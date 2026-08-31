/** Opções e metadados da ficha de membro (padrão igreja batista). */

export const GENDERS = [
  { value: "masculino", label: "Masculino" },
  { value: "feminino", label: "Feminino" },
] as const;

export const MARITAL_STATUS = [
  { value: "solteiro", label: "Solteiro(a)" },
  { value: "casado", label: "Casado(a)" },
  { value: "uniao_estavel", label: "União estável" },
  { value: "viuvo", label: "Viúvo(a)" },
  { value: "divorciado", label: "Divorciado(a)" },
] as const;

export const MEMBERSHIP_TYPES = [
  { value: "batismo", label: "Batismo" },
  { value: "transferencia", label: "Transferência" },
  { value: "aclamacao", label: "Aclamação" },
  { value: "reconciliacao", label: "Reconciliação" },
] as const;

export const MEMBERSHIP_STATUS = [
  { value: "ativo", label: "Ativo" },
  { value: "inativo", label: "Inativo" },
  { value: "visitante", label: "Visitante" },
  { value: "transferido", label: "Transferido" },
  { value: "disciplina", label: "Em disciplina" },
  { value: "falecido", label: "Falecido" },
] as const;

export const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

export const COURSE_OPTIONS = [
  "Classe de integração",
  "Encontro com Deus",
  "Discipulado I",
  "Discipulado II",
  "Escola de líderes",
  "Escola bíblica dominical",
  "Curso de batismo",
  "Curso de noivos",
] as const;

export const UFS = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
] as const;

export const EDUCATION_LEVELS = [
  "Fundamental incompleto",
  "Fundamental completo",
  "Médio incompleto",
  "Médio completo",
  "Superior incompleto",
  "Superior completo",
  "Pós-graduação",
] as const;

export function labelOf(
  options: readonly { value: string; label: string }[],
  value?: string | null,
): string | null {
  if (!value) return null;
  return options.find((o) => o.value === value)?.label ?? value;
}

export function formatDateBR(value?: string | null): string | null {
  if (!value) return null;
  const [y, m, d] = value.split("-");
  if (!y || !m || !d) return value;
  return `${d}/${m}/${y}`;
}

/** Idade em anos a partir da data de nascimento (ISO). */
export function ageFrom(birthDate?: string | null): number | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate + "T00:00:00");
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const beforeBirthday =
    now.getMonth() < birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate());
  if (beforeBirthday) age -= 1;
  return age >= 0 && age < 130 ? age : null;
}

/** Faixas etárias usadas nos filtros da tela de membros. */
export const AGE_BANDS = [
  { value: "0-11", label: "Crianças (0-11)", min: 0, max: 11 },
  { value: "12-17", label: "Adolescentes (12-17)", min: 12, max: 17 },
  { value: "18-29", label: "Jovens (18-29)", min: 18, max: 29 },
  { value: "30-59", label: "Adultos (30-59)", min: 30, max: 59 },
  { value: "60+", label: "Melhor idade (60+)", min: 60, max: 200 },
] as const;

export function matchesAgeBand(birthDate: string | null | undefined, band: string): boolean {
  if (!band || band === "all") return true;
  const age = ageFrom(birthDate);
  if (age === null) return false;
  const def = AGE_BANDS.find((b) => b.value === band);
  return !!def && age >= def.min && age <= def.max;
}

/** Aniversariantes do mês corrente. */
export function birthdayThisMonth(birthDate?: string | null): boolean {
  if (!birthDate) return false;
  const month = Number(birthDate.split("-")[1]);
  return month === new Date().getMonth() + 1;
}

export function initialsOf(name?: string | null): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

/** Exporta linhas para CSV (compatível com Excel pt-BR: separador ";"). */
export function downloadCsv(filename: string, rows: Record<string, unknown>[]): void {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [
    headers.join(";"),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(";")),
  ].join("\r\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
