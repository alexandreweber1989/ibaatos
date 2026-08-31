import { useRef, type Ref } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Download, Image as ImageIcon, Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/* ---------------------------------------------------------------------------
 * Gerador visual das pregações de domingo — artes, infográficos e mapa mental.
 * Tudo é desenhado em SVG puro (sem dependências), então exporta em PNG e SVG
 * com nitidez, direto do navegador.
 * ------------------------------------------------------------------------- */

export interface SermonPoint {
  title: string;
  detail?: string;
}

export type SermonTemplate = "mapa" | "infografico" | "arte";

export interface SermonDraft {
  title: string;
  theme?: string;
  preacher?: string;
  preached_on?: string;
  base_verse?: string;
  summary?: string;
  points: SermonPoint[];
  tags: string[];
  template: SermonTemplate;
  dark: boolean;
  churchName?: string;
  youtube_url?: string;
  cover_image_url?: string;
}

const SERIF = "'Syne', 'Georgia', serif";
const SANS = "'Plus Jakarta Sans', 'Segoe UI', system-ui, sans-serif";
const MONO = "'JetBrains Mono', ui-monospace, 'SFMono-Regular', monospace";

export const DIMS: Record<SermonTemplate, { w: number; h: number }> = {
  mapa: { w: 1600, h: 1000 },
  infografico: { w: 1080, h: 1350 },
  arte: { w: 1080, h: 1080 },
};

interface Palette {
  paper: string;
  ink: string;
  soft: string;
  line: string;
  band: string;
  chipInk: string;
}

function palette(dark: boolean): Palette {
  return dark
    ? {
        paper: "#141416",
        ink: "#F3F1EA",
        soft: "#A7A59E",
        line: "#2E2E33",
        band: "#1D1D20",
        chipInk: "#141416",
      }
    : {
        paper: "#F5F3EE",
        ink: "#18181B",
        soft: "#57574F",
        line: "#DBD8CF",
        band: "#ECEAE3",
        chipInk: "#F5F3EE",
      };
}

function wrap(text: string, max: number): string[] {
  const words = (text || "").trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if (!cur) cur = w;
    else if ((cur + " " + w).length <= max) cur += " " + w;
    else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

function capitalize(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function fmtDate(iso?: string): string {
  if (!iso) return "";
  try {
    return capitalize(format(parseISO(iso), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR }));
  } catch {
    return iso;
  }
}

function slugify(s: string): string {
  return (
    (s || "pregacao")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 60) || "pregacao"
  );
}

/** Bloco de texto com quebra automática em várias linhas (tspans). */
function TextLines({
  text,
  x,
  y,
  size,
  lh,
  family,
  fill,
  weight,
  anchor = "start",
  italic,
  tracking,
  maxChars,
  maxLines,
}: {
  text: string;
  x: number;
  y: number;
  size: number;
  lh?: number;
  family: string;
  fill: string;
  weight?: number | string;
  anchor?: "start" | "middle" | "end";
  italic?: boolean;
  tracking?: number;
  maxChars: number;
  maxLines?: number;
}) {
  let lines = wrap(text, maxChars);
  if (maxLines && lines.length > maxLines) {
    lines = lines.slice(0, maxLines);
    lines[maxLines - 1] = lines[maxLines - 1].replace(/[.,;:]?$/, "") + "…";
  }
  const lineHeight = lh ?? size * 1.15;
  return (
    <text
      x={x}
      y={y}
      fontFamily={family}
      fontSize={size}
      fill={fill}
      fontWeight={weight}
      fontStyle={italic ? "italic" : undefined}
      textAnchor={anchor}
      letterSpacing={tracking}
    >
      {lines.map((ln, i) => (
        <tspan key={i} x={x} dy={i === 0 ? 0 : lineHeight}>
          {ln}
        </tspan>
      ))}
    </text>
  );
}

