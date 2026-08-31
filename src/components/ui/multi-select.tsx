import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
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

export interface MultiSelectOption {
  value: string;
  label: string;
}

export interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onValueChange: (value: string[]) => void;
  placeholder?: string;
}

/**
 * Seletor múltiplo genérico baseado no padrão do MemberPicker,
 * mas para qualquer lista de opções (id/label).
 */
export function MultiSelect({
  options,
  value,
  onValueChange,
  placeholder = "Selecione as opções...",
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);

  const selected = useMemo(() => options.filter((o) => value.includes(o.value)), [options, value]);

  const toggle = (val: string) =>
    onValueChange(value.includes(val) ? value.filter((v) => v !== val) : [...value, val]);

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
              {selected.length === 0 ? placeholder : `${selected.length} selecionado(s)`}
            </span>
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <CommandInput placeholder="Filtrar..." />
            <CommandList>
              <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
              <CommandGroup>
                {options.map((o) => (
                  <CommandItem key={o.value} value={o.label} onSelect={() => toggle(o.value)}>
                    <Check
                      className={cn(
                        "h-4 w-4",
                        value.includes(o.value) ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <span className="truncate">{o.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selected.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {selected.map((o) => (
            <li
              key={o.value}
              className="flex items-center gap-2 border border-border bg-muted/40 rounded-sm px-2 py-1 text-xs"
            >
              <span>{o.label}</span>
              <button
                type="button"
                aria-label={`Remover ${o.label}`}
                className="text-muted-foreground hover:text-foreground"
                onClick={() => toggle(o.value)}
              >
                <X className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
