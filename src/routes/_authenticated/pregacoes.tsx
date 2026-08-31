import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Trash2,
  ArrowLeft,
  Save,
  Sun,
  Moon,
  Network,
  LayoutTemplate,
  Image as ImageIcon,
  Presentation,
  Pencil,
  CalendarDays,
  Video,
  Send,
  Loader2,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { useAuth } from "@/lib/auth-context";
import { PageHeader, PageBody } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { LoadingRegion, CardGridSkeleton } from "@/components/ui/loading-states";
import {
  SermonCanvas,
  svgToPngBlob,
  DIMS,
  type SermonDraft,
  type SermonPoint,
  type SermonTemplate,
} from "@/components/pregacoes/sermon-canvas";

export const Route = createFileRoute("/_authenticated/pregacoes")({
  head: () => ({
    meta: [
      { title: "Pregações — Igreja Batista Atos" },
      {
        name: "description",
        content:
          "Crie artes, infográficos e mapas mentais das mensagens de domingo para compartilhar.",
      },
    ],
  }),
  component: PregacoesPage,
});

const TEMPLATES: { value: SermonTemplate; label: string; icon: typeof Network; hint: string }[] = [
  { value: "mapa", label: "Mapa mental", icon: Network, hint: "Tema central com ramos" },
  { value: "infografico", label: "Infográfico", icon: LayoutTemplate, hint: "Story vertical" },
  { value: "arte", label: "Arte / Card", icon: ImageIcon, hint: "Quadrado para post" },
];

/** Extrai o ID de 11 caracteres de um link do YouTube (watch, youtu.be, shorts, embed). */
function youtubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

function blankDraft(): SermonDraft {
  return {
    title: "",
    theme: "",
    preacher: "",
    preached_on: new Date().toISOString().slice(0, 10),
    base_verse: "",
    summary: "",
    points: [{ title: "", detail: "" }],
    tags: [],
    template: "mapa",
    dark: false,
    youtube_url: "",
    cover_image_url: "",
  };
}

function fromRow(row: any): SermonDraft {
  const points = Array.isArray(row.points) ? (row.points as SermonPoint[]) : [];
  return {
    title: row.title ?? "",
    theme: row.theme ?? "",
    preacher: row.preacher ?? "",
    preached_on: row.preached_on ?? "",
    base_verse: row.base_verse ?? "",
    summary: row.summary ?? "",
    points: points.length ? points : [{ title: "", detail: "" }],
    tags: Array.isArray(row.tags) ? row.tags : [],
    template: (row.template ?? "mapa") as SermonTemplate,
    dark: Boolean(row.dark),
    youtube_url: row.youtube_url ?? "",
    cover_image_url: row.cover_image_url ?? "",
  };
}