function Brandmark({ x, y, size, P }: { x: number; y: number; size: number; P: Palette }) {
  return (
    <g>
      <rect x={x} y={y} width={size} height={size} rx={size * 0.24} fill={P.ink} />
      <text
        x={x + size / 2}
        y={y + size / 2}
        fontFamily={SERIF}
        fontSize={size * 0.58}
        fontWeight={800}
        fill={P.chipInk}
        textAnchor="middle"
        dominantBaseline="central"
      >
        A
      </text>
    </g>
  );
}

/* ------------------------------- MAPA MENTAL ------------------------------ */
function LayoutMapa({ d, P }: { d: SermonDraft; P: Palette }) {
  const { w, h } = DIMS.mapa;
  const cx = w / 2;
  const cy = h / 2;
  const points = d.points.filter((p) => p.title?.trim()).slice(0, 6);
  const leftCount = Math.ceil(points.length / 2);
  const left = points.slice(0, leftCount);
  const right = points.slice(leftCount);

  const nodeW = 380;
  const nodeH = 132;
  const spread = (count: number) => {
    const top = 250;
    const bottom = h - 320;
    if (count <= 1) return [(top + bottom) / 2];
    const step = (bottom - top) / (count - 1);
    return Array.from({ length: count }, (_, i) => top + step * i);
  };
  const leftYs = spread(left.length);
  const rightYs = spread(right.length);

  const themeLines = wrap(d.theme || d.title, 18).slice(0, 3);
  const centerW = 540;
  const centerH = Math.max(150, 70 + themeLines.length * 52);

  const node = (p: SermonPoint, nx: number, ny: number, side: "l" | "r", idx: number) => {
    const x = nx - nodeW / 2;
    const y = ny - nodeH / 2;
    const badgeX = x + 34;
    const badgeY = y + 34;
    return (
      <g key={`${side}-${idx}`}>
        <rect
          x={x}
          y={y}
          width={nodeW}
          height={nodeH}
          rx={20}
          fill={P.paper}
          stroke={P.line}
          strokeWidth={2}
        />
        <circle cx={badgeX} cy={badgeY} r={19} fill={P.ink} />
        <text
          x={badgeX}
          y={badgeY}
          fontFamily={MONO}
          fontSize={20}
          fontWeight={700}
          fill={P.chipInk}
          textAnchor="middle"
          dominantBaseline="central"
        >
          {idx + 1}
        </text>
        <TextLines
          text={p.title}
          x={x + 66}
          y={y + 42}
          size={26}
          lh={30}
          family={SERIF}
          fill={P.ink}
          weight={700}
          maxChars={24}
          maxLines={2}
        />
        {p.detail ? (
          <TextLines
            text={p.detail}
            x={x + 24}
            y={y + nodeH - 30}
            size={16}
            lh={19}
            family={SANS}
            fill={P.soft}
            maxChars={40}
            maxLines={2}
          />
        ) : null}
      </g>
    );
  };

  const connector = (nx: number, ny: number, side: "l" | "r") => {
    const sx = side === "l" ? cx - centerW / 2 : cx + centerW / 2;
    const ex = side === "l" ? nx + nodeW / 2 : nx - nodeW / 2;
    const mx = (sx + ex) / 2;
    return (
      <path
        key={`c-${side}-${ny}`}
        d={`M ${sx} ${cy} C ${mx} ${cy}, ${mx} ${ny}, ${ex} ${ny}`}
        fill="none"
        stroke={P.line}
        strokeWidth={2.5}
      />
    );
  };

  return (
    <>
      <rect x={0} y={0} width={w} height={h} fill={P.paper} />
      <rect
        x={30}
        y={30}
        width={w - 60}
        height={h - 60}
        rx={28}
        fill="none"
        stroke={P.line}
        strokeWidth={2}
      />

      {/* Cabeçalho */}
      <Brandmark x={70} y={64} size={48} P={P} />
      <text x={132} y={82} fontFamily={SANS} fontSize={23} fontWeight={700} fill={P.ink}>
        {d.churchName || "Igreja Batista Atos"}
      </text>
      <text x={132} y={108} fontFamily={MONO} fontSize={13} fill={P.soft} letterSpacing={2}>
        MENSAGEM DE DOMINGO
      </text>
      <text x={w - 70} y={98} fontFamily={MONO} fontSize={15} fill={P.soft} textAnchor="end">
        {fmtDate(d.preached_on)}
      </text>

      {/* Conectores atrás dos nós */}
      {left.map((_, i) => connector(300, leftYs[i], "l"))}
      {right.map((_, i) => connector(w - 300, rightYs[i], "r"))}

      {/* Nó central — o tema */}
      <rect
        x={cx - centerW / 2}
        y={cy - centerH / 2}
        width={centerW}
        height={centerH}
        rx={26}
        fill={P.ink}
      />
      <text
        x={cx}
        y={cy - centerH / 2 + 34}
        fontFamily={MONO}
        fontSize={13}
        fill={P.chipInk}
        textAnchor="middle"
        letterSpacing={3}
        opacity={0.7}
      >
        TEMA
      </text>
      <text
        x={cx}
        y={cy + 8 - (themeLines.length - 1) * 26}
        fontFamily={SERIF}
        fontSize={46}
        fontWeight={800}
        fill={P.chipInk}
        textAnchor="middle"
      >
        {themeLines.map((ln, i) => (
          <tspan key={i} x={cx} dy={i === 0 ? 0 : 52}>
            {ln}
          </tspan>
        ))}
      </text>

      {/* Nós dos pontos */}
      {left.map((p, i) => node(p, 300, leftYs[i], "l", i))}
      {right.map((p, i) => node(p, w - 300, rightYs[i], "r", leftCount + i))}

      {/* Versículo-base */}
      {d.base_verse ? (
        <g>
          <rect x={cx - 260} y={h - 130} width={520} height={64} rx={32} fill={P.ink} />
          <text
            x={cx}
            y={h - 98}
            fontFamily={SANS}
            fontSize={22}
            fontWeight={600}
            fill={P.chipInk}
            textAnchor="middle"
            dominantBaseline="central"
          >
            {d.base_verse}
          </text>
        </g>
      ) : null}
    </>
  );
}

