import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Utensils, CheckCircle2, Clock, XCircle, Info, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { formatBRL, RESERVATION_STATUS } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function CantinaMyReservations() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: reservations, isLoading } = useQuery({
    queryKey: ["my-reservations", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("canteen_reservations")
        .select(
          "*, menu:canteen_menus(title, service_date), items:canteen_reservation_items(id, item_name, quantity, unit_price_cents)",
        )
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const cancel = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("canteen_reservations")
        .update({ status: "cancelado" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Reserva cancelada.");
      qc.invalidateQueries({ queryKey: ["my-reservations"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="grid md:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="h-64 bg-muted/20 rounded-[2rem] animate-pulse border border-border/50"
          />
        ))}
      </div>
    );
  }

  if (reservations && reservations.length === 0) {
    return (
      <div className="text-center py-20 bg-card border border-border/50 rounded-[2.5rem] shadow-sm">
        <div className="h-20 w-20 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <Utensils className="h-8 w-8 text-muted-foreground/30" />
        </div>
        <h3 className="text-xl font-serif mb-2">Nenhuma reserva encontrada</h3>
        <p className="text-muted-foreground text-sm font-light">
          Você ainda não reservou nada em nossa cantina.
        </p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-8 items-start">
      <AnimatePresence mode="popLayout">
        {reservations?.map((r: any, idx) => {
          const status = RESERVATION_STATUS[r.status];
          const serviceDate = r.menu?.service_date
            ? new Date(r.menu.service_date + "T12:00:00")
            : null;

          return (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="group bg-card border border-border/50 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 relative overflow-hidden flex flex-col"
            >
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="flex flex-wrap items-center justify-between gap-4 mb-6 relative">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-muted/30 flex items-center justify-center font-serif text-2xl text-primary">
                    {r.pickup_code}
                  </div>
                  <div>
                    <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground block">
                      Mesa
                    </span>
                    <span className="font-serif text-xl text-foreground tracking-tight line-clamp-1">
                      {r.menu?.title || "Reserva de Culto"}
                    </span>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "font-mono text-[9px] uppercase tracking-widest px-3 py-1 border-opacity-30",
                    status.className,
                  )}
                >
                  {status.label}
                </Badge>
              </div>

              {serviceDate && (
                <div className="flex items-center gap-2 mb-6 text-[10px] font-mono uppercase tracking-widest text-muted-foreground/70">
                  <Calendar className="h-3 w-3" />
                  {serviceDate.toLocaleDateString("pt-BR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </div>
              )}

              <div className="space-y-4 mb-8 flex-1">
                <div className="space-y-2">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground block opacity-60">
                    Pedido
                  </span>
                  <ul className="space-y-2">
                    {r.items?.map((i: any) => (
                      <li
                        key={i.id}
                        className="flex justify-between items-center text-sm font-light"
                      >
                        <div className="flex items-center gap-2">
                          <span className="h-1 w-1 rounded-full bg-primary/30" />
                          <span>
                            {i.quantity}× {i.item_name}
                          </span>
                        </div>
                        <span className="font-mono text-xs text-muted-foreground">
                          {formatBRL(i.unit_price_cents * i.quantity)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 border-t border-border/50">
                  <div className="flex items-baseline justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      Pagar na Retirada
                    </span>
                    <span className="font-serif text-2xl text-primary">
                      {formatBRL(r.total_cents)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="relative mt-auto">
                {r.status === "reservado" && (
                  <div className="flex flex-col gap-4">
                    <div className="flex gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                      <Info className="h-5 w-5 text-primary flex-shrink-0" />
                      <p className="text-[11px] text-primary/80 leading-relaxed font-light">
                        Sua reserva está garantida. Realize o pagamento diretamente na cantina para
                        retirar seus itens.
                      </p>
                    </div>
                    <button
                      className="text-[10px] text-muted-foreground/40 hover:text-destructive transition-colors underline underline-offset-4 w-fit"
                      onClick={() => cancel.mutate(r.id)}
                    >
                      Cancelar Reserva
                    </button>
                  </div>
                )}

                {r.status === "retirado" && (
                  <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <p className="text-[11px] text-emerald-800 leading-relaxed font-light">
                      Itens retirados com sucesso. Bom apetite e excelente comunhão!
                    </p>
                  </div>
                )}

                {r.status === "cancelado" && (
                  <div className="flex items-center gap-3 p-4 bg-muted/30 border border-border/50 rounded-2xl opacity-60">
                    <XCircle className="h-5 w-5 text-muted-foreground" />
                    <p className="text-[11px] text-muted-foreground leading-relaxed font-light">
                      Esta reserva foi cancelada e os itens foram liberados para outros membros.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
