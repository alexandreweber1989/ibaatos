import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import {
  CATEGORY_LABEL,
  SCOPE_LABEL,
  type Announcement,
  type AnnouncementCategory,
  type AnnouncementScope,
} from "@/lib/avisos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Opcao {
  id: string;
  name: string;
}

export interface AvisoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aviso: Announcement | null;
}

/** Editor de aviso: alcance, categoria, agendamento e publicação. */
export function AvisoForm({ open, onOpenChange, aviso }: AvisoFormProps) {
  const qc = useQueryClient();
  const { user, isAdmin, roles } = useAuth();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<AnnouncementCategory>("aviso");
  const [scope, setScope] = useState<AnnouncementScope>("geral");
  const [targetId, setTargetId] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [isPublished, setIsPublished] = useState(true);
  const [expiresAt, setExpiresAt] = useState("");

  useEffect(() => {
    if (!open) return;
    setTitle(aviso?.title ?? "");
    setBody(aviso?.body ?? "");
    setCategory(aviso?.category ?? "aviso");
    setScope(aviso?.scope ?? "geral");
    setTargetId(aviso?.church_id ?? aviso?.ministry_id ?? aviso?.rede_id ?? aviso?.mesa_id ?? "");
    setIsPinned(aviso?.is_pinned ?? false);
    setIsPublished(aviso?.is_published ?? true);
    setExpiresAt(aviso?.expires_at ? aviso.expires_at.slice(0, 16) : "");
  }, [open, aviso]);

  const meusMinisterios = roles
    .filter((r) => r.role === "admin_ministerio" && r.ministry_id)
    .map((r) => r.ministry_id as string);
  const minhasMesas = roles
    .filter((r) => r.role === "lider_mesa" && r.mesa_id)
    .map((r) => r.mesa_id as string);

  /** Alcances que a pessoa realmente pode usar, conforme o RLS do banco. */
  const escoposDisponiveis = useMemo<AnnouncementScope[]>(() => {
    if (isAdmin) return ["geral", "igreja", "ministerio", "rede", "mesa"];
    const lista: AnnouncementScope[] = [];
    if (meusMinisterios.length) lista.push("ministerio");
    if (minhasMesas.length) lista.push("mesa");
    return lista;
  }, [isAdmin, meusMinisterios.length, minhasMesas.length]);

  useEffect(() => {
    if (open && escoposDisponiveis.length && !escoposDisponiveis.includes(scope)) {
      setScope(escoposDisponiveis[0]);
    }
  }, [open, escoposDisponiveis, scope]);

  const { data: opcoes = [] } = useQuery({
    queryKey: ["avisos", "alvos", scope, isAdmin],
    enabled: open && scope !== "geral",
    queryFn: async (): Promise<Opcao[]> => {
      const table =
        scope === "igreja"
          ? "churches"
          : scope === "ministerio"
            ? "ministries"
            : scope === "rede"
              ? "redes"
              : "mesas";
      const { data, error } = await supabase.from(table).select("id, name").order("name");
      if (error) throw error;
      let lista = (data ?? []) as Opcao[];
      if (!isAdmin && scope === "ministerio")
        lista = lista.filter((o) => meusMinisterios.includes(o.id));
      if (!isAdmin && scope === "mesa") lista = lista.filter((o) => minhasMesas.includes(o.id));
      return lista;
    },
  });

  const salvar = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sessão expirada. Entre novamente.");
      if (!title.trim()) throw new Error("Informe o título do aviso.");
      if (!body.trim()) throw new Error("Escreva o conteúdo do aviso.");
      if (scope !== "geral" && !targetId) throw new Error("Escolha o destino do aviso.");

      const payload = {
        title: title.trim(),
        body: body.trim(),
        category,
        scope,
        church_id: scope === "igreja" ? targetId : null,
        ministry_id: scope === "ministerio" ? targetId : null,
        rede_id: scope === "rede" ? targetId : null,
        mesa_id: scope === "mesa" ? targetId : null,
        is_pinned: isPinned,
        is_published: isPublished,
        published_at: isPublished ? (aviso?.published_at ?? new Date().toISOString()) : null,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      };

      if (aviso) {
        const { error } = await supabase
          .from("announcements")
          .update(payload as any)
          .eq("id", aviso.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("announcements")
          .insert({ ...payload, created_by: user.id } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(aviso ? "Aviso atualizado." : "Aviso publicado.");
      void qc.invalidateQueries({ queryKey: ["avisos"] });
      onOpenChange(false);
    },
    onError: (e: any) => toast.error(e?.message ?? "Não foi possível salvar o aviso."),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">
            {aviso ? "Editar aviso" : "Novo aviso"}
          </DialogTitle>
          <DialogDescription>
            O aviso aparece apenas para quem pertence ao alcance escolhido.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Título</Label>
            <Input value={title} maxLength={140} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Conteúdo</Label>
            <Textarea rows={6} value={body} onChange={(e) => setBody(e.target.value)} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as AnnouncementCategory)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(CATEGORY_LABEL) as AnnouncementCategory[]).map((c) => (
                    <SelectItem key={c} value={c}>
                      {CATEGORY_LABEL[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Alcance</Label>
              <Select
                value={scope}
                onValueChange={(v) => {
                  setScope(v as AnnouncementScope);
                  setTargetId("");
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {escoposDisponiveis.map((s) => (
                    <SelectItem key={s} value={s}>
                      {SCOPE_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {scope !== "geral" && (
            <div className="space-y-2">
              <Label>Destino</Label>
              <Select value={targetId} onValueChange={setTargetId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar..." />
                </SelectTrigger>
                <SelectContent>
                  {opcoes.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Expira em (opcional)</Label>
            <Input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-8">
            <label className="flex items-center gap-3 text-sm">
              <Switch checked={isPinned} onCheckedChange={setIsPinned} />
              Fixar no topo
            </label>
            <label className="flex items-center gap-3 text-sm">
              <Switch checked={isPublished} onCheckedChange={setIsPublished} />
              {isPublished ? "Publicar agora" : "Salvar como rascunho"}
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={() => salvar.mutate()} disabled={salvar.isPending}>
            {salvar.isPending ? "Salvando..." : aviso ? "Salvar alterações" : "Criar aviso"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
