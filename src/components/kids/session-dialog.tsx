import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarPlus, Pencil } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ChurchSelect } from "@/components/admin/church-select";
import type { KidsSession } from "@/lib/kids";

function nextSundayISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7));
  return d.toISOString().slice(0, 10);
}

/** Cria ou edita um culto/sessão Kids — é o "dia" em que o check-in acontece. */
export function SessionDialog({
  session,
  trigger,
}: {
  session?: KidsSession;
  trigger?: React.ReactNode;
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [room, setRoom] = useState("");
  const [notes, setNotes] = useState("");
  const [churchId, setChurchId] = useState("");

  useEffect(() => {
    if (!open) return;
    setTitle(session?.title ?? "Culto de domingo — Kids");
    setDate(session?.session_date ?? nextSundayISO());
    setStartTime(session?.start_time?.slice(0, 5) ?? "18:00");
    setRoom(session?.room ?? "");
    setNotes(session?.notes ?? "");
    setChurchId(session?.church_id ?? "");
  }, [open, session]);

  const save = useMutation({
    mutationFn: async () => {
      if (!title.trim()) throw new Error("Informe o nome da sessão.");
      if (!date) throw new Error("Informe a data.");
      const payload = {
        title: title.trim(),
        session_date: date,
        start_time: startTime || null,
        room: room.trim() || null,
        notes: notes.trim() || null,
        church_id: churchId || null,
      };
      const query = session
        ? supabase.from("kids_sessions").update(payload).eq("id", session.id)
        : supabase.from("kids_sessions").insert(payload);
      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["kids-sessions"] });
      toast.success(session ? "Sessão atualizada." : "Sessão criada.");
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="outline">
            <CalendarPlus className="h-4 w-4" /> Nova sessão
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{session ? "Editar sessão Kids" : "Nova sessão Kids"}</DialogTitle>
          <DialogDescription>
            Cada culto tem uma sessão própria — é nela que os check-ins do dia ficam registrados.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Data</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Horário</Label>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Sala</Label>
            <Input
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="Ex.: Sala 2"
            />
          </div>
          <ChurchSelect value={churchId} onChange={setChurchId} />
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function EditSessionButton({ session }: { session: KidsSession }) {
  return (
    <SessionDialog
      session={session}
      trigger={
        <Button variant="ghost" size="sm">
          <Pencil className="h-3.5 w-3.5" /> Editar sessão
        </Button>
      }
    />
  );
}
