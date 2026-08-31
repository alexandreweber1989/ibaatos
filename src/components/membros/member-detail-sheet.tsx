import type { ReactNode } from "react";
import { displayMemberName } from "@/lib/igreja";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FamilySummary } from "./family-summary";
import { MemberTimeline } from "./member-timeline";
import { MemberCredentialsDialog } from "./credentials-dialog";
import { MemberRolesDialog } from "./roles-dialog";
import { OnboardingTracker } from "./onboarding-tracker";
import { PastoralNotes } from "./pastoral-notes";
import { useAuth } from "@/lib/auth-context";

import {
  MARITAL_STATUS,
  MEMBERSHIP_STATUS,
  MEMBERSHIP_TYPES,
  ageFrom,
  formatDateBR,
  initialsOf,
  labelOf,
} from "@/lib/membros";

type Profile = Record<string, any>;

function Line({ label, value }: { label: string; value?: ReactNode }) {
  if (value === null || value === undefined || value === "" || value === false) return null;
  return (
    <div className="flex flex-col sm:flex-row gap-1 sm:gap-3 py-1.5 text-sm border-b border-border/50 last:border-0">
      <span className="font-mono text-[9px] sm:text-[10px] uppercase tracking-widest text-muted-foreground w-full sm:w-40 shrink-0 pt-1">
        {label}
      </span>
      <span className="flex-1 break-words">{value}</span>
    </div>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-1">
      <h4 className="font-mono text-[10px] uppercase tracking-widest text-primary mb-2">{title}</h4>
      {children}
    </section>
  );
}

