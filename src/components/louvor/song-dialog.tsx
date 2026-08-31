import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ClipboardPaste, ExternalLink, Loader2, Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LOUVOR_MINISTRY_ID, SONG_KEYS, TEMPO_LABELS } from "@/lib/louvor";
import { parseChordSheet } from "@/lib/cifra-import";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface SongDraft {
  id?: string;
  title: string;
  artist: string;
  song_key: string;
  bpm: string;
  tempo: string;
  theme: string;
  tags: string;
  lyrics: string;
  chords: string;
  youtube_url: string;
  sheet_url: string;
  is_active: boolean;
}

export const emptySong: SongDraft = {
  title: "",
  artist: "",
  song_key: "C",
  bpm: "",
  tempo: "media",
  theme: "",
  tags: "",
  lyrics: "",
  chords: "",
  youtube_url: "",
  sheet_url: "",
  is_active: true,
};

export function SongDialog({ initial, trigger }: { initial: SongDraft; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(initial);
  const [paste, setPaste] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const qc = useQueryClient();

  const save = useMutation({
    mutationFn: async () => {
      if (!draft.title.trim()) throw new Error("Informe o título da música.");
      const payload = {
        title: draft.title.trim(),
        artist: draft.artist || null,
        original_key: draft.song_key || null,
        bpm: draft.bpm ? Number(draft.bpm) : null,
        lyrics: draft.lyrics || null,
        youtube_url: draft.youtube_url || null,
        chords_url: draft.sheet_url || null,
        is_active: draft.is_active,
      };
      const { error } = draft.id
        ? await (supabase.from("songs") as any).update(payload).eq("id", draft.id)
        : await (supabase.from("songs") as any).insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Música salva no repertório.");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["songs"] });
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
      <DialogContent className="sm:max-w-2xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-3xl">
            {draft.id ? "Editar música" : "Nova música"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Artista / autor</Label>
              <Input
                value={draft.artist}
                onChange={(e) => setDraft({ ...draft, artist: e.target.value })}
              />
            </div>
          </div>
          <div className="grid sm:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Tom</Label>
              <Select
                value={draft.song_key}
                onValueChange={(v) => setDraft({ ...draft, song_key: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {SONG_KEYS.map((k) => (
                    <SelectItem key={k} value={k}>
                      {k}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>BPM</Label>
              <Input
                type="number"
                value={draft.bpm}
                onChange={(e) => setDraft({ ...draft, bpm: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Andamento</Label>
              <Select value={draft.tempo} onValueChange={(v) => setDraft({ ...draft, tempo: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TEMPO_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tema</Label>
              <Input
                value={draft.theme}
                onChange={(e) => setDraft({ ...draft, theme: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Tags (separadas por vírgula)</Label>
            <Input
              placeholder="adoracao, celebracao"
              value={draft.tags}
              onChange={(e) => setDraft({ ...draft, tags: e.target.value })}
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Link do YouTube</Label>
              <Input
                value={draft.youtube_url}
                onChange={(e) => setDraft({ ...draft, youtube_url: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Link do CifraClub / partitura</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="https://www.cifraclub.com.br/..."
                  value={draft.sheet_url}
                  onChange={(e) => setDraft({ ...draft, sheet_url: e.target.value })}
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  disabled={
                    isImporting ||
                    (!draft.sheet_url.includes("cifraclub.com.br") &&
                      !draft.sheet_url.includes("cifras.com.br"))
                  }
                  onClick={async () => {
                    setIsImporting(true);
                    try {
                      const res = await fetch(
                        `/api/public/import-cifra?url=${encodeURIComponent(draft.sheet_url)}`,
                      );
                      const data = await res.json();
                      if (data.error) throw new Error(data.error);

                      const parsed = parseChordSheet(data.content);
                      setDraft((d) => ({
                        ...d,
                        title: d.title || data.title || parsed.title || "",
                        artist: d.artist || data.artist || parsed.artist || "",
                        song_key: data.key || parsed.key || d.song_key,
                        bpm: data.bpm?.toString() || d.bpm,
                        youtube_url: d.youtube_url || data.youtubeUrl || "",
                        chords: parsed.chords,
                        lyrics: parsed.lyrics,
                      }));
                      toast.success("Dados importados do link com sucesso!");
                    } catch (e: any) {
                      toast.error(e.message || "Erro ao importar link");
                    } finally {
                      setIsImporting(false);
                    }
                  }}
                  title="Importar automaticamente via link"
                >
                  {isImporting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="h-4 w-4" />
                  )}
                </Button>
                {draft.sheet_url && (
                  <a href={draft.sheet_url} target="_blank" rel="noreferrer">
                    <Button type="button" variant="outline" size="icon" aria-label="Abrir link">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="border border-border rounded-sm p-4 space-y-3 bg-muted/30">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Importar cifra
            </div>
            <p className="text-xs text-muted-foreground">
              Abra a página no CifraClub, copie a cifra e cole abaixo. O sistema separa letra e
              acordes, detecta o tom e deixa tudo pronto para transposição.
            </p>
            <Textarea
              rows={5}
              className="font-mono text-xs"
              placeholder="Cole aqui o conteúdo copiado da página da cifra"
              value={paste}
              onChange={(e) => setPaste(e.target.value)}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (!paste.trim()) {
                  toast.error("Cole a cifra antes de importar.");
                  return;
                }
                const parsed = parseChordSheet(paste);
                setDraft((d) => ({
                  ...d,
                  title: d.title || parsed.title || "",
                  artist: d.artist || parsed.artist || "",
                  song_key:
                    parsed.key && SONG_KEYS.includes(parsed.key as never) ? parsed.key : d.song_key,
                  chords: parsed.chords,
                  lyrics: parsed.lyrics,
                }));
                setPaste("");
                toast.success("Cifra importada. Confira os campos abaixo.");
              }}
            >
              <ClipboardPaste className="h-4 w-4" /> Importar para os campos
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Cifra</Label>
            <Textarea
              rows={8}
              className="font-mono text-xs"
              placeholder={"Intro: C  G  Am  F\n\nC        G\nLetra da música..."}
              value={draft.chords}
              onChange={(e) => setDraft({ ...draft, chords: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Letra</Label>
            <Textarea
              rows={6}
              value={draft.lyrics}
              onChange={(e) => setDraft({ ...draft, lyrics: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-3">
            <Switch
              checked={draft.is_active}
              onCheckedChange={(v) => setDraft({ ...draft, is_active: v })}
            />
            <Label className="text-sm">Ativa no repertório</Label>
          </div>
          <Button className="w-full" disabled={save.isPending} onClick={() => save.mutate()}>
            Salvar música
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
