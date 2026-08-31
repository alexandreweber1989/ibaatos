import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProfileOptions, type ProfileOption } from "@/lib/use-profiles";
import { CHURCH_FUNCTION_LABEL, displayMemberName } from "@/lib/igreja";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export interface MemberPickerProps {
  /** Ids já selecionados. */
  value: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
  label?: string;
}

function functionLabel(p: ProfileOption) {
  return p.church_function ? (CHURCH_FUNCTION_LABEL[p.church_function] ?? p.church_function) : null;
}

/**
 * Busca por parte do nome e devolve nome completo + função na igreja.
 * Seleção múltipla e opcional (pode ficar vazia).
 */
export function MemberPicker({
  value,
  onChange,
  placeholder = "Buscar por parte do nome",
  label = "responsável(is)",
}: MemberPickerProps) {
  const [open, setOpen] = useState(false);
  const { data: profiles, isLoading } = useProfileOptions();

  const selected = useMemo(
    () => (profiles ?? []).filter((p) => value.includes(p.id)),
    [profiles, value],
  );

  const toggle = (id: string) =>
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            <span className={cn("truncate", selected.length === 0 && "text-muted-foreground")}>
              {selected.length === 0 ? placeholder : `${selected.length} ${label} selecionado(s)`}
            </span>
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <CommandInput placeholder="Digite parte do nome..." />
            <CommandList>
              <CommandEmpty>
                {isLoading ? "Carregando..." : "Nenhum membro encontrado."}
              </CommandEmpty>
              <CommandGroup>
                {(profiles ?? []).map((p) => {
                  const fn = functionLabel(p);
                  return (
                    <CommandItem
                      key={p.id}
                      value={`${p.full_name} ${fn ?? ""}`}
                      onSelect={() => toggle(p.id)}
                    >
                      <Check
                        className={cn(
                          "h-4 w-4",
                          value.includes(p.id) ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <span className="truncate">
                        {displayMemberName(p.full_name, p.church_function, p.gender)}
                      </span>
                      {fn && (
                        <span className="ml-auto font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                          {fn}
                        </span>
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selected.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {selected.map((p) => {
            const fn = functionLabel(p);
            return (
              <li
                key={p.id}
                className="flex items-center gap-2 border border-border bg-muted/40 rounded-sm px-2 py-1 text-xs"
              >
                <span>{displayMemberName(p.full_name, p.church_function, p.gender)}</span>
                {fn && <span className="text-muted-foreground">· {fn}</span>}
                <button
                  type="button"
                  aria-label={`Remover ${p.full_name}`}
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => toggle(p.id)}
                >
                  <X className="h-3 w-3" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
