import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FAMILY_RELATIONS, relationLabel, sortFamily, useFamilyLinks } from "@/lib/family";
import type { FamilyRelation } from "@/lib/family";

type Candidate = { id: string; full_name: string; birth_date: string | null };

/**
 * Editor de vínculos familiares. Ao salvar, o banco cria o vínculo inverso
 * automaticamente (cônjuge ↔ cônjuge, filho(a) ↔ pai/mãe).
 */
export function FamilyLinksEditor({ personId, canEdit }: { personId: string; canEdit: boolean }) {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Candidate | null>(null);
  const [relation, setRelation] = useState<FamilyRelation>("conjuge");

  const { data: links } = useFamilyLinks(personId);

  const { data: candidates } = useQuery({
    queryKey: ["family-candidates", search],
    enabled: canEdit && search.trim().length >= 2,
    queryFn: async (): Promise<Candidate[]> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, birth_date")
        .ilike("full_name", `%${search.trim()}%`)
        .order("full_name")
        .limit(8);
      if (error) throw error;
      return (data ?? []) as Candidate[];
    },
  });

  const linkedIds = useMemo(
    () => new Set([personId, ...(links ?? []).map((l) => l.relative_id)]),
    [links, personId],
  );

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["family-links"] });
  };

  const add = useMutation({
    mutationFn: async () => {
      if (!selected) throw new Error("Escolha a pessoa que será vinculada.");
      const { error } = await supabase
        .from("family_links")
        .insert({ person_id: personId, relative_id: selected.id, relation } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Vínculo familiar criado nos dois perfis.");
      setSelected(null);
      setSearch("");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("family_links").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Vínculo removido dos dois perfis.");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="sm:col-span-2 space-y-4">
      <ul className="space-y-2">
        {sortFamily(links ?? []).map((link) => (
          <li
            key={link.id}
            className="flex items-center gap-3 border border-border px-3 py-2 text-sm"
          >
            <Badge variant="secondary" className="shrink-0">
              {relationLabel(link.relation)}
            </Badge>
            <span className="flex-1 truncate">
              {link.relative?.full_name ?? "Membro"}
              {link.relation === "filho" && link.otherParent && (
                <span className="text-muted-foreground"> · com {link.otherParent.full_name}</span>
              )}
            </span>
            {canEdit && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => remove.mutate(link.id)}
                disabled={remove.isPending}
              >
                Remover
              </Button>
            )}
          </li>
        ))}
        {!links?.length && (
          <li className="text-sm text-muted-foreground">Nenhum parente vinculado ainda.</li>
        )}
      </ul>

      {canEdit && (
        <div className="space-y-2 border-t border-border pt-4">
          <div className="grid gap-2 sm:grid-cols-[1fr_180px_auto]">
            <Input
              value={selected ? selected.full_name : search}
              placeholder="Buscar membro pelo nome..."
              onChange={(e) => {
                setSelected(null);
                setSearch(e.target.value);
              }}
            />
            <Select value={relation} onValueChange={(v) => setRelation(v as FamilyRelation)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FAMILY_RELATIONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              onClick={() => add.mutate()}
              disabled={!selected || add.isPending}
            >
              Vincular
            </Button>
          </div>
          {!selected && search.trim().length >= 2 && (
            <ul className="border border-border divide-y divide-border max-h-48 overflow-y-auto">
              {(candidates ?? [])
                .filter((c) => !linkedIds.has(c.id))
                .map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                      onClick={() => setSelected(c)}
                    >
                      {c.full_name}
                    </button>
                  </li>
                ))}
              {!candidates?.length && (
                <li className="px-3 py-2 text-sm text-muted-foreground">
                  Nenhum membro encontrado.
                </li>
              )}
            </ul>
          )}
          <p className="text-xs text-muted-foreground">
            O parentesco inverso é criado automaticamente no perfil da outra pessoa.
          </p>
        </div>
      )}
    </div>
  );
}
