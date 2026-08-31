import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CHURCH_FUNCTION_LABEL } from "@/lib/igreja";
import type { GroupStats } from "@/lib/use-grupos";

/**
 * Faixa resumo de um grupo (rede ou mesa): quantas pessoas e quem lidera.
 * Mantém as listagens úteis sem precisar abrir cada diálogo.
 */
export function GroupSummary({ stats, emptyHint }: { stats: GroupStats; emptyHint: string }) {
  if (stats.total === 0) {
    return <p className="text-sm text-muted-foreground">{emptyHint}</p>;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        <Users className="size-3.5" aria-hidden />
        {stats.total} {stats.total === 1 ? "pessoa" : "pessoas"}
      </div>
      {stats.leaders.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {stats.leaders.map((person) => (
            <Badge key={person.userId} variant="secondary" className="font-normal">
              {person.name}
              <span className="ml-1 text-muted-foreground">
                · {CHURCH_FUNCTION_LABEL[person.role] ?? person.role}
              </span>
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Sem liderança definida.</p>
      )}
    </div>
  );
}
