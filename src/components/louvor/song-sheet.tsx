import { useState } from "react";
import { Minus, Plus, Video, FileText } from "lucide-react";
import { transposeChords, TEMPO_LABELS } from "@/lib/louvor";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export interface SongRecord {
  id: string;
  title: string;
  artist: string | null;
  song_key: string | null;
  original_key?: string | null;
  bpm: number | null;
  tempo: string | null;
  theme: string | null;
  tags: string[];
  lyrics: string | null;
  chords: string | null;
  youtube_url: string | null;
  sheet_url: string | null;
  chords_url?: string | null;
  is_active: boolean;
}

export function SongSheet({
  song,
  onOpenChange,
}: {
  song: SongRecord | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [shift, setShift] = useState(0);
  const [showChords, setShowChords] = useState(true);

  return (
    <Sheet
      open={Boolean(song)}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) setShift(0);
      }}
    >
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        {song && (
          <>
            <SheetHeader>
              <SheetTitle className="font-serif text-4xl text-left leading-none">
                {song.title}
              </SheetTitle>
            </SheetHeader>
            <div className="px-4 pb-10 space-y-6">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                {[
                  song.artist,
                  (song.song_key || song.original_key) &&
                    `Tom ${song.song_key || song.original_key}`,
                  song.bpm && `${song.bpm} BPM`,
                  song.tempo && TEMPO_LABELS[song.tempo],
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {song.youtube_url && (
                  <a href={song.youtube_url} target="_blank" rel="noreferrer">
                    <Button variant="outline" size="sm">
                      <Video className="h-4 w-4" /> Referência
                    </Button>
                  </a>
                )}
                {(song.sheet_url || song.chords_url) && (
                  <a href={(song.sheet_url || song.chords_url)!} target="_blank" rel="noreferrer">
                    <Button variant="outline" size="sm">
                      <FileText className="h-4 w-4" /> Partitura
                    </Button>
                  </a>
                )}
              </div>

              {song.chords && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                        Cifra {shift !== 0 && `(${shift > 0 ? "+" : ""}${shift})`}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 font-mono text-[10px] uppercase tracking-widest"
                          onClick={() => setShowChords(!showChords)}
                        >
                          {showChords ? "Ocultar Cifra" : "Exibir Cifra"}
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        aria-label="Baixar meio tom"
                        onClick={() => setShift((s) => s - 1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        aria-label="Subir meio tom"
                        onClick={() => setShift((s) => s + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {showChords ? (
                    <pre className="border border-border bg-card rounded-sm p-4 font-mono text-xs whitespace-pre-wrap leading-[1.6] tracking-normal overflow-x-auto selection:bg-primary/20">
                      {transposeChords(song.chords, shift)}
                    </pre>
                  ) : song.lyrics ? (
                    <div className="space-y-3">
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">{song.lyrics}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      Letra não disponível para esta música.
                    </p>
                  )}
                </div>
              )}

              {!song.chords && song.lyrics && (
                <div className="space-y-3">
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    Letra
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{song.lyrics}</p>
                </div>
              )}

              {!song.chords && !song.lyrics && (
                <p className="text-sm text-muted-foreground">
                  Cifra e letra ainda não cadastradas.
                </p>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