/** Painel lateral com a ficha completa do membro e seus vínculos. */
export function MemberDetailSheet({
  profile,
  open,
  onOpenChange,
  onEdit,
  canSeeNotes,
}: {
  profile: Profile | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onEdit: () => void;
  canSeeNotes: boolean;
}) {
  const id = profile?.id as string | undefined;
  const { isAdmin, isPastoral, isLeadership } = useAuth();

  const { data: links } = useQuery({
    queryKey: ["member-links", id],
    enabled: !!id && open,
    queryFn: async () => {
      const [mesas, mins, roles] = await Promise.all([
        supabase.from("mesa_members").select("mesas(name)").eq("user_id", id!),
        supabase
          .from("ministry_members")
          .select("function_name, ministries(name)")
          .eq("user_id", id!),
        supabase.from("user_roles").select("role").eq("user_id", id!),
      ]);
      return {
        mesas: (mesas.data ?? []).map((m: any) => m.mesas?.name).filter(Boolean) as string[],
        ministries: (mins.data ?? []).map((m: any) =>
          [m.ministries?.name, m.function_name].filter(Boolean).join(" · "),
        ) as string[],
        roles: (roles.data ?? []).map((r: any) => r.role as string),
      };
    },
  });

  if (!profile) return null;
  const address = [
    profile.street,
    profile.street_number,
    profile.neighborhood,
    profile.city,
    profile.state,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        key={id}
        className="ficha-sweep w-full sm:max-w-xl overflow-y-auto overflow-x-hidden"
      >
        <SheetHeader className="ficha-wipe text-left">
          <div className="flex items-center gap-4">
            <div className="ficha-avatar size-14 rounded-sm bg-primary text-primary-foreground grid place-items-center font-serif text-xl">
              {initialsOf(profile.full_name)}
            </div>
            <div className="min-w-0">
              <SheetTitle className="font-serif text-2xl truncate">
                {displayMemberName(profile.full_name, profile.church_function, profile.gender)}
              </SheetTitle>
              <SheetDescription className="truncate">
                {profile.email ?? "Sem e-mail"}
              </SheetDescription>
            </div>
          </div>
          <div className="ficha-stagger flex flex-wrap gap-1.5 pt-3">
            <Badge variant="outline">
              {labelOf(MEMBERSHIP_STATUS, profile.membership_status) ?? "Sem situação"}
            </Badge>
            {profile.is_baptized && <Badge variant="secondary">Batizado</Badge>}
            {ageFrom(profile.birth_date) !== null && (
              <Badge variant="secondary">{ageFrom(profile.birth_date)} anos</Badge>
            )}
            {links?.roles.map((r, ri) => (
              <Badge key={`${r}-${ri}`}>{r.replace("admin_", "admin ").replace("_", " ")}</Badge>
            ))}
          </div>
        </SheetHeader>

        <div className="ficha-stagger space-y-6 py-6">
          <Block title="Contato">
            <Line label="Telefone" value={profile.phone} />
            <Line label="Nascimento" value={formatDateBR(profile.birth_date)} />
            <Line label="Endereço" value={address} />
            <Line label="CEP" value={profile.zip_code} />
            <Line
              label="Emergência"
              value={
                profile.emergency_contact_name
                  ? `${profile.emergency_contact_name} — ${profile.emergency_contact_phone ?? ""} ${
                      profile.emergency_contact_relation
                        ? `(${profile.emergency_contact_relation})`
                        : ""
                    }`
                  : null
              }
            />
          </Block>
          <Separator />
          <Block title="Pessoal">
            <Line label="Estado civil" value={labelOf(MARITAL_STATUS, profile.marital_status)} />
            <Line label="Cônjuge" value={profile.spouse_name} />
            <Line
              label="Filhos"
              value={profile.has_children ? `${profile.children_count ?? 0}` : null}
            />
            <Line label="Profissão" value={profile.profession} />
            <Line label="Escolaridade" value={profile.education} />
          </Block>
          <Separator />
          <Block title="Família">{id && <FamilySummary personId={id} enabled={open} />}</Block>
          <Separator />
          <Block title="Vida cristã">
            <Line label="Conversão" value={formatDateBR(profile.conversion_date)} />
            <Line label="Batismo" value={formatDateBR(profile.baptism_date)} />
            <Line label="Igreja do batismo" value={profile.baptism_church} />
            <Line label="Membro desde" value={formatDateBR(profile.member_since)} />
            <Line
              label="Forma de entrada"
              value={labelOf(MEMBERSHIP_TYPES, profile.membership_type)}
            />
            <Line
              label="Cursos"
              value={
                Array.isArray(profile.courses) && profile.courses.length
                  ? profile.courses.join(", ")
                  : null
              }
            />
            <Line label="Dons" value={profile.gifts} />
            <Line label="Disponibilidade" value={profile.availability} />
          </Block>
          <Separator />
          <Block title="Trilha de integração">
            {id && <OnboardingTracker personId={id} enabled={open} canEdit={isLeadership} />}
          </Block>
          <Separator />
          <Block title="Caminhada na igreja">
            {id && <MemberTimeline personId={id} enabled={open} />}
          </Block>
          <Separator />
          <Block title="Vínculos">
            <Line label="Mesas" value={links?.mesas.length ? links.mesas.join(", ") : "—"} />
            <Line
              label="Ministérios"
              value={links?.ministries.length ? links.ministries.join(" | ") : "—"}
            />
          </Block>
          {isPastoral && (
            <>
              <Separator />
              <Block title="Histórico pastoral">
                {id && <PastoralNotes personId={id} enabled={open} />}
              </Block>
            </>
          )}

          {canSeeNotes && (
            <>
              <Separator />
              <Block title="Saúde e observações">
                <Line label="Tipo sanguíneo" value={profile.blood_type} />
                <Line label="Alergias" value={profile.allergies} />
                <Line label="Saúde" value={profile.health_notes} />
                <Line label="Notas pastorais" value={profile.notes} />
              </Block>
            </>
          )}
        </div>

        <div className="flex flex-wrap gap-2 sticky bottom-0 bg-background py-4 border-t border-border">
          <Button onClick={onEdit} className="flex-1 min-w-32">
            Editar ficha
          </Button>
          {isAdmin && id && (
            <MemberCredentialsDialog
              userId={id}
              currentEmail={profile.email}
              fullName={profile.full_name}
            />
          )}
          {isAdmin && id && <MemberRolesDialog userId={id} fullName={profile.full_name} />}
          {profile.phone && (
            <Button variant="outline" asChild>
              <a
                href={`https://wa.me/55${String(profile.phone).replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
              >
                WhatsApp
              </a>
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
