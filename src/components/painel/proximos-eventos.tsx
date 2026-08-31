import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, MapPin, ArrowUpRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PanelSection } from "@/components/painel/ui";
import { KIND_LABEL, type EventKind } from "@/lib/agenda";
import { Button } from "@/components/ui/button";

interface EventoResumo {
  id: string;
  title: string;
  description: string | null;
  kind: EventKind;
  starts_at: string;
  location: string | null;
}

function formatQuando(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Programação publicada e ainda por vir — visível a todo membro autenticado.
 * O filtro por status/`starts_at` evita mostrar rascunhos ou eventos passados.
 */
export function ProximosEventos() {
  const { data, isPending } = useQuery({
    queryKey: ["painel", "proximos-eventos"],
    queryFn: async (): Promise<EventoResumo[]> => {
      const { data, error } = await supabase
        .from("events")
        .select("id, title, description, kind, starts_at, location")
        .eq("status", "publicado")
        .gte("starts_at", new Date().toISOString())
        .order("starts_at", { ascending: true })
        .limit(5);
      if (error) throw error;
      return (data ?? []) as EventoResumo[];
    },
  });

  return (
    <PanelSection
      label="Programação"
      title="Próximos eventos"
      action={
        <Button asChild variant="outline" size="sm">
          <Link to="/agenda">
            Ver agenda <ArrowUpRight className="h-4 w-4" />
          </Link>
        </Button>
      }
    >
      {isPending ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-muted/50 animate-pulse" />
          ))}
        </div>
      ) : !data?.length ? (
        <p className="text-sm text-muted-foreground">
          Nenhum evento publicado no momento. Assim que a liderança divulgar a próxima programação,
          ela aparece aqui.
        </p>
      ) : (
        <ul className="space-y-3">
          {data.map((e) => (
            <li
              key={e.id}
              className="rounded-lg border border-border p-4 transition-all duration-200 hover:border-primary/40 hover:shadow-sm"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
                  {KIND_LABEL[e.kind] ?? "Evento"}
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <CalendarDays className="h-3 w-3" /> {formatQuando(e.starts_at)}
                </span>
                {e.location && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {e.location}
                  </span>
                )}
              </div>
              <div className="font-serif text-lg mt-1 leading-tight">{e.title}</div>
              {e.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{e.description}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </PanelSection>
  );
}
