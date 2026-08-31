import { createFileRoute } from "@tanstack/react-router";
import { displayMemberName } from "@/lib/igreja";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, PageBody } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth-context";
import { useAffiliations } from "@/lib/vinculos";
import { MemberFormDialog } from "@/components/membros/member-form-dialog";
import { MemberWizardDialog } from "@/components/membros/member-wizard-dialog";
import { RequestMemberDialog } from "@/components/membros/request-member-dialog";
import { MembershipRequestsPanel } from "@/components/membros/membership-requests-panel";
import { RowsSkeleton } from "@/components/ui/loading-states";
import { deleteMemberAccount } from "@/lib/membership.functions";
import { useServerFn } from "@tanstack/react-start";
import { MemberStats } from "@/components/membros/member-stats";
import { MemberCard } from "@/components/membros/member-card";
import { MemberDetailSheet } from "@/components/membros/member-detail-sheet";
import {
  DEFAULT_FILTERS,
  MemberToolbar,
  type MemberFilters,
} from "@/components/membros/member-toolbar";
import {
  MEMBERSHIP_STATUS,
  ageFrom,
  birthdayThisMonth,
  downloadCsv,
  formatDateBR,
  initialsOf,
  labelOf,
  matchesAgeBand,
} from "@/lib/membros";

type Profile = Record<string, any>;

/** Papéis administrativos que o admin geral pode conceder pela tela de membros. */
const GRANTABLE = [
  { role: "admin_livraria" as const, label: "Livraria" },
  { role: "admin_cantina" as const, label: "Cantina" },
  { role: "admin_ministerio" as const, label: "Ministério" },
  { role: "lider_mesa" as const, label: "Líder de mesa" },
  { role: "admin_geral" as const, label: "Admin geral" },
];

const PAGE_SIZE = 25;

