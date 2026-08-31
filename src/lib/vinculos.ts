import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Tipos de vínculo que um membro pode ter dentro da igreja. */
export type AffiliationKind = "ministerio" | "rede" | "mesa";

export interface Affiliation {
  kind: AffiliationKind;
  /** Nome curto exibido no badge. */
  label: string;
  /** Nome completo (tooltip). */
  title: string;
  /** Cor hex vinda do banco; usada para o badge e o realce do card. */
  color: string;
  /** Função exercida (quando houver). */
  role?: string | null;
}

/** Cor neutra caso o registro não tenha cor definida. */
const FALLBACK = "#525252";

/** Encurta nomes longos como "Mulheres — Rede Sabaoth" para o badge. */
function shortLabel(name: string) {
  const cut = name.split("—")[0]?.trim() || name;
  return cut.length > 18 ? `${cut.slice(0, 17)}…` : cut;
}

/**
 * Carrega, de uma só vez, todos os vínculos (ministérios, mesas e redes)
 * e devolve um mapa user_id -> lista de vínculos, evitando N+1 na lista de membros.
 */
export function useAffiliations() {
  return useQuery({
    queryKey: ["affiliations"],
    queryFn: async () => {
      const [mins, mesas] = await Promise.all([
        supabase.from("ministry_members").select("user_id, function_name, ministries(name, color)"),
        supabase.from("mesa_members").select("user_id, mesas(name, redes(name, color))"),
      ]);
      if (mins.error) throw mins.error;
      if (mesas.error) throw mesas.error;

      const map = new Map<string, Affiliation[]>();
      const push = (userId: string, a: Affiliation) => {
        const list = map.get(userId) ?? [];
        list.push(a);
        map.set(userId, list);
      };

      for (const row of (mins.data ?? []) as any[]) {
        const m = row.ministries;
        if (!m) continue;
        push(row.user_id, {
          kind: "ministerio",
          label: shortLabel(m.name),
          title: m.name,
          color: m.color || FALLBACK,
          role: row.function_name,
        });
      }

      for (const row of (mesas.data ?? []) as any[]) {
        const mesa = row.mesas;
        if (!mesa) continue;
        const rede = mesa.redes;
        push(row.user_id, {
          kind: "mesa",
          label: shortLabel(mesa.name),
          title: rede ? `${mesa.name} · ${rede.name}` : mesa.name,
          color: rede?.color || FALLBACK,
        });
        if (rede) {
          push(row.user_id, {
            kind: "rede",
            label: shortLabel(rede.name),
            title: rede.name,
            color: rede.color || FALLBACK,
          });
        }
      }

      // remove duplicatas de rede (membro em duas mesas da mesma rede)
      for (const [userId, list] of map) {
        const seen = new Set<string>();
        map.set(
          userId,
          list.filter((a) => {
            const key = `${a.kind}:${a.title}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          }),
        );
      }

      return map;
    },
    staleTime: 60_000,
  });
}

/** Estilos inline derivados da cor do vínculo (dados dinâmicos do banco). */
export function affiliationStyle(color: string) {
  return {
    color,
    borderColor: `color-mix(in oklab, ${color} 55%, transparent)`,
    backgroundColor: `color-mix(in oklab, ${color} 14%, transparent)`,
  } as const;
}
