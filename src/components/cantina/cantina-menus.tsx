import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, Utensils, Info, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { formatBRL } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CanteenItem {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price_cents: number;
  image_url: string | null;
}

interface CanteenMenu {
  id: string;
  title: string;
  service_date: string;
  notes: string | null;
  art_url: string | null;
}

export function CantinaMenus() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});

  const { data: activeMenu, isLoading: menuLoading } = useQuery({
    queryKey: ["canteen-menus", "active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("canteen_menus")
        .select("*")
        .eq("status", "aberto")
        .maybeSingle();
      if (error) throw error;
      return data as CanteenMenu | null;
    },
  });

  const { data: menuItems, isLoading: itemsLoading } = useQuery({
    queryKey: ["canteen-menu-items", activeMenu?.id],
    enabled: !!activeMenu?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("canteen_menu_items")
        .select("item:canteen_items(id, name, description, category, price_cents, image_url)")
        .eq("menu_id", activeMenu!.id);
      if (error) throw error;
      return data.map((d: any) => d.item as CanteenItem);
    },
  });

  const categories = useMemo(() => {
    if (!menuItems) return [];
    return Array.from(new Set(menuItems.map((i) => i.category)));
  }, [menuItems]);

  const total = useMemo(() => {
    if (!menuItems) return 0;
    return Object.entries(selectedItems).reduce((sum, [id, qty]) => {
      const item = menuItems.find((i) => i.id === id);
      return sum + (item?.price_cents ?? 0) * qty;
    }, 0);
  }, [selectedItems, menuItems]);

  const setQty = (id: string, delta: number) => {
    setSelectedItems((prev) => {
      const newQty = Math.max(0, (prev[id] ?? 0) + delta);
      if (newQty === 0) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: newQty };
    });
  };

  const reserve = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Faça login para reservar.");
      if (Object.keys(selectedItems).length === 0) throw new Error("Selecione pelo menos um item.");

      const { data: reservation, error } = await supabase
        .from("canteen_reservations")
        .insert({
          user_id: user.id,
          menu_id: activeMenu!.id,
          total_cents: total,
        })
        .select()
        .single();

      if (error) throw error;

      const itemsToInsert = Object.entries(selectedItems).map(([id, qty]) => {
        const item = menuItems!.find((i) => i.id === id)!;
        return {
          reservation_id: reservation.id,
          item_id: id,
          item_name: item.name,
          unit_price_cents: item.price_cents,
          quantity: qty,
        };
      });

      const { error: itemsError } = await supabase
        .from("canteen_reservation_items")
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;
      return reservation;
    },
    onSuccess: () => {
      setSelectedItems({});
      qc.invalidateQueries({ queryKey: ["canteen-reservations", user?.id] });
      toast.success("Reserva realizada com sucesso!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (menuLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-64 bg-muted/20 rounded-[2.5rem] border border-border/50" />
        <div className="grid md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-muted/20 rounded-3xl border border-border/50" />
          ))}
        </div>
      </div>
    );
  }

  if (!activeMenu) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="h-24 w-24 bg-muted/30 rounded-full flex items-center justify-center mb-6">
          <Utensils className="h-10 w-10 text-muted-foreground/40" />
        </div>
        <h3 className="text-2xl font-serif mb-2">Cardápio Indisponível</h3>
        <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
          Ainda não temos um cardápio publicado para o próximo culto. Fique atento às comunicações
          da sua Mesa.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Hero Header */}
      <section className="relative h-64 md:h-80 rounded-[2.5rem] overflow-hidden group shadow-2xl shadow-black/20">
        {activeMenu.art_url ? (
          <img
            src={activeMenu.art_url}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            alt={activeMenu.title}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/5 to-background border border-primary/20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8 md:p-12">
          <div className="flex items-center gap-3 mb-3">
            <Badge
              variant="secondary"
              className="bg-primary/20 text-primary-foreground backdrop-blur-xl border-primary/30 font-mono text-[10px] uppercase tracking-widest px-3"
            >
              Cardápio da Semana
            </Badge>
            <div className="flex items-center gap-2 text-white/60 font-mono text-[10px] uppercase tracking-widest">
              <Clock className="h-3 w-3" />
              {new Date(activeMenu.service_date).toLocaleDateString("pt-BR", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </div>
          </div>
          <h2 className="text-4xl md:text-6xl font-serif text-white tracking-tight">
            {activeMenu.title}
          </h2>
          {activeMenu.notes && (
            <p className="text-white/70 mt-4 max-w-2xl font-light italic leading-relaxed">
              {activeMenu.notes}
            </p>
          )}
        </div>
      </section>

      <div className="grid lg:grid-cols-[1fr_380px] gap-12 items-start">
        {/* Menu Items */}
        <div className="space-y-16">
          {itemsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-muted/20 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            categories.map((cat) => (
              <section key={cat} className="space-y-8">
                <div className="flex items-center gap-4">
                  <h3 className="text-2xl font-serif text-foreground/90 pr-4 bg-background z-10">
                    {cat}
                  </h3>
                  <div className="h-px bg-border/50 flex-1" />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {menuItems
                    ?.filter((i) => i.category === cat)
                    .map((item, idx) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className={cn(
                          "group bg-card border border-border/50 rounded-3xl p-5 flex gap-5 transition-all duration-300",
                          "hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20",
                          selectedItems[item.id] > 0 &&
                            "ring-2 ring-primary/20 border-primary/30 bg-primary/5",
                        )}
                      >
                        <div className="h-24 w-24 rounded-2xl bg-muted/30 overflow-hidden flex-shrink-0 relative">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              alt={item.name}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Utensils className="h-6 w-6 text-muted-foreground/30" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 flex flex-col justify-between py-1">
                          <div>
                            <h4 className="font-serif text-xl leading-none mb-2">{item.name}</h4>
                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed font-light">
                              {item.description}
                            </p>
                          </div>

                          <div className="flex items-center justify-between mt-4">
                            <span className="font-serif text-lg text-primary">
                              {formatBRL(item.price_cents)}
                            </span>

                            <div className="flex items-center gap-1 bg-background/50 p-1 rounded-xl border border-border/50">
                              {selectedItems[item.id] > 0 ? (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary"
                                    onClick={() => setQty(item.id, -1)}
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <span className="w-6 text-center font-mono text-xs font-bold">
                                    {selectedItems[item.id]}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary"
                                    onClick={() => setQty(item.id, 1)}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary"
                                  onClick={() => setQty(item.id, 1)}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                </div>
              </section>
            ))
          )}
        </div>

        {/* Floating Cart / Summary */}
        <aside className="lg:sticky lg:top-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border/50 rounded-[2.5rem] p-8 shadow-2xl shadow-black/10 relative overflow-hidden"
          >
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/10 rounded-full blur-3xl opacity-50" />

            <div className="relative space-y-8">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Utensils className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary/60 block">
                    Reserva
                  </span>
                  <span className="font-serif text-2xl">Sua Mesa</span>
                </div>
              </div>

              {Object.keys(selectedItems).length === 0 ? (
                <div className="py-12 text-center space-y-4">
                  <div className="h-20 w-20 bg-muted/20 rounded-full flex items-center justify-center mx-auto">
                    <Utensils className="h-8 w-8 text-muted-foreground/30" />
                  </div>
                  <p className="text-sm text-muted-foreground max-w-[200px] mx-auto leading-relaxed">
                    Explore o cardápio e selecione suas delícias favoritas para reservar.
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="space-y-3 max-h-[35vh] overflow-y-auto pr-2 custom-scrollbar">
                    <AnimatePresence mode="popLayout">
                      {Object.entries(selectedItems).map(([id, qty]) => {
                        const item = menuItems?.find((i) => i.id === id);
                        if (!item) return null;
                        return (
                          <motion.div
                            key={id}
                            layout
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border/50 group"
                          >
                            <div className="min-w-0">
                              <p className="font-serif text-sm truncate">{item.name}</p>
                              <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">
                                {qty}x {formatBRL(item.price_cents)}
                              </p>
                            </div>
                            <div className="flex items-center gap-3 ml-4">
                              <span className="font-mono text-sm font-bold text-primary">
                                {formatBRL(item.price_cents * qty)}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 rounded-md opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
                                onClick={() => setQty(id, -qty)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>

                  <div className="pt-8 border-t border-border/50">
                    <div className="flex items-baseline justify-between mb-8">
                      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                        Total da Reserva
                      </span>
                      <span className="font-serif text-4xl text-foreground tracking-tighter">
                        {formatBRL(total)}
                      </span>
                    </div>

                    <Button
                      className="w-full h-16 rounded-2xl text-xl font-serif shadow-2xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
                      disabled={reserve.isPending}
                      onClick={() => reserve.mutate()}
                    >
                      {reserve.isPending ? "Confirmando..." : "Confirmar Reserva"}
                    </Button>

                    <div className="mt-8 flex gap-4 p-5 bg-primary/5 rounded-[1.5rem] border border-primary/10">
                      <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0" />
                      <div>
                        <p className="text-xs font-serif text-foreground mb-1">
                          Pagamento no local
                        </p>
                        <p className="text-[10px] text-muted-foreground leading-relaxed">
                          Sua reserva garante a disponibilidade. O pagamento é feito diretamente na
                          cantina na hora da retirada.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </aside>
      </div>
    </div>
  );
}
