import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  PackageCheck,
  TrendingUp,
  Package,
  History,
  CheckCircle2,
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

import { StatTile } from "@/components/painel/ui";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/lib/store";

interface DemandRow {
  name: string;
  quantity: number;
  revenueCents: number;
}

export function LivrariaEstoque() {
  const { data, isLoading } = useQuery({
    queryKey: ["livraria-demanda"],
    queryFn: async () => {
      const since = new Date(Date.now() - 90 * 86400000).toISOString();
      const [produtos, itens] = await Promise.all([
        supabase.from("products").select("id, name, stock, track_stock, is_active").order("name"),
        supabase
          .from("order_items")
          .select("product_name, quantity, unit_price_cents, orders!inner(status, created_at)")
          .gte("orders.created_at", since),
      ]);
      if (produtos.error) throw produtos.error;
      if (itens.error) throw itens.error;

      const map = new Map<string, DemandRow>();
      (itens.data ?? []).forEach((i: any) => {
        if (i.orders?.status === "cancelado") return;
        const row = map.get(i.product_name) ?? {
          name: i.product_name,
          quantity: 0,
          revenueCents: 0,
        };
        row.quantity += i.quantity;
        row.revenueCents += i.quantity * i.unit_price_cents;
        map.set(i.product_name, row);
      });

      return {
        produtos: produtos.data ?? [],
        demanda: [...map.values()].sort((a, b) => b.quantity - a.quantity),
      };
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 opacity-30 animate-pulse">
        <Package className="h-10 w-10 mb-4" />
        <p className="font-serif text-lg">Processando inventário...</p>
      </div>
    );
  }

  const produtos = data?.produtos ?? [];
  const baixo = produtos.filter((p: any) => p.track_stock && p.is_active && p.stock <= 3);
  const demanda = data?.demanda ?? [];
  const totalVendido = demanda.reduce((s, d) => s + d.quantity, 0);
  const receita = demanda.reduce((s, d) => s + d.revenueCents, 0);

  return (
    <div className="space-y-10">
      <div className="grid sm:grid-cols-3 gap-6">
        <StatTile label="Saídas (90 dias)" value={totalVendido} icon={PackageCheck} />
        <StatTile label="Receita Estimada" value={formatBRL(receita)} icon={TrendingUp} />
        <StatTile
          label="Itens Críticos"
          value={baixo.length}
          icon={AlertTriangle}
          hint="Estoque <= 3"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-10">
        {/* Critical Stock Section */}
        <section className="bg-card border border-border/50 rounded-[2rem] p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-2xl bg-destructive/5 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground block">
                Reposição
              </span>
              <h3 className="font-serif text-2xl tracking-tight">Estoque Crítico</h3>
            </div>
          </div>

          {baixo.length === 0 ? (
            <div className="py-12 text-center bg-muted/20 rounded-2xl border border-dashed border-border/50">
              <CheckCircle2 className="h-8 w-8 text-emerald-500/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground font-light">
                Todos os itens ativos estão abastecidos.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {baixo.map((p: any) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border/50 group hover:border-destructive/30 transition-colors"
                >
                  <span className="font-serif text-base">{p.name}</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "font-mono text-[9px] uppercase tracking-widest px-3 py-1",
                      p.stock === 0
                        ? "border-destructive/30 text-destructive bg-destructive/5"
                        : "border-amber-500/30 text-amber-600 bg-amber-50",
                    )}
                  >
                    {p.stock === 0 ? "Esgotado" : `${p.stock} unidades`}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Demand Section */}
        <section className="bg-card border border-border/50 rounded-[2rem] p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-2xl bg-primary/5 flex items-center justify-center">
              <History className="h-5 w-5 text-primary" />
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground block">
                Performance
              </span>
              <h3 className="font-serif text-2xl tracking-tight">Mais Procurados</h3>
            </div>
          </div>

          {demanda.length === 0 ? (
            <div className="py-12 text-center bg-muted/20 rounded-2xl border border-dashed border-border/50">
              <TrendingUp className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground font-light italic">
                Aguardando dados históricos...
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {demanda.slice(0, 8).map((d, idx) => {
                const max = demanda[0]?.quantity || 1;
                const pct = Math.round((d.quantity / max) * 100);
                return (
                  <motion.div
                    key={d.name}
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: "100%", opacity: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    className="space-y-2"
                  >
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="text-sm font-serif">{d.name}</span>
                      <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                        {d.quantity} un · {formatBRL(d.revenueCents)}
                      </span>
                    </div>
                    <div className="h-2 bg-muted/50 rounded-full overflow-hidden border border-border/30">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 1, ease: "easeOut", delay: idx * 0.1 + 0.3 }}
                        className="h-full bg-primary shadow-[0_0_12px_rgba(var(--primary),0.3)]"
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
