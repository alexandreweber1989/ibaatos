import { cloneElement, isValidElement, useEffect, useId, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { Baby, Check, Download, Loader2, ShieldCheck, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { FieldLabelContext } from "@/components/ui/field-label-context";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GUARDIAN_RELATIONS, KIDS_CLASSROOMS, suggestClassroom } from "@/lib/kids";

export const Route = createFileRoute("/kids/visitante")({
  validateSearch: z.object({ kiosk: z.coerce.boolean().optional() }),
  head: () => ({
    meta: [
      { title: "Cadastro do Kids para visitantes | IB Atos" },
      {
        name: "description",
        content:
          "Cadastre seu filho no Ministério Infantil da Igreja Batista Atos em menos de um minuto.",
      },
      { property: "og:title", content: "Cadastro do Kids para visitantes | IB Atos" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: VisitorPage,
});

const schema = z.object({
  guardian_full_name: z.string().trim().min(3, "Informe o nome completo do responsável").max(120),
  guardian_phone: z
    .string()
    .trim()
    .refine((v) => v.replace(/\D/g, "").length >= 10, "Informe o telefone com DDD"),
  guardian_relation: z.string().min(1),
  guardian_document: z.string().trim().max(40).optional().or(z.literal("")),
  child_full_name: z.string().trim().min(3, "Informe o nome completo da criança").max(120),
  child_nickname: z.string().trim().max(60).optional().or(z.literal("")),
  birth_date: z.string().optional().or(z.literal("")),
  classroom: z.string().min(1),
  allergies: z.string().trim().max(500).optional().or(z.literal("")),
  health_notes: z.string().trim().max(500).optional().or(z.literal("")),
  special_needs: z.string().trim().max(500).optional().or(z.literal("")),
  other_pickup: z.string().trim().max(300).optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
  photo_consent: z.boolean(),
});

type FormState = z.infer<typeof schema>;

const EMPTY: FormState = {
  guardian_full_name: "",
  guardian_phone: "",
  guardian_relation: "mae",
  guardian_document: "",
  child_full_name: "",
  child_nickname: "",
  birth_date: "",
  classroom: "nao_definida",
  allergies: "",
  health_notes: "",
  special_needs: "",
  other_pickup: "",
  notes: "",
  photo_consent: false,
};

function VisitorPage() {
  const { kiosk } = Route.useSearch();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [knownChildId, setKnownChildId] = useState<string | null>(null);
  const [known, setKnown] = useState<{ child_id: string; first_name: string }[]>([]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  useEffect(() => {
    if (!done || !kiosk) return;
    const t = setTimeout(() => reset(), 10000);
    return () => clearTimeout(t);
  }, [done, kiosk]);

  function reset() {
    setForm(EMPTY);
    setKnown([]);
    setKnownChildId(null);
    setDone(false);
  }

  async function lookupPhone(phone: string) {
    if (phone.replace(/\D/g, "").length < 10) return;
    const { data, error } = await supabase.rpc("kids_find_family_by_phone", { _phone: phone });
    if (error || !data?.length) return;
    setKnown(data as { child_id: string; first_name: string }[]);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Confira os dados informados.");
      return;
    }
    const v = parsed.data;
    setSaving(true);

    try {
      let documentUrl = null;
      const fileInput = document.getElementById("doc-upload") as HTMLInputElement;
      const file = fileInput?.files?.[0];

      if (file) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `visitors/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("kids-documents-v2")
          .upload(filePath, file);

        if (uploadError) {
          console.error("Erro no upload:", uploadError);
          toast.error("Erro ao enviar documento, mas continuaremos com o cadastro.");
        } else {
          documentUrl = filePath;
        }
      }

      const response = await fetch("/api/public/kids-visitor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          child_id: knownChildId,
          child_full_name: v.child_full_name,
          child_nickname: v.child_nickname || null,
          birth_date: v.birth_date || null,
          classroom: v.classroom,
          allergies: v.allergies || null,
          health_notes: v.health_notes || null,
          special_needs: v.special_needs || null,
          photo_consent: v.photo_consent,
          guardian_full_name: v.guardian_full_name,
          guardian_phone: v.guardian_phone,
          guardian_relation: v.guardian_relation,
          guardian_document: v.guardian_document || null,
          document_url: documentUrl,
          other_pickup: v.other_pickup || null,
          notes: v.notes || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Erro desconhecido" }));
        throw new Error(errorData.error || "Falha na requisição");
      }

      setDone(true);
    } catch (error: any) {
      console.error("Erro ao enviar cadastro:", error);
      toast.error(error.message || "Não foi possível enviar.");
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return (
      <main className="min-h-screen grid place-items-center px-6 py-16 bg-background">
        <div className="max-w-md text-center">
          <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 grid place-items-center">
            <Check className="h-7 w-7 text-primary" />
          </div>
          <h1 className="font-serif text-3xl mt-6">Cadastro enviado</h1>
          <p className="text-muted-foreground mt-3">
            Agora é só chegar no balcão do Kids com um documento seu.
          </p>
          <Button variant="outline" className="mt-8" onClick={reset}>
            Cadastrar outra criança
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-yellow-50 px-4 sm:px-5 py-6 sm:py-10 font-kids selection:bg-pink-200 selection:text-pink-900">
      <div className="mx-auto w-full max-w-xl lg:max-w-4xl xl:max-w-5xl">
        <header className="relative text-center bg-white rounded-3xl sm:rounded-[3rem] p-6 sm:p-10 lg:p-16 border-4 border-yellow-200 shadow-xl mb-6 sm:mb-10 overflow-hidden">
          <Baby className="h-8 w-8 text-primary mx-auto lg:h-12 lg:w-12" />
          <h1 className="text-2xl sm:text-4xl lg:text-5xl mt-4 font-bold text-yellow-600 tracking-tight">
            Bem-vindo ao Kids! 🎨
          </h1>
          <p className="text-sm sm:text-lg lg:text-xl mt-4 lg:mt-6 text-muted-foreground leading-relaxed">
            Estamos muito felizes em ter vocês aqui!
          </p>
        </header>

        <form
          onSubmit={submit}
          className="space-y-6 sm:space-y-8 bg-white rounded-3xl sm:rounded-[3rem] p-6 sm:p-12 lg:p-20 border-4 border-blue-100 shadow-2xl relative"
        >
          <section className="space-y-4">
            <h2 className="text-xl font-bold">1. Responsável</h2>
            <Field label="Telefone com DDD">
              <Input
                inputMode="tel"
                value={form.guardian_phone}
                onChange={(e) => set("guardian_phone", e.target.value)}
                onBlur={(e) => void lookupPhone(e.target.value)}
                placeholder="(11) 99999-0000"
                required
              />
            </Field>

            <Field label="Nome completo do responsável">
              <Input
                value={form.guardian_full_name}
                onChange={(e) => set("guardian_full_name", e.target.value)}
                required
              />
            </Field>

            <Field label="Parentesco">
              <Select
                value={form.guardian_relation}
                onValueChange={(v) => set("guardian_relation", v)}
              >
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
            </Field>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold">2. Criança</h2>
            <Field label="Nome completo da criança">
              <Input
                value={form.child_full_name}
                onChange={(e) => set("child_full_name", e.target.value)}
                required
              />
            </Field>
            <Field label="Data de nascimento">
              <Input
                type="date"
                value={form.birth_date}
                onChange={(e) => {
                  set("birth_date", e.target.value);
                  if (e.target.value) set("classroom", suggestClassroom(e.target.value));
                }}
              />
            </Field>
            <Field label="Turma">
              <Select value={form.classroom} onValueChange={(v) => set("classroom", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KIDS_CLASSROOMS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold">3. Documento e Termos</h2>
            <div className="space-y-2">
              <Label htmlFor="doc-upload">Documento da Criança (Foto ou PDF)</Label>
              <Input id="doc-upload" type="file" accept="image/*,.pdf" />
            </div>

            <label className="flex items-start gap-3 cursor-pointer mt-4">
              <Checkbox
                checked={form.photo_consent}
                onCheckedChange={(v) => set("photo_consent", v === true)}
              />
              <span className="text-sm text-muted-foreground">
                Autorizo o uso de fotos da criança.
              </span>
            </label>
          </section>

          <Button type="submit" className="w-full h-14 text-xl" disabled={saving}>
            {saving ? <Loader2 className="animate-spin" /> : "Finalizar Cadastro"}
          </Button>
        </form>
      </div>
    </main>
  );
}

/**
 * Liga o rotulo ao campo automaticamente.
 *
 * Sem `htmlFor`/`id` o leitor de tela anuncia "campo de edicao" sem dizer de
 * que, e tocar no rotulo nao foca o campo -- o que ajuda qualquer pessoa, e
 * especialmente quem tem menos firmeza na mao. O id sai de `useId`, entao
 * nenhum ponto de uso precisa mudar.
 */
function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  const gerado = useId();
  const campo = isValidElement(children) ? children : null;
  const id = (campo?.props as { id?: string } | undefined)?.id ?? gerado;
  const idDoRotulo = `${id}-rotulo`;
  return (
    <div className="space-y-2">
      <Label id={idDoRotulo} htmlFor={campo ? id : undefined}>
        {label}
      </Label>
      <FieldLabelContext.Provider value={idDoRotulo}>
        {campo ? cloneElement(campo, { id } as never) : children}
      </FieldLabelContext.Provider>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
