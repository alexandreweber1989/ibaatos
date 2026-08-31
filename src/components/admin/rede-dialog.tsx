import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus } from "lucide-react";
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

export interface RedeRecord {
  id: string;
  name: string;
  church_id?: string | null;
  target_audience?: string | null;
  description?: string | null;
}

/**
 * Criação e edição de redes (somente admin geral, garantido também por RLS).
 * Quando `rede` é informado, o diálogo entra em modo de edição.
 */
export function RedeDialog({ rede, trigger }: { rede?: RedeRecord; trigger?: React.ReactNode }) {
  const isEdit = Boolean(rede?.id);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(rede?.name ?? "");
  const [churchId, setChurchId] = useState(rede?.church_id ?? "");
  const [audience, setAudience] = useState(rede?.target_audience ?? "");
  const [description, setDescription] = useState(rede?.description ?? "");
  const [leaders, setLeaders] = useState<string[]>([]);
  const { data: profiles } = useProfileOptions();
  const qc = useQueryClient();

  // Responsáveis atuais só são necessários no modo edição.
  const { data: currentLeaders } = useQuery({
    queryKey: ["rede-leaders", rede?.id],
    enabled: open && isEdit,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rede_members")
        .select("user_id, role")
        .eq("rede_id", rede!.id);
      if (error) throw error;
      return (data ?? []).filter((r) => r.role !== "membro").map((r) => r.user_id);
    },
  });

  useEffect(() => {
    if (open && isEdit && currentLeaders) setLeaders(currentLeaders);
  }, [open, isEdit, currentLeaders]);

  function resetToInitial() {
    setName(rede?.name ?? "");
    setChurchId(rede?.church_id ?? "");
    setAudience(rede?.target_audience ?? "");
    setDescription(rede?.description ?? "");
    setLeaders(isEdit ? (currentLeaders ?? []) : []);
  }

  const save = useMutation({
    mutationFn: async () => {
      if (name.trim().length < 3) throw new Error("Informe o nome da rede.");
      if (!churchId) throw new Error("Selecione a igreja desta rede.");

      const payload = {
        name: name.trim(),
        slug: slugify(name),
        church_id: churchId,
        target_audience: audience.trim() || null,
        description: description.trim() || null,
      };

      let redeId = rede?.id;
      if (isEdit) {
        const { error } = await supabase.from("redes").update(payload).eq("id", rede!.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("redes").insert(payload).select("id").single();
        if (error) throw error;
        redeId = data?.id;
      }
      if (!redeId) return;

      // Sincroniza os responsáveis: remove quem saiu, insere quem entrou.
      const previous = isEdit ? (currentLeaders ?? []) : [];
      const removed = previous.filter((id) => !leaders.includes(id));
      const added = leaders.filter((id) => !previous.includes(id));

      if (removed.length > 0) {
        const { error } = await supabase
          .from("rede_members")
          .delete()
          .eq("rede_id", redeId)
          .in("user_id", removed);
        if (error) throw error;
      }
      if (added.length > 0) {
        const rows = added.map((userId) => {
          const fn = profiles?.find((p) => p.id === userId)?.church_function;
          const role = fn && fn !== "membro" ? fn : "lider";
          return { rede_id: redeId!, user_id: userId, role: role as never };
        });
        const { error } = await supabase.from("rede_members").insert(rows);
        if (error) throw error;
      }
    },

    onSuccess: () => {
      toast.success(isEdit ? "Rede atualizada." : "Rede criada.");
      setOpen(false);
      if (!isEdit) {
        setName("");
        setAudience("");
        setDescription("");
        setLeaders([]);
      }
      void qc.invalidateQueries({ queryKey: ["redes"] });
      void qc.invalidateQueries({ queryKey: ["redes-full"] });
      void qc.invalidateQueries({ queryKey: ["rede-members-count"] });
      void qc.invalidateQueries({ queryKey: ["rede-leaders", rede?.id] });
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
            <Plus className="h-4 w-4" /> Nova rede
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-3xl">
            {isEdit ? "Editar rede" : "Nova rede"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Rede Jovens"
            />
          </div>
          <ChurchSelect value={churchId} onChange={setChurchId} />

          <div className="space-y-2">
            <Label>Público-alvo</Label>
            <Input
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="18 a 29 anos"
            />
          </div>
          <div className="space-y-2">
            <Label>
              Responsáveis pela rede{" "}
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                opcional
              </span>
            </Label>
            <MemberPicker value={leaders} onChange={setLeaders} />
            <p className="text-xs text-muted-foreground">
              Pastores, apascentadores ou líderes já cadastrados em Membros.
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

          <Button className="w-full" disabled={save.isPending} onClick={() => save.mutate()}>
            {isEdit ? "Salvar alterações" : "Criar rede"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Atalho de edição usado na listagem de redes. */
export function EditRedeButton({ rede }: { rede: RedeRecord }) {
  return (
    <RedeDialog
      rede={rede}
      trigger={
        <Button variant="outline" size="sm" aria-label="Editar rede">
          <Pencil className="h-4 w-4" /> Editar rede
        </Button>
      }
    />
  );
}
