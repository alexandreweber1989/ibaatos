import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Megaphone, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { PageBody, PageHeader } from "@/components/app-shell";
import { EmptyLine } from "@/components/painel/ui";
import { AvisoCard } from "@/components/avisos/aviso-card";
import { AvisoForm } from "@/components/avisos/aviso-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  isVigente,
  useAvisos,
  useContagemLeituras,
  useMarcarLido,
  useMinhasLeituras,
  type Announcement,
} from "@/lib/avisos";

export const Route = createFileRoute("/_authenticated/avisos")({
  head: () => ({
    meta: [
      { title: "Mural de Avisos — IB Atos" },
      {
        name: "description",
        content:
          "Comunicados da liderança da Igreja Batista Atos por igreja, ministério, rede e mesa, com marcação de leitura.",
      },
      { property: "og:title", content: "Mural de Avisos — IB Atos" },
      {
        property: "og:description",
        content: "Todos os comunicados da igreja em um só lugar, direcionados a quem precisa ler.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AvisosPage,
});

function AvisosPage() {
  const qc = useQueryClient();
  const { user, isAdmin, roles } = useAuth();
  const { data: avisos = [], isPending } = useAvisos();
  const { data: lidos } = useMinhasLeituras(user?.id);
  const marcarLido = useMarcarLido();

  const [formOpen, setFormOpen] = useState(false);
  const [editando, setEditando] = useState<Announcement | null>(null);
  const [busca, setBusca] = useState("");
  const [aba, setAba] = useState<"vigentes" | "nao-lidos" | "todos">("vigentes");

  const podePublicar =
    isAdmin ||
    roles.some(
      (r) =>
        (r.role === "admin_ministerio" && r.ministry_id) || (r.role === "lider_mesa" && r.mesa_id),
    );

  const meus = useMemo(
    () => avisos.filter((a) => a.created_by === user?.id || isAdmin).map((a) => a.id),
    [avisos, user?.id, isAdmin],
  );
  const { data: contagem = {} } = useContagemLeituras(meus);

  const excluir = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("announcements").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Aviso removido.");
      void qc.invalidateQueries({ queryKey: ["avisos"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Não foi possível remover o aviso."),
  });

  const lista = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return avisos.filter((a) => {
      if (aba === "vigentes" && !isVigente(a)) return false;
      if (aba === "nao-lidos" && (!isVigente(a) || lidos?.has(a.id))) return false;
      if (!termo) return true;
      return a.title.toLowerCase().includes(termo) || a.body.toLowerCase().includes(termo);
    });
  }, [avisos, aba, busca, lidos]);

  const naoLidos = avisos.filter((a) => isVigente(a) && !lidos?.has(a.id)).length;

  return (
    <>
      <PageHeader
        eyebrow="Comunicação"
        title="Mural de avisos"
        description="Comunicados da liderança direcionados a você — por igreja, ministério, rede ou mesa."
        actions={
          podePublicar ? (
            <Button
              onClick={() => {
                setEditando(null);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" /> Novo aviso
            </Button>
          ) : undefined
        }
      />

      <PageBody>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Tabs value={aba} onValueChange={(v) => setAba(v as typeof aba)}>
            <TabsList>
              <TabsTrigger value="vigentes">No ar</TabsTrigger>
              <TabsTrigger value="nao-lidos">
                Não lidos {naoLidos > 0 && `(${naoLidos})`}
              </TabsTrigger>
              <TabsTrigger value="todos">Todos</TabsTrigger>
            </TabsList>
          </Tabs>
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar aviso..."
            className="sm:max-w-xs"
          />
        </div>

        <div className="mt-6 space-y-4">
          {isPending ? (
            [0, 1, 2].map((i) => (
              <div key={i} className="h-32 rounded-xl bg-muted/50 animate-pulse" />
            ))
          ) : lista.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-10 text-center">
              <Megaphone className="h-6 w-6 text-muted-foreground mx-auto mb-3" />
              <EmptyLine>Nenhum aviso por aqui no momento.</EmptyLine>
            </div>
          ) : (
            lista.map((a) => (
              <AvisoCard
                key={a.id}
                aviso={a}
                lido={Boolean(lidos?.has(a.id))}
                leitores={contagem[a.id] ?? 0}
                podeGerenciar={isAdmin || a.created_by === user?.id}
                onMarcarLido={() =>
                  user && marcarLido.mutate({ announcementId: a.id, userId: user.id })
                }
                onEditar={() => {
                  setEditando(a);
                  setFormOpen(true);
                }}
                onExcluir={() => excluir.mutate(a.id)}
              />
            ))
          )}
        </div>
      </PageBody>

      <AvisoForm open={formOpen} onOpenChange={setFormOpen} aviso={editando} />
    </>
  );
}
