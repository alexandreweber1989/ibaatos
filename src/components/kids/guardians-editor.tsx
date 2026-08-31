import { useState } from "react";
import { Plus, Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GUARDIAN_RELATIONS } from "@/lib/kids";
import { PhotoInput } from "@/components/kids/photo-input";
import { useProfileOptions } from "@/lib/use-profiles";
import { displayMemberName } from "@/lib/igreja";

export interface GuardianDraft {
  id?: string;
  profile_id: string | null;
  full_name: string;
  phone: string;
  relation: string;
  is_primary: boolean;
  can_pickup: boolean;
  document: string;
  photo_url: string;
}

export function emptyGuardian(): GuardianDraft {
  return {
    profile_id: null,
    full_name: "",
    phone: "",
    relation: "mae",
    is_primary: false,
    can_pickup: true,
    document: "",
    photo_url: "",
  };
}

interface GuardiansEditorProps {
  value: GuardianDraft[];
  onChange: (next: GuardianDraft[]) => void;
}

/**
 * Lista de responsáveis autorizados de uma criança.
 * Só quem estiver marcado como "pode retirar" aparece na hora do check-out,
 * que é o ponto crítico de segurança do módulo Kids.
 */
export function GuardiansEditor({ value, onChange }: GuardiansEditorProps) {
  const { data: profiles } = useProfileOptions();
  const [linking, setLinking] = useState<number | null>(null);

  const update = (index: number, patch: Partial<GuardianDraft>) =>
    onChange(value.map((g, i) => (i === index ? { ...g, ...patch } : g)));

  const setPrimary = (index: number) =>
    onChange(value.map((g, i) => ({ ...g, is_primary: i === index })));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Responsáveis autorizados</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...value, emptyGuardian()])}
        >
          <Plus className="h-3.5 w-3.5" /> Adicionar
        </Button>
      </div>

      {value.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Cadastre pelo menos um responsável — ele será quem entrega e retira a criança.
        </p>
      )}

      {value.map((g, index) => (
        <div
          key={g.id || `draft-${index}`}
          className="border border-border rounded-sm p-4 space-y-3 bg-muted/20"
        >
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs">Nome completo</Label>
              <Input
                value={g.full_name}
                onChange={(e) => update(index, { full_name: e.target.value })}
                placeholder="Nome do responsável"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Telefone / WhatsApp</Label>
              <Input
                value={g.phone}
                onChange={(e) => update(index, { phone: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Parentesco</Label>
              <Select value={g.relation} onValueChange={(v) => update(index, { relation: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GUARDIAN_RELATIONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Documento (RG/CPF)</Label>
              <Input
                value={g.document}
                onChange={(e) => update(index, { document: e.target.value })}
                placeholder="Opcional"
              />
            </div>
            <PhotoInput
              label="Foto do responsável"
              value={g.photo_url}
              onChange={(v) => update(index, { photo_url: v })}
              folder="responsaveis"
              variant="responsavel"
            />
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-xs">
              <Switch checked={g.is_primary} onCheckedChange={() => setPrimary(index)} />
              Responsável principal
            </label>
            <label className="flex items-center gap-2 text-xs">
              <Switch
                checked={g.can_pickup}
                onCheckedChange={(v) => update(index, { can_pickup: v })}
              />
              Pode retirar a criança
            </label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setLinking(linking === index ? null : index)}
            >
              <UserPlus className="h-3.5 w-3.5" />
              {g.profile_id ? "Vinculado a um membro" : "Vincular a um membro"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="ml-auto text-destructive"
              onClick={() => onChange(value.filter((_, i) => i !== index))}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>

          {linking === index && (
            <Select
              value={g.profile_id ?? ""}
              onValueChange={(v) => {
                const profile = (profiles ?? []).find((p) => p.id === v);
                update(index, {
                  profile_id: v,
                  full_name: profile ? profile.full_name : g.full_name,
                });
                setLinking(null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Escolha o membro cadastrado" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {(profiles ?? []).map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {displayMemberName(p.full_name, p.church_function, p.gender)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      ))}
    </div>
  );
}
