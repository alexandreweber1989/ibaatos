import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ASSIGNMENT_STATUS, SCHEDULE_TYPE_LABELS, formatDate, formatTime } from "@/lib/louvor";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QueryError } from "./visao-geral";

export function MinhasEscalas() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [note, setNote] = useState<Record<string, string>>({});

  const { data, error } = useQuery({
    queryKey: ["my-worship-assignments", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("worship_schedule_assignments")
        .select(
          "id, function_name, status, response_note, schedule:worship_schedules!inner(id, title, schedule_type, event_date, start_time, location, status)",
        )
        .eq("user_id", user!.id);
      if (error) throw error;
      return (data as any[]).filter((a) => a.schedule?.status !== "rascunho");
    },
  });

  const respond = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "confirmado" | "recusado" }) => {
      const { error } = await supabase
        .from("worship_schedule_assignments")
        .update({ status, response_note: note[id] || null, responded_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Resposta registrada.");
      qc.invalidateQueries({ queryKey: ["my-worship-assignments"] });
      qc.invalidateQueries({ queryKey: ["worship-schedules"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const sorted = [...(data ?? [])].sort((a, b) =>
    a.schedule.event_date.localeCompare(b.schedule.event_date),
  );

  if (error) return <QueryError error={error as Error} />;

  if (sorted.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Você não está escalado em nenhum culto ou ensaio no momento.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {sorted.map((a: any) => (
        <div key={a.id} className="border border-border bg-card rounded-sm p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                {SCHEDULE_TYPE_LABELS[a.schedule.schedule_type]} ·{" "}
                {formatDate(a.schedule.event_date)} · {formatTime(a.schedule.start_time)}
                {a.schedule.location ? ` · ${a.schedule.location}` : ""}
              </div>
              <h3 className="font-serif text-3xl leading-none mt-1">{a.schedule.title}</h3>
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mt-2">
                Sua função: {a.function_name}
              </div>
            </div>
            <span
              className={`px-2 py-1 rounded-sm font-mono text-[10px] uppercase tracking-widest ${ASSIGNMENT_STATUS[a.status].className}`}
            >
              {ASSIGNMENT_STATUS[a.status].label}
            </span>
          </div>
          {a.status === "pendente" && (
            <div className="mt-4 flex flex-wrap gap-2">
              <Input
                className="flex-1 min-w-48"
                placeholder="Observação (opcional)"
                value={note[a.id] ?? ""}
                onChange={(e) => setNote((n) => ({ ...n, [a.id]: e.target.value }))}
              />
              <Button onClick={() => respond.mutate({ id: a.id, status: "confirmado" })}>
                <Check className="h-4 w-4" /> Confirmar
              </Button>
              <Button
                variant="outline"
                onClick={() => respond.mutate({ id: a.id, status: "recusado" })}
              >
                <X className="h-4 w-4" /> Não posso
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
