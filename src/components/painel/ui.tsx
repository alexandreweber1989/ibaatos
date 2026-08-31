import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Bloco de seção do painel, com título mono e ação opcional. */
export function PanelSection({
  label,
  title,
  action,
  className,
  children,
}: {
  label: string;
  title: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        "border border-border bg-card/50 backdrop-blur-sm rounded-xl shadow-sm transition-all duration-300 hover:shadow-md hover:border-border/80",
        className,
      )}
    >
      <header className="flex flex-wrap items-end justify-between gap-3 px-4 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-border">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            {label}
          </div>
          <h2 className="font-serif text-2xl mt-1 leading-none">{title}</h2>
        </div>
        {action}
      </header>
      <div className="p-4 sm:p-6">{children}</div>
    </section>
  );
}

/** Cartão numérico compacto. */
export function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  to,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon: LucideIcon;
  to?: string;
}) {
  const inner = (
    <>
      <div className="flex items-start justify-between">
        <Icon className="h-4 w-4 text-primary" />
        {to && (
          <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        )}
      </div>
      <div className="font-serif text-2xl sm:text-3xl md:text-4xl mt-4 sm:mt-6 leading-none tabular-nums truncate">
        {value}
      </div>
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-2">
        {label}
      </div>
      {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
    </>
  );

  const base =
    "group border border-border bg-card/50 backdrop-blur-sm p-4 sm:p-6 rounded-xl transition-all duration-300 block hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5";

  if (to) {
    return (
      <Link to={to} className={cn(base, "hover:border-primary")}>
        {inner}
      </Link>
    );
  }
  return <div className={base}>{inner}</div>;
}

/** Estado vazio padronizado. */
export function EmptyLine({ children }: { children: ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}

/** Avatar tipográfico monocromático. */
export function Initials({ text, className }: { text: string; className?: string }) {
  return (
    <div
      className={cn(
        "h-9 w-9 shrink-0 rounded-sm border border-border bg-muted flex items-center justify-center font-mono text-[11px] tracking-wider",
        className,
      )}
    >
      {text}
    </div>
  );
}
