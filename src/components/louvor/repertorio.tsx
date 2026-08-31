import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Music,
  Pencil,
  Plus,
  Search,
  Trash2,
  Video,
  FileText,
  ChevronRight,
  ListMusic,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { LOUVOR_MINISTRY_ID, SONG_KEYS, TEMPO_LABELS } from "@/lib/louvor";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { SongDialog, emptySong, type SongDraft } from "./song-dialog";
import { BulkImportDialog } from "./bulk-import-dialog";
import { SongSheet, type SongRecord } from "./song-sheet";
import { Badge } from "@/components/ui/badge";

function toDraft(song: SongRecord): SongDraft {
  return {
    id: song.id,
    title: song.title,
    artist: song.artist ?? "",
    song_key: song.song_key ?? song.original_key ?? "C",
    bpm: song.bpm?.toString() ?? "",
    tempo: song.tempo ?? "media",
    theme: song.theme ?? "",
    tags: (song.tags ?? []).join(", "),
    lyrics: song.lyrics ?? "",
    chords: song.chords ?? "",
    youtube_url: song.youtube_url ?? "",
    sheet_url: song.sheet_url ?? song.chords_url ?? "",
    is_active: song.is_active,
  };
}

export function Repertorio() {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<SongRecord | null>(null);
  const { isMinistryAdmin } = useAuth();
  const canManage = isMinistryAdmin(LOUVOR_MINISTRY_ID);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["songs"],
    queryFn: async () => {
      // Priorizamos a nova tabela public.songs
      // O cast 'as any' resolve temporariamente a tipagem até a geração automática atualizar
      const { data, error } = await (supabase.from("songs") as any).select("*").order("title");
      if (error) {
        // Fallback para worship_songs para retrocompatibilidade
        const { data: oldData, error: oldError } = await (supabase.from("worship_songs") as any)
          .select("*")
          .order("title");
        if (oldError) throw oldError;
        return oldData as SongRecord[];
      }
      return data as SongRecord[];
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from("songs") as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Música removida.");
      qc.invalidateQueries({ queryKey: ["songs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return data ?? [];
    return (data ?? []).filter((s) =>
      [s.title, s.artist, s.theme, (s.tags ?? []).join(" ")]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(term)),
    );
  }, [data, q]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 h-11 bg-muted/30 border-border/50 focus-visible:ring-primary/50"
            placeholder="Buscar por título, artista, tema ou tag"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {canManage && (
            <BulkImportDialog
              trigger={
                <Button variant="outline" className="h-11 px-4">
                  <ListMusic className="h-4 w-4 mr-2" /> Importação em massa
                </Button>
              }
            />
          )}
          {canManage && (
            <SongDialog
              initial={emptySong}
              trigger={
                <Button className="h-11 px-6 shadow-lg shadow-primary/10 transition-all hover:scale-[1.02] active:scale-[0.98]">
                  <Plus className="h-4 w-4 mr-2" /> Nova música
                </Button>
              }
            />
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-48 rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed rounded-lg bg-muted/10">
          <Music className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">Nenhuma música encontrada no repertório.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((song: SongRecord) => (
            <div
              key={song.id}
              className="group relative flex flex-col bg-card hover:bg-muted/30 border border-border/50 hover:border-primary/30 rounded-lg p-5 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5"
            >
              <button
                className="text-left flex-1 space-y-3 cursor-pointer"
                onClick={() => setSelected(song)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {(song.song_key || song.original_key) && (
                      <Badge
                        variant="outline"
                        className="font-mono text-[10px] tracking-wider uppercase bg-primary/5 text-primary border-primary/20"
                      >
                        {song.song_key || song.original_key}
                      </Badge>
                    )}
                    {song.bpm && (
                      <Badge
                        variant="outline"
                        className="font-mono text-[10px] tracking-wider uppercase"
                      >
                        {song.bpm} BPM
                      </Badge>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                <div>
                  <h3 className="font-serif text-2xl leading-tight group-hover:text-primary transition-colors">
                    {song.title}
                  </h3>
                  <p className="text-sm text-muted-foreground font-medium mt-1">
                    {song.artist ?? "Artista Desconhecido"}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {(song.tags ?? []).map((t: string) => (
                    <span
                      key={t}
                      className="text-[9px] uppercase tracking-widest text-muted-foreground/70 bg-muted/50 px-2 py-0.5 rounded-full border border-border/30"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </button>

              <div className="mt-6 pt-4 flex items-center justify-between border-t border-border/50">
                <div className="flex items-center gap-3">
                  {song.youtube_url && (
                    <a
                      href={song.youtube_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-muted-foreground hover:text-red-500 transition-colors"
                    >
                      <Video className="h-4 w-4" />
                    </a>
                  )}
                  {(song.sheet_url || song.chords_url) && (
                    <a
                      href={(song.sheet_url || song.chords_url)!}
                      target="_blank"
                      rel="noreferrer"
                      className="text-muted-foreground hover:text-blue-500 transition-colors"
                    >
                      <FileText className="h-4 w-4" />
                    </a>
                  )}
                </div>

                {canManage && (
                  <div className="flex gap-1">
                    <SongDialog
                      initial={toDraft(song)}
                      trigger={
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Deseja realmente remover esta música?"))
                          remove.mutate(song.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <SongSheet song={selected} onOpenChange={(o) => !o && setSelected(null)} />
    </div>
  );
}
