import { cloneElement, isValidElement, useId, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ArrowRight, Check, Sparkles, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { FieldLabelContext } from "@/components/ui/field-label-context";
import { createMemberAccount } from "@/lib/members.functions";
import {
  CHURCH_FUNCTIONS,
  CHURCH_FUNCTION_HINT,
  CHURCH_FUNCTION_LABEL,
  GENDERS,
  displayMemberName,
  type ChurchFunction,
} from "@/lib/igreja";
import {
  BLOOD_TYPES,
  COURSE_OPTIONS,
  EDUCATION_LEVELS,
  MEMBERSHIP_STATUS,
  MARITAL_STATUS,
  MEMBERSHIP_TYPES,
  ageFrom,
} from "@/lib/membros";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CepInput } from "@/components/ui/cep-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

/** Estado do formulário guiado — todos os campos são texto para simplificar a edição. */
interface WizardState {
  full_name: string;
  email: string;
  phone: string;
  password: string;
  /** Vazio força a escolha explícita do tipo de membro no assistente. */
  church_function: ChurchFunction | "";
  church_id: string;
  gender: string;
  marital_status: string;
  spouse_name: string;
  birth_date: string;
  wedding_date: string;
  cpf: string;
  rg: string;
  profession: string;
  education: string;
  zip_code: string;
  street: string;
  street_number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relation: string;
  conversion_date: string;
  is_baptized: boolean;
  baptism_date: string;
  baptism_church: string;
  membership_type: string;
  membership_status: string;
  previous_church: string;
  father_name: string;
  mother_name: string;
  courses: string[];
  bio: string;
  member_since: string;
  gifts: string;
  availability: string;
  allergies: string;
  health_notes: string;
  blood_type: string;
  has_children: boolean;
  children_count: string;
  notes: string;
}

const EMPTY: WizardState = {
  full_name: "",
  email: "",
  phone: "",
  password: "",
  church_function: "membro",
  church_id: "",
  gender: "masculino",
  marital_status: "",
  spouse_name: "",
  birth_date: "",
  wedding_date: "",
  cpf: "",
  rg: "",
  profession: "",
  education: "",
  zip_code: "",
  street: "",
  street_number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
  emergency_contact_name: "",
  emergency_contact_phone: "",
  emergency_contact_relation: "",
  conversion_date: "",
  is_baptized: false,
  baptism_date: "",
  baptism_church: "",
  membership_type: "",
  membership_status: "ativo",
  previous_church: "",
  father_name: "",
  mother_name: "",
  courses: [],
  bio: "",
  member_since: "",
  gifts: "",
  availability: "",
  allergies: "",
  health_notes: "",
  blood_type: "",
  has_children: false,
  children_count: "0",
  notes: "",
};

type Patch = (patch: Partial<WizardState>) => void;

interface Step {
  id: string;
  eyebrow: string;
  question: string;
  hint?: string;
  /** Impede avançar enquanto false. */
  valid?: (s: WizardState) => boolean;
  render: (s: WizardState, set: Patch) => React.ReactNode;
}

