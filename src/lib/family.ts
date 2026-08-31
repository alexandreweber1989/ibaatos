import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Tipos de parentesco disponíveis (espelhados automaticamente no banco). */
export const FAMILY_RELATIONS = [
  { value: "conjuge", label: "Cônjuge" },
  { value: "filho", label: "Filho(a)" },
  { value: "pai", label: "Pai" },
  { value: "mae", label: "Mãe" },
  { value: "irmao", label: "Irmão(ã)" },
  { value: "avo", label: "Avô/Avó" },
  { value: "neto", label: "Neto(a)" },
  { value: "outro", label: "Outro parente" },
] as const;

export type FamilyRelation = (typeof FAMILY_RELATIONS)[number]["value"];

export function relationLabel(relation: string): string {
  return FAMILY_RELATIONS.find((r) => r.value === relation)?.label ?? "Parente";
}

export type FamilyLink = {
  id: string;
  person_id: string;
  relative_id: string;
  relation: FamilyRelation;
  note: string | null;
  relative: {
    id: string;
    full_name: string;
    gender: string | null;
    birth_date: string | null;
  } | null;
  /** Somente para filhos: o outro genitor cadastrado, quando existir. */
  otherParent?: { id: string; full_name: string } | null;
};

const RELATIVE_SELECT =
  "id, person_id, relative_id, relation, note, relative:profiles!family_links_relative_id_fkey(id, full_name, gender, birth_date)";

/**
 * Carrega os vínculos familiares de um membro. Para cada filho(a), descobre o
 * outro genitor cadastrado — assim é possível saber se a criança é do casal
 * atual ou de um relacionamento anterior.
 */
export function useFamilyLinks(personId?: string, enabled = true) {
  return useQuery({
    queryKey: ["family-links", personId],
    enabled: !!personId && enabled,
    queryFn: async (): Promise<FamilyLink[]> => {
      const { data, error } = await supabase
        .from("family_links")
        .select(RELATIVE_SELECT)
        .eq("person_id", personId!);
      if (error) throw error;

      const links = (data ?? []) as unknown as FamilyLink[];
      const childIds = links.filter((l) => l.relation === "filho").map((l) => l.relative_id);
      if (childIds.length) {
        const { data: parents } = await supabase
          .from("family_links")
          .select(
            "person_id, relative_id, relation, relative:profiles!family_links_relative_id_fkey(id, full_name)",
          )
          .in("person_id", childIds)
          .in("relation", ["pai", "mae"]);
        for (const link of links) {
          if (link.relation !== "filho") continue;
          const other = (parents ?? []).find(
            (p: any) => p.person_id === link.relative_id && p.relative_id !== personId,
          ) as any;
          link.otherParent = other?.relative ?? null;
        }
      }
      return links;
    },
  });
}

/** Ordena por relevância pastoral: cônjuge, filhos, pais, demais. */
const ORDER: Record<string, number> = {
  conjuge: 0,
  filho: 1,
  pai: 2,
  mae: 3,
  irmao: 4,
  avo: 5,
  neto: 6,
  outro: 7,
};
export function sortFamily(links: FamilyLink[]): FamilyLink[] {
  return [...links].sort(
    (a, b) =>
      (ORDER[a.relation] ?? 9) - (ORDER[b.relation] ?? 9) ||
      (a.relative?.full_name ?? "").localeCompare(b.relative?.full_name ?? ""),
  );
}
