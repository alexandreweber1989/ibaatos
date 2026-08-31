import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Music, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDateBR, relativeDayLabel, todayISO } from "@/lib/painel";
import { Button } from "@/components/ui/button";
import { PanelSection, EmptyLine } from "./ui";

interface ScheduleRow {
  id: string;
  title: string;
  event_date: string;
  start_time: string | null;
  location: string | null;
  status: string;
  assignments: { count: number }[];
  setlist: { count: number }[];
}

/** Próximos cultos/ensaios publicados com resumo de escala e repertório. */
export function AgendaCultos() {
  const { data, isLoading } = useQuery({
    queryKey: ["painel-agenda-cultos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("worship_schedules")
        .select(
          "id, title, event_date, start_time, location, status, assignments:worship_schedule_assignments(count), setlist:worship_setlist_items(count)",
        )
        .gte("event_date", todayISO())
        .order("event_date", { ascending: true })
        .limit(5);
      if (error) throw error;
      return data as unknown as ScheduleRow[];
    },
  });

  const rows = data ?? [];

  return (
    <PanelSection
      label="Agenda"
      title="Próximos cultos"
      action={
        <Button asChild variant="outline" size="sm">
          <Link to="/louvor">Ver louvor</Link>
        </Button>
      }
    >
      {isLoading && <EmptyLine>Carregando agenda…</EmptyLine>}
      {!isLoading && rows.length === 0 && <EmptyLine>Nenhum culto agendado ainda.</EmptyLine>}
      <ol className="divide-y divide-border">
        {rows.map((s) => (
          <li key={s.id} className="flex flex-wrap items-center gap-4 py-4 first:pt-0 last:pb-0">
            <div className="w-16 shrink-0 text-center border border-border rounded-sm py-2">
              <div className="font-serif text-2xl leading-none">{s.event_date.slice(8, 10)}</div>
              <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground mt-1">
                {formatDateBR(s.event_date, { month: "short" }).replace(".", "")}
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-serif text-lg truncate">{s.title}</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {relativeDayLabel(s.event_date)}
                {s.start_time ? ` · ${s.start_time.slice(0, 5)}` : ""}
                {s.location ? ` · ${s.location}` : ""}
              </div>
            </div>
            <div className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {s.assignments?.[0]?.count ?? 0}
              </span>
              <span className="flex items-center gap-1">
                <Music className="h-3 w-3" />
                {s.setlist?.[0]?.count ?? 0}
              </span>
            </div>
          </li>
        ))}
      </ol>
    </PanelSection>
  );
}
