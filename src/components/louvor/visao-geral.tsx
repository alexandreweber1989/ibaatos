import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Clock, MapPin, Music2, Users, ListMusic } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  ASSIGNMENT_STATUS,
  FUNCTION_GROUPS,
  SCHEDULE_TYPE_LABELS,
  formatDate,
  formatTime,
  functionGroupId,
  initials,
} from "@/lib/louvor";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface Assignment {
  id: string;
  function_name: string;
  status: string;
  profiles: { full_name: string } | null;
}

interface ScheduleRow {
  id: string;
  title: string;
  schedule_type: string;
  event_date: string;
  start_time: string | null;
  location: string | null;
  status: string;
  team?: { name: string } | null;
  assignments: Assignment[];
  setlist: {
    id: string;
    position: number;
    song_key: string | null;
    song: { title: string; artist: string | null } | null;
  }[];
}

function Kpi({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: React.ElementType;
}) {
  return (
    <div className="border border-border bg-card rounded-sm p-5 flex flex-col justify-between min-h-32">
      <div className="flex items-start justify-between gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {label}
        </span>
        <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
      </div>
      <div>
        <div className="font-serif text-5xl leading-none tabular-nums">{value}</div>
        {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
      </div>
    </div>
  );
}

export function QueryError({ error }: { error: Error }) {
  return (
    <div className="border border-destructive/40 bg-destructive/5 rounded-sm p-6">
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-destructive">
        Erro ao carregar
      </div>
      <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
    </div>
  );
}

export function VisaoGeral() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["louvor-overview"],
    queryFn: async () => {
      const [schedules, musicians, songs] = await Promise.all([
        supabase
          .from("worship_schedules")
          .select(
            "id, title, schedule_type, event_date, start_time, location, status, assignments:worship_schedule_assignments(id, function_name, status, profiles:profiles(full_name)), setlist:worship_setlist_items(id, position, song_key, song:worship_songs(title, artist))",
          )
          .order("event_date", { ascending: true }),
        supabase.from("worship_musicians").select("id, user_id, functions").eq("is_active", true),
        supabase
          .from("worship_songs")
          .select("id", { count: "exact", head: true })
          .eq("is_active", true),
      ]);
      if (schedules.error) throw schedules.error;
      if (musicians.error) throw musicians.error;
      if (songs.error) throw songs.error;
      return {
        schedules: (schedules.data ?? []) as unknown as ScheduleRow[],
        musicians: (musicians.data ?? []) as { id: string; user_id: string; functions: string[] }[],
        songCount: songs.count ?? 0,
      };
    },
  });

  const stats = useMemo(() => {
    if (!data) return null;
    const today = new Date().toISOString().slice(0, 10);
    const upcoming = data.schedules.filter((s) => s.event_date >= today);
    const next = upcoming.find((s) => s.status !== "rascunho") ?? upcoming[0] ?? null;
    const people = new Set(data.musicians.map((m) => m.user_id));
    const allFunctions = data.musicians.flatMap((m) => m.functions ?? []);
    const coverage = FUNCTION_GROUPS.map((g) => ({
      ...g,
      count: allFunctions.filter((fn) => functionGroupId(fn) === g.id).length,
    }));
    const maxCoverage = Math.max(1, ...coverage.map((c) => c.count));
    const functionsCovered = new Set(allFunctions).size;
    const pending = data.schedules
      .filter((s) => s.status === "publicada" && s.event_date >= today)
      .flatMap((s) =>
        s.assignments.filter((a) => a.status !== "confirmado").map((a) => ({ ...a, schedule: s })),
      );
    return {
      upcoming,
      next,
      peopleCount: people.size,
      functionsCovered,
      coverage,
      maxCoverage,
      pending,
    };
  }, [data]);

  if (error) return <QueryError error={error as Error} />;

  if (isLoading || !stats || !data) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-sm" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-sm" />
      </div>
    );
  }

  const next = stats.next;
  const confirmed = next ? next.assignments.filter((a) => a.status === "confirmado").length : 0;
  const total = next ? next.assignments.length : 0;
  const pct = total ? Math.round((confirmed / total) * 100) : 0;

  return (
    <div className="space-y-10">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label="Integrantes"
          value={stats.peopleCount}
          hint="irmãos no elenco do louvor"
          icon={Users}
        />
        <Kpi
          label="Funções"
          value={stats.functionsCovered}
          hint="instrumentos e vozes cobertos"
          icon={Users}
        />

        <Kpi label="Repertório" value={data.songCount} hint="músicas com cifra" icon={Music2} />
        <Kpi
          label="Agenda"
          value={stats.upcoming.length}
          hint="cultos e ensaios à frente"
          icon={CalendarDays}
        />
      </div>

      {next && (
        <section className="border border-border bg-card rounded-sm overflow-hidden">
          <div className="bg-foreground text-background p-6 sm:p-8">
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] opacity-70">
              Próxima {SCHEDULE_TYPE_LABELS[next.schedule_type]}
            </div>
            <h3 className="font-serif text-4xl sm:text-6xl leading-[0.9] mt-2">{next.title}</h3>
            <div className="flex flex-wrap gap-5 mt-5 font-mono text-[11px] uppercase tracking-widest opacity-80">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                {formatDate(next.event_date)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {formatTime(next.start_time)}
              </span>
              {next.location && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {next.location}
                </span>
              )}
            </div>
            <div className="mt-6">
              <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest opacity-80">
                <span>Confirmações</span>
                <span>
                  {confirmed}/{total} · {pct}%
                </span>
              </div>
              <div className="h-1.5 bg-background/25 mt-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-background transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
            <div className="p-6 sm:p-8">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-4">
                Escalados
              </div>
              <ul className="space-y-2">
                {next.assignments.map((a) => (
                  <li key={a.id} className="flex items-center gap-3">
                    <span className="h-8 w-8 shrink-0 rounded-full border border-border grid place-items-center font-mono text-[10px]">
                      {initials(a.profiles?.full_name ?? "?")}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm truncate">{a.profiles?.full_name ?? "—"}</span>
                      <span className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                        {a.function_name}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "px-2 py-1 rounded-sm font-mono text-[9px] uppercase tracking-widest",
                        ASSIGNMENT_STATUS[a.status]?.className,
                      )}
                    >
                      {ASSIGNMENT_STATUS[a.status]?.label}
                    </span>
                  </li>
                ))}
                {next.assignments.length === 0 && (
                  <li className="text-sm text-muted-foreground">Ninguém escalado ainda.</li>
                )}
              </ul>
            </div>
            <div className="p-6 sm:p-8">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-4 inline-flex items-center gap-2">
                <ListMusic className="h-3.5 w-3.5" /> Repertório do dia
              </div>
              <ol className="divide-y divide-border">
                {[...next.setlist]
                  .sort((a, b) => a.position - b.position)
                  .map((item, i) => (
                    <li key={item.id} className="py-3 flex items-baseline gap-4">
                      <span className="font-serif text-2xl text-muted-foreground tabular-nums w-8">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block truncate">{item.song?.title ?? "—"}</span>
                        {item.song?.artist && (
                          <span className="block text-xs text-muted-foreground truncate">
                            {item.song.artist}
                          </span>
                        )}
                      </span>
                      {item.song_key && (
                        <span className="font-mono text-[10px] uppercase tracking-widest border border-border px-2 py-1 rounded-sm">
                          {item.song_key}
                        </span>
                      )}
                    </li>
                  ))}
                {next.setlist.length === 0 && (
                  <li className="py-3 text-sm text-muted-foreground">Setlist ainda não montado.</li>
                )}
              </ol>
            </div>
          </div>
        </section>
      )}

      <section className="grid lg:grid-cols-2 gap-4">
        <div className="border border-border bg-card rounded-sm p-6 sm:p-8">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Cobertura por naipe
          </div>
          <div className="mt-6 space-y-4">
            {stats.coverage.map((g) => (
              <div key={g.id}>
                <div className="flex items-baseline justify-between text-sm">
                  <span>{g.label}</span>
                  <span className="font-mono text-xs text-muted-foreground tabular-nums">
                    {g.count}
                  </span>
                </div>
                <div className="h-1 bg-muted mt-2 overflow-hidden rounded-full">
                  <div
                    className="h-full bg-foreground transition-all duration-700"
                    style={{ width: `${(g.count / stats.maxCoverage) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-border bg-card rounded-sm p-6 sm:p-8">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Pendências de confirmação
          </div>
          <ul className="mt-4 divide-y divide-border">
            {stats.pending.slice(0, 8).map((a) => (
              <li key={a.id} className="py-3 flex items-center justify-between gap-3">
                <span className="min-w-0">
                  <span className="block text-sm truncate">{a.profiles?.full_name ?? "—"}</span>
                  <span className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground truncate">
                    {a.function_name} · {a.schedule.title}
                  </span>
                </span>
                <span
                  className={cn(
                    "px-2 py-1 rounded-sm font-mono text-[9px] uppercase tracking-widest shrink-0",
                    ASSIGNMENT_STATUS[a.status]?.className,
                  )}
                >
                  {ASSIGNMENT_STATUS[a.status]?.label}
                </span>
              </li>
            ))}
            {stats.pending.length === 0 && (
              <li className="py-3 text-sm text-muted-foreground">
                Tudo confirmado nas escalas publicadas.
              </li>
            )}
          </ul>
        </div>
      </section>
    </div>
  );
}
