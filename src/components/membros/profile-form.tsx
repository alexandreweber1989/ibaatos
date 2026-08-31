import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CepInput } from "@/components/ui/cep-input";
import { Field, Section, SelectField, TextField } from "./member-fields";
import { FamilyLinksEditor } from "./family-links-editor";
import { initialsOf } from "@/lib/membros";
import {
  BLOOD_TYPES,
  COURSE_OPTIONS,
  EDUCATION_LEVELS,
  GENDERS,
  MARITAL_STATUS,
  UFS,
} from "@/lib/membros";
import { cn } from "@/lib/utils";
import { Heart, HeartPulse, Home, Loader2, Save, Sparkles, User } from "lucide-react";

type ProfileData = Record<string, any>;

/** Somente o essencial é obrigatório: a ficha pastoral é preenchida aos poucos. */
const schema = z.object({
  full_name: z.string().trim().min(3, "Informe o nome completo").max(120),
  email: z.union([z.string().trim().email("E-mail inválido").max(255), z.literal("")]),
  phone: z.string().trim().max(30),
  children_count: z.number().int().min(0).max(30),
});

/** Campos considerados no indicador de preenchimento da ficha. */
const COMPLETION_FIELDS = [
  "full_name",
  "email",
  "phone",
  "birth_date",
  "gender",
  "marital_status",
  "profession",
  "zip_code",
  "street",
  "neighborhood",
  "city",
  "state",
  "emergency_contact_name",
  "emergency_contact_phone",
  "conversion_date",
  "gifts",
  "availability",
  "bio",
] as const;

