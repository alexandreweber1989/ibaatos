import { useEffect } from "react";
import { useChurchOptions, churchLabel } from "@/lib/use-igrejas";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ChurchSelectProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

/**
 * Seletor de igreja usado em todos os cadastros (ministérios, redes, mesas).
 * Preenche automaticamente com a sede quando ainda não há escolha.
 */
export function ChurchSelect({ value, onChange, label = "Igreja" }: ChurchSelectProps) {
  const { data: churches } = useChurchOptions();

  useEffect(() => {
    if (value || !churches?.length) return;
    const sede = churches.find((c) => c.is_headquarters) ?? churches[0];
    if (sede) onChange(sede.id);
  }, [churches, value, onChange]);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue
            placeholder={churches?.length ? "Selecione a igreja" : "Cadastre uma igreja primeiro"}
          />
        </SelectTrigger>
        <SelectContent className="max-h-60">
          {churches?.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {churchLabel(c)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
