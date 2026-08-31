import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useProfileOptions } from "@/lib/use-profiles";
import { ChurchSelect } from "./church-select";
import { MemberPicker } from "./member-picker";
import { AddressManager } from "./address-manager";

import {
  CHURCH_FUNCTIONS,
  CHURCH_FUNCTION_LABEL,
  churchFunctionRank,
  type ChurchFunction,
} from "@/lib/igreja";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

const DAYS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

export interface MesaRecord {
  id: string;
  name: string;
  rede_id?: string | null;
  church_id?: string | null;
  meeting_day?: string | null;
  meeting_time?: string | null;
  meeting_location?: string | null;
  description?: string | null;
}

/**
 * Criação e edição de mesas vinculadas a uma rede e a uma igreja (admin geral).
 * Quando `mesa` é informado, o diálogo entra em modo de edição.
 */
export function MesaDialog({
  redeId,
  compact,
  mesa,
  trigger,
}: {
  redeId?: string;
  compact?: boolean;
  mesa?: MesaRecord;
  trigger?: React.ReactNode;
}) {
  const isEdit = Boolean(mesa?.id);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(mesa?.name ?? "");
  const [rede, setRede] = useState(mesa?.rede_id ?? redeId ?? "");
  const [churchId, setChurchId] = useState(mesa?.church_id ?? "");
  const [day, setDay] = useState(mesa?.meeting_day ?? "");
  const [time, setTime] = useState(mesa?.meeting_time ?? "");
  const [location, setLocation] = useState(mesa?.meeting_location ?? "");
  const [description, setDescription] = useState(mesa?.description ?? "");
  const [leaders, setLeaders] = useState<string[]>([]);
  const { data: profiles } = useProfileOptions();
  const qc = useQueryClient();

  const { data: redes } = useQuery({
    queryKey: ["redes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("redes")
        .select("id, name, church_id")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Responsáveis atuais (funções diferentes de "membro") — só no modo edição.
  const { data: currentLeaders } = useQuery({
    queryKey: ["mesa-leaders", mesa?.id],
    enabled: open && isEdit,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mesa_members")
        .select("user_id, role")
        .eq("mesa_id", mesa!.id);
      if (error) throw error;
      return (data ?? []).filter((r) => r.role !== "membro").map((r) => r.user_id);
    },
  });

  useEffect(() => {
    if (open && isEdit && currentLeaders) setLeaders(currentLeaders);
  }, [open, isEdit, currentLeaders]);

  function resetToInitial() {
    setName(mesa?.name ?? "");
    setRede(mesa?.rede_id ?? redeId ?? "");
    setChurchId(mesa?.church_id ?? "");
    setDay(mesa?.meeting_day ?? "");
    setTime(mesa?.meeting_time ?? "");
    setLocation(mesa?.meeting_location ?? "");
    setDescription(mesa?.description ?? "");
    setLeaders(isEdit ? (currentLeaders ?? []) : []);
  }

  const save = useMutation({
    mutationFn: async () => {
      if (name.trim().length < 3) throw new Error("Informe o nome da mesa.");
      const redeFinal = rede || redeId || null;
      // A igreja é herdada da rede quando não for escolhida explicitamente,
      // evitando que a criação de mesas dentro de uma rede seja bloqueada.
      const inherited = redes?.find((r) => r.id === redeFinal)?.church_id ?? null;
      const churchFinal = churchId || inherited;
      if (!churchFinal) throw new Error("Selecione a igreja desta mesa.");
      const payload = {
        name: name.trim(),
        rede_id: redeFinal,
        church_id: churchFinal,
        meeting_day: day || null,
        meeting_time: time || null,
        meeting_location: location.trim() || null,
        description: description.trim() || null,
      };

      let mesaId = mesa?.id;
      if (isEdit) {
        const { error } = await supabase.from("mesas").update(payload).eq("id", mesa!.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("mesas").insert(payload).select("id").single();
        if (error) throw error;
        mesaId = data?.id;
      }
      if (!mesaId) return;

      // Sincroniza responsáveis: remove quem saiu, insere quem entrou.
      const previous = isEdit ? (currentLeaders ?? []) : [];
      const removed = previous.filter((id) => !leaders.includes(id));
      const added = leaders.filter((id) => !previous.includes(id));

      if (removed.length > 0) {
        const { error } = await supabase
          .from("mesa_members")
          .delete()
          .eq("mesa_id", mesaId)
          .in("user_id", removed);
        if (error) throw error;
      }
      if (added.length > 0) {
        const rows = added.map((userId) => {
          const profile = profiles?.find((p) => p.id === userId);
          const fn = profile?.church_function;
          // Se a função for apascentador ou pastor, mantém. Caso contrário, define como líder de mesa.
          const role =
            fn &&
            (fn === "apascentador" ||
              fn === "pastor" ||
              fn === "lider" ||
              fn === "obreiro" ||
              fn === "diacono" ||
              fn === "lider_mesa")
              ? fn
              : "lider_mesa";
          return { mesa_id: mesaId!, user_id: userId, role: role as any };
        });

        const { error } = await supabase.from("mesa_members").insert(rows);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(isEdit ? "Mesa atualizada." : "Mesa criada.");
      setOpen(false);
      if (!isEdit) {
        setName("");
        setDay("");
        setTime("");
        setLocation("");
        setDescription("");
        setLeaders([]);
      }
      void qc.invalidateQueries({ queryKey: ["mesas-full"] });
      void qc.invalidateQueries({ queryKey: ["mesas-by-rede"] });
      void qc.invalidateQueries({ queryKey: ["redes-full"] });
      void qc.invalidateQueries({ queryKey: ["mesas"] });
      void qc.invalidateQueries({ queryKey: ["mesa-members", mesa?.id] });
      void qc.invalidateQueries({ queryKey: ["mesa-leaders", mesa?.id] });
      void qc.invalidateQueries({ queryKey: ["group-stats"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) resetToInitial();
      }}
    >
      <DialogTrigger asChild>
        {trigger ??
          (compact ? (
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4" /> Nova mesa nesta rede
            </Button>
          ) : (
            <Button>
              <Plus className="h-4 w-4" /> Nova mesa
            </Button>
          ))}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-3xl">
            {isEdit ? "Editar mesa" : "Nova mesa"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Mesa Betel"
            />
          </div>
          <ChurchSelect value={churchId} onChange={setChurchId} />
          <div className="space-y-2">
            <Label>Rede</Label>
            <Select value={rede} onValueChange={setRede} disabled={Boolean(redeId) && !isEdit}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a rede" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {redes?.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Líderes da mesa</Label>
            <MemberPicker value={leaders} onChange={setLeaders} label="líder(es)" />
            <p className="text-xs text-muted-foreground">
              Geralmente um casal. Selecione uma ou mais pessoas da lista de membros. Ao selecionar,
              elas serão definidas como líderes desta mesa.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Dia</Label>
              <Select value={day} onValueChange={setDay}>
                <SelectTrigger>
                  <SelectValue placeholder="Dia" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Horário</Label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Ponto de referência ou descrição do local</Label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Casa da família Silva"
            />
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="resize-none"
            />
          </div>

          {isEdit && (
            <div className="pt-4 border-t border-border/40">
              <AddressManager mesaId={mesa!.id} />
            </div>
          )}

          <Button className="w-full" disabled={save.isPending} onClick={() => save.mutate()}>
            {isEdit ? "Salvar alterações" : "Criar mesa"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Atalho de edição usado nas listagens de mesas. */
export function EditMesaButton({ mesa }: { mesa: MesaRecord }) {
  return (
    <MesaDialog
      mesa={mesa}
      trigger={
        <Button variant="ghost" size="icon" aria-label="Editar mesa">
          <Pencil className="h-4 w-4" />
        </Button>
      }
    />
  );
}

/** Gerencia os integrantes de uma mesa: membros, líderes, apascentadores e pastores. */
export function MesaMembersDialog({ mesaId, mesaName }: { mesaId: string; mesaName: string }) {
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<ChurchFunction>("membro");
  const { data: profiles } = useProfileOptions();
  const qc = useQueryClient();

  const { data: members } = useQuery({
    queryKey: ["mesa-members", mesaId],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mesa_members")
        .select("id, user_id, role, profiles:profiles!inner(full_name)")
        .eq("mesa_id", mesaId);
      if (error) throw error;
      const rows = data as unknown as {
        id: string;
        user_id: string;
        role: string;
        profiles: { full_name: string };
      }[];
      return rows.sort(
        (a, b) =>
          churchFunctionRank(a.role) - churchFunctionRank(b.role) ||
          a.profiles.full_name.localeCompare(b.profiles.full_name),
      );
    },
  });

  const add = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("Selecione a pessoa.");
      const { error } = await supabase
        .from("mesa_members")
        .insert({ mesa_id: mesaId, user_id: userId, role });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Integrante adicionado à mesa.");
      setUserId("");
      void qc.invalidateQueries({ queryKey: ["mesa-members", mesaId] });
      void qc.invalidateQueries({ queryKey: ["group-stats"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const changeRole = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: ChurchFunction }) => {
      const { error } = await supabase.from("mesa_members").update({ role: value }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["mesa-members", mesaId] });
      void qc.invalidateQueries({ queryKey: ["group-stats"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("mesa_members").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["mesa-members", mesaId] });
      void qc.invalidateQueries({ queryKey: ["group-stats"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="h-4 w-4" /> Integrantes
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-3xl">{mesaName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Adicionar pessoa</Label>
            <div className="grid sm:grid-cols-[1fr_auto] gap-2">
              <Select value={userId} onValueChange={setUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {profiles?.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={role} onValueChange={(v) => setRole(v as ChurchFunction)}>
                <SelectTrigger className="sm:w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHURCH_FUNCTIONS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" disabled={add.isPending} onClick={() => add.mutate()}>
              Adicionar
            </Button>
          </div>
          <ul className="divide-y divide-border">
            {members?.map((m) => (
              <li key={m.id} className="py-2 flex items-center justify-between gap-2 text-sm">
                <span className="min-w-0 truncate">{m.profiles?.full_name}</span>
                <div className="flex items-center gap-2">
                  <Select
                    value={m.role}
                    onValueChange={(v) =>
                      changeRole.mutate({ id: m.id, value: v as ChurchFunction })
                    }
                  >
                    <SelectTrigger className="h-8 w-40 text-xs">
                      <SelectValue>{CHURCH_FUNCTION_LABEL[m.role]}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {CHURCH_FUNCTIONS.map((f) => (
                        <SelectItem key={f.value} value={f.value}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Remover"
                    onClick={() => remove.mutate(m.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
            {members?.length === 0 && (
              <li className="py-3 text-sm text-muted-foreground">Nenhum integrante ainda.</li>
            )}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}
