import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
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

export interface NewsFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  news?: any;
}

export function NewsForm({ open, onOpenChange, news }: NewsFormProps) {
  const qc = useQueryClient();
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(news?.title ?? "");
    setExcerpt(news?.excerpt ?? "");
    setContent(news?.content ?? "");
    setCategory(news?.category ?? "");
    setImageUrl(news?.image_url ?? "");
    setIsPublished(news?.is_published ?? true);
    setIsFeatured(news?.is_featured ?? false);
  }, [open, news]);

  const salvar = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sessão expirada.");
      if (!title.trim()) throw new Error("Informe o título.");
      if (!content.trim()) throw new Error("Informe o conteúdo.");

      const slug = title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-");

      const payload = {
        title: title.trim(),
        slug,
        excerpt: excerpt.trim() || null,
        content: content.trim(),
        category: category.trim() || null,
        image_url: imageUrl.trim() || null,
        is_published: isPublished,
        is_featured: isFeatured,
        author_id: user.id,
        published_at: isPublished ? (news?.published_at ?? new Date().toISOString()) : null,
      };

      if (news?.id) {
        const { error } = await supabase.from("news").update(payload).eq("id", news.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("news").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(news ? "Notícia atualizada." : "Notícia publicada.");
      void qc.invalidateQueries({ queryKey: ["news"] });
      onOpenChange(false);
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao salvar notícia."),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">
            {news ? "Editar notícia" : "Nova notícia"}
          </DialogTitle>
          <DialogDescription>Publique novidades para toda a comunidade.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Título</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título da matéria"
            />
          </div>

          <div className="space-y-2">
            <Label>Resumo (opcional)</Label>
            <Input
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Breve descrição"
            />
          </div>

          <div className="space-y-2">
            <Label>Conteúdo (Texto)</Label>
            <Textarea
              rows={8}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escreva a matéria aqui..."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Ex: Eventos, Social, Avisos"
              />
            </div>
            <div className="space-y-2">
              <Label>URL da Imagem</Label>
              <Input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-8 pt-2">
            <label className="flex items-center gap-3 text-sm">
              <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
              Destaque
            </label>
            <label className="flex items-center gap-3 text-sm">
              <Switch checked={isPublished} onCheckedChange={setIsPublished} />
              {isPublished ? "Publicar agora" : "Rascunho"}
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={() => salvar.mutate()} disabled={salvar.isPending}>
            {salvar.isPending ? "Salvando..." : news ? "Salvar alterações" : "Publicar notícia"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
