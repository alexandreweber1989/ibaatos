import { useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { displayMemberName } from "@/lib/igreja";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { affiliationStyle, type Affiliation } from "@/lib/vinculos";
import {
  MEMBERSHIP_STATUS,
  ageFrom,
  birthdayThisMonth,
  formatDateBR,
  initialsOf,
  labelOf,
} from "@/lib/membros";

type Profile = Record<string, any>;

/**
 * Card de membro com micro-interações: seleção, expansão ao toque
 * e ações rápidas (ficha, edição, WhatsApp).
 */
export function MemberCard({
  profile,
  index,
  selectable,
  selected,
  onSelect,
  onOpen,
  onEdit,
  canEdit,
  affiliations = [],
}: {
  profile: Profile;
  index: number;
  selectable: boolean;
  selected: boolean;
  onSelect: (v: boolean) => void;
  onOpen: () => void;
  onEdit: () => void;
  canEdit: boolean;
  affiliations?: Affiliation[];
}) {
  const [expanded, setExpanded] = useState(false);
  /** Ondas do clique: cada uma se remove sozinha ao terminar a animação. */
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const [punch, setPunch] = useState(false);
  const rippleId = useRef(0);
  const age = ageFrom(profile.birth_date);
  const isBirthday = birthdayThisMonth(profile.birth_date);
  const active = (profile.membership_status ?? "ativo") === "ativo";
  const phone = String(profile.phone ?? "").replace(/\D/g, "");
  const ministries = affiliations.filter((a) => a.kind === "ministerio");
  const groups = affiliations.filter((a) => a.kind !== "ministerio");
  const engaged = affiliations.length > 0;
  /** Faixa multicolorida com as cores de todos os vínculos do membro. */
  const stripe = engaged
    ? affiliations.length === 1
      ? affiliations[0].color
      : `linear-gradient(180deg, ${affiliations
          .map(
            (a, i) =>
              `${a.color} ${(i / affiliations.length) * 100}%, ${a.color} ${((i + 1) / affiliations.length) * 100}%`,
          )
          .join(", ")})`
    : undefined;

  /** Dispara feedback tátil-visual (onda + "punch") a partir do ponto clicado. */
  const burst = (e: ReactMouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const id = ++rippleId.current;
    setRipples((prev) => [...prev, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    setPunch(true);
    window.setTimeout(() => setPunch(false), 340);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={(e) => {
        burst(e);
        setExpanded((v) => !v);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setExpanded((v) => !v);
        }
      }}
      className={cn(
        "group relative animate-fade-in cursor-pointer select-none overflow-hidden rounded-xl border bg-card/50 backdrop-blur-sm p-4",
        "transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:bg-card/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected
          ? "border-primary ring-2 ring-primary/30"
          : "border-border hover:border-primary/50",
        engaged && !selected && "shadow-md border-primary/20",
        punch && "member-punch",
      )}
      style={{
        animationDelay: `${Math.min(index, 12) * 30}ms`,
        ...(engaged
          ? {
              backgroundImage: `radial-gradient(120% 100% at 0% 0%, color-mix(in oklab, ${affiliations[0].color} 12%, transparent) 0%, transparent 60%)`,
            }
          : {}),
      }}
    >
      {/* ondas de clique */}
      {ripples.map((r) => (
        <span
          key={r.id}
          aria-hidden
          onAnimationEnd={() => setRipples((prev) => prev.filter((p) => p.id !== r.id))}
          style={{ left: r.x, top: r.y }}
          className="member-ripple pointer-events-none absolute -ml-16 -mt-16 size-32 rounded-full bg-primary/40"
        />
      ))}

      {/* faixa lateral: colorida pelos vínculos do membro, neutra se não tiver nenhum */}
      <span
        aria-hidden
        className={cn(
          "absolute left-0 top-0 h-full origin-top transition-all duration-300",
          engaged ? "w-1.5 scale-y-100" : "w-1 scale-y-0 group-hover:scale-y-100",
          !engaged && (active ? "bg-primary" : "bg-muted-foreground"),
        )}
        style={engaged ? { background: stripe } : undefined}
      />

      {selectable && (
        <div
          className={cn(
            "absolute right-3 top-3 transition-opacity duration-200",
            selected ? "opacity-100" : "opacity-0 group-hover:opacity-100",
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <Checkbox checked={selected} onCheckedChange={(v) => onSelect(v === true)} />
        </div>
      )}

      <div className="flex items-center gap-3">
        <span
          className={cn(
            "grid size-12 shrink-0 place-items-center rounded-sm font-serif text-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3",
            selected ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
          )}
          style={
            engaged && !selected
              ? {
                  boxShadow: `inset 0 0 0 2px ${affiliations[0].color}`,
                  color: affiliations[0].color,
                }
              : undefined
          }
        >
          {initialsOf(profile.full_name)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium leading-tight text-sm sm:text-base">
            {displayMemberName(profile.full_name, profile.church_function, profile.gender)}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {profile.email ?? profile.phone ?? "Sem contato"}
          </p>
        </div>
        {ministries.length > 0 && (
          <span className="flex shrink-0 -space-x-1" aria-hidden>
            {ministries.slice(0, 4).map((a, i) => (
              <span
                key={`${a.title}-${i}`}
                title={a.title}
                className="size-2.5 rounded-full ring-2 ring-card"
                style={{ backgroundColor: a.color }}
              />
            ))}
          </span>
        )}
      </div>

      {affiliations.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {ministries.map((a, i) => (
            <span
              key={`min-${a.title}-${i}`}
              title={a.role ? `${a.title} · ${a.role}` : a.title}
              style={affiliationStyle(a.color)}
              className="inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-widest"
            >
              <span className="size-1.5 rounded-full" style={{ backgroundColor: a.color }} />
              {a.label}
            </span>
          ))}
          {groups.map((a, i) => (
            <span
              key={`grp-${a.title}-${i}`}
              title={a.title}
              style={affiliationStyle(a.color)}
              className="inline-flex items-center gap-1 rounded-sm border border-dashed px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest"
            >
              {a.kind === "rede" ? "Rede" : "Mesa"} · {a.label}
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-1.5">
        <Badge variant={active ? "default" : "secondary"} className="text-[10px] sm:text-xs">
          {labelOf(MEMBERSHIP_STATUS, profile.membership_status ?? "ativo")}
        </Badge>
        {age !== null && (
          <Badge variant="outline" className="text-[10px] sm:text-xs">
            {age} anos
          </Badge>
        )}
        {profile.is_baptized && (
          <Badge variant="outline" className="text-[10px] sm:text-xs">
            Batizado
          </Badge>
        )}
        {isBirthday && <Badge className="animate-pulse">🎂 Aniversário do mês</Badge>}
      </div>

      {/* detalhes revelados ao tocar no card */}
      <div
        className={cn(
          "grid transition-all duration-300 ease-out",
          expanded ? "mt-3 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <dl className="space-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
            <div className="flex justify-between gap-2">
              <dt>Telefone</dt>
              <dd className="text-foreground">{profile.phone ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Nascimento</dt>
              <dd className="text-foreground">{formatDateBR(profile.birth_date) ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Cidade</dt>
              <dd className="text-foreground">{profile.city ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Membro desde</dt>
              <dd className="text-foreground">{formatDateBR(profile.member_since) ?? "—"}</dd>
            </div>
          </dl>

          <div className="mt-3 flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
            <Button
              size="sm"
              onClick={(e) => {
                burst(e);
                onOpen();
              }}
            >
              Ver ficha
            </Button>
            {canEdit && (
              <Button size="sm" variant="outline" onClick={onEdit}>
                Editar
              </Button>
            )}
            {phone && (
              <Button size="sm" variant="outline" asChild>
                <a href={`https://wa.me/55${phone}`} target="_blank" rel="noreferrer">
                  WhatsApp
                </a>
              </Button>
            )}
            {profile.email && (
              <Button size="sm" variant="ghost" asChild>
                <a href={`mailto:${profile.email}`}>E-mail</a>
              </Button>
            )}
          </div>
        </div>
      </div>

      <p
        className={cn(
          "mt-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground transition-opacity",
          expanded ? "opacity-0" : "opacity-60 group-hover:opacity-100",
        )}
      >
        Toque para ver ações
      </p>
    </div>
  );
}