/* ------------------------------- INFOGRÁFICO ------------------------------ */
function LayoutInfografico({ d, P }: { d: SermonDraft; P: Palette }) {
  const { w, h } = DIMS.infografico;
  const points = d.points.filter((p) => p.title?.trim()).slice(0, 5);
  const themeLines = wrap(d.theme || d.title, 20).slice(0, 3);

  let cursor = 300 + themeLines.length * 74 + 20;
  if (d.base_verse) cursor += 54;

  const rows = points.map((p) => {
    const titleLines = wrap(p.title, 30).slice(0, 2);
    const detailLines = p.detail ? wrap(p.detail, 46).slice(0, 2) : [];
    const rowY = cursor;
    const height = Math.max(70, 34 + titleLines.length * 34 + detailLines.length * 24 + 24);
    cursor += height;
    return { p, rowY, height, titleLines, detailLines };
  });

  return (
    <>
      <rect x={0} y={0} width={w} height={h} fill={P.paper} />

      {/* Cabeçalho */}
      <rect x={0} y={0} width={w} height={158} fill={P.band} />
      <Brandmark x={72} y={54} size={52} P={P} />
      <text x={140} y={90} fontFamily={SANS} fontSize={27} fontWeight={700} fill={P.ink}>
        {d.churchName || "Igreja Batista Atos"}
      </text>
      <text x={140} y={118} fontFamily={MONO} fontSize={13} fill={P.soft} letterSpacing={2}>
        MENSAGEM DE DOMINGO
      </text>
      <text x={w - 72} y={104} fontFamily={MONO} fontSize={15} fill={P.soft} textAnchor="end">
        {fmtDate(d.preached_on)}
      </text>

      {/* Título (eyebrow) + tema */}
      <text x={80} y={238} fontFamily={MONO} fontSize={15} fill={P.soft} letterSpacing={2}>
        {(d.title || "").toUpperCase()}
      </text>
      <text x={80} y={300} fontFamily={SERIF} fontSize={62} fontWeight={800} fill={P.ink}>
        {themeLines.map((ln, i) => (
          <tspan key={i} x={80} dy={i === 0 ? 0 : 72}>
            {ln}
          </tspan>
        ))}
      </text>
      {d.base_verse ? (
        <text
          x={80}
          y={300 + themeLines.length * 72 + 6}
          fontFamily={SANS}
          fontSize={24}
          fontStyle="italic"
          fill={P.soft}
        >
          {d.base_verse}
        </text>
      ) : null}

      {/* Pontos com espinha vertical numerada */}
      {rows.length > 1 ? (
        <line
          x1={112}
          y1={rows[0].rowY + 6}
          x2={112}
          y2={rows[rows.length - 1].rowY + 6}
          stroke={P.line}
          strokeWidth={3}
        />
      ) : null}
      {rows.map(({ p, rowY, titleLines, detailLines }, i) => (
        <g key={i}>
          <circle cx={112} cy={rowY + 6} r={24} fill={P.ink} />
          <text
            x={112}
            y={rowY + 6}
            fontFamily={MONO}
            fontSize={22}
            fontWeight={700}
            fill={P.chipInk}
            textAnchor="middle"
            dominantBaseline="central"
          >
            {i + 1}
          </text>
          <text
            x={168}
            y={rowY + 16}
            fontFamily={SERIF}
            fontSize={31}
            fontWeight={700}
            fill={P.ink}
          >
            {titleLines.map((ln, j) => (
              <tspan key={j} x={168} dy={j === 0 ? 0 : 36}>
                {ln}
              </tspan>
            ))}
          </text>
          {detailLines.length ? (
            <text
              x={168}
              y={rowY + 20 + titleLines.length * 34}
              fontFamily={SANS}
              fontSize={19}
              fill={P.soft}
            >
              {detailLines.map((ln, j) => (
                <tspan key={j} x={168} dy={j === 0 ? 0 : 25}>
                  {ln}
                </tspan>
              ))}
            </text>
          ) : null}
        </g>
      ))}

      {/* Rodapé */}
      <line x1={80} y1={h - 116} x2={w - 80} y2={h - 116} stroke={P.line} strokeWidth={2} />
      {d.preacher ? (
        <text x={80} y={h - 74} fontFamily={SANS} fontSize={21} fontWeight={600} fill={P.ink}>
          Pregação · {d.preacher}
        </text>
      ) : null}
      {d.tags?.length ? (
        <text x={w - 80} y={h - 74} fontFamily={MONO} fontSize={16} fill={P.soft} textAnchor="end">
          {d.tags.map((t) => `#${t}`).join("  ")}
        </text>
      ) : null}
    </>
  );
}

