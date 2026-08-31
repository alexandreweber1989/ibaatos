import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Pencil,
  Plus,
  Search,
  Filter,
  Utensils,
  CheckCircle2,
  XCircle,
  Upload,
  Loader2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL, RESERVATION_STATUS } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
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

interface ItemDraft {
  id?: string;
  name: string;
  description: string;
  category: string;
  price_cents: number;
  image_url: string;
  is_active: boolean;
}

const emptyItem: ItemDraft = {
  name: "",
  description: "",
  category: "salgados",
  price_cents: 0,
  image_url: "",
  is_active: true,
};

function ItemDialog({ initial, trigger }: { initial: ItemDraft; trigger: React.ReactNode }) {
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
        image_url: draft.image_url || null,
        is_active: draft.is_active,
      };
      const { error } = draft.id
        ? await supabase.from("canteen_items").update(payload).eq("id", draft.id)
        : await supabase.from("canteen_items").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Item salvo.");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["canteen-items"] });
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
            {draft.id ? "Editar item" : "Novo item"}
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
              rows={2}
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
            <Label>Imagem / Arte do Item</Label>
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
                <div className="w-full aspect-video rounded-2xl border-2 border-dashed border-muted flex flex-col items-center justify-center bg-muted/20 gap-2 relative">
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
                        const path = `canteen/${crypto.randomUUID()}.${ext}`;

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
          <div className="flex items-center gap-3">
            <Switch
              checked={draft.is_active}
              onCheckedChange={(v) => setDraft({ ...draft, is_active: v })}
            />
            <Label className="text-sm">Item ativo</Label>
          </div>
          <Button
            className="w-full"
            disabled={!draft.name || save.isPending}
            onClick={() => save.mutate()}
          >
            Salvar item
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function CantinaAdminItems() {
  const { data } = useQuery({
    queryKey: ["canteen-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("canteen_items")
        .select("*")
        .order("category")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-4">
      <ItemDialog
        initial={emptyItem}
        trigger={
          <Button>
            <Plus className="h-4 w-4" /> Novo item
          </Button>
        }
      />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {data?.map((i: any, idx: number) => (
            <motion.div
              key={i.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="group bg-card border border-border/50 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300 flex items-start justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-muted/30 overflow-hidden flex-shrink-0">
                  {i.image_url ? (
                    <img
                      src={i.image_url}
                      className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground/30">
                      <Utensils className="h-6 w-6" />
                    </div>
                  )}
                </div>
                <div>
                  <Badge
                    variant="secondary"
                    className="bg-muted/50 font-mono text-[8px] uppercase tracking-widest border-border/50 px-2 py-0 mb-2"
                  >
                    {i.category}
                  </Badge>
                  <div className="font-serif text-xl leading-none">{i.name}</div>
                  <div className="font-mono text-sm mt-2 text-primary">
                    {formatBRL(i.price_cents)}
                  </div>
                  {!i.is_active && (
                    <span className="inline-block mt-2 px-2 py-0.5 rounded font-mono text-[9px] uppercase bg-muted text-muted-foreground">
                      Inativo
                    </span>
                  )}
                </div>
              </div>
              <ItemDialog
                initial={{
                  id: i.id,
                  name: i.name,
                  description: i.description ?? "",
                  category: i.category,
                  price_cents: i.price_cents,
                  image_url: i.image_url ?? "",
                  is_active: i.is_active,
                }}
                trigger={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-xl hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                }
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function MenuDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [artUrl, setArtUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const qc = useQueryClient();

  const { data: items } = useQuery({
    queryKey: ["canteen-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("canteen_items")
        .select("id, name, price_cents, category")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const chosen = (items ?? []).filter((i) => selected[i.id]);
      if (chosen.length === 0) throw new Error("Selecione ao menos um item.");
      const { data: menu, error } = await supabase
        .from("canteen_menus")
        .insert({
          title,
          service_date: date,
          notes: notes || null,
          art_url: artUrl || null,
          status: "aberto",
        })
        .select("id")
        .single();
      if (error) throw error;
      const { error: linkError } = await supabase
        .from("canteen_menu_items")
        .insert(
          chosen.map((i) => ({ menu_id: menu.id, item_id: i.id, price_cents: i.price_cents })),
        );
      if (linkError) throw linkError;
    },
    onSuccess: () => {
      toast.success("Cardápio publicado.");
      setOpen(false);
      setTitle("");
      setSelected({});
      qc.invalidateQueries({ queryKey: ["cantina-menus"] });
      qc.invalidateQueries({ queryKey: ["admin-menus"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" /> Novo cardápio
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-3xl">Cardápio do culto</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Título</Label>
            <Input
              placeholder="Culto de domingo à noite"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Data</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Arte de Divulgação do Cardápio</Label>
            <div className="flex flex-col gap-4">
              {artUrl ? (
                <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-border group">
                  <img src={artUrl} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setArtUrl("")}
                    className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="w-full aspect-video rounded-2xl border-2 border-dashed border-muted flex flex-col items-center justify-center bg-muted/20 gap-2 relative">
                  <div className="p-3 rounded-full bg-muted">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">Clique para enviar o banner</p>
                    <p className="text-xs text-muted-foreground">Banner do culto/cardápio</p>
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
                        const path = `menus/${crypto.randomUUID()}.${ext}`;

                        const { error: uploadError } = await supabase.storage
                          .from("store-assets")
                          .upload(path, file);

                        if (uploadError) throw uploadError;

                        const {
                          data: { publicUrl },
                        } = supabase.storage.from("store-assets").getPublicUrl(path);

                        setArtUrl(publicUrl);
                        toast.success("Banner enviado!");
                      } catch (err: any) {
                        toast.error("Erro ao enviar banner: " + err.message);
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
                  Ou cole a URL do banner
                </Label>
                <Input
                  value={artUrl}
                  placeholder="https://exemplo.com/banner.jpg"
                  onChange={(e) => setArtUrl(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Itens do dia</Label>
            <div className="border border-border rounded-sm divide-y divide-border">
              {items?.map((i) => (
                <label
                  key={i.id}
                  className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer"
                >
                  <Checkbox
                    checked={Boolean(selected[i.id])}
                    onCheckedChange={(v) => setSelected((s) => ({ ...s, [i.id]: Boolean(v) }))}
                  />
                  <span className="flex-1">{i.name}</span>
                  <span className="font-mono text-muted-foreground">
                    {formatBRL(i.price_cents)}
                  </span>
                </label>
              ))}
            </div>
          </div>
          <Button
            className="w-full"
            disabled={!title || create.isPending}
            onClick={() => create.mutate()}
          >
            Publicar cardápio
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function CantinaAdminMenus() {
  const qc = useQueryClient();
  const { data: menus } = useQuery({
    queryKey: ["admin-menus"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("canteen_menus")
        .select(
          "*, reservations:canteen_reservations(id, pickup_code, status, total_cents, user_id, items:canteen_reservation_items(id, item_name, quantity))",
        )
        .order("service_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const setMenuStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("canteen_menus").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-menus"] });
      qc.invalidateQueries({ queryKey: ["cantina-menus"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setResStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("canteen_reservations")
        .update({ status, picked_up_at: status === "retirado" ? new Date().toISOString() : null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-menus"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between bg-card border border-border/50 p-6 rounded-[2rem] shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center">
            <Utensils className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="font-serif text-2xl tracking-tight">Gestão de Cardápios</h3>
            <p className="text-xs text-muted-foreground font-light">
              Publique menus e acompanhe as reservas em tempo real.
            </p>
          </div>
        </div>
        <MenuDialog />
      </div>

      <div className="space-y-8">
        {menus?.map((menu: any, menuIdx: number) => {
          const active = (menu.reservations ?? []).filter((r: any) => r.status !== "cancelado");
          const totals = new Map<string, number>();
          for (const r of active) {
            for (const i of r.items ?? []) {
              totals.set(i.item_name, (totals.get(i.item_name) ?? 0) + i.quantity);
            }
          }

          return (
            <motion.div
              key={menu.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: menuIdx * 0.1 }}
              className="group border border-border/50 bg-card rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500"
            >
              {/* Menu Header Section */}
              <div className="bg-muted/30 p-8 border-b border-border/50">
                <div className="flex flex-wrap items-start justify-between gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="outline"
                        className={cn(
                          "font-mono text-[9px] uppercase tracking-widest px-3 py-1",
                          menu.status === "aberto"
                            ? "border-emerald-500/30 text-emerald-600 bg-emerald-50"
                            : "border-muted-foreground/30 text-muted-foreground bg-muted",
                        )}
                      >
                        {menu.status === "aberto" ? "Ativo no App" : "Encerrado"}
                      </Badge>
                      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                        {new Date(menu.service_date + "T12:00:00").toLocaleDateString("pt-BR", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                        })}
                      </span>
                    </div>
                    <h3 className="font-serif text-3xl text-foreground tracking-tight">
                      {menu.title}
                    </h3>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="rounded-xl h-12 px-6 font-serif border-border/50 hover:bg-background"
                      onClick={() =>
                        setMenuStatus.mutate({
                          id: menu.id,
                          status: menu.status === "aberto" ? "encerrado" : "aberto",
                        })
                      }
                    >
                      {menu.status === "aberto" ? "Encerrar Reservas" : "Reabrir Reservas"}
                    </Button>
                  </div>
                </div>

                {/* Production Summary */}
                <div className="mt-10 bg-background/50 border border-border/50 rounded-3xl p-6">
                  <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary/60 block mb-4">
                    Produção Necessária (Cozinha)
                  </span>
                  {totals.size === 0 ? (
                    <p className="text-sm text-muted-foreground font-light italic">
                      Aguardando as primeiras reservas...
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-3">
                      {[...totals.entries()].map(([name, qty]) => (
                        <div
                          key={name}
                          className="bg-card border border-border/50 rounded-2xl px-5 py-3 flex items-center gap-4 group/item hover:border-primary/30 transition-colors"
                        >
                          <span className="font-serif text-3xl text-primary leading-none">
                            {qty}
                          </span>
                          <span className="font-light text-sm text-foreground/80">{name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Reservations List Section */}
              <div className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <h4 className="font-serif text-xl">Fluxo de Retirada</h4>
                  <Badge className="rounded-full bg-primary/10 text-primary border-none">
                    {active.length} Reservas
                  </Badge>
                </div>

                <div className="space-y-4">
                  {active.length === 0 ? (
                    <div className="text-center py-10 opacity-30">
                      <Utensils className="h-12 w-12 mx-auto mb-2" />
                      <p className="font-serif">Nenhuma reserva ativa</p>
                    </div>
                  ) : (
                    active.map((r: any) => (
                      <div
                        key={r.id}
                        className="flex flex-wrap items-center justify-between gap-6 p-6 bg-muted/20 hover:bg-muted/40 rounded-2xl border border-border/30 transition-colors group/res"
                      >
                        <div className="flex items-center gap-6">
                          <div className="h-12 w-12 rounded-xl bg-background border border-border/50 flex items-center justify-center font-serif text-2xl text-primary shadow-sm">
                            {r.pickup_code}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-light text-foreground/70 mb-1">
                              {(r.items ?? [])
                                .map((i: any) => `${i.quantity}× ${i.item_name}`)
                                .join(", ")}
                            </p>
                            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
                              {formatBRL(r.total_cents)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <Badge
                            variant="outline"
                            className={cn(
                              "font-mono text-[9px] uppercase tracking-widest px-3 py-1",
                              RESERVATION_STATUS[r.status].className,
                            )}
                          >
                            {RESERVATION_STATUS[r.status].label}
                          </Badge>

                          {r.status === "reservado" && (
                            <Button
                              size="sm"
                              className="rounded-xl h-10 px-5 shadow-lg shadow-primary/10"
                              onClick={() => setResStatus.mutate({ id: r.id, status: "retirado" })}
                            >
                              Dar Baixa
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
