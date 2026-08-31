import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Plus, CheckCircle2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { PageHeader, PageBody } from "@/components/app-shell";
import { StatTile, PanelSection, EmptyLine } from "@/components/painel/ui";
import { EventCard } from "@/components/agenda/event-card";
import { EventForm } from "@/components/agenda/event-form";
import { EventCalendar } from "@/components/agenda/event-calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KIND_LABEL, SCOPE_LABEL, type ChurchEvent, type RsvpStatus } from "@/lib/agenda";

export const Route = createFileRoute("/_authenticated/agenda")({
  head: () => ({
    meta: [
      { title: "Agenda e Eventos — IB Atos" },
      {
        name: "description",
        content:
          "Agenda da Igreja Batista Atos: cultos, ensaios, encontros de rede e mesa, com confirmação de presença.",
      },
      { property: "og:title", content: "Agenda e Eventos — IB Atos" },
      {
        property: "og:description",
        content: "Todos os eventos da igreja em um só lugar, com confirmação de presença.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AgendaPage,
});

function AgendaPage() {
  const qc = useQueryClient();
  const { user, isAdmin, isMinistryAdmin, isMesaLeader } = useAuth();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ChurchEvent | null>(null);
  const [search, setSearch] = useState("");
  const [scopeFilter, setScopeFilter] = useState<string>("todos");
  const [kindFilter, setKindFilter] = useState<string>("todos");

  const eventsQuery = useQuery({
    queryKey: ["agenda-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*, ministry:ministries(name, color), rede:redes(name, color), mesa:mesas(name)")
        .order("starts_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as ChurchEvent[];
    },
  });

  const rsvpQuery = useQuery({
    queryKey: ["agenda-rsvps"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_rsvps")
        .select("event_id, user_id, status");
      if (error) throw error;
      return data ?? [];
    },
  });

  const rsvpMutation = useMutation({
    mutationFn: async ({ eventId, status }: { eventId: string; status: RsvpStatus }) => {
      if (!user) throw new Error("Faça login para confirmar presença.");
      const { error } = await supabase
        .from("event_rsvps")
        .upsert(
          { event_id: eventId, user_id: user.id, status },
          { onConflict: "event_id,user_id" },
        );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agenda-rsvps"] });
      toast.success("Resposta registrada.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agenda-events"] });
      toast.success("Evento excluído.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const canManage = (e: ChurchEvent) =>
    isAdmin ||
    (!!e.ministry_id && isMinistryAdmin(e.ministry_id)) ||
    (!!e.mesa_id && isMesaLeader(e.mesa_id));

  const events = eventsQuery.data ?? [];
  const rsvps = rsvpQuery.data ?? [];

  const myRsvpByEvent = useMemo(() => {
    const map = new Map<string, RsvpStatus>();
    rsvps.forEach((r: { event_id: string; user_id: string; status: RsvpStatus }) => {
      if (r.user_id === user?.id) map.set(r.event_id, r.status);
    });
    return map;
  }, [rsvps, user?.id]);

  const goingByEvent = useMemo(() => {
    const map = new Map<string, number>();
    rsvps.forEach((r: { event_id: string; status: RsvpStatus }) => {
      if (r.status === "vou") map.set(r.event_id, (map.get(r.event_id) ?? 0) + 1);
    });
    return map;
  }, [rsvps]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return events.filter((e) => {
      if (scopeFilter !== "todos" && e.scope !== scopeFilter) return false;
      if (kindFilter !== "todos" && e.kind !== kindFilter) return false;
      if (!term) return true;
      return (
        e.title.toLowerCase().includes(term) ||
        (e.description ?? "").toLowerCase().includes(term) ||
        (e.location ?? "").toLowerCase().includes(term)
      );
    });
  }, [events, search, scopeFilter, kindFilter]);

  const now = Date.now();
  const upcoming = filtered.filter((e) => new Date(e.starts_at).getTime() >= now);
  const past = filtered.filter((e) => new Date(e.starts_at).getTime() < now).reverse();
  const mine = upcoming.filter((e) => myRsvpByEvent.get(e.id) === "vou");
  const pendingRsvp = upcoming.filter((e) => e.requires_rsvp && !myRsvpByEvent.has(e.id));

  const renderList = (list: ChurchEvent[], empty: string) =>
    list.length === 0 ? (
      <EmptyLine>{empty}</EmptyLine>
    ) : (
      <div className="grid gap-4">
        {list.map((e) => (
          <EventCard
            key={e.id}
            event={e}
            myRsvp={myRsvpByEvent.get(e.id) ?? null}
            goingCount={goingByEvent.get(e.id) ?? 0}
            canManage={canManage(e)}
            pending={rsvpMutation.isPending}
            onRsvp={(status) => rsvpMutation.mutate({ eventId: e.id, status })}
            onEdit={() => {
              setEditing(e);
              setFormOpen(true);
            }}
            onDelete={() => {
              if (confirm(`Excluir o evento "${e.title}"?`)) deleteMutation.mutate(e.id);
            }}
          />
        ))}
      </div>
    );

  return (
    <>
      <PageHeader
        eyebrow="Fase 2 · Eventos"
        title="Agenda da Igreja"
        description="Cultos, ensaios, encontros de rede e de mesa. Cada evento tem público definido e confirmação de presença."
        actions={
          <Button
            className="evt-cta"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Novo evento
          </Button>
        }
      />
      <PageBody>
        {eventsQuery.isError && (
          <div className="border border-destructive/40 bg-destructive/5 text-sm p-4 rounded-sm mb-6">
            Não foi possível carregar a agenda. Recarregue a página.
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatTile label="Eventos futuros" value={upcoming.length} icon={CalendarDays} />
          <StatTile label="Você confirmou" value={mine.length} icon={CheckCircle2} />
          <StatTile
            label="Aguardando resposta"
            value={pendingRsvp.length}
            icon={Sparkles}
            hint="Eventos que pedem confirmação"
          />
          <StatTile
            label="Em destaque"
            value={upcoming.filter((e) => e.is_featured).length}
            icon={Sparkles}
          />
        </div>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[1fr_auto_auto] gap-3">
          <Input
            placeholder="Buscar por título, descrição ou local"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select value={scopeFilter} onValueChange={setScopeFilter}>
            <SelectTrigger className="sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os públicos</SelectItem>
              {Object.entries(SCOPE_LABEL).map(([v, l]) => (
                <SelectItem key={v} value={v}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={kindFilter} onValueChange={setKindFilter}>
            <SelectTrigger className="sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os tipos</SelectItem>
              {Object.entries(KIND_LABEL).map(([v, l]) => (
                <SelectItem key={v} value={v}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="proximos" className="mt-8">
          <TabsList className="w-full flex overflow-x-auto justify-start sm:justify-center scrollbar-none">
            <TabsTrigger value="proximos">Próximos</TabsTrigger>
            <TabsTrigger value="meus">Meus eventos</TabsTrigger>
            <TabsTrigger value="pendentes">Pendentes</TabsTrigger>
            <TabsTrigger value="calendario">Calendário</TabsTrigger>
            <TabsTrigger value="passados">Realizados</TabsTrigger>
          </TabsList>

          <TabsContent value="proximos" className="mt-6">
            <PanelSection label="Agenda" title="Próximos eventos">
              {eventsQuery.isLoading ? (
                <EmptyLine>Carregando agenda...</EmptyLine>
              ) : upcoming.length === 0 ? (
                <div className="border border-dashed border-border p-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    Nenhum evento futuro com esses filtros. Crie o primeiro compromisso da agenda.
                  </p>
                  <Button
                    className="evt-cta mt-4"
                    onClick={() => {
                      setEditing(null);
                      setFormOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4" /> Novo evento
                  </Button>
                </div>
              ) : (
                renderList(upcoming, "Nenhum evento futuro com esses filtros.")
              )}
            </PanelSection>
          </TabsContent>

          <TabsContent value="meus" className="mt-6">
            <PanelSection label="Compromissos" title="Onde você confirmou presença">
              {renderList(mine, "Você ainda não confirmou presença em nenhum evento.")}
            </PanelSection>
          </TabsContent>

          <TabsContent value="pendentes" className="mt-6">
            <PanelSection label="Depende de você" title="Aguardando sua resposta">
              {renderList(pendingRsvp, "Tudo respondido. Nada pendente.")}
            </PanelSection>
          </TabsContent>

          <TabsContent value="calendario" className="mt-6">
            <PanelSection label="Visão do mês" title="Calendário da igreja">
              <EventCalendar
                events={filtered}
                onSelect={(e) => {
                  if (canManage(e)) {
                    setEditing(e);
                    setFormOpen(true);
                  }
                }}
              />
            </PanelSection>
          </TabsContent>

          <TabsContent value="passados" className="mt-6">
            <PanelSection label="Histórico" title="Eventos realizados">
              {renderList(past, "Nenhum evento realizado ainda.")}
            </PanelSection>
          </TabsContent>
        </Tabs>
      </PageBody>

      <EventForm open={formOpen} onOpenChange={setFormOpen} event={editing} />
    </>
  );
}
