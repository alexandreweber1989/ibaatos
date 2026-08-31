import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Play, CheckCircle2, AlertCircle, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { parseChordSheet } from "@/lib/cifra-import";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

interface ImportTask {
  url: string;
  status: "pending" | "processing" | "completed" | "error";
  error?: string;
  title?: string;
}

export function BulkImportDialog({ trigger }: { trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [urlsText, setUrlsText] = useState("");
  const [tasks, setTasks] = useState<ImportTask[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const qc = useQueryClient();

  const handleStart = async () => {
    const lines = urlsText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (lines.length === 0) {
      toast.error("Insira pelo menos uma URL.");
      return;
    }

    const newTasks: ImportTask[] = lines.map((url) => ({ url, status: "pending" }));
    setTasks(newTasks);
    setIsProcessing(true);

    for (let i = 0; i < newTasks.length; i++) {
      setTasks((prev) => prev.map((t, idx) => (idx === i ? { ...t, status: "processing" } : t)));

      try {
        const res = await fetch(
          `/api/public/import-cifra?url=${encodeURIComponent(newTasks[i].url)}`,
        );
        const data = await res.json();

        if (data.error) throw new Error(data.error);

        const parsed = parseChordSheet(data.content);
        const payload = {
          title: data.title || parsed.title || "Música sem título",
          artist: data.artist || parsed.artist || null,
          original_key: data.key || parsed.key || null,
          bpm: data.bpm ? Number(data.bpm) : null,
          lyrics: parsed.lyrics || null,
          youtube_url: null,
          chords_url: newTasks[i].url,
          is_active: true,
        };

        const { error: dbError } = await (supabase.from("songs") as any).insert(payload);
        if (dbError) throw dbError;

        setTasks((prev) =>
          prev.map((t, idx) =>
            idx === i ? { ...t, status: "completed", title: payload.title } : t,
          ),
        );
      } catch (e: any) {
        setTasks((prev) =>
          prev.map((t, idx) => (idx === i ? { ...t, status: "error", error: e.message } : t)),
        );
      }
    }

    setIsProcessing(false);
    qc.invalidateQueries({ queryKey: ["songs"] });
    toast.success("Processo de importação concluído!");
  };

  const progress =
    tasks.length > 0
      ? (tasks.filter((t) => t.status === "completed" || t.status === "error").length /
          tasks.length) *
        100
      : 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o && !isProcessing) {
          setTasks([]);
          setUrlsText("");
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Importação em Massa</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {!isProcessing && tasks.length === 0 ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>URLs das Cifras (uma por linha)</Label>
                <Textarea
                  placeholder="https://www.cifraclub.com.br/artista/musica/&#10;https://www.cifras.com.br/artista/musica/"
                  rows={10}
                  value={urlsText}
                  onChange={(e) => setUrlsText(e.target.value)}
                  className="font-mono text-sm"
                />
              </div>
              <Button className="w-full" onClick={handleStart}>
                <Play className="h-4 w-4 mr-2" /> Iniciar Importação
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm mb-1">
                  <span>Progresso</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              <div className="border rounded-lg divide-y bg-muted/20 max-h-[300px] overflow-y-auto">
                {tasks.map((task, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between gap-3 text-sm">
                    <div className="truncate flex-1">
                      <p className="font-medium truncate">{task.title || task.url}</p>
                      {task.error && (
                        <p className="text-destructive text-xs truncate">{task.error}</p>
                      )}
                    </div>
                    <div>
                      {task.status === "processing" && (
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      )}
                      {task.status === "completed" && (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      )}
                      {task.status === "error" && (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      )}
                      {task.status === "pending" && (
                        <div className="h-4 w-4 rounded-full border border-muted-foreground/30" />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {!isProcessing && (
                <Button variant="outline" className="w-full" onClick={() => setOpen(false)}>
                  Fechar
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
