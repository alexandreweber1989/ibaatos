import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Pin } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { PanelSection, EmptyLine } from "@/components/painel/ui";
import { Button } from "@/components/ui/button";
import { CATEGORY_LABEL, formatData, isVigente, useAvisos, useMinhasLeituras } from "@/lib/avisos";

/** Os três avisos mais relevantes para a pessoa logada (fixados primeiro). */
export function AvisosRecentes() {
  const { user } = useAuth();
  const { data: avisos = [], isPending } = useAvisos();
  const { data: lidos } = useMinhasLeituras(user?.id);

  const destaque = avisos.filter(isVigente).slice(0, 3);

  return (
    <PanelSection
      label="Comunicação"
      title="Avisos recentes"
      action={
        <Button asChild variant="outline" size="sm">
          <Link to="/avisos">
            Ver mural <ArrowUpRight className="h-4 w-4" />
          </Link>
        </Button>
      }
    >
      {isPending ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-muted/50 animate-pulse" />
          ))}
        </div>
      ) : destaque.length === 0 ? (
        <EmptyLine>Nenhum aviso publicado para você no momento.</EmptyLine>
      ) : (
        <ul className="space-y-3">
          {destaque.map((a) => (
            <li key={a.id}>
              <Link
                to="/avisos"
                className="block rounded-lg border border-border p-4 transition-all duration-200 hover:border-primary/40 hover:shadow-sm"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
                    {CATEGORY_LABEL[a.category]}
                  </span>
                  {a.is_pinned && <Pin className="h-3 w-3 text-primary" />}
                  <span className="text-xs text-muted-foreground">
                    {formatData(a.published_at ?? a.created_at)}
                  </span>
                  {!lidos?.has(a.id) && (
                    <span
                      className="ml-auto h-2 w-2 rounded-full bg-primary"
                      aria-label="Não lido"
                    />
                  )}
                </div>
                <div className="font-serif text-lg mt-1 leading-tight">{a.title}</div>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{a.body}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PanelSection>
  );
}