/** Botão grande de escolha única, no estilo de um formulário conversacional. */
function ChoiceGrid({
  options,
  value,
  onChange,
  columns = 2,
}: {
  options: readonly { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  columns?: number;
}) {
  return (
    <div className={cn("grid gap-3", columns === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              "text-left border rounded-sm px-4 py-3 text-sm transition-colors",
              active
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border bg-card hover:border-primary/50 text-muted-foreground",
            )}
          >
            <span className="flex items-center justify-between gap-2">
              {o.label}
              {active && <Check className="h-4 w-4 text-primary" />}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const gerado = useId();
  const campo = isValidElement(children) ? children : null;
  const id = (campo?.props as { id?: string } | undefined)?.id ?? gerado;
  return (
    <div className="space-y-2">
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

function useChurchOptions() {
  return useQuery({
    queryKey: ["churches-min"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("churches")
        .select("id, name, city, state")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Cadastro guiado de membros, uma pergunta por tela (estilo Typeform). */
export function MemberWizardDialog() {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [state, setState] = useState<WizardState>(EMPTY);
  const qc = useQueryClient();
  const create = useServerFn(createMemberAccount);
  const { data: churches } = useChurchOptions();

  const set: Patch = (patch) => setState((prev) => ({ ...prev, ...patch }));

  const steps = useMemo<Step[]>(
    () => [
      {
        id: "nome",
        eyebrow: "Identificação",
        question: "Qual é o nome completo?",
        hint: "Como o nome aparecerá na ficha e nas listas da igreja.",
        valid: (s) => s.full_name.trim().length >= 3,
        render: (s, up) => (
          <Input
            autoFocus
            className="h-14 text-xl"
            placeholder="Maria Aparecida da Silva"
            value={s.full_name}
            onChange={(e) => up({ full_name: e.target.value })}
          />
        ),
      },
      {
        id: "acesso",
        eyebrow: "Acesso à plataforma",
        question: "Qual e-mail e telefone dessa pessoa?",
        hint: "O e-mail será o login. A conta já nasce confirmada.",
        valid: (s) => /.+@.+\..+/.test(s.email.trim()),
        render: (s, up) => (
          <div className="space-y-4">
            <Field label="E-mail">
              <Input
                autoFocus
                type="email"
                className="h-12"
                value={s.email}
                onChange={(e) => up({ email: e.target.value })}
              />
            </Field>
            <Field label="Telefone / WhatsApp">
              <Input
                className="h-12"
                value={s.phone}
                onChange={(e) => up({ phone: e.target.value })}
              />
            </Field>
          </div>
        ),
      },
      {
        id: "senha",
        eyebrow: "Acesso à plataforma",
        question: "Defina a senha inicial",
        hint: "Mínimo de 8 caracteres. A pessoa poderá alterá-la depois no perfil.",
        valid: (s) => s.password.length >= 8,
        render: (s, up) => (
          <Input
            autoFocus
            type="password"
            className="h-14 text-xl"
            value={s.password}
            onChange={(e) => up({ password: e.target.value })}
          />
        ),
      },
      {
        id: "funcao",
        eyebrow: "Vida na igreja",
        question: "Que tipo de membro essa pessoa é?",
        hint: "Escolha obrigatória — define o prefixo do nome e o destaque em redes e mesas.",
        valid: (s) => s.church_function !== "",
        render: (s, up) => (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              {CHURCH_FUNCTIONS.map((f) => {
                const active = s.church_function === f.value;
                return (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => up({ church_function: f.value })}
                    className={cn(
                      "text-left border rounded-sm px-4 py-3 transition-colors",
                      active
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card hover:border-primary/50",
                    )}
                  >
                    <span className="flex items-center justify-between gap-2 text-sm text-foreground">
                      {f.label}
                      {active && <Check className="h-4 w-4 text-primary" />}
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {CHURCH_FUNCTION_HINT[f.value] ?? "Sem prefixo no nome"}
                    </span>
                  </button>
                );
              })}
            </div>
            {s.church_function && s.full_name.trim() && (
              <p className="text-sm text-muted-foreground">
                Aparecerá como{" "}
                <span className="text-foreground font-medium">
                  {displayMemberName(s.full_name, s.church_function, s.gender)}
                </span>
              </p>
            )}
          </div>
        ),
      },

      {
        id: "igreja",
        eyebrow: "Vida na igreja",
        question: "De qual igreja esse membro faz parte?",
        hint:
          churches && churches.length > 0
            ? "Selecione a sede ou uma das congregações cadastradas."
            : "Nenhuma igreja cadastrada ainda — cadastre pelo menu Igrejas para vincular depois.",
        render: (s, up) => (
          <ChoiceGrid
            options={(churches ?? []).map((c: any) => ({
              value: c.id,
              label: c.city ? `${c.name} — ${c.city}/${c.state ?? ""}` : c.name,
            }))}
            value={s.church_id}
            onChange={(v) => up({ church_id: v === s.church_id ? "" : v })}
          />
        ),
      },
      {
        id: "pessoais",
        eyebrow: "Dados pessoais",
        question: "Nascimento, gênero e estado civil",
        render: (s, up) => (
          <div className="space-y-5">
            <Field label="Data de nascimento">
              <Input
                type="date"
                className="h-12"
                value={s.birth_date}
                onChange={(e) => up({ birth_date: e.target.value })}
              />
            </Field>
            <Field label="Gênero">
              <ChoiceGrid options={GENDERS} value={s.gender} onChange={(v) => up({ gender: v })} />
            </Field>
            <Field label="Estado civil">
              <ChoiceGrid
                options={MARITAL_STATUS}
                value={s.marital_status}
                onChange={(v) => up({ marital_status: v })}
                columns={3}
              />
            </Field>
            {(s.marital_status === "casado" || s.marital_status === "uniao_estavel") && (
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Nome do cônjuge">
                  <Input
                    value={s.spouse_name}
                    onChange={(e) => up({ spouse_name: e.target.value })}
                  />
                </Field>
                <Field label="Data do casamento">
                  <Input
                    type="date"
                    value={s.wedding_date}
                    onChange={(e) => up({ wedding_date: e.target.value })}
                  />
                </Field>
              </div>
            )}
          </div>
        ),
      },
      {
        id: "documentos",
        eyebrow: "Dados pessoais",
        question: "Documentos, profissão e escolaridade",
        hint: "Opcional — pode ser preenchido depois na ficha do membro.",
        render: (s, up) => (
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="CPF">
              <Input value={s.cpf} onChange={(e) => up({ cpf: e.target.value })} />
            </Field>
            <Field label="RG">
              <Input value={s.rg} onChange={(e) => up({ rg: e.target.value })} />
            </Field>
            <Field label="Profissão">
              <Input value={s.profession} onChange={(e) => up({ profession: e.target.value })} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Escolaridade">
                <ChoiceGrid
                  options={EDUCATION_LEVELS.map((e) => ({ value: e, label: e }))}
                  value={s.education}
                  onChange={(v) => up({ education: v === s.education ? "" : v })}
                  columns={3}
                />
              </Field>
            </div>
            <Field label="Nome do pai">
              <Input value={s.father_name} onChange={(e) => up({ father_name: e.target.value })} />
            </Field>
            <Field label="Nome da mãe">
              <Input value={s.mother_name} onChange={(e) => up({ mother_name: e.target.value })} />
            </Field>
          </div>
        ),
      },
      {
        id: "endereco",
        eyebrow: "Contato",
        question: "Onde essa pessoa mora?",
        render: (s, up) => (
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="CEP">
              <CepInput
                value={s.zip_code}
                onChange={(v) => up({ zip_code: v })}
                onResolved={(a) =>
                  up({
                    street: a.street || s.street,
                    neighborhood: a.neighborhood || s.neighborhood,
                    city: a.city || s.city,
                    state: a.state || s.state,
                    complement: s.complement || a.complement,
                  })
                }
              />
            </Field>
            <Field label="Rua">
              <Input value={s.street} onChange={(e) => up({ street: e.target.value })} />
            </Field>
            <Field label="Número">
              <Input
                value={s.street_number}
                onChange={(e) => up({ street_number: e.target.value })}
              />
            </Field>
            <Field label="Complemento">
              <Input value={s.complement} onChange={(e) => up({ complement: e.target.value })} />
            </Field>
            <Field label="Bairro">
              <Input
                value={s.neighborhood}
                onChange={(e) => up({ neighborhood: e.target.value })}
              />
            </Field>
            <Field label="Cidade">
              <Input value={s.city} onChange={(e) => up({ city: e.target.value })} />
            </Field>
            <Field label="Estado">
              <Input value={s.state} onChange={(e) => up({ state: e.target.value })} />
            </Field>
          </div>
        ),
      },
      {
        id: "emergencia",
        eyebrow: "Contato",
        question: "Quem acionar em caso de emergência?",
        render: (s, up) => (
          <div className="space-y-4">
            <Field label="Nome">
              <Input
                value={s.emergency_contact_name}
                onChange={(e) => up({ emergency_contact_name: e.target.value })}
              />
            </Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Telefone">
                <Input
                  value={s.emergency_contact_phone}
                  onChange={(e) => up({ emergency_contact_phone: e.target.value })}
                />
              </Field>
              <Field label="Parentesco">
                <Input
                  value={s.emergency_contact_relation}
                  onChange={(e) => up({ emergency_contact_relation: e.target.value })}
                />
              </Field>
            </div>
          </div>
        ),
      },
      {
        id: "conversao",
        eyebrow: "Caminhada cristã",
        question: "Conversão e batismo",
        render: (s, up) => (
          <div className="space-y-5">
            <Field label="Data de conversão">
              <Input
                type="date"
                value={s.conversion_date}
                onChange={(e) => up({ conversion_date: e.target.value })}
              />
            </Field>
            <div className="flex items-center gap-3">
              <Switch checked={s.is_baptized} onCheckedChange={(v) => up({ is_baptized: v })} />
              <Label>É batizado(a)?</Label>
            </div>
            {s.is_baptized && (
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Data do batismo">
                  <Input
                    type="date"
                    value={s.baptism_date}
                    onChange={(e) => up({ baptism_date: e.target.value })}
                  />
                </Field>
                <Field label="Igreja do batismo">
                  <Input
                    value={s.baptism_church}
                    onChange={(e) => up({ baptism_church: e.target.value })}
                  />
                </Field>
              </div>
            )}
          </div>
        ),
      },
      {
        id: "membresia",
        eyebrow: "Caminhada cristã",
        question: "Como essa pessoa entrou para a membresia?",
        render: (s, up) => (
          <div className="space-y-5">
            <ChoiceGrid
              options={MEMBERSHIP_TYPES}
              value={s.membership_type}
              onChange={(v) => up({ membership_type: v })}
            />
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Membro desde">
                <Input
                  type="date"
                  value={s.member_since}
                  onChange={(e) => up({ member_since: e.target.value })}
                />
              </Field>
              <Field label="Igreja anterior">
                <Input
                  value={s.previous_church}
                  onChange={(e) => up({ previous_church: e.target.value })}
                />
              </Field>
            </div>
          </div>
        ),
      },
      {
        id: "status",
        eyebrow: "Caminhada cristã",
        question: "Qual é a situação dessa pessoa na membresia?",
        hint: "Define como o membro aparece nas listas e nos indicadores da igreja.",
        render: (s, up) => (
          <ChoiceGrid
            options={MEMBERSHIP_STATUS}
            value={s.membership_status || "ativo"}
            onChange={(v) => up({ membership_status: v })}
            columns={3}
          />
        ),
      },
      {
        id: "cursos",
        eyebrow: "Formação",
        question: "Quais cursos e encontros já concluiu?",
        hint: "Opcional — marque quantos forem necessários.",
        render: (s, up) => (
          <div className="grid sm:grid-cols-2 gap-2">
            {COURSE_OPTIONS.map((course) => {
              const checked = s.courses.includes(course);
              return (
                <label key={course} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(v) =>
                      up({
                        courses:
                          v === true
                            ? [...s.courses, course]
                            : s.courses.filter((c) => c !== course),
                      })
                    }
                  />
                  {course}
                </label>
              );
            })}
          </div>
        ),
      },
      {
        id: "dons",
        eyebrow: "Serviço",
        question: "Dons, habilidades e disponibilidade",
        hint: "Ex.: toca violão, canta, ensina crianças, disponível aos domingos à noite.",
        render: (s, up) => (
          <div className="space-y-4">
            <Field label="Dons e habilidades">
              <Textarea rows={3} value={s.gifts} onChange={(e) => up({ gifts: e.target.value })} />
            </Field>
            <Field label="Disponibilidade">
              <Textarea
                rows={2}
                value={s.availability}
                onChange={(e) => up({ availability: e.target.value })}
              />
            </Field>
          </div>
        ),
      },
      {
        id: "saude",
        eyebrow: "Cuidado",
        question: "Saúde e família",
        render: (s, up) => (
          <div className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Alergias">
                <Input value={s.allergies} onChange={(e) => up({ allergies: e.target.value })} />
              </Field>
              <Field label="Tipo sanguíneo">
                <ChoiceGrid
                  options={BLOOD_TYPES.map((b) => ({ value: b, label: b }))}
                  value={s.blood_type}
                  onChange={(v) => up({ blood_type: v === s.blood_type ? "" : v })}
                  columns={3}
                />
              </Field>
            </div>
            <Field label="Observações de saúde">
              <Textarea
                rows={2}
                value={s.health_notes}
                onChange={(e) => up({ health_notes: e.target.value })}
              />
            </Field>
            <div className="flex items-center gap-3">
              <Switch checked={s.has_children} onCheckedChange={(v) => up({ has_children: v })} />
              <Label>Tem filhos?</Label>
            </div>
            {s.has_children && (
              <Field label="Quantidade de filhos">
                <Input
                  type="number"
                  min={0}
                  max={30}
                  className="max-w-[140px]"
                  value={s.children_count}
                  onChange={(e) => up({ children_count: e.target.value })}
                />
              </Field>
            )}
            <Field label="Testemunho / bio">
              <Textarea rows={3} value={s.bio} onChange={(e) => up({ bio: e.target.value })} />
            </Field>
            <Field label="Observações gerais">
              <Textarea rows={3} value={s.notes} onChange={(e) => up({ notes: e.target.value })} />
            </Field>
          </div>
        ),
      },
      {
        id: "revisao",
        eyebrow: "Conferência",
        question: "Tudo certo para criar o cadastro?",
        hint: "Revise os dados principais. Use Voltar para ajustar qualquer etapa.",
        render: (s, up) => (
          <div className="space-y-5">
            <dl className="grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-muted-foreground text-xs uppercase tracking-wider">Nome</dt>
                <dd className="text-foreground">
                  {displayMemberName(s.full_name, s.church_function, s.gender) || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs uppercase tracking-wider">
                  Tipo de membro
                </dt>
                <dd className="text-foreground">
                  {s.church_function ? CHURCH_FUNCTION_LABEL[s.church_function] : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs uppercase tracking-wider">E-mail</dt>
                <dd className="text-foreground">{s.email || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs uppercase tracking-wider">Igreja</dt>
                <dd className="text-foreground">
                  {(churches ?? []).find((c: any) => c.id === s.church_id)?.name ?? "—"}
                </dd>
              </div>
            </dl>
            <Field label="Ajustar tipo de membro">
              <ChoiceGrid
                options={CHURCH_FUNCTIONS}
                value={s.church_function}
                onChange={(v) => up({ church_function: v as ChurchFunction })}
                columns={3}
              />
            </Field>
          </div>
        ),
      },
    ],
    [churches],
  );

  const total = steps.length;
  const step = steps[Math.min(index, total - 1)];
  const isLast = index === total - 1;
  const canAdvance = step.valid ? step.valid(state) : true;

  const mutation = useMutation({
    mutationFn: async () =>
      create({
        data: {
          full_name: state.full_name.trim(),
          email: state.email.trim(),
          phone: state.phone.trim(),
          password: state.password,
          profile: {
            church_function: state.church_function || "membro",
            ...(state.church_id ? { church_id: state.church_id } : {}),
            gender: state.gender,
            marital_status: state.marital_status,
            spouse_name: state.spouse_name,
            birth_date: state.birth_date,
            wedding_date: state.wedding_date,
            cpf: state.cpf,
            rg: state.rg,
            profession: state.profession,
            education: state.education,
            zip_code: state.zip_code,
            street: state.street,
            street_number: state.street_number,
            complement: state.complement,
            neighborhood: state.neighborhood,
            city: state.city,
            state: state.state,
            emergency_contact_name: state.emergency_contact_name,
            emergency_contact_phone: state.emergency_contact_phone,
            emergency_contact_relation: state.emergency_contact_relation,
            conversion_date: state.conversion_date,
            is_baptized: state.is_baptized,
            baptism_date: state.baptism_date,
            baptism_church: state.baptism_church,
            membership_type: state.membership_type,
            membership_status: state.membership_status || "ativo",
            father_name: state.father_name,
            mother_name: state.mother_name,
            courses: state.courses,
            previous_church: state.previous_church,
            member_since: state.member_since,
            gifts: state.gifts,
            availability: state.availability,
            allergies: state.allergies,
            health_notes: state.health_notes,
            blood_type: state.blood_type,
            has_children: state.has_children,
            children_count: Number(state.children_count) || 0,
            notes: state.notes,
            bio: state.bio,
          },
        },
      }),
    onSuccess: () => {
      toast.success(`${state.full_name} cadastrado(a) com acesso à plataforma.`);
      setOpen(false);
      setState(EMPTY);
      setIndex(0);
      void qc.invalidateQueries({ queryKey: ["profiles"] });
      void qc.invalidateQueries({ queryKey: ["profiles-min"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const next = () => {
    if (!canAdvance) return;
    if (isLast) mutation.mutate();
    else setIndex((i) => i + 1);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) {
          setIndex(0);
          setState(EMPTY);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="h-4 w-4" /> Cadastrar membro
        </Button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-3xl p-0 gap-0 overflow-hidden"
        onKeyDown={(e) => {
          if (
            e.key === "Enter" &&
            !e.shiftKey &&
            (e.target as HTMLElement).tagName !== "TEXTAREA"
          ) {
            e.preventDefault();
            next();
          }
        }}
      >
        <DialogTitle className="sr-only">Cadastro guiado de membro</DialogTitle>
        <div className="h-1 w-full bg-muted">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${((index + 1) / total) * 100}%` }}
          />
        </div>
        <div className="px-6 sm:px-10 py-8 max-h-[70vh] overflow-y-auto">
          <div
            key={step.id}
            className="animate-in fade-in slide-in-from-right-6 duration-300 space-y-6"
          >
            <div className="space-y-2">
              <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-primary flex items-center gap-2">
                <Sparkles className="h-3 w-3" />
                {step.eyebrow} · {index + 1} de {total}
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl leading-tight">{step.question}</h2>
              {step.hint && <p className="text-sm text-muted-foreground">{step.hint}</p>}
            </div>
            {step.render(state, set)}
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-border px-6 sm:px-10 py-4 bg-card">
          <Button
            variant="ghost"
            disabled={index === 0 || mutation.isPending}
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
          >
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
          <div className="flex items-center gap-3">
            {!step.valid && !isLast && (
              <button
                type="button"
                className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground"
                onClick={() => setIndex((i) => i + 1)}
              >
                Pular
              </button>
            )}
            <Button disabled={!canAdvance || mutation.isPending} onClick={next}>
              {isLast ? (
                <>
                  <Check className="h-4 w-4" /> Criar membro
                </>
              ) : (
                <>
                  Continuar <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
