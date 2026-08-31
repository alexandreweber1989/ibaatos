import { useState } from "react";
import { toast } from "sonner";
import { Lock, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDateBR } from "@/lib/membros";
import {
  PASTORAL_KINDS,
  pastoralKindLabel,
  useDeletePastoralNote,
  usePastoralNotes,
  useSavePastoralNote,
  type PastoralKind,
} from "@/lib/pastoral";

const today = () => new Date().toISOString().slice(0, 10);

/**
 * Histórico pastoral do membro. O componente só deve ser montado para a
 * equipe pastoral — a RLS também bloqueia leitura para os demais.
 */
export function PastoralNotes({ personId, enabled }: { personId: string; enabled: boolean }) {
  const { data: notes, isLoading } = usePastoralNotes(personId, enabled);
  const save = useSavePastoralNote(personId);
  const remove = useDeletePastoralNote(personId);

  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<string>("todos");
  const [kind, setKind] = useState<PastoralKind>("visita");
  const [happenedOn, setHappenedOn] = useState(today());
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<"pastoral" | "autor">("pastoral");

  const list = (notes ?? []).filter((n) => filter === "todos" || n.kind === filter);

  const submit = () => {
    save.mutate(
      { kind, happened_on: happenedOn, content, visibility },
      {
        onSuccess: () => {
          toast.success("Acompanhamento registrado.");
          setContent("");
          setOpen(false);
        },
        onError: (e: Error) => toast.error(e.message),
      },
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="h-8 w-40 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os tipos</SelectItem>
            {PASTORAL_KINDS.map((k) => (
              <SelectItem key={k.value} value={k.value}>
                {k.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" variant="outline" onClick={() => setOpen((v) => !v)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Registrar
        </Button>
      </div>

      {open && (
        <div className="space-y-2 border border-border rounded-sm p-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <Select value={kind} onValueChange={(v) => setKind(v as PastoralKind)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PASTORAL_KINDS.map((k) => (
                  <SelectItem key={k.value} value={k.value}>
                    {k.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input type="date" value={happenedOn} onChange={(e) => setHappenedOn(e.target.value)} />
          </div>
          <Textarea
            rows={4}
            placeholder="O que foi conversado, pedidos de oração, encaminhamentos…"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Select
              value={visibility}
              onValueChange={(v) => setVisibility(v as "pastoral" | "autor")}
            >
              <SelectTrigger className="h-8 w-56 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pastoral">Visível à equipe pastoral</SelectItem>
                <SelectItem value="autor">Somente eu</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" onClick={submit} disabled={save.isPending || !content.trim()}>
              Salvar registro
            </Button>
          </div>
        </div>
      )}

      {isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
      {!isLoading && !list.length && (
        <p className="text-sm text-muted-foreground">Nenhum acompanhamento registrado.</p>
      )}

      <ul className="space-y-2">
        {list.map((n) => (
          <li key={n.id} className="border border-border rounded-sm p-3 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{pastoralKindLabel(n.kind)}</Badge>
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {formatDateBR(n.happened_on)}
                {n.author?.full_name ? ` · ${n.author.full_name}` : ""}
              </span>
              {n.visibility === "autor" && (
                <Badge variant="outline" className="gap-1">
                  <Lock className="h-3 w-3" /> Sigiloso
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto h-7 px-2"
                onClick={() => {
                  remove.mutate(n.id, {
                    onSuccess: () => toast.success("Registro removido."),
                    onError: (e: Error) => toast.error(e.message),
                  });
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            <p className="text-sm whitespace-pre-wrap">{n.content}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
