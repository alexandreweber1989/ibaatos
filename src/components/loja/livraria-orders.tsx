import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Package, Link, CheckCircle2, XCircle, Info, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { formatBRL, ORDER_STATUS } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function LivrariaOrders() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [proof, setProof] = useState<Record<string, string>>({});

  const { data: orders, isLoading } = useQuery({
    queryKey: ["my-orders", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, items:order_items(id, product_name, quantity, unit_price_cents)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const sendProof = useMutation({
    mutationFn: async ({ id, url }: { id: string; url: string }) => {
      const { error } = await supabase
        .from("orders")
        .update({ payment_proof_url: url })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Comprovante enviado. Nossa equipe validará seu pagamento.");
      qc.invalidateQueries({ queryKey: ["my-orders"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const cancel = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("orders").update({ status: "cancelado" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Pedido cancelado.");
      qc.invalidateQueries({ queryKey: ["my-orders"] });
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

  if (orders && orders.length === 0) {
    return (
      <div className="text-center py-20 bg-card border border-border/50 rounded-[2.5rem] shadow-sm">
        <div className="h-20 w-20 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingBag className="h-8 w-8 text-muted-foreground/30" />
        </div>
        <h3 className="text-xl font-serif mb-2">Sem pedidos por aqui</h3>
        <p className="text-muted-foreground text-sm font-light">
          Você ainda não realizou nenhuma compra em nossa livraria.
        </p>
        <Button
          variant="link"
          className="mt-4 text-primary"
          onClick={() => (window.location.hash = "catalogo")}
        >
          Ver Catálogo
        </Button>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-8 items-start">
      <AnimatePresence mode="popLayout">
        {orders?.map((o: any, idx) => {
          const status = ORDER_STATUS[o.status];
          const hasProof = !!o.payment_proof_url;

          return (
            <motion.div
              key={o.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="group bg-card border border-border/50 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="flex flex-wrap items-center justify-between gap-4 mb-8 relative">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-muted/30 flex items-center justify-center">
                    <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground block">
                      Retirada
                    </span>
                    <span className="font-serif text-3xl text-foreground tracking-tight">
                      {o.pickup_code}
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

              <div className="space-y-4 mb-8">
                <div className="space-y-2">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground block opacity-60">
                    Conteúdo
                  </span>
                  <ul className="space-y-2">
                    {o.items?.map((i: any) => (
                      <li
                        key={i.id}
                        className="flex justify-between items-center text-sm font-light"
                      >
                        <div className="flex items-center gap-2">
                          <Package className="h-3 w-3 text-muted-foreground/50" />
                          <span>
                            {i.quantity}× {i.product_name}
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
                      Investimento Total
                    </span>
                    <span className="font-serif text-2xl text-primary">
                      {formatBRL(o.total_cents)}
                    </span>
                  </div>
                </div>
              </div>

              {o.status === "aguardando_pagamento" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4 relative"
                >
                  <div className="flex flex-col gap-3">
                    <div className="relative group/input">
                      <Link className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
                      <Input
                        className="pl-11 h-12 rounded-xl border-border/50 bg-background/50 focus:bg-background transition-all text-xs"
                        placeholder="Link do comprovante PIX"
                        value={proof[o.id] ?? o.payment_proof_url ?? ""}
                        onChange={(e) => setProof((p) => ({ ...p, [o.id]: e.target.value }))}
                      />
                    </div>
                    <Button
                      className="w-full h-12 rounded-xl text-sm font-serif shadow-lg shadow-primary/10"
                      disabled={!(proof[o.id] ?? o.payment_proof_url) || sendProof.isPending}
                      onClick={() =>
                        sendProof.mutate({ id: o.id, url: proof[o.id] ?? o.payment_proof_url })
                      }
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {hasProof ? "Atualizar Comprovante" : "Enviar Comprovante"}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-light">
                      <Info className="h-3 w-3" />
                      <span>Confirmação manual pela equipe</span>
                    </div>
                    <button
                      className="text-[10px] text-muted-foreground/40 hover:text-destructive transition-colors underline underline-offset-4"
                      onClick={() => cancel.mutate(o.id)}
                    >
                      Cancelar Pedido
                    </button>
                  </div>
                </motion.div>
              )}

              {o.status === "pago" && (
                <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <p className="text-[11px] text-emerald-800 leading-relaxed font-light">
                    Pagamento confirmado! Você já pode retirar seu pedido em nosso balcão.
                  </p>
                </div>
              )}

              {o.status === "cancelado" && (
                <div className="flex items-center gap-3 p-4 bg-muted/30 border border-border/50 rounded-2xl opacity-60">
                  <XCircle className="h-5 w-5 text-muted-foreground" />
                  <p className="text-[11px] text-muted-foreground leading-relaxed font-light">
                    Este pedido foi cancelado e não é mais válido para retirada.
                  </p>
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
