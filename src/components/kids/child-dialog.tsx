import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Baby, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { ChurchSelect } from "@/components/admin/church-select";
import { KIDS_CLASSROOMS, suggestClassroom, type KidsChild } from "@/lib/kids";
import { PhotoInput } from "@/components/kids/photo-input";
import {
  GuardiansEditor,
  emptyGuardian,
  type GuardianDraft,
} from "@/components/kids/guardians-editor";

interface ChildDialogProps {
  child?: KidsChild;
  trigger?: React.ReactNode;
}

interface ChildForm {
  full_name: string;
  nickname: string;
  birth_date: string;
  gender: string;
  classroom: string;
  church_id: string;
  allergies: string;
  health_notes: string;
  special_needs: string;
  notes: string;
  photo_consent: boolean;
  can_leave_alone: boolean;
  photo_url: string;
  is_active: boolean;
}

function initialForm(child?: KidsChild): ChildForm {
  return {
    full_name: child?.full_name ?? "",
    nickname: child?.nickname ?? "",
    birth_date: child?.birth_date ?? "",
    gender: child?.gender ?? "",
    classroom: child?.classroom ?? "nao_definida",
    church_id: child?.church_id ?? "",
    allergies: child?.allergies ?? "",
    health_notes: child?.health_notes ?? "",
    special_needs: child?.special_needs ?? "",
    notes: child?.notes ?? "",
    photo_consent: child?.photo_consent ?? false,
    can_leave_alone: child?.can_leave_alone ?? false,
    photo_url: child?.photo_url ?? "",
    is_active: child?.is_active ?? true,
  };
}

/** Cadastro/edição de criança, com responsáveis e informações de saúde. */
export function ChildDialog({ child, trigger }: ChildDialogProps) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ChildForm>(() => initialForm(child));
  const [guardians, setGuardians] = useState<GuardianDraft[]>([]);

  const set = <K extends keyof ChildForm>(key: K, value: ChildForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  useEffect(() => {
    if (!open) return;
    setForm(initialForm(child));
    if (!child) {
      setGuardians([{ ...emptyGuardian(), is_primary: true }]);
      return;
    }
    void supabase
      .from("kids_guardians")
      .select("*")
      .eq("child_id", child.id)
      .order("is_primary", { ascending: false })
      .then(({ data }) =>
        setGuardians(
          (data ?? []).map((g) => ({
            id: g.id,
            profile_id: g.profile_id,
            full_name: g.full_name,
            phone: g.phone ?? "",
            relation: g.relation,
            is_primary: g.is_primary,
            can_pickup: g.can_pickup,
            document: g.document ?? "",
            photo_url: g.photo_url ?? "",
          })),
        ),
      );
  }, [open, child]);

  const save = useMutation({
    mutationFn: async () => {
      const name = form.full_name.trim();
      if (!name) throw new Error("Informe o nome da criança.");
      const validGuardians = guardians.filter((g) => g.full_name.trim());
      if (validGuardians.length === 0)
        throw new Error("Cadastre pelo menos um responsável pela criança.");

      const payload = {
        full_name: name,
        nickname: form.nickname.trim() || null,
        birth_date: form.birth_date || null,
        gender: form.gender || null,
        classroom: form.classroom,
        church_id: form.church_id || null,
        allergies: form.allergies.trim() || null,
        health_notes: form.health_notes.trim() || null,
        special_needs: form.special_needs.trim() || null,
        notes: form.notes.trim() || null,
        photo_consent: form.photo_consent,
        photo_url: form.photo_url.trim() || null,
        can_leave_alone: form.can_leave_alone,
        is_active: form.is_active,
      };

      let childId = child?.id;
      if (childId) {
        const { error } = await supabase.from("kids_children").update(payload).eq("id", childId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("kids_children")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        childId = data.id;
      }

      // Sincroniza responsáveis: remove os apagados e regrava os atuais.
      const keptIds = validGuardians.map((g) => g.id).filter(Boolean) as string[];
      let del = supabase.from("kids_guardians").delete().eq("child_id", childId);
      if (keptIds.length > 0) del = del.not("id", "in", `(${keptIds.join(",")})`);
      const { error: delError } = await del;
      if (delError) throw delError;

      const rows = validGuardians.map((g) => ({
        ...(g.id ? { id: g.id } : {}),
        child_id: childId!,
        profile_id: g.profile_id,
        full_name: g.full_name.trim(),
        phone: g.phone.trim() || null,
        relation: g.relation,
        is_primary: g.is_primary,
        can_pickup: g.can_pickup,
        document: g.document.trim() || null,
        photo_url: g.photo_url.trim() || null,
      }));
      const { error: upError } = await supabase.from("kids_guardians").upsert(rows);
      if (upError) throw upError;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["kids-children"] });
      void qc.invalidateQueries({ queryKey: ["kids-checkins"] });
      toast.success(child ? "Cadastro atualizado." : "Criança cadastrada.");
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Plus className="h-4 w-4" /> Nova criança
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Baby className="h-5 w-5 text-primary" />
            {child ? "Editar criança" : "Cadastrar criança"}
          </DialogTitle>
          <DialogDescription>
            Os dados de saúde e os responsáveis aparecem na etiqueta e na retirada.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Nome completo</Label>
              <Input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Como é chamada</Label>
              <Input value={form.nickname} onChange={(e) => set("nickname", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Data de nascimento</Label>
              <Input
                type="date"
                value={form.birth_date}
                onChange={(e) => {
                  set("birth_date", e.target.value);
                  if (!child) set("classroom", suggestClassroom(e.target.value));
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Sexo</Label>
              <Select value={form.gender} onValueChange={(v) => set("gender", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="masculino">Masculino</SelectItem>
                  <SelectItem value="feminino">Feminino</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Turma</Label>
              <Select value={form.classroom} onValueChange={(v) => set("classroom", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KIDS_CLASSROOMS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label} · {c.hint}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <ChurchSelect value={form.church_id} onChange={(v) => set("church_id", v)} />
            <PhotoInput
              label="Foto da criança"
              value={form.photo_url}
              onChange={(v) => set("photo_url", v)}
              folder="criancas"
              variant="crianca"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Alergias</Label>
              <Textarea
                rows={2}
                value={form.allergies}
                onChange={(e) => set("allergies", e.target.value)}
                placeholder="Ex.: amendoim, leite, corante"
              />
            </div>
            <div className="space-y-2">
              <Label>Observações de saúde</Label>
              <Textarea
                rows={2}
                value={form.health_notes}
                onChange={(e) => set("health_notes", e.target.value)}
                placeholder="Medicação, condições, cuidados"
              />
            </div>
            <div className="space-y-2">
              <Label>Necessidades específicas</Label>
              <Textarea
                rows={2}
                value={form.special_needs}
                onChange={(e) => set("special_needs", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Observações gerais</Label>
              <Textarea
                rows={2}
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm">
              <Switch
                checked={form.photo_consent}
                onCheckedChange={(v) => set("photo_consent", v)}
              />
              Autoriza uso de imagem
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Switch
                checked={form.can_leave_alone}
                onCheckedChange={(v) => set("can_leave_alone", v)}
              />
              Pode sair sozinha
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={form.is_active} onCheckedChange={(v) => set("is_active", v)} />
              Cadastro ativo
            </label>
          </div>

          <GuardiansEditor value={guardians} onChange={setGuardians} />
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

export function EditChildButton({ child }: { child: KidsChild }) {
  return (
    <ChildDialog
      child={child}
      trigger={
        <Button variant="ghost" size="sm">
          <Pencil className="h-3.5 w-3.5" /> Editar
        </Button>
      }
    />
  );
}
