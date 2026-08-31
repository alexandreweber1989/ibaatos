import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Minus, Plus, Play, Pause, X, Monitor } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { transposeChords } from "@/lib/louvor";
import { Button } from "@/components/ui/button";

export interface StageItem {
  id: string;
  position: number;
  song_key: string | null;
  notes: string | null;
  song: { id: string; title: string; artist: string | null } | null;
}

/** Busca cifra/letra completa das músicas do repertório do dia. */
function useStageSongs(ids: string[], enabled: boolean) {
  return useQuery({
    queryKey: ["worship-stage-songs", ids.join(",")],
    enabled: enabled && ids.length > 0,
    queryFn: async () => {
      const { data, error } = await (supabase.from("songs") as any)
        .select("id, title, artist, song_key, chords, lyrics")
        .in("id", ids);
      if (error) throw error;
      return data;
    },
  });
}

export function StageMode({ setlist }: { setlist: StageItem[] }) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [shift, setShift] = useState(0);
  const [showChords, setShowChords] = useState(true);
  const [size, setSize] = useState(16);
  const [scrolling, setScrolling] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const ids = useMemo(() => setlist.map((i) => i.song?.id).filter(Boolean) as string[], [setlist]);
  const { data: songs } = useStageSongs(ids, open);

  const current = setlist[index];
  const song = songs?.find((s: any) => s.id === current?.song?.id);

  // Reinicia estado ao trocar de música.
  useEffect(() => {
    setShift(0);
    scrollRef.current?.scrollTo({ top: 0 });
  }, [index]);

  // Autoscroll suave enquanto ativo.
  useEffect(() => {
    if (!scrolling || !open) return;
    const id = window.setInterval(() => {
      scrollRef.current?.scrollBy({ top: 1 });
    }, 60);
    return () => window.clearInterval(id);
  }, [scrolling, open]);

  // Navegação por teclado no palco.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowRight") setIndex((i) => Math.min(i + 1, setlist.length - 1));
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(i - 1, 0));
      if (e.key === " ") {
        e.preventDefault();
        setScrolling((s) => !s);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setlist.length]);

  if (!open) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled={setlist.length === 0}
        onClick={() => {
          setIndex(0);
          setOpen(true);
        }}
      >
        <Monitor className="h-4 w-4" /> Modo palco
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <div className="font-serif text-2xl truncate">{current?.song?.title ?? "—"}</div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground truncate">
            {[
              current?.song?.artist,
              current?.song_key && `Tom ${current.song_key}`,
              shift !== 0 && `${shift > 0 ? "+" : ""}${shift} semitons`,
              `${index + 1}/${setlist.length}`,
            ]
              .filter(Boolean)
              .join(" · ")}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            aria-label="Diminuir letra"
            onClick={() => setSize((s) => Math.max(11, s - 1))}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="font-mono text-[10px] w-8 text-center text-muted-foreground">
            {size}px
          </span>
          <Button
            variant="outline"
            size="icon"
            aria-label="Aumentar letra"
            onClick={() => setSize((s) => Math.min(40, s + 1))}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="font-mono text-[10px]"
            onClick={() => setShowChords(!showChords)}
          >
            {showChords ? "LETRA" : "CIFRA"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShift((s) => s - 1)}>
            -½
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShift((s) => s + 1)}>
            +½
          </Button>

          <Button
            variant={scrolling ? "default" : "outline"}
            size="icon"
            aria-label="Rolagem automática"
            onClick={() => setScrolling((s) => !s)}
          >
            {scrolling ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Sair do modo palco"
            onClick={() => {
              setOpen(false);
              setScrolling(false);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
        {showChords && song?.chords ? (
          <pre
            className="font-mono whitespace-pre-wrap leading-[1.6] max-w-3xl mx-auto selection:bg-primary/20"
            style={{ fontSize: size }}
          >
            {transposeChords(song.chords, shift)}
          </pre>
        ) : song?.lyrics ? (
          <p
            className="whitespace-pre-wrap leading-relaxed max-w-3xl mx-auto"
            style={{ fontSize: size }}
          >
            {song.lyrics}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground text-center">
            Cifra ou letra ainda não cadastradas para esta música.
          </p>
        )}

        {current?.notes && (
          <p className="max-w-3xl mx-auto mt-6 text-sm text-muted-foreground border-l-2 border-border pl-3">
            {current.notes}
          </p>
        )}
      </div>

      <footer className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
        <Button
          variant="outline"
          size="sm"
          disabled={index === 0}
          onClick={() => setIndex((i) => i - 1)}
        >
          <ChevronLeft className="h-4 w-4" /> Anterior
        </Button>
        <div className="flex-1 flex flex-wrap justify-center gap-1 overflow-x-auto">
          {setlist.map((item, i) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setIndex(i)}
              className={`px-2 py-1 rounded-sm font-mono text-[10px] uppercase tracking-widest border transition-colors ${
                i === index
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:border-foreground"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={index >= setlist.length - 1}
          onClick={() => setIndex((i) => i + 1)}
        >
          Próxima <ChevronRight className="h-4 w-4" />
        </Button>
      </footer>
    </div>
  );
}
