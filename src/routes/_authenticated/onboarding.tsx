import { createFileRoute } from "@tanstack/react-router";
import {
  Sprout,
  Search,
  Filter,
  MoreHorizontal,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  UserPlus,
} from "lucide-react";
import { PageBody, PageHeader } from "@/components/app-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOnboardingOverview } from "@/lib/onboarding";
import { OnboardingTracker } from "@/components/membros/onboarding-tracker";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Integração de novos membros — IB Atos" },
      { name: "description", content: "Gerenciamento da trilha de novos membros." },
    ],
  }),
  component: OnboardingLayout,
});

function OnboardingLayout() {
  const { rows, total, isLoading } = useOnboardingOverview();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);

  const filteredRows = rows.filter((r) =>
    r.person.full_name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const stats = {
    total: rows.length,
    completed: rows.filter((r) => r.done === total && total > 0).length,
    stalled: rows.filter((r) => {
      if (!r.lastAt) return false;
      const days = (Date.now() - new Date(r.lastAt).getTime()) / 86400000;
      return days > 15 && r.done < total;
    }).length,
  };

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader
        eyebrow="Crescimento & Integração"
        title="Jornada do Novo Membro"
        description="Acompanhe e facilite a caminhada de quem está chegando na família Atos."
      />

      <PageBody>
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-mono uppercase tracking-widest text-primary/60">
                Em Integração
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-4xl font-serif">{stats.total}</span>
                <UserPlus className="h-8 w-8 text-primary/40" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Pessoas ativas na trilha</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-mono uppercase tracking-widest text-emerald-500/60">
                Concluídos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-4xl font-serif">{stats.completed}</span>
                <CheckCircle2 className="h-8 w-8 text-emerald-500/40" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Integrados com sucesso</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-mono uppercase tracking-widest text-amber-500/60">
                Atenção
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-4xl font-serif">{stats.stalled}</span>
                <Clock className="h-8 w-8 text-amber-500/40" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Sem movimentação há +15 dias</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="list" className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <TabsList className="bg-muted/50 p-1">
              <TabsTrigger value="list" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                Fluxo Ativo
              </TabsTrigger>
              <TabsTrigger value="config" className="gap-2">
                <AlertCircle className="h-4 w-4" />
                Configuração
              </TabsTrigger>
            </TabsList>

            <div className="relative w-full sm:w-72 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Filtrar por nome..."
                className="pl-10 bg-card/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <TabsContent value="list" className="space-y-4">
            {isLoading ? (
              <div className="py-20 text-center text-muted-foreground font-mono uppercase tracking-widest animate-pulse">
                Sincronizando dados...
              </div>
            ) : filteredRows.length === 0 ? (
              <div className="py-20 text-center border-2 border-dashed border-border rounded-3xl">
                <Sprout className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                <h3 className="text-lg font-serif">Nenhum membro encontrado</h3>
                <p className="text-muted-foreground">
                  Tente ajustar seu filtro ou verifique se há novos registros.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {filteredRows.map((row) => (
                  <Card
                    key={row.person.id}
                    className={`overflow-hidden transition-all duration-300 border-l-4 ${
                      row.done === total ? "border-l-emerald-500" : "border-l-primary/40"
                    } ${selectedPersonId === row.person.id ? "ring-2 ring-primary/20" : ""}`}
                  >
                    <div className="p-4 sm:p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center font-serif text-xl border border-border/50">
                            {row.person.full_name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-serif text-lg leading-none mb-1">
                              {row.person.full_name}
                            </h3>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className="text-[10px] font-mono uppercase tracking-widest py-0"
                              >
                                {row.done}/{total} Etapas
                              </Badge>
                              {row.lastAt && (
                                <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">
                                  Lido em {new Date(row.lastAt).toLocaleDateString("pt-BR")}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setSelectedPersonId(
                                selectedPersonId === row.person.id ? null : row.person.id,
                              )
                            }
                            className="rounded-xl"
                          >
                            {selectedPersonId === row.person.id ? "Fechar" : "Ver Detalhes"}
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="rounded-xl">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>Ver Perfil</DropdownMenuItem>
                              <DropdownMenuItem>Enviar Mensagem</DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">
                                Remover da Trilha
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {selectedPersonId === row.person.id && (
                        <div className="mt-6 pt-6 border-t border-border animate-in fade-in slide-in-from-top-2 duration-300">
                          <OnboardingTracker
                            personId={row.person.id}
                            enabled={true}
                            canEdit={true}
                          />
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="config">
            <Card>
              <CardHeader>
                <CardTitle className="font-serif">Configuração da Jornada</CardTitle>
                <CardDescription>
                  Defina as etapas oficiais que todo novo membro deve percorrer.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-8 text-center border-2 border-dashed border-border rounded-2xl">
                  <p className="text-muted-foreground italic mb-4">
                    A gestão de etapas está disponível apenas para administradores do sistema.
                  </p>
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => toast.info("Funcionalidade em desenvolvimento.")}
                  >
                    Editar Etapas
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </PageBody>
    </div>
  );
}
