import { cloneElement, isValidElement, useId, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldLabelContext } from "@/components/ui/field-label-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4">
      <h3 className="font-mono text-[10px] uppercase tracking-widest text-primary border-b border-border pb-2">
        {title}
      </h3>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: ReactNode;
  full?: boolean;
}) {
  const gerado = useId();
  const campo = isValidElement(children) ? children : null;
  const id = (campo?.props as { id?: string } | undefined)?.id ?? gerado;
  return (
    <div className={full ? "sm:col-span-2 space-y-2" : "space-y-2"}>
      <Label
        id={`${id}-rotulo`}
        htmlFor={campo ? id : undefined}
        className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground"
      >
        {label}
      </Label>
      <FieldLabelContext.Provider value={`${id}-rotulo`}>
        {campo ? cloneElement(campo, { id } as never) : children}
      </FieldLabelContext.Provider>
    </div>
  );
}

export function TextField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  full,
  maxLength = 200,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  full?: boolean;
  maxLength?: number;
}) {
  return (
    <Field label={label} full={full}>
      <Input
        type={type}
        value={value}
        placeholder={placeholder}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
      />
    </Field>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  full,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly { value: string; label: string }[];
  full?: boolean;
}) {
  return (
    <Field label={label} full={full}>
      <Select value={value || "__none"} onValueChange={(v) => onChange(v === "__none" ? "" : v)}>
        <SelectTrigger>
          <SelectValue placeholder="Selecionar..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none">Não informado</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}
