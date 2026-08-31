import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, ChevronDown, Search, Calendar, MapPin, Clock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  LOUVOR_MINISTRY_ID,
  SCHEDULE_STATUS,
  SCHEDULE_TYPE_LABELS,
  formatDate,
  formatTime,
} from "@/lib/louvor";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { ScheduleDialog } from "./schedule-dialog";
import { ScheduleDetail } from "./schedule-detail";
import { QueryError } from "./visao-geral";
import { Badge } from "@/components/ui/badge";

export function Escalas() {
  const { isMinistryAdmin } = useAuth();
  const canManage = isMinistryAdmin(LOUVOR_MINISTRY_ID);
  const [openId, setOpenId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["worship-schedules"],
    queryFn: async () => {
      // Priorizamos as novas tabelas public.setlists e mantemos retrocompatibilidade
      const { data: setlists, error: setlistError } = await (supabase.from("setlists") as any)
        .select("*, assignments:worship_schedule_assignments(id, status)")
        .order("event_date", { ascending: false });

      if (setlistError) {
        const { data: oldData, error: oldError } = await (supabase.from("worship_schedules") as any)
          .select("*, assignments:worship_schedule_assignments(id, status)")
          .order("event_date", { ascending: false });
        if (oldError) throw oldError;
        return oldData;
      }
      return setlists;
    },
  });

  const setStatus = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: "rascunho" | "publicada" | "concluida";
    }) => {
      // Tenta atualizar na nova tabela ou na antiga
      const { error } = await (supabase.from("setlists") as any).update({ status }).eq("id", id);
      if (error) {
        const { error: oldError } = await (supabase.from("worship_schedules") as any)
          .update({ status })
          .eq("id", id);
        if (oldError) throw oldError;
      }
    },
    onSuccess: () => {
      toast.success("Situação atualizada.");
      qc.invalidateQueries({ queryKey: ["worship-schedules"] });
      qc.invalidateQueries({ queryKey: ["my-worship-assignments"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from("setlists") as any).delete().eq("id", id);
      if (error) {
        const { error: oldError } = await (supabase.from("worship_schedules") as any)
          .delete()
          .eq("id", id);
        if (oldError) throw oldError;
      }
    },
    onSuccess: () => {
      toast.success("Escala removida.");
      qc.invalidateQueries({ queryKey: ["worship-schedules"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return data ?? [];
    return (data ?? []).filter(
      (s: any) =>
        s.title.toLowerCase().includes(term) || (s.notes && s.notes.toLowerCase().includes(term)),
    );
  }, [data, q]);

  if (error) return <QueryError error={error as Error} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 h-11 bg-muted/30 border-border/50 focus-visible:ring-primary/50"
            placeholder="Filtrar por título ou notas..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        {canManage && (
          <ScheduleDialog
            trigger={
              <Button className="h-11 px-6 shadow-lg shadow-primary/10 transition-all hover:scale-[1.02] active:scale-[0.98]">
                <Plus className="h-4 w-4 mr-2" /> Nova Escala
              </Button>
            }
          />
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed rounded-lg bg-muted/10">
          <Calendar className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">
            Nenhuma escala encontrada para os critérios informados.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((s: any) => {
            const confirmed = (s.assignments ?? []).filter(
              (a: any) => a.status === "confirmado",
            ).length;
            const total = (s.assignments ?? []).length;
            const open = openId === s.id;
            const statusCfg = SCHEDULE_STATUS[s.status] || {
              label: s.status,
              className: "bg-muted",
            };

            return (
              <div
                key={s.id}
                className={`group border transition-all duration-300 rounded-lg overflow-hidden ${
                  open
                    ? "border-primary/30 bg-card shadow-lg shadow-primary/5"
                    : "border-border/50 bg-card/50 hover:bg-card hover:border-border"
                }`}
              >
                <div className="p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="font-mono text-[9px] uppercase tracking-widest bg-muted/50 border-none"
                        >
                          {SCHEDULE_TYPE_LABELS[s.schedule_type] || s.schedule_type}
                        </Badge>
                        <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                          {formatDate(s.event_date)}
                        </span>
                      </div>
                      <h3 className="font-serif text-3xl leading-tight group-hover:text-primary transition-colors">
                        {s.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" /> {formatTime(s.start_time)}
                        </span>
                        {s.location && (
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5" /> {s.location}
                          </span>
                        )}
                        <span className="font-medium">
                          {confirmed}/{total} confirmados
                        </span>
                      </div>
                      {s.notes && (
                        <p className="text-sm text-muted-foreground mt-3 italic line-clamp-1">
                          {s.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        className={`uppercase text-[10px] tracking-widest py-1 px-3 ${statusCfg.className} border-none`}
                      >
                        {statusCfg.label}
                      </Badge>

                      <div className="flex items-center gap-1 ml-2">
                        {canManage && s.status === "rascunho" && (
                          <Button
                            size="sm"
                            onClick={() => setStatus.mutate({ id: s.id, status: "publicada" })}
                            className="h-8"
                          >
                            Publicar
                          </Button>
                        )}
                        {canManage && s.status === "publicada" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setStatus.mutate({ id: s.id, status: "concluida" })}
                            className="h-8"
                          >
                            Concluir
                          </Button>
                        )}
                        {canManage && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => {
                              if (confirm("Deseja realmente remover esta escala?"))
                                remove.mutate(s.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant={open ? "secondary" : "outline"}
                          size="sm"
                          className="h-8 gap-2"
                          onClick={() => setOpenId(open ? null : s.id)}
                        >
                          {open ? "Fechar" : "Detalhes"}
                          <ChevronDown
                            className={`h-4 w-4 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
                          />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                {open && (
                  <div className="animate-in slide-in-from-top-2 duration-300">
                    <ScheduleDetail scheduleId={s.id} canManage={canManage} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
