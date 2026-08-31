import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatDateBR } from "@/lib/membros";

/** Categoria de cada marco — define o rótulo e a cor do ponto na linha. */
type EventKind = "vida" | "igreja" | "vinculo" | "servico" | "presenca";

export interface TimelineEvent {
  /** Data ISO (yyyy-mm-dd ou timestamp). Marcos sem data são descartados. */
  date: string;
  kind: EventKind;
  title: string;
  detail?: string | null;
}

const KIND_STYLE: Record<EventKind, { label: string; dot: string }> = {
  vida: { label: "Vida", dot: "bg-muted-foreground" },
  igreja: { label: "Igreja", dot: "bg-primary" },
  vinculo: { label: "Vínculo", dot: "bg-foreground" },
  servico: { label: "Serviço", dot: "bg-primary/60" },
  presenca: { label: "Presença", dot: "bg-muted-foreground/60" },
};

/** Aceita apenas datas válidas; evita quebrar a ordenação com null/""/data inválida. */
function isValidDate(value: unknown): value is string {
  if (typeof value !== "string" || !value.trim()) return false;
  return !Number.isNaN(new Date(value).getTime());
}

function push(list: TimelineEvent[], event: Partial<TimelineEvent> & { date: unknown }) {
  if (!isValidDate(event.date)) return;
  list.push({
    date: event.date,
    kind: event.kind ?? "igreja",
    title: event.title ?? "",
    detail: event.detail ?? null,
  });
}

/**
 * Monta a linha do tempo do membro a partir dos dados que já existem na
 * plataforma (ficha, vínculos, escalas de louvor e confirmações de eventos).
 * Nenhuma tabela nova é necessária: é uma leitura derivada.
 */
export function useMemberTimeline(personId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ["member-timeline", personId],
    enabled: !!personId && enabled,
    queryFn: async (): Promise<TimelineEvent[]> => {
      const id = personId!;
      const [profile, ministries, mesas, redes, worship, rsvps] = await Promise.all([
        supabase
          .from("profiles")
          .select(
            "birth_date, conversion_date, baptism_date, baptism_church, member_since, wedding_date, membership_end_date, membership_status, created_at",
          )
          .eq("id", id)
          .maybeSingle(),
        supabase
          .from("ministry_members")
          .select("joined_at, function_name, ministries(name)")
          .eq("user_id", id),
        supabase.from("mesa_members").select("joined_at, role, mesas(name)").eq("user_id", id),
        supabase.from("rede_members").select("created_at, role, redes(name)").eq("user_id", id),
        supabase
          .from("worship_schedule_assignments")
          .select("status, function_name, worship_schedules(title, event_date, schedule_type)")
          .eq("user_id", id),
        supabase
          .from("event_rsvps")
          .select("status, created_at, events(title, starts_at)")
          .eq("user_id", id),
      ]);

      const events: TimelineEvent[] = [];
      const p = (profile.data ?? {}) as Record<string, any>;

      push(events, { date: p.birth_date, kind: "vida", title: "Nascimento" });
      push(events, { date: p.wedding_date, kind: "vida", title: "Casamento" });
      push(events, { date: p.conversion_date, kind: "igreja", title: "Conversão a Cristo" });
      push(events, {
        date: p.baptism_date,
        kind: "igreja",
        title: "Batismo nas águas",
        detail: p.baptism_church,
      });
      push(events, { date: p.member_since, kind: "igreja", title: "Recebido(a) como membro" });
      push(events, { date: p.created_at, kind: "igreja", title: "Ficha criada na plataforma" });
      push(events, {
        date: p.membership_end_date,
        kind: "igreja",
        title: "Saída da membresia",
        detail: p.membership_status,
      });

      for (const row of (ministries.data ?? []) as any[]) {
        push(events, {
          date: row.joined_at,
          kind: "vinculo",
          title: `Entrou no ministério ${row.ministries?.name ?? ""}`.trim(),
          detail: row.function_name,
        });
      }
      for (const row of (mesas.data ?? []) as any[]) {
        push(events, {
          date: row.joined_at,
          kind: "vinculo",
          title: `Entrou na mesa ${row.mesas?.name ?? ""}`.trim(),
          detail: row.role,
        });
      }
      for (const row of (redes.data ?? []) as any[]) {
        push(events, {
          date: row.created_at,
          kind: "vinculo",
          title: `Entrou na rede ${row.redes?.name ?? ""}`.trim(),
          detail: row.role,
        });
      }
      for (const row of (worship.data ?? []) as any[]) {
        // Só entra na linha do tempo quem confirmou — recusas não são histórico de serviço.
        if (row.status !== "confirmado") continue;
        push(events, {
          date: row.worship_schedules?.event_date,
          kind: "servico",
          title: `Louvor · ${row.function_name ?? "escala"}`,
          detail: row.worship_schedules?.title,
        });
      }
      for (const row of (rsvps.data ?? []) as any[]) {
        if (row.status !== "vou") continue;
        push(events, {
          date: row.events?.starts_at ?? row.created_at,
          kind: "presenca",
          title: `Confirmou presença · ${row.events?.title ?? "evento"}`,
        });
      }

      return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },
  });
}

/** Linha do tempo vertical com os marcos da caminhada do membro na igreja. */
export function MemberTimeline({ personId, enabled }: { personId: string; enabled: boolean }) {
  const { data, isLoading } = useMemberTimeline(personId, enabled);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (!data?.length) {
    return (
      <p className="text-sm text-muted-foreground">
        Ainda não há marcos registrados. Preencha datas de conversão, batismo e entrada na membresia
        na ficha para montar a caminhada.
      </p>
    );
  }

  return (
    <ol className="relative border-l border-border pl-5 space-y-4">
      {data.map((event, i) => {
        const style = KIND_STYLE[event.kind];
        return (
          <li key={`${event.date}-${event.title}-${i}`} className="relative">
            <span
              className={cn(
                "absolute -left-[1.4rem] top-1.5 size-2 rounded-full ring-4 ring-background",
                style.dot,
              )}
              aria-hidden
            />
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {formatDateBR(event.date)}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-primary">
                {style.label}
              </span>
            </div>
            <p className="text-sm leading-snug">{event.title}</p>
            {event.detail && (
              <p className="text-xs text-muted-foreground leading-snug">{event.detail}</p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
