/** Utilitários compartilhados pelo Painel (dashboard inicial). */

/** Formata uma data ISO (yyyy-mm-dd) em pt-BR sem sofrer com fuso horário. */
export function formatDateBR(iso: string, opts?: Intl.DateTimeFormatOptions): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString(
    "pt-BR",
    opts ?? { day: "2-digit", month: "short" },
  );
}

/** Data de hoje em formato ISO local (yyyy-mm-dd). */
export function todayISO(): string {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}

/** Diferença em dias entre hoje e uma data ISO (positivo = futuro). */
export function daysFromToday(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  const target = new Date(y, (m ?? 1) - 1, d ?? 1).getTime();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round((target - today) / 86_400_000);
}

/** Rótulo humano para proximidade de datas. */
export function relativeDayLabel(iso: string): string {
  const diff = daysFromToday(iso);
  if (diff === 0) return "Hoje";
  if (diff === 1) return "Amanhã";
  if (diff > 1 && diff < 7) return `Em ${diff} dias`;
  if (diff < 0) return `Há ${Math.abs(diff)} dias`;
  return formatDateBR(iso, { day: "2-digit", month: "long" });
}

/** Converte centavos em moeda BRL. */
export function brl(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Iniciais para avatar (máx. 2 letras). */
export function initialsOf(name: string): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return ((parts[0][0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

/** Idade a partir da data de nascimento ISO. */
export function ageFrom(iso: string | null): number | null {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  if (!y) return null;
  const now = new Date();
  let age = now.getFullYear() - y;
  const passed = now.getMonth() + 1 > m || (now.getMonth() + 1 === m && now.getDate() >= d);
  if (!passed) age -= 1;
  return age;
}