/* ---------------------------------- ARTE ---------------------------------- */
function LayoutArte({ d, P }: { d: SermonDraft; P: Palette }) {
  const { w, h } = DIMS.arte;
  const cx = w / 2;
  const themeLines = wrap(d.theme || d.title, 16).slice(0, 4);
  const themeStart = h / 2 - (themeLines.length - 1) * 40 - 30;

  return (
    <>
      <rect x={0} y={0} width={w} height={h} fill={P.paper} />
      <rect
        x={44}
        y={44}
        width={w - 88}
        height={h - 88}
        rx={26}
        fill="none"
        stroke={P.line}
        strokeWidth={2}
      />

      {/* Topo — marca + igreja */}
      <Brandmark x={cx - 30} y={120} size={60} P={P} />
      <text
        x={cx}
        y={224}
        fontFamily={MONO}
        fontSize={15}
        fill={P.soft}
        textAnchor="middle"
        letterSpacing={3}
      >
        {(d.churchName || "IGREJA BATISTA ATOS").toUpperCase()}
      </text>

      {/* Tema central */}
      <text
        x={cx}
        y={themeStart}
        fontFamily={SERIF}
        fontSize={72}
        fontWeight={800}
        fill={P.ink}
        textAnchor="middle"
      >
        {themeLines.map((ln, i) => (
          <tspan key={i} x={cx} dy={i === 0 ? 0 : 80}>
            {ln}
          </tspan>
        ))}
      </text>

      {/* Régua + versículo */}
      <line
        x1={cx - 70}
        y1={themeStart + themeLines.length * 80 + 6}
        x2={cx + 70}
        y2={themeStart + themeLines.length * 80 + 6}
        stroke={P.ink}
        strokeWidth={3}
      />
      {d.base_verse ? (
        <TextLines
          text={d.base_verse}
          x={cx}
          y={themeStart + themeLines.length * 80 + 64}
          size={28}
          lh={36}
          family={SANS}
          fill={P.soft}
          italic
          anchor="middle"
          maxChars={40}
          maxLines={2}
        />
      ) : null}

      {/* Rodapé — pregador e data */}
      {d.preacher ? (
        <text
          x={cx}
          y={h - 150}
          fontFamily={SANS}
          fontSize={22}
          fontWeight={600}
          fill={P.ink}
          textAnchor="middle"
        >
          {d.preacher}
        </text>
      ) : null}
      <text
        x={cx}
        y={h - 116}
        fontFamily={MONO}
        fontSize={15}
        fill={P.soft}
        textAnchor="middle"
        letterSpacing={1}
      >
        {fmtDate(d.preached_on)}
      </text>
    </>
  );
}

