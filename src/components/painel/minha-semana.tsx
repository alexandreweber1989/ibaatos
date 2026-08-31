import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, X, CalendarClock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { formatDateBR, relativeDayLabel } from "@/lib/painel";
import { Button } from "@/components/ui/button";
import { PanelSection, EmptyLine } from "./ui";

interface AssignmentRow {
  id: string;
  function_name: string;
  status: string;
  schedule: {
    id: string;
    title: string;
    schedule_type: string;
    event_date: string;
    start_time: string | null;
    location: string | null;
    status: string;
  } | null;
}

/** Escalas pessoais aguardando resposta ou já confirmadas para os próximos dias. */
export function MinhaSemana() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["painel-minhas-escalas", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("worship_schedule_assignments")
        .select(
          "id, function_name, status, schedule:worship_schedules!inner(id, title, schedule_type, event_date, start_time, location, status)",
        )
        .eq("user_id", user!.id);
      if (error) throw error;
      return (data as unknown as AssignmentRow[]).filter((a) => a.schedule?.status === "publicada");
    },
  });

  const respond = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "confirmado" | "recusado" }) => {
      const { error } = await supabase
        .from("worship_schedule_assignments")
        .update({ status, responded_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Resposta registrada.");
      qc.invalidateQueries({ queryKey: ["painel-minhas-escalas"] });
      qc.invalidateQueries({ queryKey: ["my-worship-assignments"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const hoje = new Date().toISOString().slice(0, 10);
  const proximas = (data ?? [])
    .filter((a) => a.schedule && a.schedule.event_date >= hoje)
    .sort((a, b) => a.schedule!.event_date.localeCompare(b.schedule!.event_date))
    .slice(0, 4);

  return (
    <PanelSection label="Minha agenda" title="O que depende de você">
      {isLoading && <EmptyLine>Carregando suas escalas…</EmptyLine>}
      {!isLoading && proximas.length === 0 && (
        <EmptyLine>Você não tem nenhuma escala publicada nos próximos dias.</EmptyLine>
      )}
      <div className="space-y-3">
        {proximas.map((a) => (
          <div
            key={a.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-border rounded-sm p-4"
          >
            <div className="min-w-0">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
                {relativeDayLabel(a.schedule!.event_date)} ·{" "}
                {formatDateBR(a.schedule!.event_date, { day: "2-digit", month: "2-digit" })}
                {a.schedule!.start_time ? ` · ${a.schedule!.start_time.slice(0, 5)}` : ""}
              </div>
              <div className="font-serif text-lg mt-1 truncate">{a.schedule!.title}</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {a.function_name}
                {a.schedule!.location ? ` · ${a.schedule!.location}` : ""}
              </div>
            </div>
            {a.status === "pendente" ? (
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <Button
                  className="flex-1 sm:flex-initial"
                  onClick={() => respond.mutate({ id: a.id, status: "confirmado" })}
                  disabled={respond.isPending}
                >
                  <Check className="h-4 w-4" /> Confirmar
                </Button>
                <Button
                  className="flex-1 sm:flex-initial"
                  variant="outline"
                  onClick={() => respond.mutate({ id: a.id, status: "recusado" })}
                  disabled={respond.isPending}
                >
                  <X className="h-4 w-4" /> Recusar
                </Button>
              </div>
            ) : (
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-1">
                <CalendarClock className="h-3 w-3" />
                {a.status === "confirmado" ? "Confirmado" : "Recusado"}
              </span>
            )}
          </div>
        ))}
      </div>
    </PanelSection>
  );
}
