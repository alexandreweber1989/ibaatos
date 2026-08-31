import { MapPin, Clock, Users, Pencil, Trash2, Star, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EventArt } from "@/components/agenda/event-art";
import { AddToCalendar } from "@/components/agenda/add-to-calendar";
import {
  KIND_LABEL,
  RSVP_LABEL,
  STATUS_LABEL,
  audienceLabel,
  formatDayNumber,
  formatTime,
  relativeDayLabel,
  type ChurchEvent,
  type RsvpStatus,
} from "@/lib/agenda";

const RSVP_OPTIONS: RsvpStatus[] = ["vou", "talvez", "nao_vou"];

/** Cartão editorial de um evento, com confirmação de presença e ações de admin. */
export function EventCard({
  event,
  myRsvp,
  goingCount,
  canManage,
  onRsvp,
  onEdit,
  onDelete,
  pending,
}: {
  event: ChurchEvent;
  myRsvp?: RsvpStatus | null;
  goingCount?: number;
  canManage: boolean;
  onRsvp: (status: RsvpStatus) => void;
  onEdit: () => void;
  onDelete: () => void;
  pending?: boolean;
}) {
  const d = formatDayNumber(event.starts_at);
  const cancelled = event.status === "cancelado";

  return (
    <article
      className={cn(
        "group border border-border bg-card rounded-sm overflow-hidden transition-colors hover:border-primary",
        event.is_featured && "border-primary/60",
        cancelled && "opacity-60",
      )}
    >
      <div className="flex">
        {event.image_url && (
          <div className="hidden sm:block w-40 shrink-0 border-r border-border bg-muted/40 overflow-hidden">
            <EventArt
              value={event.image_url}
              alt={`Arte de divulgação — ${event.title}`}
              className="h-full transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        )}
        <div className="w-24 shrink-0 border-r border-border bg-muted/40 flex flex-col items-center justify-center py-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {d.weekday}
          </div>
          <div className="font-serif text-4xl leading-none mt-1 tabular-nums">{d.day}</div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1">
            {d.month}
          </div>
        </div>

        <div className="flex-1 min-w-0 p-6">
          <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            <span className="text-primary">{KIND_LABEL[event.kind]}</span>
            <span aria-hidden>·</span>
            <span>{audienceLabel(event)}</span>
            <span aria-hidden>·</span>
            <span>{relativeDayLabel(event.starts_at)}</span>
            {event.status !== "publicado" && (
              <span className="border border-border px-2 py-0.5">{STATUS_LABEL[event.status]}</span>
            )}
            {event.is_featured && <Star className="h-3 w-3 text-primary" aria-label="Destaque" />}
          </div>

          <h3 className="font-serif text-2xl mt-2 leading-tight">{event.title}</h3>
          {event.description && (
            <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{event.description}</p>
          )}

          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {formatTime(event.starts_at)}
              {event.ends_at ? ` — ${formatTime(event.ends_at)}` : ""}
            </span>
            {event.location && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {event.location}
              </span>
            )}
            {typeof goingCount === "number" && (
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                {goingCount} confirmado{goingCount === 1 ? "" : "s"}
                {event.capacity ? ` / ${event.capacity} vagas` : ""}
              </span>
            )}
          </div>

          {event.requires_rsvp && !cancelled && (
            <div className="mt-5 flex flex-wrap items-center gap-2">
              {RSVP_OPTIONS.map((opt) => (
                <Button
                  key={opt}
                  size="sm"
                  variant={myRsvp === opt ? "default" : "outline"}
                  disabled={pending}
                  onClick={() => onRsvp(opt)}
                >
                  {RSVP_LABEL[opt]}
                </Button>
              ))}
            </div>
          )}

          {!cancelled && (
            <div className="mt-4 flex items-center gap-2">
              <AddToCalendar
                event={event}
                variant="ghost"
                className="h-8 px-2 text-muted-foreground hover:text-primary"
              />
            </div>
          )}

          {canManage && (
            <div className="mt-5 pt-4 border-t border-border flex gap-2">
              <Button size="sm" variant="ghost" onClick={onEdit}>
                <Pencil className="h-3.5 w-3.5" /> Editar
              </Button>
              <Button size="sm" variant="ghost" onClick={onDelete}>
                <Trash2 className="h-3.5 w-3.5" /> Excluir
              </Button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
