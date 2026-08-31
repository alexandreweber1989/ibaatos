/** ID do ministério de Louvor (usado como escopo padrão do módulo). */
export const LOUVOR_MINISTRY_ID = "7cc9c01b-b760-4dc7-985e-2e6e8505384b";

/**
 * Funções do louvor na ordem em que aparecem na escala.
 * A escala é montada função por função (instrumento por instrumento).
 */
export const WORSHIP_FUNCTIONS = [
  "Violão (ministro)",
  "Backvocal",
  "Teclado",
  "Guitarra",
  "Baixo",
  "Bateria",
] as const;

export type WorshipFunction = (typeof WORSHIP_FUNCTIONS)[number];

/** Agrupamento das funções do louvor por naipe/família. */
export const FUNCTION_GROUPS: { id: string; label: string; functions: string[] }[] = [
  {
    id: "vozes",
    label: "Vozes",
    functions: ["Violão (ministro)", "Backvocal", "Vocal", "Ministro(a)", "Backing vocal"],
  },
  { id: "cordas", label: "Cordas", functions: ["Guitarra", "Baixo", "Violão"] },
  { id: "teclas", label: "Teclas", functions: ["Teclado"] },
  { id: "ritmo", label: "Ritmo", functions: ["Bateria", "Percussão"] },
  { id: "tecnica", label: "Técnica", functions: ["Técnico de som", "Sopro"] },
];

/** Retorna o id do naipe de uma função (fallback: técnica). */
export function functionGroupId(fn: string): string {
  return FUNCTION_GROUPS.find((g) => g.functions.includes(fn))?.id ?? "tecnica";
}

/** Iniciais para avatares (máx. 2 letras). */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return (
    (parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")
  ).toUpperCase();
}

export const SONG_KEYS = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
  "Cm",
  "C#m",
  "Dm",
  "D#m",
  "Em",
  "Fm",
  "F#m",
  "Gm",
  "G#m",
  "Am",
  "A#m",
  "Bm",
] as const;

export const TEMPO_LABELS: Record<string, string> = {
  lenta: "Lenta",
  media: "Média",
  rapida: "Rápida",
};

export const SCHEDULE_TYPE_LABELS: Record<string, string> = {
  culto: "Culto",
  ensaio: "Ensaio",
  evento: "Evento",
};

export const SCHEDULE_STATUS: Record<string, { label: string; className: string }> = {
  rascunho: { label: "Rascunho", className: "bg-muted text-muted-foreground" },
  publicada: { label: "Publicada", className: "bg-primary text-primary-foreground" },
  concluida: { label: "Concluída", className: "bg-muted text-muted-foreground" },
};

export const ASSIGNMENT_STATUS: Record<string, { label: string; className: string }> = {
  pendente: { label: "Aguardando", className: "bg-muted text-muted-foreground" },
  confirmado: { label: "Confirmado", className: "bg-primary text-primary-foreground" },
  recusado: { label: "Recusado", className: "bg-destructive/10 text-destructive" },
};

export function formatDate(iso: string): string {
  return new Date(iso + "T12:00:00").toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

export function formatTime(time: string | null): string {
  return time ? time.slice(0, 5) : "—";
}

/** Ex.: "há 12 dias" / "hoje" — usado no histórico de participação. */
export function relativeDays(iso: string | null): string {
  if (!iso) return "nunca participou";
  const days = Math.floor((Date.now() - new Date(iso + "T12:00:00").getTime()) / 86_400_000);
  if (days <= 0) return "hoje";
  if (days === 1) return "ontem";
  if (days < 30) return `há ${days} dias`;
  const months = Math.floor(days / 30);
  return months === 1 ? "há 1 mês" : `há ${months} meses`;
}

const SHARP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const FLAT_TO_SHARP: Record<string, string> = {
  Db: "C#",
  Eb: "D#",
  Gb: "F#",
  Ab: "G#",
  Bb: "A#",
};

/** Transpõe uma cifra em N semitons preservando o texto ao redor. */
export function transposeChords(text: string, semitones: number): string {
  if (!semitones) return text;

  // Regex para capturar o acorde completo, incluindo baixo após a barra e extensões entre parênteses
  // Ex: C#m7(9), G/B, A#add9
  return text.replace(
    /\b([A-G][b#]?)((?:m|maj|min|dim|aug|sus|add)?[0-9]*(?:\([^)]*\))?)(?:\/([A-G][b#]?))?/g,
    (match, root: string, suffix: string, bass: string) => {
      const transposeKey = (key: string) => {
        const normalized = FLAT_TO_SHARP[key] ?? key;
        const idx = SHARP.indexOf(normalized);
        if (idx === -1) return key;
        return SHARP[(idx + semitones + 120) % 12];
      };

      const newRoot = transposeKey(root);
      const newBass = bass ? "/" + transposeKey(bass) : "";

      return newRoot + suffix + newBass;
    },
  );
}
