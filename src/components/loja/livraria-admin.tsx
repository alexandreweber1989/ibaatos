import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Pencil,
  Plus,
  Search,
  Filter,
  ShoppingBag,
  Package,
  CheckCircle2,
  Clock,
  XCircle,
  Upload,
  Loader2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL, ORDER_STATUS } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface ProductDraft {
  id?: string;
  name: string;
  description: string;
  category: string;
  price_cents: number;
  stock: number;
  track_stock: boolean;
  image_url: string;
  is_active: boolean;
}

const emptyProduct: ProductDraft = {
  name: "",
  description: "",
  category: "livros",
  price_cents: 0,
  stock: 0,
  track_stock: true,
  image_url: "",
  is_active: true,
};

function ProductDialog({ initial, trigger }: { initial: ProductDraft; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(initial);
  const [uploading, setUploading] = useState(false);
  const qc = useQueryClient();

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        name: draft.name,
        description: draft.description || null,
        category: draft.category,
        price_cents: draft.price_cents,
        stock: draft.stock,
        track_stock: draft.track_stock,
        image_url: draft.image_url || null,
        is_active: draft.is_active,
      };
      const { error } = draft.id
        ? await supabase.from("products").update(payload).eq("id", draft.id)
        : await supabase.from("products").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Produto salvo.");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["admin-products"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setDraft(initial);
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-3xl">
            {draft.id ? "Editar produto" : "Novo produto"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              rows={3}
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Input
                value={draft.category}
                onChange={(e) => setDraft({ ...draft, category: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Preço (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={(draft.price_cents / 100).toString()}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    price_cents: Math.round((Number(e.target.value) || 0) * 100),
                  })
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Imagem do Produto</Label>
            <div className="flex flex-col gap-4">
              {draft.image_url ? (
                <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-border group">
                  <img src={draft.image_url} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setDraft({ ...draft, image_url: "" })}
                    className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="w-full aspect-video rounded-2xl border-2 border-dashed border-muted flex flex-col items-center justify-center bg-muted/20 gap-2">
                  <div className="p-3 rounded-full bg-muted">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">Clique para enviar uma foto</p>
                    <p className="text-xs text-muted-foreground">JPG, PNG ou WebP</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      try {
                        setUploading(true);
                        const ext = file.name.split(".").pop();
                        const path = `products/${crypto.randomUUID()}.${ext}`;

                        const { error: uploadError } = await supabase.storage
                          .from("store-assets")
                          .upload(path, file);

                        if (uploadError) throw uploadError;

                        const {
                          data: { publicUrl },
                        } = supabase.storage.from("store-assets").getPublicUrl(path);

                        setDraft({ ...draft, image_url: publicUrl });
                        toast.success("Foto enviada com sucesso!");
                      } catch (err: any) {
                        toast.error("Erro ao enviar foto: " + err.message);
                      } finally {
                        setUploading(false);
                      }
                    }}
                    disabled={uploading}
                  />
                  {uploading && (
                    <div className="absolute inset-0 bg-background/50 flex items-center justify-center rounded-2xl">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  )}
                </div>
              )}
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wider opacity-50">
                  Ou cole uma URL
                </Label>
                <Input
                  value={draft.image_url}
                  placeholder="https://exemplo.com/imagem.jpg"
                  onChange={(e) => setDraft({ ...draft, image_url: e.target.value })}
                />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 items-end">
            <div className="space-y-2">
              <Label>Estoque</Label>
              <Input
                type="number"
                value={draft.stock}
                onChange={(e) =>
                  setDraft({ ...draft, stock: Math.max(0, Number(e.target.value) || 0) })
                }
              />
            </div>
            <div className="flex items-center gap-3 pb-2">
              <Switch
                checked={draft.track_stock}
                onCheckedChange={(v) => setDraft({ ...draft, track_stock: v })}
              />
              <Label className="text-sm">Controlar estoque</Label>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              checked={draft.is_active}
              onCheckedChange={(v) => setDraft({ ...draft, is_active: v })}
            />
            <Label className="text-sm">Visível no catálogo</Label>
          </div>
          <Button
            className="w-full"
            disabled={!draft.name || save.isPending}
            onClick={() => save.mutate()}
          >
            Salvar produto
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function LivrariaAdminProducts() {
  const { data } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-4">
      <ProductDialog
        initial={emptyProduct}
        trigger={
          <Button>
            <Plus className="h-4 w-4" /> Novo produto
          </Button>
        }
      />
      <div className="bg-card border border-border/50 rounded-3xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-muted/30">
            <tr className="text-left font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground border-b border-border/50">
              <th className="px-6 py-4">Produto</th>
              <th className="px-6 py-4">Categoria</th>
              <th className="px-6 py-4">Preço</th>
              <th className="px-6 py-4">Estoque</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {data?.map((p: any) => (
              <tr key={p.id} className="group hover:bg-muted/10 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-muted/30 overflow-hidden flex-shrink-0">
                      {p.image_url ? (
                        <img src={p.image_url} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-muted-foreground/30 font-serif text-xs">
                          A
                        </div>
                      )}
                    </div>
                    <span className="font-serif text-base">{p.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Badge
                    variant="secondary"
                    className="bg-muted/50 font-mono text-[9px] uppercase tracking-widest border-border/50 px-2"
                  >
                    {p.category}
                  </Badge>
                </td>
                <td className="px-6 py-4 font-mono font-medium">{formatBRL(p.price_cents)}</td>
                <td className="px-6 py-4">
                  {p.track_stock ? (
                    <span
                      className={cn(
                        "font-mono text-xs px-2 py-0.5 rounded-md",
                        p.stock <= 5
                          ? "bg-destructive/10 text-destructive border border-destructive/20"
                          : "bg-primary/5 text-primary border border-primary/20",
                      )}
                    >
                      {p.stock} un
                    </span>
                  ) : (
                    <span className="text-muted-foreground/40 font-mono text-[10px]">
                      ILIMITADO
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full inline-block mr-2",
                      p.is_active
                        ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                        : "bg-muted-foreground/30",
                    )}
                  />
                  <span className="text-xs font-light">{p.is_active ? "Ativo" : "Inativo"}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <ProductDialog
                    initial={{
                      id: p.id,
                      name: p.name,
                      description: p.description ?? "",
                      category: p.category,
                      price_cents: p.price_cents,
                      stock: p.stock,
                      track_stock: p.track_stock,
                      image_url: p.image_url ?? "",
                      is_active: p.is_active,
                    }}
                    trigger={
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary group-hover:scale-105 transition-transform"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function LivrariaAdminOrders() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");

  const { data: orders } = useQuery({
    queryKey: ["all-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, items:order_items(id, product_id, product_name, quantity, unit_price_cents)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const setStatus = useMutation({
    mutationFn: async ({ order, status }: { order: any; status: string }) => {
      const patch: {
        status: string;
        confirmed_at?: string;
        delivered_at?: string;
      } = { status };
      if (status === "pago") patch.confirmed_at = new Date().toISOString();
      if (status === "entregue") patch.delivered_at = new Date().toISOString();
      const { error } = await supabase.from("orders").update(patch).eq("id", order.id);
      if (error) throw error;

      if (status === "entregue") {
        for (const item of order.items ?? []) {
          if (!item.product_id) continue;
          const { data: prod } = await supabase
            .from("products")
            .select("stock, track_stock")
            .eq("id", item.product_id)
            .maybeSingle();
          if (prod?.track_stock) {
            await supabase
              .from("products")
              .update({ stock: Math.max(0, prod.stock - item.quantity) })
              .eq("id", item.product_id);
          }
        }
      }
    },
    onSuccess: () => {
      toast.success("Pedido atualizado.");
      qc.invalidateQueries({ queryKey: ["all-orders"] });
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = orders?.filter((o: any) =>
    !q.trim() ? true : o.pickup_code.toLowerCase().includes(q.trim().toLowerCase()),
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border/50 p-6 rounded-[2rem]">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-11 h-12 rounded-2xl border-border/50 bg-background/50 focus:bg-background transition-all"
            placeholder="Buscar pelo código de retirada..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl border-border/50">
            <Filter className="h-4 w-4" />
          </Button>
          <div className="h-12 px-6 rounded-2xl bg-primary/5 border border-primary/10 flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="font-serif text-sm text-primary">
              {filtered?.length || 0} pedidos encontrados
            </span>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filtered?.map((o: any, idx: number) => {
            const status = ORDER_STATUS[o.status];
            return (
              <motion.div
                key={o.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="group border border-border/50 bg-card rounded-[2rem] p-8 shadow-sm hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300 relative overflow-hidden flex flex-col"
              >
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="flex items-center justify-between mb-6 relative">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-muted/30 flex items-center justify-center">
                      <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground block">
                        Código
                      </span>
                      <span className="font-serif text-2xl text-foreground tracking-tight">
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

                <div className="space-y-4 mb-8 flex-1">
                  <div className="space-y-2">
                    <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground block opacity-60">
                      Itens do Pedido
                    </span>
                    <ul className="space-y-2">
                      {o.items?.map((i: any) => (
                        <li
                          key={i.id}
                          className="flex items-center gap-2 text-sm text-foreground/80 font-light"
                        >
                          <Package className="h-3 w-3 text-muted-foreground/50" />
                          <span>
                            {i.quantity}× {i.product_name}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4 border-t border-border/50">
                    <div className="flex items-baseline justify-between">
                      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                        Valor Total
                      </span>
                      <span className="font-serif text-2xl text-primary">
                        {formatBRL(o.total_cents)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 relative mt-auto">
                  {o.payment_proof_url && (
                    <Button
                      variant="outline"
                      className="w-full h-10 rounded-xl text-xs font-serif bg-background/50"
                      asChild
                    >
                      <a href={o.payment_proof_url} target="_blank" rel="noreferrer">
                        Ver comprovante de pagamento
                      </a>
                    </Button>
                  )}

                  <div className="flex gap-2">
                    {o.status === "aguardando_pagamento" && (
                      <Button
                        className="flex-1 h-12 rounded-xl text-sm font-serif shadow-lg shadow-primary/10"
                        onClick={() => setStatus.mutate({ order: o, status: "pago" })}
                      >
                        Confirmar PIX
                      </Button>
                    )}
                    {o.status === "pago" && (
                      <Button
                        className="flex-1 h-12 rounded-xl text-sm font-serif shadow-lg shadow-primary/10 bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => setStatus.mutate({ order: o, status: "entregue" })}
                      >
                        Confirmar Entrega
                      </Button>
                    )}
                    {o.status !== "cancelado" && o.status !== "entregue" && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-12 w-12 rounded-xl hover:bg-destructive/10 hover:text-destructive transition-colors"
                        onClick={() => setStatus.mutate({ order: o, status: "cancelado" })}
                      >
                        <XCircle className="h-5 w-5" />
                      </Button>
                    )}
                  </div>
                </div>

                {o.status === "entregue" && (
                  <div className="absolute bottom-4 right-4 opacity-5 pointer-events-none">
                    <CheckCircle2 className="h-24 w-24 text-primary" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filtered && filtered.length === 0 && (
        <div className="text-center py-20 border-2 border-dashed border-border/50 rounded-[2.5rem]">
          <ShoppingBag className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-muted-foreground font-serif">
            Nenhum pedido encontrado com este critério.
          </p>
        </div>
      )}
    </div>
  );
}