export const Route = createFileRoute("/_authenticated/membros")({
  head: () => ({
    meta: [
      { title: "Membros — Igreja Batista Atos" },
      {
        name: "description",
        content:
          "Gestão completa da membresia da Igreja Batista Atos: fichas, filtros, permissões e indicadores.",
      },
      { property: "og:title", content: "Membros — Igreja Batista Atos" },
      {
        property: "og:description",
        content: "Cadastro, filtros e permissões da membresia da Igreja Batista Atos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MembrosPage,
});

function MembrosPage() {
  const { isAdmin, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <PageHeader
          eyebrow="Carregando..."
          title="Membros"
          description="Aguarde enquanto preparamos a listagem da membresia."
        />
        <PageBody>
          <RowsSkeleton rows={10} />
        </PageBody>
      </div>
    );
  }

  if (!loading && !isAdmin) {
    throw new Error("Acesso negado. Apenas administradores gerais podem gerenciar membros.");
  }

  const canRequest = true; // Sempre true se chegou aqui
  const removeMember = useServerFn(deleteMemberAccount);
  const qc = useQueryClient();
  const [filters, setFilters] = useState<MemberFilters>(DEFAULT_FILTERS);
  const [view, setView] = useState<"table" | "cards">("cards");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [editing, setEditing] = useState<Profile | null>(null);
  const [detail, setDetail] = useState<Profile | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      // Se não for admin, vê apenas a si mesmo ou nada dependendo da política
      // RLS cuidará do filtro no banco, mas mantemos o código limpo
      const { data, error } = await supabase.from("profiles").select("*").order("full_name");
      if (error) throw error;
      return data as Profile[];
    },
  });

  /** Vínculos (ministérios, mesas, redes) de todos os membros, para colorir os cards. */
  const { data: affiliations } = useAffiliations();

  const { data: roles } = useQuery({
    queryKey: ["all-roles"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("id, user_id, role");
      if (error) throw error;
      return data;
    },
  });

  const toggleRole = useMutation({
    mutationFn: async ({
      userId,
      role,
      existingId,
    }: {
      userId: string;
      role: (typeof GRANTABLE)[number]["role"];
      existingId?: string;
    }) => {
      const { error } = existingId
        ? await supabase.from("user_roles").delete().eq("id", existingId)
        : await supabase.from("user_roles").insert({ user_id: userId, role });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Permissões atualizadas.");
      qc.invalidateQueries({ queryKey: ["all-roles"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const bulkStatus = useMutation({
    mutationFn: async (status: string) => {
      if (!selected.length) throw new Error("Selecione ao menos um membro.");
      const { error } = await supabase
        .from("profiles")
        .update({ membership_status: status } as never)
        .in("id", selected);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Situação atualizada para os membros selecionados.");
      setSelected([]);
      qc.invalidateQueries({ queryKey: ["profiles"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  /** Exclusão definitiva de um membro (conta + ficha), restrita ao admin geral. */
  const removeMutation = useMutation({
    mutationFn: async (userId: string) => removeMember({ data: { user_id: userId } }),
    onSuccess: () => {
      toast.success("Membro removido da plataforma.");
      qc.invalidateQueries({ queryKey: ["profiles"] });
      qc.invalidateQueries({ queryKey: ["profiles-min"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    const term = filters.q.trim().toLowerCase();
    const rows = (data ?? []).filter((p) => {
      const haystack = [p.full_name, p.email, p.phone, p.city].join(" ").toLowerCase();
      if (term && !haystack.includes(term)) return false;
      if (filters.status !== "all" && (p.membership_status ?? "ativo") !== filters.status)
        return false;
      if (filters.gender !== "all" && p.gender !== filters.gender) return false;
      if (!matchesAgeBand(p.birth_date, filters.age)) return false;
      if (filters.baptized === "yes" && !p.is_baptized) return false;
      if (filters.baptized === "no" && p.is_baptized) return false;
      if (filters.birthday === "month" && !birthdayThisMonth(p.birth_date)) return false;
      return true;
    });
    const byAge = (p: Profile) => ageFrom(p.birth_date) ?? 999;
    return [...rows].sort((a, b) => {
      if (filters.sort === "recent")
        return String(b.created_at).localeCompare(String(a.created_at));
      if (filters.sort === "age_asc") return byAge(a) - byAge(b);
      if (filters.sort === "age_desc") return byAge(b) - byAge(a);
      return String(a.full_name ?? "").localeCompare(String(b.full_name ?? ""), "pt-BR");
    });
  }, [data, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const pageRows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const allChecked = pageRows.length > 0 && pageRows.every((p) => selected.includes(p.id));

  const canEdit = (p: Profile) => isAdmin || user?.id === p.id;

  const exportCsv = () =>
    downloadCsv(
      `membros-ibatos-${new Date().toISOString().slice(0, 10)}.csv`,
      filtered.map((p) => ({
        Nome: p.full_name,
        Email: p.email,
        Telefone: p.phone,
        Nascimento: formatDateBR(p.birth_date),
        Idade: ageFrom(p.birth_date) ?? "",
        Sexo: p.gender,
        Situacao: labelOf(MEMBERSHIP_STATUS, p.membership_status) ?? "",
        Batizado: p.is_baptized ? "Sim" : "Não",
        Cidade: p.city,
        MembroDesde: formatDateBR(p.member_since),
      })),
    );

  return (
    <>
      <PageHeader
        eyebrow="Corpo de Cristo"
        title="Membros"
        description="Gestão completa da membresia com visualização contextualizada e métricas em tempo real."
        actions={
          <div className="flex flex-wrap gap-2">
            {canRequest && <RequestMemberDialog />}
            {isAdmin && <MemberWizardDialog />}
          </div>
        }
      />
      <PageBody>
        {isAdmin && (
          <div className="mb-6">
            <MembershipRequestsPanel />
          </div>
        )}
        {isAdmin && <MemberStats members={(data ?? []) as any} />}

        <MemberToolbar
          filters={filters}
          onChange={(f) => {
            setFilters(f);
            setPage(1);
          }}
          onExport={exportCsv}
          view={view}
          onViewChange={setView}
          count={filtered.length}
        />

        {isAdmin && selected.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 border border-border bg-muted/40 rounded-sm px-4 py-3 mb-4">
            <span className="font-mono text-[10px] uppercase tracking-widest">
              {selected.length} selecionado{selected.length === 1 ? "" : "s"}
            </span>
            <div className="flex flex-wrap gap-1 ml-auto">
              {MEMBERSHIP_STATUS.map((s) => (
                <Button
                  key={s.value}
                  size="sm"
                  variant="outline"
                  disabled={bulkStatus.isPending}
                  onClick={() => bulkStatus.mutate(s.value)}
                >
                  {s.label}
                </Button>
              ))}
              <Button size="sm" variant="ghost" onClick={() => setSelected([])}>
                Limpar
              </Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <RowsSkeleton rows={PAGE_SIZE} />
        ) : view === "table" ? (
          <div className="border border-border bg-card rounded-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-left [&>th]:px-4 [&>th]:py-3 [&>th]:font-mono [&>th]:text-[10px] [&>th]:uppercase [&>th]:tracking-widest [&>th]:text-muted-foreground">
                  {isAdmin && (
                    <th className="w-10">
                      <Checkbox
                        checked={allChecked}
                        onCheckedChange={(v) =>
                          setSelected(
                            v === true
                              ? Array.from(new Set([...selected, ...pageRows.map((p) => p.id)]))
                              : selected.filter((id) => !pageRows.some((p) => p.id === id)),
                          )
                        }
                      />
                    </th>
                  )}
                  <th>Membro</th>
                  <th>Contato</th>
                  <th>Idade</th>
                  <th>Situação</th>
                  {isAdmin && <th>Permissões</th>}
                  <th className="text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((p) => {
                  const userRoles = roles?.filter((r) => r.user_id === p.id) ?? [];
                  return (
                    <tr
                      key={p.id}
                      className="border-t border-border hover:bg-muted/30 transition-colors"
                    >
                      {isAdmin && (
                        <td className="px-4 py-3">
                          <Checkbox
                            checked={selected.includes(p.id)}
                            onCheckedChange={(v) =>
                              setSelected((prev) =>
                                v === true ? [...prev, p.id] : prev.filter((id) => id !== p.id),
                              )
                            }
                          />
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <button
                          className="flex items-center gap-3 text-left"
                          onClick={() => setDetail(p)}
                        >
                          <span className="size-9 rounded-sm bg-muted grid place-items-center font-mono text-xs shrink-0">
                            {initialsOf(p.full_name)}
                          </span>
                          <span>
                            <span className="block font-medium hover:underline">
                              {displayMemberName(p.full_name, p.church_function, p.gender)}
                            </span>
                            <span className="block text-xs text-muted-foreground">
                              {p.city ?? "Cidade não informada"}
                            </span>
                          </span>
                        </button>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <span className="block">{p.email ?? "—"}</span>
                        <span className="block text-xs">{p.phone ?? "—"}</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {ageFrom(p.birth_date) ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            (p.membership_status ?? "ativo") === "ativo" ? "default" : "secondary"
                          }
                        >
                          {labelOf(MEMBERSHIP_STATUS, p.membership_status ?? "ativo")}
                        </Badge>
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="outline">
                                {userRoles.filter((r) => r.role !== "membro").length || "—"}{" "}
                                papel(is)
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              <DropdownMenuLabel>Conceder acesso</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {GRANTABLE.map(({ role, label }) => {
                                const existing = userRoles.find((r) => r.role === role);
                                return (
                                  <DropdownMenuItem
                                    key={role}
                                    onSelect={(e) => {
                                      e.preventDefault();
                                      toggleRole.mutate({
                                        userId: p.id,
                                        role,
                                        existingId: existing?.id,
                                      });
                                    }}
                                  >
                                    <span className="mr-2">{existing ? "✓" : "○"}</span>
                                    {label}
                                  </DropdownMenuItem>
                                );
                              })}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      )}

                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <Button size="sm" variant="ghost" onClick={() => setDetail(p)}>
                          Ver
                        </Button>
                        {canEdit(p) && (
                          <Button size="sm" variant="outline" onClick={() => setEditing(p)}>
                            Editar
                          </Button>
                        )}
                        {isAdmin && p.id !== user?.id && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            disabled={removeMutation.isPending}
                            onClick={() => {
                              if (window.confirm(`Excluir ${p.full_name} da plataforma?`))
                                removeMutation.mutate(p.id);
                            }}
                          >
                            Excluir
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {pageRows.length === 0 && (
                  <tr>
                    <td
                      colSpan={isAdmin ? 7 : 5}
                      className="px-4 py-10 text-center text-muted-foreground"
                    >
                      Nenhum membro encontrado com esses filtros.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {pageRows.map((p, i) => (
              <MemberCard
                key={p.id}
                profile={p}
                index={i}
                selectable={isAdmin}
                selected={selected.includes(p.id)}
                onSelect={(v) =>
                  setSelected((prev) => (v ? [...prev, p.id] : prev.filter((id) => id !== p.id)))
                }
                onOpen={() => setDetail(p)}
                onEdit={() => setEditing(p)}
                canEdit={canEdit(p)}
                affiliations={affiliations?.get(p.id) ?? []}
              />
            ))}
            {pageRows.length === 0 && (
              <p className="text-muted-foreground col-span-full py-10 text-center">
                Nenhum membro encontrado com esses filtros.
              </p>
            )}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Página {current} de {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={current === 1}
                onClick={() => setPage(current - 1)}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={current === totalPages}
                onClick={() => setPage(current + 1)}
              >
                Próxima
              </Button>
            </div>
          </div>
        )}

        <MemberDetailSheet
          profile={detail}
          open={!!detail}
          onOpenChange={(v) => !v && setDetail(null)}
          canSeeNotes={isAdmin || user?.id === detail?.id}
          onEdit={() => {
            if (detail && canEdit(detail)) setEditing(detail);
            setDetail(null);
          }}
        />
        <MemberFormDialog
          profile={editing}
          open={!!editing}
          onOpenChange={(v) => !v && setEditing(null)}
          canEditMembership={isAdmin}
        />
      </PageBody>
    </>
  );
}
