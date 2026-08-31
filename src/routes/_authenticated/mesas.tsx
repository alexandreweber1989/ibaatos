import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { UtensilsCrossed } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, PageBody } from "@/components/app-shell";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";
import { MesaDialog, MesaMembersDialog, EditMesaButton } from "@/components/admin/mesa-dialog";
import { MesaEventDialog } from "@/components/events/mesa-event-dialog";

import { GroupSummary } from "@/components/admin/group-summary";
import { statsOf, useGroupStats } from "@/lib/use-grupos";
import { LoadingRegion, CardGridSkeleton } from "@/components/ui/loading-states";

export const Route = createFileRoute("/_authenticated/mesas")({
  head: () => ({
    meta: [
      { title: "Mesas — Igreja Batista Atos" },
      {
        name: "description",
        content:
          "Mesas de comunhão da Igreja Batista Atos: liderança, dia de reunião, local e pessoas de cada grupo.",
      },
      { property: "og:title", content: "Mesas — Igreja Batista Atos" },
      {
        property: "og:description",
        content: "Grupos semanais de comunhão, sua liderança e seus participantes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MesasPage,
});

function MesasPage() {
  const { isAdmin, isMesaLeader } = useAuth();
  const [term, setTerm] = useState("");
  const [redeFilter, setRedeFilter] = useState("all");

  const { data, isPending } = useQuery({
    queryKey: ["mesas-full"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mesas")
        .select("*, rede:redes(id, name, target_audience), church:churches(name, city)")
        .order("name");
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: stats } = useGroupStats();

  /** Redes disponíveis para o filtro, derivadas das mesas já carregadas. */
  const redeOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of data ?? []) if (m.rede?.id) map.set(m.rede.id, m.rede.name);
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1], "pt-BR"));
  }, [data]);

  const filtered = useMemo(() => {
    const q = term.trim().toLowerCase();
    return (data ?? []).filter((m) => {
      if (redeFilter !== "all" && m.rede?.id !== redeFilter) return false;
      if (!q) return true;
      const haystack = [
        m.name,
        m.description,
        m.meeting_location,
        m.meeting_day,
        m.rede?.name,
        m.church?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [data, term, redeFilter]);

  return (
    <>
      <PageHeader
        eyebrow="Comunhão semanal"
        title="Mesas"
        description={
          isAdmin
            ? "Cada Mesa é um grupo de comunhão que se reúne durante a semana, sob a liderança de um casal ou líder da rede."
            : "Seus grupos de comunhão semanais."
        }
        actions={isAdmin ? <MesaDialog /> : undefined}
      />
      <PageBody>
        <div className="flex flex-col sm:flex-row gap-2 mb-6">
          <Input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Buscar por mesa, líder, bairro ou dia da semana"
            className="sm:max-w-sm"
            aria-label="Buscar mesas"
          />
          <Select value={redeFilter} onValueChange={setRedeFilter}>
            <SelectTrigger className="sm:w-56" aria-label="Filtrar por rede">
              <SelectValue placeholder="Todas as redes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as redes</SelectItem>
              {redeOptions.map(([id, name]) => (
                <SelectItem key={id} value={id}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground self-center">
            {filtered.length} {filtered.length === 1 ? "mesa" : "mesas"}
          </span>
        </div>

        {isPending ? (
          <LoadingRegion label="Carregando mesas…">
            <CardGridSkeleton count={6} className="grid md:grid-cols-2 lg:grid-cols-3 gap-4" />
          </LoadingRegion>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((m: any) => (
              <div
                key={m.id}
                className="border border-border bg-card p-6 rounded-sm flex flex-col hover:shadow-lg transition-all duration-300"
                style={{ borderTop: `4px solid ${m.rede?.color || "var(--primary)"}` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <UtensilsCrossed className="h-5 w-5 text-primary" />
                  {m.rede && (
                    <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      {m.rede.name}
                    </div>
                  )}
                </div>
                <h3 className="font-serif text-2xl">{m.name}</h3>
                {m.description && (
                  <p className="mt-2 text-sm text-muted-foreground">{m.description}</p>
                )}

                <div className="mt-4">
                  <GroupSummary
                    stats={statsOf(stats?.mesas, m.id)}
                    emptyHint="Nenhuma pessoa nesta mesa ainda."
                  />
                </div>

                {(isAdmin || isMesaLeader(m.id)) && (
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <MesaMembersDialog mesaId={m.id} mesaName={m.name} />
                    <MesaEventDialog mesa={m} />
                    {isAdmin && <EditMesaButton mesa={m} />}
                  </div>
                )}
                <div className="mt-6 pt-4 border-t border-border space-y-1 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                  <div>
                    {m.meeting_day ?? "Dia a definir"} · {m.meeting_time ?? "—"}
                  </div>
                  <div>{m.meeting_location ?? "Local a definir"}</div>
                  <div>{m.church?.name ?? "Igreja a definir"}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        {data && filtered.length === 0 && (
          <p className="text-muted-foreground">
            {data.length === 0
              ? "Nenhuma mesa cadastrada ainda."
              : "Nenhuma mesa encontrada com esses filtros."}
          </p>
        )}
      </PageBody>
    </>
  );
}
