import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, PageBody } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, MessageSquare, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Database } from "@/integrations/supabase/types";

type Visitor = Database["public"]["Tables"]["visitor_checkins"]["Row"];

export const Route = createFileRoute("/_authenticated/visitantes")({
  component: VisitorsAdminPage,
});

function VisitorsAdminPage() {
  const qc = useQueryClient();
  const { data: visitors, isLoading } = useQuery({
    queryKey: ["visitors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("visitor_checkins")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Visitor["status"] }) => {
      const { error } = await supabase
        .from("visitor_checkins")
        .update({ status, reviewed_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Status atualizado.");
      qc.invalidateQueries({ queryKey: ["visitors"] });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("visitor_checkins").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Registro removido.");
      qc.invalidateQueries({ queryKey: ["visitors"] });
    },
  });

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        eyebrow="Gestão"
        title="Visitantes do Domingo"
        description="Acompanhamento em tempo real dos novos visitantes que chegaram pelo QR Code."
      />

      <PageBody>
        {isLoading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        ) : !visitors?.length ? (
          <div className="text-center py-20 border border-dashed rounded-2xl bg-muted/10">
            <Clock className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum visitante registrado ainda hoje.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {visitors.map((v) => (
              <Card
                key={v.id}
                className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif text-xl font-bold">{v.full_name}</h3>
                    <Badge variant={v.status === "novo" ? "default" : "outline"}>
                      {v.status === "novo"
                        ? "Novo"
                        : v.status === "contatado"
                          ? "Contatado"
                          : "Integrado"}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" /> {v.whatsapp || "N/A"}
                    </span>
                    <span>
                      Chegou em:{" "}
                      {v.created_at
                        ? format(new Date(v.created_at), "HH:mm 'de' d/MM", { locale: ptBR })
                        : "—"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button size="sm" variant="outline" asChild className="flex-1 sm:flex-none">
                    <a
                      href={`https://wa.me/55${(v.whatsapp || "").replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      WhatsApp
                    </a>
                  </Button>

                  {v.status === "novo" && (
                    <Button
                      size="sm"
                      onClick={() => updateStatus.mutate({ id: v.id, status: "contatado" })}
                      className="flex-1 sm:flex-none"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" /> Marcar Contatado
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => confirm("Remover este registro?") && remove.mutate(v.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </PageBody>
    </div>
  );
}
