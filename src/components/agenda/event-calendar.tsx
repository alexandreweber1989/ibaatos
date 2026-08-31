import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KIND_LABEL, type ChurchEvent } from "@/lib/agenda";

const WEEKDAYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function monthLabel(d: Date) {
  return d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function dayKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/** Calendário mensal da agenda: visão de mês com os eventos de cada dia. */
export function EventCalendar({
  events,
  onSelect,
}: {
  events: ChurchEvent[];
  onSelect: (event: ChurchEvent) => void;
}) {
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));

  const byDay = useMemo(() => {
    const map = new Map<string, ChurchEvent[]>();
    events.forEach((e) => {
      const key = dayKey(e.starts_at);
      map.set(key, [...(map.get(key) ?? []), e]);
    });
    return map;
  }, [events]);

  // Grade completa começando no domingo da primeira semana do mês.
  const cells = useMemo(() => {
    const first = startOfMonth(cursor);
    const start = new Date(first);
    start.setDate(first.getDate() - first.getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [cursor]);

  const today = new Date();
  const isToday = (d: Date) => d.toDateString() === today.toDateString();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="font-serif text-2xl capitalize">{monthLabel(cursor)}</div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            aria-label="Mês anterior"
            onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCursor(startOfMonth(new Date()))}>
            Hoje
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Próximo mês"
            onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px border border-border bg-border overflow-hidden rounded-sm">
        {WEEKDAYS.map((w) => (
          <div
            key={w}
            className="bg-background px-1 sm:px-2 py-2 font-mono text-[9px] sm:text-[10px] uppercase tracking-widest text-muted-foreground text-center"
          >
            {w}
          </div>
        ))}
        {cells.map((d) => {
          const list = byDay.get(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`) ?? [];
          const outside = d.getMonth() !== cursor.getMonth();
          return (
            <div
              key={d.toISOString()}
              className={`bg-background min-h-16 sm:min-h-24 p-1 sm:p-1.5 space-y-1 ${outside ? "opacity-30" : ""}`}
            >
              <div
                className={`font-mono text-[10px] w-5 h-5 grid place-items-center rounded-sm ${
                  isToday(d) ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                {d.getDate()}
              </div>
              {list.slice(0, 3).map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => onSelect(e)}
                  title={`${e.title} · ${KIND_LABEL[e.kind]}`}
                  className="w-full text-left truncate rounded-sm border border-border px-1 sm:px-1.5 py-0.5 sm:py-1 text-[9px] sm:text-[11px] hover:border-foreground transition-colors"
                >
                  {new Date(e.starts_at).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  {e.title}
                </button>
              ))}
              {list.length > 3 && (
                <div className="font-mono text-[10px] text-muted-foreground">
                  +{list.length - 3}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
