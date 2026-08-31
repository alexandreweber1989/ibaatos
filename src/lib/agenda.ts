/** Tipos e utilitários do módulo de Eventos & Agenda. */

export type EventScope = "igreja" | "ministerio" | "rede" | "mesa";
export type EventStatus = "rascunho" | "publicado" | "cancelado" | "concluido";
export type EventKind = "culto" | "ensaio" | "reuniao" | "evento" | "acao_social" | "treinamento";
export type RsvpStatus = "vou" | "nao_vou" | "talvez";

export interface ChurchEvent {
  id: string;
  title: string;
  description: string | null;
  kind: EventKind;
  scope: EventScope;
  ministry_id: string | null;
  rede_id: string | null;
  mesa_id: string | null;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  image_url: string | null;
  requires_rsvp: boolean;
  capacity: number | null;
  is_featured: boolean;
  status: EventStatus;
  reminder_settings?: {
    enabled: boolean;
    lead_time: number;
    type: "push" | "email" | "both";
  };
  created_by: string | null;
  ministry?: { name: string; color: string | null } | null;
  rede?: { name: string; color: string | null } | null;
  mesa?: { name: string } | null;
}

export const KIND_LABEL: Record<EventKind, string> = {
  culto: "Culto",
  ensaio: "Ensaio",
  reuniao: "Reunião",
  evento: "Evento",
  acao_social: "Ação social",
  treinamento: "Treinamento",
};

export const SCOPE_LABEL: Record<EventScope, string> = {
  igreja: "Toda a igreja",
  ministerio: "Ministério",
  rede: "Rede",
  mesa: "Mesa",
};

export const STATUS_LABEL: Record<EventStatus, string> = {
  rascunho: "Rascunho",
  publicado: "Publicado",
  cancelado: "Cancelado",
  concluido: "Concluído",
};

export const RSVP_LABEL: Record<RsvpStatus, string> = {
  vou: "Vou participar",
  nao_vou: "Não vou",
  talvez: "Talvez",
};

/** Rótulo do público-alvo do evento, já resolvido. */
export function audienceLabel(e: ChurchEvent): string {
  if (e.scope === "ministerio") return e.ministry?.name ?? "Ministério";
  if (e.scope === "rede") return e.rede?.name ?? "Rede";
  if (e.scope === "mesa") return e.mesa?.name ?? "Mesa";
  return "Toda a igreja";
}

/** Data/hora completa em pt-BR a partir de um timestamptz. */
export function formatEventDateTime(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDayNumber(iso: string): { day: string; month: string; weekday: string } {
  const d = new Date(iso);
  return {
    day: String(d.getDate()).padStart(2, "0"),
    month: d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
    weekday: d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", ""),
  };
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

/** Rótulo relativo simples ("hoje", "amanhã", "em 5 dias"). */
export function relativeDayLabel(iso: string): string {
  const target = new Date(iso);
  const now = new Date();
  const a = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
  const b = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const diff = Math.round((a - b) / 86_400_000);
  if (diff === 0) return "hoje";
  if (diff === 1) return "amanhã";
  if (diff === -1) return "ontem";
  if (diff > 1) return `em ${diff} dias`;
  return `há ${Math.abs(diff)} dias`;
}

/** Converte timestamptz em valor aceito por <input type="datetime-local">. */
export function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Converte valor do input datetime-local em ISO, ou null quando vazio. */
export function fromLocalInput(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
