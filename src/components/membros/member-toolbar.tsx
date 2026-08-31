import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AGE_BANDS, GENDERS, MEMBERSHIP_STATUS } from "@/lib/membros";

export interface MemberFilters {
  q: string;
  status: string;
  gender: string;
  age: string;
  baptized: string;
  birthday: string;
  sort: string;
}

export const DEFAULT_FILTERS: MemberFilters = {
  q: "",
  status: "all",
  gender: "all",
  age: "all",
  baptized: "all",
  birthday: "all",
  sort: "name",
};

function Picker({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: readonly { value: string; label: string }[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[170px]">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{placeholder}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Barra de busca, filtros e ordenação da listagem de membros. */
export function MemberToolbar({
  filters,
  onChange,
  onExport,
  view,
  onViewChange,
  count,
}: {
  filters: MemberFilters;
  onChange: (f: MemberFilters) => void;
  onExport: () => void;
  view: "table" | "cards";
  onViewChange: (v: "table" | "cards") => void;
  count: number;
}) {
  const set = (patch: Partial<MemberFilters>) => onChange({ ...filters, ...patch });
  const dirty = JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS);

  return (
    <div className="space-y-3 mb-6 bg-card/50 p-4 rounded-xl border border-border/50 backdrop-blur-sm shadow-sm transition-all duration-300 hover:shadow-md">
      <div className="flex flex-col lg:flex-row flex-wrap gap-2 lg:items-center">
        <Input
          className="w-full sm:w-72"
          placeholder="Buscar por nome, e-mail, telefone ou cidade..."
          value={filters.q}
          onChange={(e) => set({ q: e.target.value })}
        />
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
          <Picker
            value={filters.status}
            onChange={(v) => set({ status: v })}
            placeholder="Situação"
            options={MEMBERSHIP_STATUS}
          />
          <Picker
            value={filters.gender}
            onChange={(v) => set({ gender: v })}
            placeholder="Sexo"
            options={GENDERS}
          />
        </div>
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
          <Picker
            value={filters.age}
            onChange={(v) => set({ age: v })}
            placeholder="Faixa etária"
            options={AGE_BANDS.map((b) => ({ value: b.value, label: b.label }))}
          />
          <Picker
            value={filters.baptized}
            onChange={(v) => set({ baptized: v })}
            placeholder="Batismo"
            options={[
              { value: "yes", label: "Batizados" },
              { value: "no", label: "Não batizados" },
            ]}
          />
        </div>
        <Picker
          value={filters.birthday}
          onChange={(v) => set({ birthday: v })}
          placeholder="Aniversários"
          options={[{ value: "month", label: "Deste mês" }]}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mr-auto">
          {count} resultado{count === 1 ? "" : "s"}
        </span>
        <Picker
          value={filters.sort}
          onChange={(v) => set({ sort: v })}
          placeholder="Ordenar"
          options={[
            { value: "name", label: "Nome (A-Z)" },
            { value: "recent", label: "Cadastro recente" },
            { value: "age_asc", label: "Mais novos" },
            { value: "age_desc", label: "Mais velhos" },
          ]}
        />
        {dirty && (
          <Button variant="ghost" size="sm" onClick={() => onChange(DEFAULT_FILTERS)}>
            Limpar filtros
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={onExport} className="h-9 sm:h-10">
          Exportar CSV
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-9 sm:h-10"
          onClick={() => onViewChange(view === "table" ? "cards" : "table")}
        >
          {view === "table" ? "Ver em cards" : "Ver em tabela"}
        </Button>
      </div>
    </div>
  );
}