function PregacoesPage() {
  const { isAdmin, user } = useAuth();
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<string | null | undefined>(undefined); // undefined = lista
  const [draft, setDraft] = useState<SermonDraft>(blankDraft);
  const [tagsText, setTagsText] = useState("");
  const [ytLoading, setYtLoading] = useState(false);
  const previewRef = useRef<SVGSVGElement>(null);

  const { data: sermons, isPending } = useQuery({
    queryKey: ["sermons"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("sermons")
        .select("*")
        .order("preached_on", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  // Persiste a pregação (usado por "Salvar" e por "Publicar") e devolve o id.
  async function persistSermon(): Promise<string> {
    if (draft.title.trim().length < 2) throw new Error("Dê um título à pregação.");
    const payload = {
      title: draft.title.trim(),
      theme: draft.theme?.trim() || null,
      preacher: draft.preacher?.trim() || null,
      preached_on: draft.preached_on || null,
      base_verse: draft.base_verse?.trim() || null,
      summary: draft.summary?.trim() || null,
      points: draft.points.filter((p) => p.title?.trim()) as unknown as Json,
      tags: draft.tags,
      template: draft.template,
      dark: draft.dark,
      youtube_url: draft.youtube_url?.trim() || null,
      cover_image_url: draft.cover_image_url?.trim() || null,
    };
    if (editingId) {
      const { error } = await (supabase as any).from("sermons").update(payload).eq("id", editingId);
      if (error) throw error;
      return editingId;
    }
    const { data, error } = await (supabase as any)
      .from("sermons")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw error;
    return data!.id as string;
  }

  const save = useMutation({
    mutationFn: persistSermon,
    onSuccess: (id) => {
      toast.success("Pregação salva.");
      setEditingId(id);
      void qc.invalidateQueries({ queryKey: ["sermons"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Puxa capa, título e aciona o processamento (transcrição e resumo).
  async function fetchYouTube() {
    const url = draft.youtube_url?.trim();
    if (!url) return;
    const id = youtubeId(url);
    if (!id) {
      toast.error("Link do YouTube inválido.");
      return;
    }
    setYtLoading(true);

    // A capa vem do ID do vídeo, carregada direto no navegador.
    const cover = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
    setDraft((d) => ({ ...d, cover_image_url: cover }));

    try {
      // 1. Título básico via oEmbed
      const res = await fetch(`/api/public/youtube-oembed?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      if (res.ok && data.title) {
        setDraft((d) => ({ ...d, title: d.title?.trim() ? d.title : data.title }));
      }

      // 2. Processamento (Transcrição e Resumo)
      toast.info("Processando transcrição e resumo... Isso pode levar alguns segundos.");
      const { processSermon } = await import("@/lib/pregacoes.functions");
      const aiResult = await processSermon({ data: { youtubeUrl: url } });

      if (aiResult) {
        setDraft((d) => ({
          ...d,
          title: aiResult.title || d.title,
          theme: aiResult.theme || d.theme,
          base_verse: aiResult.base_verse || d.base_verse,
          summary: aiResult.summary || d.summary,
          points: aiResult.points?.length ? aiResult.points : d.points,
          tags: [...new Set([...(d.tags || []), ...(aiResult.verses || [])])].slice(0, 10),
        }));
        toast.success("Pregação processada com sucesso!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Capa carregada, mas houve um erro no processamento.");
    } finally {
      setYtLoading(false);
    }
  }

  // Publica: sobe a arte para o bucket público, cria/atualiza o post no feed de
  // Notícias e também baixa o PNG para as redes sociais ("os dois").
  const publish = useMutation({
    mutationFn: async () => {
      if (!previewRef.current) throw new Error("Prévia indisponível.");
      const id = await persistSermon();
      const { w, h } = DIMS[draft.template];
      const blob = await svgToPngBlob(previewRef.current, w, h, 2);

      const path = `${id}/${draft.template}-${draft.dark ? "escuro" : "claro"}.png`;
      const up = await supabase.storage
        .from("sermon-arts")
        .upload(path, blob, { upsert: true, contentType: "image/png", cacheControl: "3600" });
      if (up.error) throw up.error;
      const artUrl = supabase.storage.from("sermon-arts").getPublicUrl(path).data.publicUrl;

      // Corpo do post no feed.
      const pts = draft.points.filter((p) => p.title?.trim());
      const linhas: string[] = [];
      if (draft.base_verse) linhas.push(draft.base_verse);
      if (draft.summary) linhas.push("", draft.summary);
      if (pts.length) {
        linhas.push("", "Pontos da mensagem:");
        pts.forEach((p, i) =>
          linhas.push(`${i + 1}. ${p.title}${p.detail ? ` — ${p.detail}` : ""}`),
        );
      }
      if (draft.preacher) linhas.push("", `Pregação: ${draft.preacher}`);
      if (draft.youtube_url?.trim())
        linhas.push("", `Assista na íntegra: ${draft.youtube_url.trim()}`);

      const slug = `pregacao-${id}`;
      const newsPayload = {
        title: draft.theme?.trim() || draft.title.trim(),
        slug,
        excerpt: draft.base_verse?.trim() || draft.theme?.trim() || null,
        content: linhas.join("\n") || (draft.theme?.trim() ?? draft.title.trim()),
        category: "Pregação",
        image_url: artUrl,
        is_published: true,
        author_id: user?.id ?? null,
        published_at: new Date().toISOString(),
      };

      const existing = await supabase.from("news").select("id").eq("slug", slug).maybeSingle();
      let newsId: string;
      if (existing.data?.id) {
        const { error } = await supabase
          .from("news")
          .update(newsPayload)
          .eq("id", existing.data.id);
        if (error) throw error;
        newsId = existing.data.id;
      } else {
        const { data, error } = await supabase
          .from("news")
          .insert(newsPayload)
          .select("id")
          .single();
        if (error) throw error;
        newsId = data!.id;
      }

      await (supabase as any)
        .from("sermons")
        .update({ is_published: true, published_at: new Date().toISOString(), news_id: newsId })
        .eq("id", id);

      // Baixa também o PNG para o usuário postar nas redes.
      const dlUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = dlUrl;
      a.download = `${slug}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(dlUrl), 1500);

      return id;
    },
    onSuccess: (id) => {
      toast.success("Publicado no feed de Notícias e baixado para as redes.");
      setEditingId(id);
      void qc.invalidateQueries({ queryKey: ["sermons"] });
      void qc.invalidateQueries({ queryKey: ["news"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("sermons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Pregação removida.");
      void qc.invalidateQueries({ queryKey: ["sermons"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openEditor = (row?: any) => {
    if (row) {
      setDraft(fromRow(row));
      setTagsText((Array.isArray(row.tags) ? row.tags : []).join(", "));
      setEditingId(row.id);
    } else {
      setDraft(blankDraft());
      setTagsText("");
      setEditingId(null);
    }
  };

  const set = (patch: Partial<SermonDraft>) => setDraft((d) => ({ ...d, ...patch }));

  const updatePoint = (i: number, patch: Partial<SermonPoint>) =>
    setDraft((d) => ({
      ...d,
      points: d.points.map((p, idx) => (idx === i ? { ...p, ...patch } : p)),
    }));
  const addPoint = () =>
    setDraft((d) => ({ ...d, points: [...d.points, { title: "", detail: "" }] }));
  const removePoint = (i: number) =>
    setDraft((d) => ({ ...d, points: d.points.filter((_, idx) => idx !== i) }));

  const commitTags = (raw: string) => {
    setTagsText(raw);
    const tags = raw
      .split(/[,\s]+/)
      .map((t) => t.replace(/^#/, "").trim())
      .filter(Boolean)
      .slice(0, 8);
    set({ tags });
  };

  if (!isAdmin) {
    return (
      <>
        <PageHeader eyebrow="Restrito" title="Pregações" />
        <PageBody>
          <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            Esta área é exclusiva da administração.
          </div>
        </PageBody>
      </>
    );
  }

  /* ------------------------------- LISTA ------------------------------- */
  if (editingId === undefined) {
    return (
      <>
        <PageHeader
          eyebrow="Comunicação"
          title="Pregações"
          description="Transforme as mensagens de domingo em artes, infográficos e mapas mentais prontos para compartilhar."
          actions={
            <Button onClick={() => openEditor()}>
              <Plus className="h-4 w-4" /> Nova pregação
            </Button>
          }
        />
        <PageBody>
          {isPending ? (
            <LoadingRegion>
              <CardGridSkeleton count={6} />
            </LoadingRegion>
          ) : !sermons || sermons.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-12 text-center">
              <Presentation className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 font-serif text-2xl">Nenhuma pregação ainda</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Comece registrando a mensagem do último domingo.
              </p>
              <Button className="mt-5" onClick={() => openEditor()}>
                <Plus className="h-4 w-4" /> Nova pregação
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sermons.map((s) => {
                const tpl = TEMPLATES.find((t) => t.value === s.template);
                const Icon = tpl?.icon ?? Network;
                return (
                  <div
                    key={s.id}
                    className="group flex flex-col rounded-xl border border-border bg-card/50 p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="gap-1.5">
                          <Icon className="h-3 w-3" /> {tpl?.label ?? s.template}
                        </Badge>
                        {s.is_published && (
                          <Badge className="gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Publicado
                          </Badge>
                        )}
                      </div>
                      {s.preached_on && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <CalendarDays className="h-3 w-3" />
                          {format(parseISO(s.preached_on), "dd/MM/yy", { locale: ptBR })}
                        </span>
                      )}
                    </div>
                    <h3 className="mt-3 font-serif text-xl leading-tight">{s.theme || s.title}</h3>
                    {s.base_verse && (
                      <p className="mt-1 text-sm text-muted-foreground">{s.base_verse}</p>
                    )}
                    <div className="mt-4 flex items-center gap-2 pt-3 border-t border-border">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => openEditor(s)}
                      >
                        <Pencil className="h-4 w-4" /> Abrir
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label="Remover"
                        onClick={() => {
                          if (confirm("Remover esta pregação?")) remove.mutate(s.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </PageBody>
      </>
    );
  }

  /* ------------------------------- EDITOR ------------------------------- */
  return (
    <>
      <PageHeader
        eyebrow={editingId ? "Editando" : "Nova pregação"}
        title="Estúdio de pregações"
        description="Preencha os campos à esquerda e veja a arte se montar em tempo real à direita."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" onClick={() => setEditingId(undefined)}>
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Button>
            <Button variant="outline" disabled={save.isPending} onClick={() => save.mutate()}>
              <Save className="h-4 w-4" /> Salvar
            </Button>
            <Button disabled={publish.isPending} onClick={() => publish.mutate()}>
              {publish.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Publicar no feed
            </Button>
          </div>
        }
      />
      <PageBody>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          {/* Formulário */}
          <div className="space-y-5">
            <div className="space-y-2 rounded-xl border border-border bg-card/40 p-4">
              <Label className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary animate-pulse" /> Link do YouTube da
                pregação
              </Label>
              <div className="flex gap-2">
                <Input
                  value={draft.youtube_url}
                  onChange={(e) => set({ youtube_url: e.target.value })}
                  onBlur={() => draft.youtube_url?.trim() && fetchYouTube()}
                  placeholder="https://youtu.be/..."
                />
                <Button variant="outline" disabled={ytLoading} onClick={() => fetchYouTube()}>
                  {ytLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  {ytLoading ? "Processando..." : "Buscar e Resumir"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Cole o link para baixar a transcrição e gerar um resumo completo via IA.
              </p>
              {draft.cover_image_url ? (
                <img
                  src={draft.cover_image_url}
                  alt="Capa do vídeo"
                  className="mt-1 w-full rounded-lg border border-border"
                  loading="lazy"
                />
              ) : null}
            </div>
            <div className="space-y-2">
              <Label>Título da pregação</Label>
              <Input
                value={draft.title}
                onChange={(e) => set({ title: e.target.value })}
                placeholder="A fé que move montanhas"
              />
            </div>
            <div className="space-y-2">
              <Label>Tema (frase de destaque)</Label>
              <Input
                value={draft.theme}
                onChange={(e) => set({ theme: e.target.value })}
                placeholder="Creia, mesmo sem ver"
              />
              <p className="text-xs text-muted-foreground">É o texto grande, o coração da arte.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Versículo-base</Label>
                <Input
                  value={draft.base_verse}
                  onChange={(e) => set({ base_verse: e.target.value })}
                  placeholder="Hebreus 11:1"
                />
              </div>
              <div className="space-y-2">
                <Label>Data (domingo)</Label>
                <Input
                  type="date"
                  value={draft.preached_on}
                  onChange={(e) => set({ preached_on: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Pregador(a)</Label>
              <Input
                value={draft.preacher}
                onChange={(e) => set({ preacher: e.target.value })}
                placeholder="Pr. João Silva"
              />
            </div>

            {/* Pontos principais */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Pontos principais</Label>
                <Button size="sm" variant="outline" onClick={addPoint}>
                  <Plus className="h-4 w-4" /> Ponto
                </Button>
              </div>
              <div className="space-y-3">
                {draft.points.map((p, i) => (
                  <div key={i} className="rounded-lg border border-border p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-foreground font-mono text-xs text-background">
                        {i + 1}
                      </span>
                      <Input
                        value={p.title}
                        onChange={(e) => updatePoint(i, { title: e.target.value })}
                        placeholder={`Ponto ${i + 1}`}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label="Remover ponto"
                        onClick={() => removePoint(i)}
                        disabled={draft.points.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <Textarea
                      rows={2}
                      value={p.detail ?? ""}
                      onChange={(e) => updatePoint(i, { detail: e.target.value })}
                      placeholder="Uma frase que resume este ponto (opcional)"
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                No mapa mental cabem até 6 pontos; no infográfico, até 5.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Hashtags</Label>
              <Input
                value={tagsText}
                onChange={(e) => commitTags(e.target.value)}
                placeholder="fé, esperança, domingo"
              />
            </div>
          </div>

          {/* Preview + controles */}
          <div className="lg:sticky lg:top-6 space-y-4 self-start">
            <div className="flex flex-wrap items-center gap-2">
              {TEMPLATES.map((t) => {
                const Icon = t.icon;
                const active = draft.template === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => set({ template: t.value })}
                    className={
                      "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors " +
                      (active
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-background hover:border-foreground/40")
                    }
                    title={t.hint}
                  >
                    <Icon className="h-4 w-4" /> {t.label}
                  </button>
                );
              })}
              <label className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
                {draft.dark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                <Switch checked={draft.dark} onCheckedChange={(v) => set({ dark: v })} />
              </label>
            </div>

            <SermonCanvas draft={draft} innerRef={previewRef} />
          </div>
        </div>
      </PageBody>
    </>
  );
}
