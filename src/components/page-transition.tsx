import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useIsFetching } from "@tanstack/react-query";

const LABELS: Record<string, string> = {
  "/dashboard": "Painel",
  "/agenda": "Agenda",
  "/ministerios": "Ministérios",
  "/louvor": "Louvor",
  "/redes": "Redes",
  "/mesas": "Mesas",
  "/membros": "Membros",
  "/igrejas": "Igrejas",
  "/livraria": "Livraria",
  "/cantina": "Cantina",
  "/perfil": "Perfil",
};

function labelFor(pathname: string): string {
  const key = Object.keys(LABELS).find((k) => pathname === k || pathname.startsWith(k + "/"));
  return key ? LABELS[key] : "Atos";
}

/** Variantes de transição disponíveis. */
const VARIANTS = ["cols", "rows", "wave", "iris", "split", "glitch"] as const;
type Variant = (typeof VARIANTS)[number];

/** Quantidade de peças e classe de entrada do conteúdo por variante. */
const PIECES: Record<Variant, number> = {
  cols: 7,
  rows: 5,
  wave: 6,
  iris: 1,
  split: 2,
  glitch: 9,
};

const ENTER_CLASS: Record<Variant, string> = {
  cols: "pt-enter",
  rows: "pt-enter-rows",
  wave: "pt-enter-wave",
  iris: "pt-enter-scale",
  split: "pt-enter-split",
  glitch: "pt-enter-glitch",
};

/** Tempo da fase de cobertura (tela fechando). Espelha o CSS. */
const COVER_MS = 300;
/** Tempo da fase de revelação (tela abrindo). Espelha o CSS. */
const REVEAL_MS = 340;
/** Silêncio de rede exigido antes de revelar (evita piscar entre requisições). */
const SETTLE_MS = 50;
/** Teto de segurança: nunca segura a cortina além disso. */
const MAX_HOLD_MS = 2500;

function pickVariant(exclude?: Variant): Variant {
  const pool = VARIANTS.filter((v) => v !== exclude);
  return pool[Math.floor(Math.random() * pool.length)];
}

interface Wipe {
  id: number;
  label: string;
  variant: Variant;
  phase: "cover" | "reveal";
}

/**
 * Transição editorial entre páginas, em duas fases:
 * 1. "cover" — a cortina fecha e fica parada enquanto a rota e as consultas
 *    da página ainda estão carregando;
 * 2. "reveal" — só depois que tudo terminou (ou após o teto de segurança)
 *    a cortina abre e o conteúdo entra.
 *
 * Assim a animação nunca termina antes da página estar pronta.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const routerBusy = useRouterState({
    select: (s) => s.status === "pending" || s.isLoading || s.isTransitioning,
  });

  const fetching = useIsFetching();
  const busy = routerBusy || fetching > 0;

  const previous = useRef(pathname);
  const lastVariant = useRef<Variant | undefined>(undefined);
  const [wipe, setWipe] = useState<Wipe | null>(null);
  /** Muda a cada revelação para reiniciar a animação de entrada do conteúdo. */
  const [revealKey, setRevealKey] = useState(pathname);

  // Dispara a cortina ao mudar de rota.
  useEffect(() => {
    if (previous.current === pathname) return;
    previous.current = pathname;
    const variant = pickVariant(lastVariant.current);
    lastVariant.current = variant;
    setWipe({
      id: Date.now(),
      label: labelFor(pathname),
      variant,
      phase: "cover",
    });
  }, [pathname]);

  // Segura a cortina fechada até a página terminar de carregar.
  useEffect(() => {
    if (!wipe || wipe.phase !== "cover") return;
    const id = wipe.id;
    const startedAt = Date.now();
    let settleTimer = 0;
    let raf = 0;

    const reveal = () => {
      setWipe((w) => (w && w.id === id ? { ...w, phase: "reveal" } : w));
      setRevealKey(`${pathname}-${id}`);
    };

    const tick = () => {
      const elapsed = Date.now() - startedAt;
      if (elapsed >= MAX_HOLD_MS) {
        reveal();
        return;
      }
      // A cortina precisa ao menos terminar de fechar.
      const coverRemaining = Math.max(0, COVER_MS - elapsed);
      if (busy) {
        raf = window.setTimeout(tick, 40);
        return;
      }
      settleTimer = window.setTimeout(reveal, coverRemaining + SETTLE_MS);
    };

    tick();
    return () => {
      window.clearTimeout(settleTimer);
      window.clearTimeout(raf);
    };
  }, [wipe, busy, pathname]);

  // Remove a cortina quando a revelação termina.
  useEffect(() => {
    if (!wipe || wipe.phase !== "reveal") return;
    const id = wipe.id;
    const timer = window.setTimeout(() => setWipe((w) => (w && w.id === id ? null : w)), REVEAL_MS);
    return () => window.clearTimeout(timer);
  }, [wipe]);

  const enterClass = wipe ? ENTER_CLASS[wipe.variant] : "pt-enter";
  const covering = wipe?.phase === "cover";

  return (
    <div className="relative">
      <div key={revealKey} className={covering ? undefined : enterClass}>
        {children}
      </div>

      {wipe && (
        <div
          key={wipe.id}
          className={`pt-overlay pt-v-${wipe.variant} pt-phase-${wipe.phase}`}
          aria-hidden="true"
        >
          <div className="pt-pieces">
            {Array.from({ length: PIECES[wipe.variant] }).map((_, i) => (
              <span key={i} className="pt-piece" style={{ "--i": i } as React.CSSProperties} />
            ))}
          </div>
          <div className="pt-word">
            <span className="pt-word-mark">Igreja Batista Atos</span>
            <span className="pt-word-title">{wipe.label}</span>
            <span className="pt-word-rule" />
          </div>
        </div>
      )}
    </div>
  );
}