/** Rasteriza um <svg> já renderizado para um PNG (2× por padrão). Reutilizável
 *  tanto para baixar quanto para publicar a arte no feed. */
export async function svgToPngBlob(
  svg: SVGSVGElement,
  w: number,
  h: number,
  scale = 2,
): Promise<Blob> {
  const xml = new XMLSerializer().serializeToString(svg);
  const svg64 = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(xml);
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = svg64;
  });
  const canvas = document.createElement("canvas");
  canvas.width = w * scale;
  canvas.height = h * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponível.");
  ctx.scale(scale, scale);
  ctx.drawImage(img, 0, 0, w, h);
  return await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Falha ao gerar PNG."))), "image/png"),
  );
}

export function SermonCanvas({
  draft,
  innerRef,
}: {
  draft: SermonDraft;
  innerRef?: Ref<SVGSVGElement>;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const { w, h } = DIMS[draft.template];
  const P = palette(draft.dark);
  const base =
    slugify(draft.theme || draft.title) + (draft.preached_on ? "-" + draft.preached_on : "");

  const setSvg = (el: SVGSVGElement | null) => {
    ref.current = el;
    if (typeof innerRef === "function") innerRef(el);
    else if (innerRef) (innerRef as { current: SVGSVGElement | null }).current = el;
  };

  const download = (filename: string, href: string) => {
    const a = document.createElement("a");
    a.href = href;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const exportSVG = () => {
    if (!ref.current) return;
    const xml = new XMLSerializer().serializeToString(ref.current);
    const blob = new Blob(['<?xml version="1.0" encoding="UTF-8"?>\n', xml], {
      type: "image/svg+xml",
    });
    const url = URL.createObjectURL(blob);
    download(base + ".svg", url);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  };

  const exportPNG = async () => {
    if (!ref.current) return;
    const blob = await svgToPngBlob(ref.current, w, h, 2);
    const url = URL.createObjectURL(blob);
    download(base + ".png", url);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  };

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-border bg-muted/30 shadow-sm">
        <svg
          ref={setSvg}
          xmlns="http://www.w3.org/2000/svg"
          width={w}
          height={h}
          viewBox={`0 0 ${w} ${h}`}
          style={{ width: "100%", height: "auto", display: "block" }}
          role="img"
          aria-label={`Pré-visualização: ${draft.theme || draft.title}`}
        >
          {draft.template === "mapa" && <LayoutMapa d={draft} P={P} />}
          {draft.template === "infografico" && <LayoutInfografico d={draft} P={P} />}
          {draft.template === "arte" && <LayoutArte d={draft} P={P} />}
        </svg>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={exportPNG}>
          <ImageIcon className="h-4 w-4" /> Baixar PNG
        </Button>
        <Button variant="outline" onClick={exportSVG}>
          <Code2 className="h-4 w-4" /> Baixar SVG
        </Button>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Download className="h-3.5 w-3.5" /> Alta resolução, pronto para Instagram e WhatsApp.
        </span>
      </div>
    </div>
  );
}
