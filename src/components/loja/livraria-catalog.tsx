import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Minus, Plus, ShoppingBag, Package, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { formatBRL } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { PixDialog } from "@/components/loja/pix-dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price_cents: number;
  stock: number;
  track_stock: boolean;
  image_url: string | null;
}

export function LivrariaCatalog() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [cart, setCart] = useState<Record<string, number>>({});
  const [placed, setPlaced] = useState<{ code: string; total: number } | null>(null);

  const { data: products, isLoading } = useQuery({
    queryKey: ["products", "active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, description, category, price_cents, stock, track_stock, image_url")
        .eq("is_active", true)
        .order("category")
        .order("name");
      if (error) throw error;
      return data as Product[];
    },
  });

  const { data: settings } = useQuery({
    queryKey: ["app-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("app_settings").select("key, value");
      if (error) throw error;
      return Object.fromEntries((data ?? []).map((r) => [r.key, r.value ?? ""]));
    },
  });

  const lines = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, qty]) => ({ product: products?.find((p) => p.id === id), qty }))
        .filter((l): l is { product: Product; qty: number } => Boolean(l.product) && l.qty > 0),
    [cart, products],
  );

  const total = lines.reduce((sum, l) => sum + l.product.price_cents * l.qty, 0);

  const setQty = (id: string, delta: number) =>
    setCart((c) => ({ ...c, [id]: Math.max(0, (c[id] ?? 0) + delta) }));

  const checkout = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Faça login para comprar.");
      const { data: order, error } = await supabase
        .from("orders")
        .insert({ user_id: user.id, total_cents: total })
        .select("id, pickup_code, total_cents")
        .single();
      if (error) throw error;
      const { error: itemsError } = await supabase.from("order_items").insert(
        lines.map((l) => ({
          order_id: order.id,
          product_id: l.product.id,
          product_name: l.product.name,
          unit_price_cents: l.product.price_cents,
          quantity: l.qty,
        })),
      );
      if (itemsError) throw itemsError;
      return order;
    },
    onSuccess: (order) => {
      setCart({});
      setPlaced({ code: order.pickup_code, total: order.total_cents });
      qc.invalidateQueries({ queryKey: ["my-orders"] });
      qc.invalidateQueries({ queryKey: ["all-orders"] });
      toast.success("Pedido gerado com sucesso!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="h-[400px] rounded-3xl bg-muted/20 animate-pulse border border-border/50"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">
      <motion.div layout className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {products?.map((p, idx) => {
            const soldOut = p.track_stock && p.stock <= 0;
            const inCart = cart[p.id] ?? 0;

            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ y: -5 }}
                className={cn(
                  "group relative bg-card border border-border/50 rounded-3xl overflow-hidden flex flex-col transition-all duration-300",
                  "hover:shadow-2xl hover:shadow-primary/5 hover:border-primary/20",
                  inCart > 0 && "ring-2 ring-primary/20 border-primary/30",
                )}
              >
                <div className="aspect-[4/3] bg-muted/30 flex items-center justify-center overflow-hidden relative">
                  {p.image_url ? (
                    <motion.img
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.6 }}
                      src={p.image_url}
                      alt={p.name}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Package className="h-12 w-12 text-muted-foreground/30" />
                  )}

                  {soldOut && (
                    <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex items-center justify-center">
                      <Badge
                        variant="destructive"
                        className="font-mono uppercase tracking-widest text-[10px] px-3"
                      >
                        Esgotado
                      </Badge>
                    </div>
                  )}

                  <div className="absolute top-4 left-4">
                    <Badge
                      variant="secondary"
                      className="bg-background/80 backdrop-blur-md border-border/50 font-mono text-[9px] uppercase tracking-widest px-2 py-0"
                    >
                      {p.category}
                    </Badge>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="font-serif text-2xl leading-tight group-hover:text-primary transition-colors">
                    {p.name}
                  </h3>
                  {p.description && (
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2 font-light leading-relaxed">
                      {p.description}
                    </p>
                  )}

                  <div className="mt-auto pt-6 flex items-center justify-between">
                    <div>
                      <span className="font-serif text-2xl text-foreground">
                        {formatBRL(p.price_cents)}
                      </span>
                      {p.track_stock && !soldOut && (
                        <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mt-1 opacity-60">
                          {p.stock} em estoque
                        </div>
                      )}
                    </div>

                    {!soldOut && (
                      <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-2xl border border-border/50">
                        {inCart > 0 ? (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 rounded-xl hover:bg-background hover:text-primary"
                              onClick={() => setQty(p.id, -1)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center font-mono text-sm font-bold">
                              {inCart}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 rounded-xl hover:bg-background hover:text-primary"
                              onClick={() => setQty(p.id, 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            className="rounded-xl px-4 h-9 shadow-lg shadow-primary/20"
                            onClick={() => setQty(p.id, 1)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Adicionar
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {products && products.length === 0 && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-border/50 rounded-3xl">
            <Package className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
            <h3 className="text-lg font-serif">Nenhum produto disponível</h3>
            <p className="text-muted-foreground">Volte em breve para conferir as novidades.</p>
          </div>
        )}
      </motion.div>

      <aside className="lg:sticky lg:top-24 space-y-6">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-card border border-border/50 rounded-[2rem] p-8 shadow-2xl shadow-black/5 relative overflow-hidden"
        >
          {/* Decorative elements */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />

          <div className="relative">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                <ShoppingBag className="h-5 w-5 text-primary" />
              </div>
              <div>
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary/60 block">
                  Checkout
                </span>
                <span className="font-serif text-xl">Seu Pedido</span>
              </div>
            </div>

            {lines.length === 0 ? (
              <div className="py-10 text-center">
                <div className="h-16 w-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingBag className="h-6 w-6 text-muted-foreground/40" />
                </div>
                <p className="text-sm text-muted-foreground max-w-[200px] mx-auto leading-relaxed">
                  Adicione produtos ao carrinho para continuar com a compra.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                  {lines.map((l) => (
                    <motion.div
                      layout
                      key={l.product.id}
                      className="flex items-center justify-between gap-4 text-sm bg-muted/30 p-3 rounded-2xl border border-border/50"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-xl bg-background border border-border/50 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {l.product.image_url ? (
                            <img src={l.product.image_url} className="h-full w-full object-cover" />
                          ) : (
                            <Package className="h-4 w-4 text-muted-foreground/40" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-serif truncate">{l.product.name}</p>
                          <p className="font-mono text-[10px] text-muted-foreground uppercase">
                            {l.qty} unidades
                          </p>
                        </div>
                      </div>
                      <span className="font-mono font-medium text-primary">
                        {formatBRL(l.product.price_cents * l.qty)}
                      </span>
                    </motion.div>
                  ))}
                </div>

                <div className="pt-6 border-t border-border/50">
                  <div className="flex items-baseline justify-between mb-6">
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      Total Final
                    </span>
                    <span className="font-serif text-4xl text-foreground tracking-tighter">
                      {formatBRL(total)}
                    </span>
                  </div>

                  <Button
                    className="w-full h-14 rounded-2xl text-lg font-serif shadow-xl shadow-primary/20 active:scale-[0.98] transition-transform"
                    disabled={checkout.isPending}
                    onClick={() => checkout.mutate()}
                  >
                    {checkout.isPending ? "Processando..." : "Pagar via PIX"}
                  </Button>

                  <div className="mt-6 flex gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                    <Info className="h-5 w-5 text-primary flex-shrink-0" />
                    <p className="text-[11px] text-primary/80 leading-relaxed">
                      Pagamento via PIX no CNPJ da igreja. Retirada <strong>presencial</strong> com
                      o código gerado após a confirmação.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </aside>

      {placed && (
        <PixDialog
          open
          onOpenChange={(o) => !o && setPlaced(null)}
          pickupCode={placed.code}
          totalCents={placed.total}
          pixKey={settings?.pix_key ?? ""}
          pixName={settings?.pix_name ?? "Igreja Batista Atos"}
          pixCity={settings?.pix_city ?? "Sao Paulo"}
        />
      )}
    </div>
  );
}
