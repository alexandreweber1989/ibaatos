import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Copy, Users2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, formatTime } from "@/lib/louvor";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  scheduleId: string;
}

/**
 * Monta o "grupo do domingo": lista dos escalados com telefone e o repertório,
 * pronto para copiar ou abrir no WhatsApp. Disponível para o ministro e admins.
 */
export function GrupoDomingo({ scheduleId }: Props) {
  const [open, setOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ["worship-group", scheduleId],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("worship_schedules")
        .select(
          "title, event_date, start_time, location, assignments:worship_schedule_assignments(function_name, status, profiles:profiles!inner(full_name, phone)), setlist:worship_setlist_items(position, song_key, song:worship_songs!inner(title, artist, youtube_url, sheet_url))",
        )
        .eq("id", scheduleId)
        .single();
      if (error) throw error;
      return data as any;
    },
  });

  const people = useMemo(
    () => ((data?.assignments ?? []) as any[]).filter((a) => a.status !== "recusado"),
    [data],
  );

  const phones = useMemo(
    () =>
      people.map((p) => (p.profiles?.phone ?? "").replace(/\D/g, "")).filter((p) => p.length >= 10),
    [people],
  );

  const message = useMemo(() => {
    if (!data) return "";
    const setlist = [...((data.setlist ?? []) as any[])].sort((a, b) => a.position - b.position);
    const linhas = [
      `*${data.title}* — ${formatDate(data.event_date)} · ${formatTime(data.start_time)}`,
      data.location ? `Local: ${data.location}` : null,
      "",
      "*Escala:*",
      ...people.map(
        (p) =>
          `• ${p.function_name}: ${p.profiles?.full_name}${p.status === "pendente" ? " (aguardando confirmação)" : ""}`,
      ),
      "",
      setlist.length ? "*Repertório:*" : "*Repertório:* a definir",
      ...setlist.map(
        (s, i) =>
          `${i + 1}. ${s.song?.title}${s.song_key ? ` (Tom ${s.song_key})` : ""}${s.song?.sheet_url ? ` — ${s.song.sheet_url}` : ""}`,
      ),
    ].filter((l) => l !== null);
    return linhas.join("\n");
  }, [data, people]);

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copiado.`);
    } catch {
      toast.error("Não foi possível copiar. Selecione o texto manualmente.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Users2 className="h-4 w-4" /> Grupo do domingo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-3xl">Grupo do domingo</DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
              Escalados ({people.length})
            </div>
            <ul className="divide-y divide-border">
              {people.map((p, i) => (
                <li key={i} className="py-2 flex items-center justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate">
                    {p.profiles?.full_name}
                    <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground ml-2">
                      {p.function_name}
                    </span>
                  </span>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {p.profiles?.phone ?? "sem telefone"}
                  </span>
                </li>
              ))}
              {people.length === 0 && (
                <li className="py-2 text-sm text-muted-foreground">Ninguém escalado ainda.</li>
              )}
            </ul>
          </div>

          <div className="space-y-2">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Mensagem do grupo
            </div>
            <Textarea rows={10} readOnly value={message} className="font-mono text-xs" />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => copy(message, "Aviso")}>
              <Copy className="h-4 w-4" /> Copiar aviso
            </Button>
            <Button variant="outline" onClick={() => copy(phones.join("\n"), "Telefones")}>
              <Copy className="h-4 w-4" /> Copiar telefones ({phones.length})
            </Button>
            <Button variant="outline" asChild>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(message)}`}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle className="h-4 w-4" /> Enviar no WhatsApp
              </a>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Crie o grupo no WhatsApp usando os telefones copiados e cole o aviso com a escala e o
            repertório do domingo.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
