import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { CepInput } from "@/components/ui/cep-input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export interface ChurchDraft {
  id?: string;
  name: string;
  short_name: string;
  zip_code: string;
  city: string;
  state: string;
  address: string;
  street_number: string;
  neighborhood: string;
  phone: string;
  email: string;
  lead_pastor: string;
  is_headquarters: boolean;
  is_active: boolean;
  notes: string;
}

export const EMPTY_CHURCH: ChurchDraft = {
  name: "",
  short_name: "",
  zip_code: "",
  city: "",
  state: "",
  address: "",
  street_number: "",
  neighborhood: "",
  phone: "",
  email: "",
  lead_pastor: "",
  is_headquarters: false,
  is_active: true,
  notes: "",
};

/** Cadastro e edição de igrejas (sede e congregações em outras cidades). */
export function ChurchDialog({
  initial = EMPTY_CHURCH,
  trigger,
}: {
  initial?: ChurchDraft;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<ChurchDraft>(initial);
  const qc = useQueryClient();

  const save = useMutation({
    mutationFn: async () => {
      if (draft.name.trim().length < 3) throw new Error("Informe o nome da igreja.");
      const payload = {
        name: draft.name.trim(),
        short_name: draft.short_name.trim() || null,
        zip_code: draft.zip_code.trim() || null,
        city: draft.city.trim() || null,
        state: draft.state.trim() || null,
        address: draft.address.trim() || null,
        street_number: draft.street_number.trim() || null,
        neighborhood: draft.neighborhood.trim() || null,
        phone: draft.phone.trim() || null,
        email: draft.email.trim() || null,
        lead_pastor: draft.lead_pastor.trim() || null,
        is_headquarters: draft.is_headquarters,
        is_active: draft.is_active,
        notes: draft.notes.trim() || null,
      };
      const { error } = draft.id
        ? await supabase.from("churches").update(payload).eq("id", draft.id)
        : await supabase.from("churches").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Igreja salva.");
      setOpen(false);
      void qc.invalidateQueries({ queryKey: ["churches"] });
      void qc.invalidateQueries({ queryKey: ["churches-min"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setDraft(initial);
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="h-4 w-4" /> Nova igreja
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-3xl">
            {draft.id ? "Editar igreja" : "Nova igreja"}
          </DialogTitle>
          <DialogDescription>
            Cadastre a sede e as congregações em outras cidades para vincular os membros.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="Igreja Batista Atos — Sede"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Apelido</Label>
              <Input
                value={draft.short_name}
                onChange={(e) => setDraft({ ...draft, short_name: e.target.value })}
                placeholder="IB Atos"
              />
            </div>
            <div className="space-y-2">
              <Label>Pastor responsável</Label>
              <Input
                value={draft.lead_pastor}
                onChange={(e) => setDraft({ ...draft, lead_pastor: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-[1fr_100px] gap-4">
            <div className="space-y-2">
              <Label>Cidade</Label>
              <Input
                value={draft.city}
                onChange={(e) => setDraft({ ...draft, city: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>UF</Label>
              <Input
                maxLength={2}
                value={draft.state}
                onChange={(e) => setDraft({ ...draft, state: e.target.value.toUpperCase() })}
              />
            </div>
          </div>
          <div className="grid grid-cols-[160px_1fr] gap-4">
            <div className="space-y-2">
              <Label>CEP</Label>
              <CepInput
                value={draft.zip_code}
                onChange={(v) => setDraft((d) => ({ ...d, zip_code: v }))}
                onResolved={(a) =>
                  setDraft((d) => ({
                    ...d,
                    address: a.street || d.address,
                    neighborhood: a.neighborhood || d.neighborhood,
                    city: a.city || d.city,
                    state: a.state || d.state,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Endereço (rua)</Label>
              <Input
                value={draft.address}
                onChange={(e) => setDraft({ ...draft, address: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-[120px_1fr] gap-4">
            <div className="space-y-2">
              <Label>Número</Label>
              <Input
                value={draft.street_number}
                onChange={(e) => setDraft({ ...draft, street_number: e.target.value })}
                placeholder="123"
              />
            </div>
            <div className="space-y-2">
              <Label>Bairro</Label>
              <Input
                value={draft.neighborhood}
                onChange={(e) => setDraft({ ...draft, neighborhood: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input
                value={draft.phone}
                onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input
                type="email"
                value={draft.email}
                onChange={(e) => setDraft({ ...draft, email: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              rows={3}
              value={draft.notes}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-3">
            <Switch
              checked={draft.is_headquarters}
              onCheckedChange={(v) => setDraft({ ...draft, is_headquarters: v })}
            />
            <Label className="text-sm">É a sede</Label>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              checked={draft.is_active}
              onCheckedChange={(v) => setDraft({ ...draft, is_active: v })}
            />
            <Label className="text-sm">Ativa</Label>
          </div>
          <Button className="w-full" disabled={save.isPending} onClick={() => save.mutate()}>
            Salvar igreja
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Atalho de edição usado na listagem de igrejas. */
export function EditChurchButton({ church }: { church: any }) {
  return (
    <ChurchDialog
      initial={{
        id: church.id,
        name: church.name ?? "",
        short_name: church.short_name ?? "",
        zip_code: church.zip_code ?? "",
        city: church.city ?? "",
        state: church.state ?? "",
        address: church.address ?? "",
        street_number: church.street_number ?? "",
        neighborhood: church.neighborhood ?? "",
        phone: church.phone ?? "",
        email: church.email ?? "",
        lead_pastor: church.lead_pastor ?? "",
        is_headquarters: !!church.is_headquarters,
        is_active: !!church.is_active,
        notes: church.notes ?? "",
      }}
      trigger={
        <Button variant="ghost" size="icon" aria-label="Editar igreja">
          <Pencil className="h-4 w-4" />
        </Button>
      }
    />
  );
}
