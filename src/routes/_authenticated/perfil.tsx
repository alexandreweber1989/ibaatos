import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, PageBody } from "@/components/app-shell";
import { useAuth } from "@/lib/auth-context";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MemberFormDialog } from "@/components/membros/member-form-dialog";
import { ProfileForm } from "@/components/membros/profile-form";
import { AtivarPush } from "@/components/notificacoes/ativar-push";

import {
  MARITAL_STATUS,
  MEMBERSHIP_STATUS,
  MEMBERSHIP_TYPES,
  formatDateBR,
  labelOf,
} from "@/lib/membros";

export const Route = createFileRoute("/_authenticated/perfil")({
  head: () => ({ meta: [{ title: "Meu perfil — IB Atos" }] }),
  component: PerfilPage,
});

function PerfilPage() {
  const { user, roles, isAdmin } = useAuth();
  const [editing, setEditing] = useState(false);

  /** Assume a administração geral — a função só concede se ainda não existir admin. */
  const claimAdmin = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Sessão não encontrada.");
      const { data, error } = await supabase.rpc("claim_first_admin", { _user_id: user.id });
      if (error) throw error;
      if (!data) throw new Error("Já existe um administrador geral definido.");
    },
    onSuccess: () => {
      toast.success("Você agora é admin geral. Recarregando permissões...");
      window.location.reload();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const roleLabel: Record<string, string> = {
    admin_geral: "Admin geral",
    admin_ministerio: "Admin de ministério",
    lider_mesa: "Líder de mesa",
    membro: "Membro",
  };

  return (
    <>
      <PageHeader
        eyebrow="Sua conta"
        title="Meu perfil"
        description={profile?.full_name ?? user?.email ?? ""}
      />
      <PageBody>
        <div className="mb-8">
          <AtivarPush />
        </div>
        <div className="mb-8">
          <ProfileForm profile={profile ?? null} userId={user?.id} />
        </div>
        <div className="mb-6">
          <Button variant="outline" onClick={() => setEditing(true)}>
            Abrir ficha em janela
          </Button>
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="border border-border bg-card p-8 rounded-sm space-y-4 text-sm">
            <div className="font-mono text-[10px] uppercase tracking-widest text-primary">
              Dados pessoais
            </div>
            <Row label="Nome" value={profile?.full_name} />
            <Row label="E-mail" value={profile?.email ?? user?.email} />
            <Row label="Telefone" value={profile?.phone} />
            <Row label="Aniversário" value={formatDateBR(profile?.birth_date)} />
            <Row label="Estado civil" value={labelOf(MARITAL_STATUS, profile?.marital_status)} />
            <Row label="Cônjuge" value={profile?.spouse_name} />
            <Row label="Profissão" value={profile?.profession} />
            <Row
              label="Endereço"
              value={
                [
                  profile?.street,
                  profile?.street_number,
                  profile?.neighborhood,
                  profile?.city,
                  profile?.state,
                ]
                  .filter(Boolean)
                  .join(", ") || null
              }
            />
            <Row
              label="Emergência"
              value={
                profile?.emergency_contact_name
                  ? `${profile.emergency_contact_name} — ${profile.emergency_contact_phone ?? ""}`
                  : null
              }
            />
          </div>
          <div className="border border-border bg-card p-8 rounded-sm space-y-4 text-sm">
            <div className="font-mono text-[10px] uppercase tracking-widest text-primary">
              Vida cristã
            </div>
            <Row label="Conversão" value={formatDateBR(profile?.conversion_date)} />
            <Row label="Batizado" value={profile?.is_baptized ? "Sim" : "Não"} />
            <Row label="Data do batismo" value={formatDateBR(profile?.baptism_date)} />
            <Row label="Membro desde" value={formatDateBR(profile?.member_since)} />
            <Row
              label="Forma de entrada"
              value={labelOf(MEMBERSHIP_TYPES, profile?.membership_type)}
            />
            <Row label="Situação" value={labelOf(MEMBERSHIP_STATUS, profile?.membership_status)} />
            <Row
              label="Cursos"
              value={profile?.courses?.length ? profile.courses.join(", ") : null}
            />
            <Row label="Dons" value={profile?.gifts} />
            <Row label="Disponibilidade" value={profile?.availability} />
          </div>
          <div className="border border-border bg-card p-8 rounded-sm">
            <div className="font-mono text-[10px] uppercase tracking-widest text-primary mb-4">
              Seus papéis
            </div>
            {isAdmin && (
              <div className="mb-4 flex items-center gap-2 text-primary">
                <ShieldCheck className="h-4 w-4" />
                <span className="font-serif text-lg">Admin geral</span>
              </div>
            )}
            <ul className="space-y-2 text-sm">
              {roles.map((r, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between border-b border-border pb-2"
                >
                  <span>{roleLabel[r.role] ?? r.role}</span>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {r.ministry_id ? "ministério" : r.mesa_id ? "mesa" : "global"}
                  </span>
                </li>
              ))}
            </ul>
            {!isAdmin && (
              <div className="mt-6 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Ainda não há administrador geral definido nesta plataforma. Se esta conta é a da
                  liderança, assuma a administração para liberar os botões de criação em todas as
                  páginas.
                </p>
                <Button
                  className="mt-3"
                  variant="outline"
                  disabled={claimAdmin.isPending}
                  onClick={() => claimAdmin.mutate()}
                >
                  <ShieldCheck className="h-4 w-4" /> Tornar-me admin geral
                </Button>
              </div>
            )}
          </div>
        </div>
        <MemberFormDialog
          profile={profile ?? null}
          open={editing}
          onOpenChange={setEditing}
          canEditMembership={isAdmin}
        />
      </PageBody>
    </>
  );
}

function Row({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex items-baseline justify-between border-b border-border pb-3">
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div>{value || <span className="text-muted-foreground">—</span>}</div>
    </div>
  );
}
