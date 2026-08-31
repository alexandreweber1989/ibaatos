import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, PageBody } from "@/components/app-shell";
import {
  ArrowUpRight,
  UserPlus,
  Music,
  Camera,
  Sparkles,
  Users,
  UserSquare2,
  Flame,
  Compass,
  Baby,
  HeartHandshake,
  HelpCircle,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { MinistryDialog, EditMinistryButton } from "@/components/admin/ministry-dialog";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/ministerios/")({
  head: () => ({ meta: [{ title: "Ministérios — IB Atos" }] }),
  component: MinistriesPage,
});

function MinistriesPage() {
  const { isAdmin } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["ministries"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ministries").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  return (
    <>
      <PageHeader
        eyebrow="Corpo em serviço"
        title="Ministérios"
        description={
          isAdmin
            ? "Os nove ministérios da Igreja Batista Atos, cada um com sua vocação e seus servos."
            : "Ministérios nos quais você serve."
        }
        actions={
          <div className="flex gap-2">
            {isAdmin && (
              <Button variant="outline" asChild>
                <Link to="/membros">
                  <UserPlus className="mr-2 h-4 w-4" /> Vincular Líderes
                </Link>
              </Button>
            )}
            {isAdmin && <MinistryDialog />}
          </div>
        }
      />
      <PageBody>
        {isLoading && <div className="text-muted-foreground">Carregando...</div>}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.map((m, i) => (
            <div key={m.id} className="relative h-full">
              {isAdmin && (
                <div className="absolute right-3 top-3 z-10">
                  <EditMinistryButton ministry={m} />
                </div>
              )}
              <Link
                to="/ministerios/$slug"
                params={{ slug: m.slug }}
                className="group block h-full border border-border bg-card rounded-sm p-6 hover:shadow-lg transition-all duration-300"
                style={{ borderTop: `4px solid ${m.color || "var(--primary)"}` }}
              >
                <div className="flex items-start justify-between mb-6 pr-10">
                  <div
                    className="h-12 w-12 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-500"
                    style={{ backgroundColor: m.color || "#3b82f6" }}
                  >
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
                        }[m.icon || ""] || HelpCircle;
                      return <Icon className="h-6 w-6" />;
                    })()}
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <h3 className="font-serif text-2xl leading-tight group-hover:text-primary transition-colors">
                  {m.name}
                </h3>
                {m.description && (
                  <p className="mt-3 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                    {m.description}
                  </p>
                )}
                <div className="mt-auto pt-6 flex items-center justify-between">
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] px-2 py-0.5 rounded-full bg-primary/5 text-primary/70">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  {m.meeting_info && (
                    <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground/60">
                      {m.meeting_info}
                    </span>
                  )}
                </div>
              </Link>
            </div>
          ))}
        </div>
      </PageBody>
    </>
  );
}
