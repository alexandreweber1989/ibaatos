import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { slugify, useProfileOptions } from "@/lib/use-profiles";
import { ChurchSelect } from "./church-select";
import { MemberPicker } from "./member-picker";

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

export interface MinistryRecord {
  id: string;
  name: string;
  church_id?: string | null;
  description?: string | null;
  meeting_info?: string | null;
}

/**
 * Criação e edição de ministérios (admin geral).
 * Quando `ministry` é informado, o diálogo entra em modo de edição.
 */
export function MinistryDialog({
  ministry,
  trigger,
}: {
  ministry?: MinistryRecord;
  trigger?: React.ReactNode;
}) {
  const isEdit = Boolean(ministry?.id);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(ministry?.name ?? "");
  const [churchId, setChurchId] = useState(ministry?.church_id ?? "");
  const [description, setDescription] = useState(ministry?.description ?? "");
  const [meetingInfo, setMeetingInfo] = useState(ministry?.meeting_info ?? "");
  const [leaders, setLeaders] = useState<string[]>([]);
  const qc = useQueryClient();

  // Responsáveis atuais do ministério (função "Responsável") — só no modo edição.
  const { data: currentLeaders } = useQuery({
    queryKey: ["ministry-leaders", ministry?.id],
    enabled: open && isEdit,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ministry_members")
        .select("user_id, function_name")
        .eq("ministry_id", ministry!.id);
      if (error) throw error;
      return (data ?? [])
        .filter((r) => (r.function_name ?? "").toLowerCase().startsWith("respons"))
        .map((r) => r.user_id);
    },
  });

  useEffect(() => {
    if (open && isEdit && currentLeaders) setLeaders(currentLeaders);
  }, [open, isEdit, currentLeaders]);

  function resetToInitial() {
    setName(ministry?.name ?? "");
    setChurchId(ministry?.church_id ?? "");
    setDescription(ministry?.description ?? "");
    setMeetingInfo(ministry?.meeting_info ?? "");
    setLeaders(isEdit ? (currentLeaders ?? []) : []);
  }

  const save = useMutation({
    mutationFn: async () => {
      if (name.trim().length < 3) throw new Error("Informe o nome do ministério.");
      if (!churchId) throw new Error("Selecione a igreja deste ministério.");
      const payload = {
        name: name.trim(),
        slug: slugify(name),
        church_id: churchId,
        description: description.trim() || null,
        meeting_info: meetingInfo.trim() || null,
      };

      let ministryId = ministry?.id;
      if (isEdit) {
        const { error } = await supabase.from("ministries").update(payload).eq("id", ministry!.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("ministries")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        ministryId = data?.id;
      }
      if (!ministryId) return;

      // Sincroniza responsáveis: remove quem saiu, insere quem entrou.
      const previous = isEdit ? (currentLeaders ?? []) : [];
      const removed = previous.filter((id) => !leaders.includes(id));
      const added = leaders.filter((id) => !previous.includes(id));

      if (removed.length > 0) {
        const { error } = await supabase
          .from("ministry_members")
          .delete()
          .eq("ministry_id", ministryId)
          .in("user_id", removed);
        if (error) throw error;
      }
      if (added.length > 0) {
        const rows = added.map((userId) => ({
          ministry_id: ministryId!,
          user_id: userId,
          function_name: "Responsável",
        }));
        const { error } = await supabase.from("ministry_members").insert(rows);
        if (error) throw error;
      }
    },

    onSuccess: () => {
      toast.success(isEdit ? "Ministério atualizado." : "Ministério criado.");
      setOpen(false);
      if (!isEdit) {
        setName("");
        setDescription("");
        setMeetingInfo("");
        setLeaders([]);
      }
      void qc.invalidateQueries({ queryKey: ["ministries"] });
      void qc.invalidateQueries({ queryKey: ["ministry"] });
      void qc.invalidateQueries({ queryKey: ["ministry-members", ministry?.id] });
      void qc.invalidateQueries({ queryKey: ["ministry-leaders", ministry?.id] });
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
        {trigger ?? (
          <Button>
            <Plus className="h-4 w-4" /> Novo ministério
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-3xl">
            {isEdit ? "Editar ministério" : "Novo ministério"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ministério de Louvor"
            />
          </div>
          <ChurchSelect value={churchId} onChange={setChurchId} />

          <div className="space-y-2">
            <Label>Responsáveis pelo ministério</Label>
            <MemberPicker value={leaders} onChange={setLeaders} />
            <p className="text-xs text-muted-foreground">
              Geralmente um casal. Selecione uma ou mais pessoas da lista de membros.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Encontros</Label>
            <Input
              value={meetingInfo}
              onChange={(e) => setMeetingInfo(e.target.value)}
              placeholder="Sábados, 19h — Templo"
            />
          </div>
          <Button className="w-full" disabled={save.isPending} onClick={() => save.mutate()}>
            {isEdit ? "Salvar alterações" : "Criar ministério"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Atalho de edição usado na listagem de ministérios. */
export function EditMinistryButton({ ministry }: { ministry: MinistryRecord }) {
  return (
    <MinistryDialog
      ministry={ministry}
      trigger={
        <Button variant="ghost" size="icon" aria-label="Editar ministério">
          <Pencil className="h-4 w-4" />
        </Button>
      }
    />
  );
}

/** Adiciona um servo ao ministério, com função opcional. */
export function MinistryMemberDialog({ ministryId }: { ministryId: string }) {
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState("");
  const [fn, setFn] = useState("");
  const { data: profiles } = useProfileOptions();
  const qc = useQueryClient();

  const add = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("Selecione a pessoa.");
      const { error } = await supabase
        .from("ministry_members")
        .insert({ ministry_id: ministryId, user_id: userId, function_name: fn.trim() || null });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Servo adicionado ao ministério.");
      setOpen(false);
      setUserId("");
      setFn("");
      void qc.invalidateQueries({ queryKey: ["ministry-members", ministryId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="h-4 w-4" /> Adicionar servo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-3xl">Adicionar servo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Pessoa</Label>
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
          </div>
          <div className="space-y-2">
            <Label>Função</Label>
            <Input
              value={fn}
              onChange={(e) => setFn(e.target.value)}
              placeholder="Coordenador(a)"
            />
          </div>
          <Button className="w-full" disabled={add.isPending} onClick={() => add.mutate()}>
            Adicionar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
