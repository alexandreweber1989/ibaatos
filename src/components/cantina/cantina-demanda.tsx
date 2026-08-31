import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Utensils, Users, Calendar, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { StatTile } from "@/components/painel/ui";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/lib/store";

export function CantinaDemanda() {
  const { data, isLoading } = useQuery({
    queryKey: ["cantina-demanda"],
    queryFn: async () => {
      const [menus, itens] = await Promise.all([
        supabase
          .from("canteen_menus")
          .select("id, title, service_date, status")
          .order("service_date", { ascending: false })
          .limit(6),
        supabase
          .from("canteen_reservation_items")
          .select(
            "item_name, quantity, unit_price_cents, reservation:canteen_reservations!inner(id, menu_id, status, user_id)",
          ),
      ]);
      if (menus.error) throw menus.error;
      if (itens.error) throw itens.error;
      return { menus: menus.data ?? [], itens: (itens.data ?? []) as any[] };
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 opacity-30 animate-pulse">
        <Utensils className="h-10 w-10 mb-4" />
        <p className="font-serif text-lg text-foreground">Calculando demanda gastronômica...</p>
      </div>
    );
  }

  const menus = data?.menus ?? [];
  const itens = (data?.itens ?? []).filter((i) => i.reservation?.status !== "cancelado");

  const totalItens = itens.reduce((s, i) => s + i.quantity, 0);
  const totalPessoas = new Set(itens.map((i) => i.reservation?.user_id)).size;
  const totalCents = itens.reduce((s, i) => s + i.quantity * i.unit_price_cents, 0);

  return (
    <div className="space-y-12">
      <div className="grid sm:grid-cols-3 gap-6">
        <StatTile label="Porções Totais" value={totalItens} icon={Utensils} />
        <StatTile label="Membros Ativos" value={totalPessoas} icon={Users} />
        <StatTile label="Caixa Projetado" value={formatBRL(totalCents)} icon={ClipboardList} />
      </div>

      {menus.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border/50 rounded-[2.5rem] shadow-sm opacity-50">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
          <p className="font-serif text-lg">Nenhum histórico de cardápio encontrado.</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-8">
          <AnimatePresence mode="popLayout">
            {menus.map((menu: any, idx) => {
              const doMenu = itens.filter((i) => i.reservation?.menu_id === menu.id);
              const map = new Map<string, number>();
              doMenu.forEach((i) => map.set(i.item_name, (map.get(i.item_name) ?? 0) + i.quantity));
              const linhas = [...map.entries()].sort((a, b) => b[1] - a[1]);
              const maior = linhas[0]?.[1] ?? 1;
              const dateObj = new Date(`${menu.service_date}T12:00:00`);

              return (
                <motion.section
                  key={menu.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-card border border-border/50 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 flex flex-col group"
                >
                  <div className="flex items-start justify-between mb-8">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <Badge
                          variant="outline"
                          className="font-mono text-[9px] uppercase tracking-widest border-primary/30 text-primary px-3 py-1"
                        >
                          {dateObj.toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                          })}
                        </Badge>
                        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                          {dateObj.toLocaleDateString("pt-BR", { weekday: "long" })}
                        </span>
                      </div>
                      <h3 className="font-serif text-2xl tracking-tight text-foreground/90 leading-none">
                        {menu.title}
                      </h3>
                    </div>
                    <div className="h-10 w-10 rounded-2xl bg-primary/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                  </div>

                  <div className="space-y-6 flex-1">
                    {linhas.length === 0 ? (
                      <div className="py-10 text-center opacity-30 border border-dashed border-border/50 rounded-2xl italic text-sm">
                        Sem reservas registradas.
                      </div>
                    ) : (
                      <div className="space-y-5">
                        {linhas.map(([nome, qtd], lineIdx) => (
                          <div key={nome} className="space-y-2">
                            <div className="flex items-baseline justify-between gap-4">
                              <span className="text-sm font-serif font-light">{nome}</span>
                              <span className="font-mono text-[10px] uppercase tracking-widest text-primary font-bold">
                                {qtd} porções
                              </span>
                            </div>
                            <div className="h-2 bg-muted/50 rounded-full overflow-hidden border border-border/20">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.round((qtd / maior) * 100)}%` }}
                                transition={{
                                  duration: 1,
                                  delay: idx * 0.1 + lineIdx * 0.05 + 0.5,
                                  ease: "easeOut",
                                }}
                                className="h-full bg-primary/80 shadow-[0_0_8px_rgba(var(--primary),0.2)]"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {linhas.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-border/50 flex justify-between items-center">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                        Popularidade por item
                      </span>
                      <span className="text-xs font-serif text-foreground/50">
                        {doMenu.length} porções totais
                      </span>
                    </div>
                  )}
                </motion.section>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
