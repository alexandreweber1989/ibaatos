import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { churchFunctionRank, displayMemberName } from "@/lib/igreja";

export interface GroupPerson {
  userId: string;
  /** Nome já com o prefixo de tratamento (Pr., Apasc., Líder). */
  name: string;
  /** Função exercida dentro do grupo (não a função geral na igreja). */
  role: string;
}

export interface GroupStats {
  total: number;
  /** Pastores, apascentadores e líderes do grupo, em ordem de precedência. */
  leaders: GroupPerson[];
}

const EMPTY: GroupStats = { total: 0, leaders: [] };
const LEADER_ROLES = new Set([
  "pastor",
  "apascentador",
  "lider",
  "lider_mesa",
  "lider_rede",
  "lider_ministerio",
  "obreiro",
  "diacono",
]);

/** Papel exercido no grupo tem prioridade; o card mostra quem lidera. */
function collect(rows: any[], groupKey: string): Record<string, GroupStats> {
  const map: Record<string, GroupStats> = {};
  for (const row of rows) {
    const key = row[groupKey] as string | null;
    if (!key) continue;
    const stats = (map[key] ??= { total: 0, leaders: [] });
    stats.total += 1;
    if (LEADER_ROLES.has(row.role)) {
      stats.leaders.push({
        userId: row.user_id,
        name: displayMemberName(row.profiles?.full_name, row.role, row.profiles?.gender),
        role: row.role,
      });
    }
  }
  for (const stats of Object.values(map)) {
    stats.leaders.sort(
      (a, b) =>
        churchFunctionRank(a.role) - churchFunctionRank(b.role) ||
        a.name.localeCompare(b.name, "pt-BR"),
    );
  }
  return map;
}

/**
 * Carrega, em uma única consulta por tabela, o total de pessoas e a liderança
 * de cada rede e de cada mesa — evitando N+1 nas listagens.
 */
export function useGroupStats() {
  return useQuery({
    queryKey: ["group-stats"],
    queryFn: async () => {
      const [redes, mesas] = await Promise.all([
        supabase
          .from("rede_members")
          .select("rede_id, user_id, role, profiles:profiles!user_id(full_name, gender)"),
        supabase
          .from("mesa_members")
          .select("mesa_id, user_id, role, profiles:profiles!user_id(full_name, gender)"),
      ]);
      if (redes.error) throw redes.error;
      if (mesas.error) throw mesas.error;
      return {
        redes: collect((redes.data ?? []) as any[], "rede_id"),
        mesas: collect((mesas.data ?? []) as any[], "mesa_id"),
      };
    },
  });
}

/** Acesso seguro às estatísticas de um grupo, com valor neutro quando ausente. */
export function statsOf(map: Record<string, GroupStats> | undefined, id: string): GroupStats {
  return map?.[id] ?? EMPTY;
}
