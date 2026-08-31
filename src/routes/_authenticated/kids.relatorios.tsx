import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Baby,
  Calendar,
  Download,
  FileText,
  Filter,
  Search,
  Users,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, PageBody } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KIDS_CLASSROOM_LABEL, childDisplayName, shortTime } from "@/lib/kids";

export const Route = createFileRoute("/_authenticated/kids/relatorios")({
  head: () => ({
    meta: [
      { title: "Relatórios Kids — Igreja Batista Atos" },
      {
        name: "description",
        content: "Histórico de presença e relatórios do ministério infantil.",
      },
    ],
  }),
  component: KidsReportsPage,
});

function KidsReportsPage() {
  const [search, setSearch] = useState("");
  const [classroom, setClassroom] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data: checkins, isLoading } = useQuery({
    queryKey: ["kids-reports", classroom, dateFrom, dateTo],
    queryFn: async () => {
      let query = supabase
        .from("kids_checkins")
        .select(
          `
          *,
          child:kids_children(*),
          session:kids_sessions(*)
        `,
        )
        .order("checked_in_at", { ascending: false });

      if (dateFrom) query = query.gte("checked_in_at", `${dateFrom}T00:00:00`);
      if (dateTo) query = query.lte("checked_in_at", `${dateTo}T23:59:59`);

      const { data, error } = await query;
      if (error) throw error;

      let filtered = data || [];
      if (classroom !== "all") {
        filtered = filtered.filter((c: any) => c.child?.classroom === classroom);
      }

      return filtered;
    },
  });

  const filteredData =
    checkins?.filter((c: any) =>
      childDisplayName(c.child).toLowerCase().includes(search.toLowerCase()),
    ) || [];

  const exportCsv = () => {
    if (!filteredData.length) return;

    const headers = [
      "Data",
      "Criança",
      "Turma",
      "Entrada",
      "Saída",
      "Responsável (Entrada)",
      "Responsável (Saída)",
      "Status",
    ];
    const rows = filteredData.map((c: any) => [
      new Date(c.checked_in_at).toLocaleDateString("pt-BR"),
      childDisplayName(c.child),
      KIDS_CLASSROOM_LABEL[c.child?.classroom] || c.child?.classroom,
      shortTime(c.checked_in_at),
      shortTime(c.checked_out_at),
      c.dropped_by_name || "",
      c.picked_up_by_name || "",
      c.status,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `presenca_kids_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="font-kids min-h-screen bg-background">
      <PageHeader
        eyebrow="Relatórios e Auditoria"
        title="Histórico de Presença"
        description="Consulte o registro completo de entradas e saídas do Kids."
        actions={
          <Button onClick={exportCsv} disabled={!filteredData.length || isLoading}>
            <Download className="mr-2 h-4 w-4" /> Exportar CSV
          </Button>
        }
      />
      <PageBody>
        <div className="space-y-6">
          <Card className="rounded-[2rem] border-primary/10 shadow-xl bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-mono uppercase tracking-widest text-primary/70 flex items-center gap-2">
                <Filter className="h-4 w-4" /> Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground ml-1">
                    Buscar
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Nome da criança..."
                      className="pl-9 rounded-xl"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground ml-1">
                    Turma
                  </label>
                  <Select value={classroom} onValueChange={setClassroom}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="all">Todas as turmas</SelectItem>
                      {Object.entries(KIDS_CLASSROOM_LABEL).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground ml-1">
                    De
                  </label>
                  <Input
                    type="date"
                    className="rounded-xl"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground ml-1">
                    Até
                  </label>
                  <Input
                    type="date"
                    className="rounded-xl"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="bg-card rounded-[2rem] border-primary/10 shadow-2xl overflow-hidden border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-transparent border-primary/5">
                  <TableHead className="font-mono text-[10px] uppercase tracking-widest">
                    Data
                  </TableHead>
                  <TableHead className="font-mono text-[10px] uppercase tracking-widest">
                    Criança
                  </TableHead>
                  <TableHead className="font-mono text-[10px] uppercase tracking-widest">
                    Turma
                  </TableHead>
                  <TableHead className="font-mono text-[10px] uppercase tracking-widest">
                    Horários
                  </TableHead>
                  <TableHead className="font-mono text-[10px] uppercase tracking-widest">
                    Responsáveis
                  </TableHead>
                  <TableHead className="font-mono text-[10px] uppercase tracking-widest">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-32 text-center text-muted-foreground italic"
                    >
                      Carregando histórico...
                    </TableCell>
                  </TableRow>
                ) : filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-32 text-center text-muted-foreground italic"
                    >
                      Nenhum registro encontrado para os filtros selecionados.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((c: any) => (
                    <TableRow
                      key={c.id}
                      className="hover:bg-primary/5 border-primary/5 transition-colors"
                    >
                      <TableCell className="font-mono text-xs">
                        {new Date(c.checked_in_at).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell className="font-serif">{childDisplayName(c.child)}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="text-[10px] uppercase tracking-widest rounded-lg font-mono"
                        >
                          {KIDS_CLASSROOM_LABEL[c.child?.classroom] || c.child?.classroom}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs space-y-1">
                          <div className="flex items-center gap-1 text-emerald-600">
                            <Calendar className="h-3 w-3" /> {shortTime(c.checked_in_at)}
                          </div>
                          {c.checked_out_at && (
                            <div className="flex items-center gap-1 text-amber-600">
                              <Calendar className="h-3 w-3" /> {shortTime(c.checked_out_at)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-[10px] space-y-1 text-muted-foreground uppercase tracking-wider font-mono">
                          <div>Entrada: {c.dropped_by_name || "—"}</div>
                          <div>Saída: {c.picked_up_by_name || "—"}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {c.status === "retirada" ? (
                          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200 rounded-lg gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Finalizado
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200 rounded-lg gap-1">
                            <Users className="h-3 w-3" /> Na Sala
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </PageBody>
    </div>
  );
}
