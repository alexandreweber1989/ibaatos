import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { LOUVOR_MINISTRY_ID, WORSHIP_FUNCTIONS, initials, relativeDays } from "@/lib/louvor";
import { useAuth } from "@/lib/auth-context";
import { useProfileOptions } from "@/lib/use-profiles";
import { useMusicians, useSundayHistory, type Musician } from "@/lib/use-worship";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
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
import { QueryError } from "./visao-geral";

interface MusicianDraft {
  id?: string;
  user_id: string;
  functions: string[];
  notes: string;
  is_active: boolean;
}

const emptyDraft: MusicianDraft = { user_id: "", functions: [], notes: "", is_active: true };

function MusicianDialog({
  initial,
  trigger,
  takenIds,
}: {
  initial: MusicianDraft;
  trigger: React.ReactNode;
  takenIds: string[];
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(initial);
  const [q, setQ] = useState("");
  const { data: profiles } = useProfileOptions();
  const qc = useQueryClient();

  const options = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (profiles ?? [])
      .filter((p) => p.id === draft.user_id || !takenIds.includes(p.id))
      .filter((p) => !term || p.full_name.toLowerCase().includes(term));
  }, [profiles, q, takenIds, draft.user_id]);

  const toggle = (fn: string) =>
    setDraft((d) => ({
      ...d,
      functions: d.functions.includes(fn)
        ? d.functions.filter((f) => f !== fn)
        : [...d.functions, fn],
    }));

  const save = useMutation({
    mutationFn: async () => {
      if (!draft.user_id) throw new Error("Selecione o irmão ou irmã.");
      if (draft.functions.length === 0)
        throw new Error("Marque ao menos uma função ou instrumento.");
      const payload = {
        ministry_id: LOUVOR_MINISTRY_ID,
        user_id: draft.user_id,
        functions: draft.functions,
        notes: draft.notes.trim() || null,
        is_active: draft.is_active,
      };
      const { error } = draft.id
        ? await supabase.from("worship_musicians").update(payload).eq("id", draft.id)
        : await supabase.from("worship_musicians").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Elenco do louvor atualizado.");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["worship-musicians"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) {
          setDraft(initial);
          setQ("");
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-3xl">
            {initial.id ? "Editar integrante" : "Adicionar ao louvor"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          <div className="space-y-2">
            <Label>Pessoa (cadastro de Membros)</Label>
            {!initial.id && (
              <Input
                placeholder="Buscar pelo nome"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            )}
            <Select value={draft.user_id} onValueChange={(v) => setDraft({ ...draft, user_id: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o membro" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {options.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Funções / instrumentos</Label>
            <div className="flex flex-wrap gap-2">
              {WORSHIP_FUNCTIONS.map((fn) => {
                const active = draft.functions.includes(fn);
                return (
                  <button
                    key={fn}
                    type="button"
                    onClick={() => toggle(fn)}
                    className={`rounded-sm border px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest transition-colors ${
                      active
                        ? "border-foreground bg-foreground text-background"
                        : "border-border text-muted-foreground hover:border-foreground"
                    }`}
                  >
                    {fn}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              rows={3}
              placeholder="Disponibilidade, tom de voz, equipamento próprio..."
              value={draft.notes}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
            />
          </div>

          <div className="flex items-center gap-3">
            <Switch
              checked={draft.is_active}
              onCheckedChange={(v) => setDraft({ ...draft, is_active: v })}
            />
            <Label className="text-sm">Disponível para escala</Label>
          </div>

          <Button className="w-full" disabled={save.isPending} onClick={() => save.mutate()}>
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function Elenco() {
  const { isMinistryAdmin } = useAuth();
  const canManage = isMinistryAdmin(LOUVOR_MINISTRY_ID);
  const { data: musicians, isLoading, error } = useMusicians();
  const { data: history } = useSundayHistory();
  const qc = useQueryClient();

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("worship_musicians").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Integrante removido do louvor.");
      qc.invalidateQueries({ queryKey: ["worship-musicians"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (error) return <QueryError error={error as Error} />;
  if (isLoading) {
    return (
      <div className="grid sm:grid-cols-2 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-40 rounded-sm" />
        ))}
      </div>
    );
  }

  const takenIds = (musicians ?? []).map((m) => m.user_id);

  const card = (m: Musician) => {
    const part = history?.[m.user_id];
    return (
      <div
        key={m.id}
        className="flex items-start justify-between gap-3 border border-border bg-background rounded-sm p-3"
      >
        <div className="flex items-start gap-3">
          <span className="h-9 w-9 shrink-0 rounded-sm bg-muted grid place-items-center font-mono text-[10px] tracking-widest">
            {initials(m.profile?.full_name ?? "?")}
          </span>
          <div>
            <div className="text-sm leading-tight">{m.profile?.full_name}</div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">
              {m.is_active ? relativeDays(part?.lastDate ?? null) : "Indisponível"}
              {part?.count ? ` · ${part.count} cultos` : ""}
            </div>
            {m.notes && <div className="text-xs text-muted-foreground mt-1">{m.notes}</div>}
          </div>
        </div>
        {canManage && (
          <div className="flex gap-1">
            <MusicianDialog
              takenIds={takenIds}
              initial={{
                id: m.id,
                user_id: m.user_id,
                functions: m.functions ?? [],
                notes: m.notes ?? "",
                is_active: m.is_active,
              }}
              trigger={
                <Button variant="ghost" size="icon" aria-label="Editar integrante">
                  <Pencil className="h-4 w-4" />
                </Button>
              }
            />
            <Button
              variant="ghost"
              size="icon"
              aria-label="Remover integrante"
              onClick={() => remove.mutate(m.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground max-w-2xl">
          O elenco reúne os irmãos por instrumento e voz. Na aba de escalas você escolhe, função por
          função, quem serve em cada domingo.
        </p>
        {canManage && (
          <MusicianDialog
            takenIds={takenIds}
            initial={emptyDraft}
            trigger={
              <Button>
                <UserPlus className="h-4 w-4" /> Adicionar ao louvor
              </Button>
            }
          />
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {WORSHIP_FUNCTIONS.map((fn) => {
          const people = (musicians ?? []).filter((m) => (m.functions ?? []).includes(fn));
          return (
            <section key={fn} className="border border-border bg-card rounded-sm p-5 space-y-3">
              <div className="flex items-baseline justify-between">
                <h3 className="font-serif text-2xl leading-none">{fn}</h3>
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {people.length} {people.length === 1 ? "pessoa" : "pessoas"}
                </span>
              </div>
              {people.length === 0 ? (
                <p className="text-sm text-muted-foreground">Ninguém cadastrado nesta função.</p>
              ) : (
                <div className="space-y-2">{people.map(card)}</div>
              )}
            </section>
          );
        })}
      </div>

      {(musicians ?? []).some((m) =>
        (m.functions ?? []).every((f) => !WORSHIP_FUNCTIONS.includes(f as never)),
      ) && (
        <section className="border border-border bg-card rounded-sm p-5 space-y-3">
          <h3 className="font-serif text-2xl leading-none">Outras funções</h3>
          <div className="space-y-2">
            {(musicians ?? [])
              .filter((m) =>
                (m.functions ?? []).every((f) => !WORSHIP_FUNCTIONS.includes(f as never)),
              )
              .map(card)}
          </div>
        </section>
      )}
    </div>
  );
}
