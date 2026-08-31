const CHORD_TOKEN =
  /^[A-G][b#]?(m|maj|min|dim|aug|sus|add)?[0-9]*(\([^)]*\))?(\/[A-G][b#]?)?(\d+)?$/;

/** Uma linha é "linha de cifra" quando todos os seus tokens são acordes. */
export function isChordLine(line: string): boolean {
  const tokens = line.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return false;
  return tokens.every((t) => CHORD_TOKEN.test(t));
}

export interface ParsedSheet {
  chords: string;
  lyrics: string;
  key: string | null;
  title: string | null;
  artist: string | null;
}

/**
 * Interpreta um conteúdo de cifra colado pelo usuário (ex.: copiado do CifraClub).
 * Mantém o texto original como cifra, extrai só as linhas de letra e tenta
 * descobrir o tom a partir do cabeçalho "tom:" ou do primeiro acorde.
 */
export function parseChordSheet(raw: string): ParsedSheet {
  const text = raw.replace(/\r\n?/g, "\n").trim();
  const lines = text.split("\n");

  let title: string | null = null;
  let artist: string | null = null;
  let key: string | null = null;

  const tomMatch = text.match(/tom:\s*([A-G][b#]?m?)/i);
  if (tomMatch) key = tomMatch[1];

  // Cabeçalho do CifraClub costuma vir como "Título" na 1ª linha e artista na 2ª.
  const head = lines.filter((l) => l.trim()).slice(0, 2);
  if (head[0] && !isChordLine(head[0]) && head[0].length < 80) title = head[0].trim();
  if (head[1] && !isChordLine(head[1]) && head[1].length < 80 && !/tom:/i.test(head[1])) {
    artist = head[1].trim();
  }

  if (!key) {
    const firstChordLine = lines.find(isChordLine);
    if (firstChordLine) key = firstChordLine.trim().split(/\s+/)[0].replace(/\/.*$/, "");
  }

  const lyrics = lines
    .filter((l) => !isChordLine(l) && !/^\[.*\]$/.test(l.trim()) && !/tom:/i.test(l))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  // A cifra fica com o conteúdo colado, já sem o cabeçalho de tom.
  // Remove tabs extras e normaliza espaços
  const chords = lines
    .filter((l) => !/tom:/i.test(l))
    .map((line) => line.replace(/\t/g, "    "))
    .join("\n")
    .trim();

  return { chords, lyrics, key, title, artist };
}
