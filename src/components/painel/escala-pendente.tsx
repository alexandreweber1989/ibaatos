import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, X, BellRing } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, formatTime, SCHEDULE_TYPE_LABELS } from "@/lib/louvor";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Aviso no painel: escalas publicadas aguardando a resposta da pessoa. */
export function EscalaPendente() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [note, setNote] = useState<Record<string, string>>({});

  const { data } = useQuery({
    queryKey: ["pending-worship-assignments", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("worship_schedule_assignments")
        .select(
          "id, function_name, schedule:worship_schedules!inner(title, schedule_type, event_date, start_time, location, status)",
        )
        .eq("user_id", user!.id)
        .eq("status", "pendente");
      if (error) throw error;
      return (data as any[]).filter((a) => a.schedule?.status === "publicada");
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
      qc.invalidateQueries({ queryKey: ["pending-worship-assignments"] });
      qc.invalidateQueries({ queryKey: ["my-worship-assignments"] });
      qc.invalidateQueries({ queryKey: ["worship-schedules"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!data || data.length === 0) return null;

  return (
    <section className="border border-primary/40 bg-card rounded-sm p-6 space-y-4">
      <div className="flex items-center gap-2">
        <BellRing className="h-4 w-4 text-primary" />
        <h2 className="font-mono text-[11px] uppercase tracking-[0.2em]">
          Você foi escalado — confirme sua participação
        </h2>
      </div>
      <ul className="space-y-4">
        {data.map((a: any) => (
          <li key={a.id} className="space-y-2">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {SCHEDULE_TYPE_LABELS[a.schedule.schedule_type]} ·{" "}
                {formatDate(a.schedule.event_date)} · {formatTime(a.schedule.start_time)}
                {a.schedule.location ? ` · ${a.schedule.location}` : ""}
              </div>
              <div className="font-serif text-2xl leading-tight">{a.schedule.title}</div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Sua função: {a.function_name}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Input
                className="flex-1 min-w-48"
                placeholder="Observação (opcional)"
                value={note[a.id] ?? ""}
                onChange={(e) => setNote((n) => ({ ...n, [a.id]: e.target.value }))}
              />
              <Button onClick={() => respond.mutate({ id: a.id, status: "confirmado" })}>
                <Check className="h-4 w-4" /> Vou participar
              </Button>
              <Button
                variant="outline"
                onClick={() => respond.mutate({ id: a.id, status: "recusado" })}
              >
                <X className="h-4 w-4" /> Não vou poder
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
