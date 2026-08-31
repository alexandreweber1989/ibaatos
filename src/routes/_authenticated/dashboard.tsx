import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users, CalendarDays, UtensilsCrossed, Sparkles, LayoutDashboard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { PageHeader, PageBody } from "@/components/app-shell";
import { StatTile } from "@/components/painel/ui";
import { StatTileSkeleton } from "@/components/ui/loading-states";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Painel Principal — IB Atos" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const { isAdmin } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [membros, ministerios, mesas, louvor, visitantes] = await Promise.all([
        supabase.from("profiles").select("id, created_at", { count: "exact" }),
        supabase.from("ministries").select("id", { count: "exact" }),
        supabase.from("mesas").select("id", { count: "exact" }),
        supabase
          .from("worship_schedules")
          .select("id", { count: "exact" })
          .eq("status", "rascunho"),
        supabase
          .from("visitor_checkins")
          .select("id", { count: "exact", head: true })
          .eq("status", "novo"),
      ]);

      // Novos membros no mês atual
      const firstDayOfMonth = new Date();
      firstDayOfMonth.setDate(1);
      firstDayOfMonth.setHours(0, 0, 0, 0);

      const novos = (membros.data ?? []).filter(
        (m) => new Date(m.created_at) >= firstDayOfMonth,
      ).length;

      return {
        ativos: membros.count ?? 0,
        novos,
        ministries: ministerios.count ?? 0,
        mesas: mesas.count ?? 0,
        pendentes: louvor.count ?? 0,
        v_pendentes: visitantes.count ?? 0,
      };
    },
  });

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        eyebrow="Resumo"
        title="Painel Principal"
        description="Acompanhamento rápido dos principais indicadores da igreja."
      />

      <PageBody>
        <div className="space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {isLoading ? (
              Array.from({ length: isAdmin ? 5 : 3 }).map((_, i) => <StatTileSkeleton key={i} />)
            ) : isAdmin ? (
              <>
                <StatTile
                  label="Membros ativos"
                  value={data?.ativos ?? "—"}
                  hint={data ? `${data.novos} novo(s) neste mês` : undefined}
                  icon={Users}
                  to="/membros"
                />
                <StatTile
                  label="Ministérios"
                  value={data?.ministries ?? "—"}
                  icon={Sparkles}
                  to="/ministerios"
                />
                <StatTile
                  label="Mesas ativas"
                  value={data?.mesas ?? "—"}
                  icon={UtensilsCrossed}
                  to="/mesas"
                />
                <StatTile
                  label="Escalas pendentes"
                  value={data?.pendentes ?? "—"}
                  hint="Aguardando confirmação"
                  icon={CalendarDays}
                  to="/louvor"
                />
                <StatTile
                  label="Visitantes"
                  value={data?.v_pendentes ?? "—"}
                  hint="Novos hoje (via QR Code)"
                  icon={Sparkles}
                  to="/visitantes"
                />
              </>
            ) : (
              <>
                <StatTile
                  label="Ministérios"
                  value={data?.ministries ?? "—"}
                  icon={Sparkles}
                  to="/ministerios"
                />
                <StatTile
                  label="Mesas ativas"
                  value={data?.mesas ?? "—"}
                  icon={UtensilsCrossed}
                  to="/mesas"
                />
                <StatTile
                  label="Escalas pendentes"
                  value={data?.pendentes ?? "—"}
                  hint="Aguardando confirmação"
                  icon={CalendarDays}
                  to="/louvor"
                />
              </>
            )}
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="border border-border bg-card p-8 rounded-sm">
              <h2 className="font-serif text-xl mb-4">Bem-vindo(a)</h2>
              <p className="text-muted-foreground leading-relaxed">
                Este é o centro de comando da Igreja Batista Atos. Aqui você tem acesso rápido aos
                dados de membresia, ministérios e escalas. Use a barra de pesquisa (Ctrl+K) para
                encontrar qualquer coisa rapidamente.
              </p>
            </div>
          </div>
        </div>
      </PageBody>
    </div>
  );
}