export function ProfileForm({
  profile,
  userId,
}: {
  profile: ProfileData | null;
  /** Identificador do usuário logado — garante o salvamento mesmo sem ficha carregada. */
  userId: string | undefined;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState<ProfileData>({});

  useEffect(() => {
    if (profile) setForm({ ...profile });
  }, [profile]);

  const set = (key: string) => (value: unknown) => setForm((prev) => ({ ...prev, [key]: value }));
  const str = (key: string) => (form[key] ?? "") as string;

  const toggleCourse = (course: string, checked: boolean) => {
    const current: string[] = Array.isArray(form.courses) ? form.courses : [];
    setForm((prev) => ({
      ...prev,
      courses: checked ? [...current, course] : current.filter((c) => c !== course),
    }));
  };

  const completion = useMemo(() => {
    const filled = COMPLETION_FIELDS.filter((f) => {
      const v = form[f];
      return v !== null && v !== undefined && String(v).trim() !== "";
    }).length;
    return Math.round((filled / COMPLETION_FIELDS.length) * 100);
  }, [form]);

  const save = useMutation({
    mutationFn: async () => {
      const parsed = schema.safeParse({
        full_name: str("full_name"),
        email: str("email"),
        phone: str("phone"),
        children_count: Number(form.children_count ?? 0),
      });
      if (!parsed.success) throw new Error(parsed.error.issues[0].message);

      const targetId = (form.id as string) || (profile?.id as string) || userId;
      if (!targetId)
        throw new Error("Sessão não localizada. Recarregue a página e tente novamente.");

      // Texto/data em branco vira null para não sujar o banco.
      const clean = (v: unknown) => (v === "" || v === undefined ? null : v);
      const payload: Record<string, unknown> = {
        id: targetId,
        full_name: parsed.data.full_name,
        email: clean(parsed.data.email),
        phone: clean(parsed.data.phone),
        birth_date: clean(form.birth_date),
        gender: clean(form.gender),
        marital_status: clean(form.marital_status),
        spouse_name: clean(form.spouse_name),
        wedding_date: clean(form.wedding_date),
        father_name: clean(form.father_name),
        mother_name: clean(form.mother_name),
        profession: clean(form.profession),
        education: clean(form.education),
        cpf: clean(form.cpf),
        rg: clean(form.rg),
        zip_code: clean(form.zip_code),
        street: clean(form.street),
        street_number: clean(form.street_number),
        complement: clean(form.complement),
        neighborhood: clean(form.neighborhood),
        city: clean(form.city),
        state: clean(form.state),
        emergency_contact_name: clean(form.emergency_contact_name),
        emergency_contact_phone: clean(form.emergency_contact_phone),
        emergency_contact_relation: clean(form.emergency_contact_relation),
        conversion_date: clean(form.conversion_date),
        is_baptized: !!form.is_baptized,
        baptism_date: clean(form.baptism_date),
        baptism_church: clean(form.baptism_church),
        previous_church: clean(form.previous_church),
        courses: Array.isArray(form.courses) ? form.courses : [],
        gifts: clean(form.gifts),
        availability: clean(form.availability),
        allergies: clean(form.allergies),
        health_notes: clean(form.health_notes),
        blood_type: clean(form.blood_type),
        has_children: !!form.has_children,
        children_count: parsed.data.children_count,
        bio: clean(form.bio),
      };

      // Upsert cobre o caso de a ficha ainda não existir para o usuário.
      const { error } = await supabase
        .from("profiles")
        .upsert(payload as any, { onConflict: "id" });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Ficha salva. Sua liderança já enxerga estes dados.");
      await qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const tabs = [
    { value: "pessoal", label: "Pessoal", icon: User },
    { value: "endereco", label: "Endereço", icon: Home },
    { value: "fe", label: "Vida cristã", icon: Heart },
    { value: "servico", label: "Serviço", icon: Sparkles },
    { value: "saude", label: "Saúde", icon: HeartPulse },
  ];

  return (
    <div className="border border-border bg-card rounded-sm overflow-hidden">
      {/* Cabeçalho da ficha */}
      <div className="relative border-b border-border bg-gradient-to-br from-primary/10 via-card to-card p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="h-16 w-16 shrink-0 rounded-sm border border-primary/30 bg-primary/10 grid place-items-center font-serif text-2xl text-primary">
            {initialsOf(str("full_name"))}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-mono text-[10px] uppercase tracking-widest text-primary">
              Ficha do membro
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl truncate">
              {str("full_name") || "Complete o seu cadastro"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Estes dados ficam gravados na plataforma e são visíveis para a administração e para a
              sua liderança direta (pastores, apascentadores e líderes de mesa).
            </p>
          </div>
          <div className="w-full sm:w-44 space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Preenchido
              </span>
              <span className="font-serif text-lg text-primary">{completion}%</span>
            </div>
            <Progress value={completion} className="h-1.5" />
          </div>
        </div>
      </div>

      <Tabs defaultValue="pessoal" className="w-full">
        <div className="border-b border-border px-3 sm:px-6 overflow-x-auto">
          <TabsList className="h-auto bg-transparent p-0 gap-1">
            {tabs.map((t) => (
              <TabsTrigger
                key={t.value}
                value={t.value}
                className={cn(
                  "gap-2 rounded-none border-b-2 border-transparent px-3 py-3",
                  "font-mono text-[10px] uppercase tracking-widest",
                  "data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none",
                )}
              >
                <t.icon className="h-3.5 w-3.5" />
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="p-6 sm:p-8">
          <TabsContent value="pessoal" className="mt-0 space-y-8">
            <Section title="Identificação">
              <TextField
                label="Nome completo"
                value={str("full_name")}
                onChange={set("full_name")}
                full
              />
              <TextField label="E-mail" type="email" value={str("email")} onChange={set("email")} />
              <TextField label="Telefone / WhatsApp" value={str("phone")} onChange={set("phone")} />
              <TextField
                label="Data de nascimento"
                type="date"
                value={str("birth_date")}
                onChange={set("birth_date")}
              />
              <SelectField
                label="Sexo"
                value={str("gender")}
                onChange={set("gender")}
                options={GENDERS}
              />
              <TextField label="CPF" value={str("cpf")} onChange={set("cpf")} maxLength={14} />
              <TextField label="RG" value={str("rg")} onChange={set("rg")} maxLength={20} />
              <SelectField
                label="Escolaridade"
                value={str("education")}
                onChange={set("education")}
                options={EDUCATION_LEVELS.map((e) => ({ value: e, label: e }))}
              />
              <TextField label="Profissão" value={str("profession")} onChange={set("profession")} />
            </Section>

            <Section title="Família">
              <SelectField
                label="Estado civil"
                value={str("marital_status")}
                onChange={set("marital_status")}
                options={MARITAL_STATUS}
              />
              <TextField
                label="Nome do cônjuge"
                value={str("spouse_name")}
                onChange={set("spouse_name")}
              />
              <TextField
                label="Data de casamento"
                type="date"
                value={str("wedding_date")}
                onChange={set("wedding_date")}
              />
              <TextField
                label="Nome do pai"
                value={str("father_name")}
                onChange={set("father_name")}
              />
              <TextField
                label="Nome da mãe"
                value={str("mother_name")}
                onChange={set("mother_name")}
              />
              <Field label="Possui filhos">
                <div className="flex items-center gap-3 h-9">
                  <Switch checked={!!form.has_children} onCheckedChange={set("has_children")} />
                  <span className="text-sm text-muted-foreground">
                    {form.has_children ? "Sim" : "Não"}
                  </span>
                </div>
              </Field>
              {form.has_children && (
                <TextField
                  label="Quantidade de filhos"
                  type="number"
                  value={String(form.children_count ?? 0)}
                  onChange={(v) => set("children_count")(Number(v) || 0)}
                />
              )}
            </Section>

            {(profile?.id || userId) && (
              <Section title="Parentes cadastrados na igreja">
                <FamilyLinksEditor
                  personId={(profile?.id as string) || (userId as string)}
                  canEdit
                />
              </Section>
            )}
          </TabsContent>

          <TabsContent value="endereco" className="mt-0 space-y-8">
            <Section title="Onde você mora">
              <Field label="CEP">
                <CepInput
                  value={str("zip_code")}
                  onChange={set("zip_code")}
                  onResolved={(a) => {
                    if (a.street) set("street")(a.street);
                    if (a.neighborhood) set("neighborhood")(a.neighborhood);
                    if (a.city) set("city")(a.city);
                    if (a.state) set("state")(a.state);
                  }}
                />
              </Field>
              <TextField label="Rua" value={str("street")} onChange={set("street")} />
              <TextField
                label="Número"
                value={str("street_number")}
                onChange={set("street_number")}
                maxLength={10}
              />
              <TextField
                label="Complemento"
                value={str("complement")}
                onChange={set("complement")}
              />
              <TextField
                label="Bairro"
                value={str("neighborhood")}
                onChange={set("neighborhood")}
              />
              <TextField label="Cidade" value={str("city")} onChange={set("city")} />
              <SelectField
                label="Estado"
                value={str("state")}
                onChange={set("state")}
                options={UFS.map((u) => ({ value: u, label: u }))}
              />
            </Section>

            <Section title="Contato de emergência">
              <TextField
                label="Nome do contato"
                value={str("emergency_contact_name")}
                onChange={set("emergency_contact_name")}
              />
              <TextField
                label="Telefone"
                value={str("emergency_contact_phone")}
                onChange={set("emergency_contact_phone")}
              />
              <TextField
                label="Parentesco"
                value={str("emergency_contact_relation")}
                onChange={set("emergency_contact_relation")}
              />
            </Section>
          </TabsContent>

          <TabsContent value="fe" className="mt-0 space-y-8">
            <Section title="Caminhada com Cristo">
              <TextField
                label="Data de conversão"
                type="date"
                value={str("conversion_date")}
                onChange={set("conversion_date")}
              />
              <Field label="Batizado(a)">
                <div className="flex items-center gap-3 h-9">
                  <Switch checked={!!form.is_baptized} onCheckedChange={set("is_baptized")} />
                  <span className="text-sm text-muted-foreground">
                    {form.is_baptized ? "Sim" : "Não"}
                  </span>
                </div>
              </Field>
              {form.is_baptized && (
                <>
                  <TextField
                    label="Data do batismo"
                    type="date"
                    value={str("baptism_date")}
                    onChange={set("baptism_date")}
                  />
                  <TextField
                    label="Igreja do batismo"
                    value={str("baptism_church")}
                    onChange={set("baptism_church")}
                  />
                </>
              )}
              <TextField
                label="Igreja anterior"
                value={str("previous_church")}
                onChange={set("previous_church")}
              />
              <Field label="Sua história / testemunho" full>
                <Textarea
                  value={str("bio")}
                  onChange={(e) => set("bio")(e.target.value)}
                  className="min-h-[140px] resize-none"
                  placeholder="Conte um pouco da sua caminhada com Deus."
                />
              </Field>
            </Section>
          </TabsContent>

          <TabsContent value="servico" className="mt-0 space-y-8">
            <Section title="Serviço e talentos">
              <Field label="Cursos concluídos" full>
                <div className="grid sm:grid-cols-2 gap-2">
                  {COURSE_OPTIONS.map((c) => (
                    <div key={c} className="flex items-center gap-2">
                      <Checkbox
                        id={`perfil-course-${c}`}
                        checked={Array.isArray(form.courses) && form.courses.includes(c)}
                        onCheckedChange={(checked) => toggleCourse(c, !!checked)}
                      />
                      <label htmlFor={`perfil-course-${c}`} className="text-sm leading-none">
                        {c}
                      </label>
                    </div>
                  ))}
                </div>
              </Field>
              <Field label="Dons e talentos" full>
                <Textarea
                  value={str("gifts")}
                  onChange={(e) => set("gifts")(e.target.value)}
                  placeholder="No que você gosta de servir?"
                  className="resize-none"
                />
              </Field>
              <Field label="Disponibilidade" full>
                <Textarea
                  value={str("availability")}
                  onChange={(e) => set("availability")(e.target.value)}
                  placeholder="Quais dias e horários você pode servir?"
                  className="resize-none"
                />
              </Field>
            </Section>
          </TabsContent>

          <TabsContent value="saude" className="mt-0 space-y-8">
            <Section title="Informações de saúde">
              <SelectField
                label="Tipo sanguíneo"
                value={str("blood_type")}
                onChange={set("blood_type")}
                options={BLOOD_TYPES.map((b) => ({ value: b, label: b }))}
              />
              <TextField label="Alergias" value={str("allergies")} onChange={set("allergies")} />
              <Field label="Observações de saúde" full>
                <Textarea
                  value={str("health_notes")}
                  onChange={(e) => set("health_notes")(e.target.value)}
                  placeholder="Ex.: medicações contínuas, restrições físicas..."
                  className="resize-none"
                />
              </Field>
            </Section>
          </TabsContent>
        </div>
      </Tabs>

      <div className="sticky bottom-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-border bg-card/95 backdrop-blur px-6 py-4">
        <p className="text-xs text-muted-foreground">
          As alterações valem para toda a plataforma assim que você salvar.
        </p>
        <Button
          onClick={() => save.mutate()}
          disabled={save.isPending}
          className="w-full sm:w-auto"
        >
          {save.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {save.isPending ? "Salvando..." : "Salvar informações"}
        </Button>
      </div>
    </div>
  );
}
