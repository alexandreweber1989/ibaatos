import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Users,
  Music,
  Camera,
  Sparkles,
  HeartHandshake,
  Baby,
  Compass,
  Flame,
  UserSquare2,
  HelpCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, PageBody } from "@/components/app-shell";
import { useAuth } from "@/lib/auth-context";
import { MinistryMemberDialog } from "@/components/admin/ministry-dialog";

export const Route = createFileRoute("/_authenticated/ministerios/$slug")({
  head: ({ params }) => ({ meta: [{ title: `${params.slug} — Ministério · IB Atos` }] }),
  component: MinistryDetail,
});

function MinistryDetail() {
  const { slug } = Route.useParams();
  const { isMinistryAdmin } = useAuth();

  const { data: ministry, isLoading } = useQuery({
    queryKey: ["ministry", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ministries")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return data;
    },
  });

  const { data: members } = useQuery({
    queryKey: ["ministry-members", ministry?.id],
    enabled: !!ministry?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ministry_members")
        .select("id, function_name, user_id, profiles:profiles!inner(full_name, avatar_url)")
        .eq("ministry_id", ministry!.id);
      if (error) throw error;
      return data;
    },
  });

  if (isLoading || !ministry) {
    return (
      <PageBody>
        <div className="text-muted-foreground">Carregando ministério...</div>
      </PageBody>
    );
  }

  const canManage = isMinistryAdmin(ministry.id);

  return (
    <>
      <PageHeader
        eyebrow="Ministério"
        title={ministry.name}
        description={ministry.description ?? undefined}
        className="border-b-[3px] border-[var(--group-primary)]"
        actions={
          <Link
            to="/ministerios"
            className="inline-flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-[var(--group-primary)] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Todos os ministérios
          </Link>
        }
      />
      <PageBody>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 border border-border bg-card p-8 rounded-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div
                  className="font-mono text-[10px] uppercase tracking-widest mb-4"
                  style={{ color: "var(--group-primary)" }}
                >
                  Equipe
                </div>
                <div className="flex items-center gap-3 mb-6">
                  {(() => {
                    const Icon =
                      {
                        Music,
                        Camera,
                        Sparkles,
                        Users,
                        UserSquare2,
                        Flame,
                        Compass,
                        Baby,
                        HeartHandshake,
                      }[ministry.icon || ""] || HelpCircle;
                    return <Icon className="h-6 w-6" style={{ color: "var(--group-primary)" }} />;
                  })()}
                  <div className="font-serif text-2xl">{members?.length ?? 0} servos</div>
                </div>
              </div>
              {canManage && <MinistryMemberDialog ministryId={ministry.id} />}
            </div>
            {members && members.length > 0 ? (
              <ul className="divide-y divide-border">
                {members.map((m: any) => (
                  <li key={m.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="text-sm">{m.profiles?.full_name}</div>
                      {m.function_name && (
                        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">
                          {m.function_name}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhum servo cadastrado ainda.
                {canManage && " Use o botão acima para adicionar."}
              </p>
            )}
          </div>

          <aside className="border border-border bg-card p-8 rounded-sm space-y-4 text-sm">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Encontros
              </div>
              <div className="mt-1">{ministry.meeting_info ?? "A definir"}</div>
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Status
              </div>
              <div className="mt-1">{ministry.is_active ? "Ativo" : "Inativo"}</div>
            </div>
            {canManage && (
              <div className="pt-4 border-t border-border">
                <div className="font-mono text-[10px] uppercase tracking-widest text-primary">
                  Você é admin deste ministério
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  As ferramentas específicas (escalas, avisos, bibliotecas) chegam nas próximas
                  fases.
                </p>
              </div>
            )}
          </aside>
        </div>
      </PageBody>
    </>
  );
}
