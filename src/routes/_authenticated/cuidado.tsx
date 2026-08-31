import { PageHeader, PageBody } from "@/components/app-shell";
import { createFileRoute } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PrayerRequestForm } from "@/components/cuidado/prayer-request-form";
import { SocialAssistanceForm } from "@/components/cuidado/social-assistance-form";
import { PrayerManagement } from "@/components/cuidado/prayer-management";
import { SocialManagement } from "@/components/cuidado/social-management";
import { DonationWidget } from "@/components/cuidado/donation-widget";
import { useAuth } from "@/lib/auth-context";

import { HeartPulse, HandHelping, ClipboardList, ShieldCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/cuidado")({
  head: () => ({
    meta: [
      { title: "Cuidado & Oração — Igreja Batista Atos" },
      {
        name: "description",
        content:
          "Canal privado para pedidos de oração, aconselhamento e assistência social Atos de Amor.",
      },
    ],
  }),
  component: CuidadoPage,
});

function CuidadoPage() {
  const { isAdmin, isLeadership } = useAuth();

  const { data: myRequests } = useQuery({
    queryKey: ["my-cuidado-requests"],
    queryFn: async () => {
      const [pr, sr] = await Promise.all([
        supabase
          .from("prayer_requests")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("social_assistance_requests")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5),
      ]);
      return { prayers: pr.data || [], social: sr.data || [] };
    },
  });

  return (
    <>
      <PageHeader
        eyebrow="Acolhimento"
        title="Cuidado & Oração"
        description="Um canal direto para oração, aconselhamento e apoio social com total privacidade."
      />
      <PageBody>
        <Tabs defaultValue="request" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="request" className="gap-2">
              <HeartPulse className="h-4 w-4" />
              Solicitar
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <ClipboardList className="h-4 w-4" />
              Meu Histórico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="request" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="flex items-center gap-3 border-b pb-4">
                    <HeartPulse className="h-6 w-6 text-primary" />
                    <h2 className="text-xl font-serif font-medium">Oração e Aconselhamento</h2>
                  </div>
                  <PrayerRequestForm />
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-3 border-b pb-4">
                    <HandHelping className="h-6 w-6 text-rose-600" />
                    <h2 className="text-xl font-serif font-medium">
                      Assistência Social (Atos de Amor)
                    </h2>
                  </div>
                  <SocialAssistanceForm />
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-3 border-b pb-4">
                  <HeartPulse className="h-6 w-6 text-rose-600" />
                  <h2 className="text-xl font-serif font-medium">Contribua</h2>
                </div>
                <DonationWidget />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-8">
            <div className="max-w-3xl mx-auto space-y-6">
              <h3 className="font-serif text-lg border-b pb-2">Meus Pedidos Recentes</h3>

              {!myRequests?.prayers.length && !myRequests?.social.length ? (
                <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
                  Você ainda não realizou nenhuma solicitação.
                </div>
              ) : (
                <div className="space-y-4">
                  {myRequests?.prayers.map((req) => (
                    <div key={req.id} className="p-4 border rounded-lg bg-card shadow-sm space-y-3">
                      <div className="flex justify-between items-start">
                        <Badge variant="outline">
                          {req.category === "prayer" ? "Oração" : "Aconselhamento"}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground uppercase font-mono">
                          {format(new Date(req.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      </div>
                      <p className="text-sm line-clamp-2 italic text-muted-foreground">
                        "{req.content}"
                      </p>
                      {req.status === "replied" && (
                        <div className="mt-2 p-3 bg-primary/5 border border-primary/10 rounded-md">
                          <p className="text-xs font-semibold text-primary mb-1 flex items-center gap-1">
                            <ShieldCheck className="h-3 w-3" /> Resposta do seu líder:
                          </p>
                          <p className="text-sm">{req.response}</p>
                        </div>
                      )}
                      {req.status === "pending" && (
                        <p className="text-[10px] text-orange-600 font-medium uppercase tracking-wider">
                          Aguardando oração
                        </p>
                      )}
                    </div>
                  ))}
                  {myRequests?.social.map((req) => (
                    <div key={req.id} className="p-4 border rounded-lg bg-card shadow-sm space-y-3">
                      <div className="flex justify-between items-start">
                        <Badge variant="secondary">Assistência Social</Badge>
                        <span className="text-[10px] text-muted-foreground uppercase font-mono">
                          {format(new Date(req.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      </div>
                      <p className="text-sm line-clamp-2 text-muted-foreground">
                        {req.description}
                      </p>
                      <Badge
                        className={req.status === "completed" ? "bg-green-600" : "bg-orange-600"}
                      >
                        {req.status === "pending"
                          ? "Pendente"
                          : req.status === "in_review"
                            ? "Em Análise"
                            : "Concluído"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {(isAdmin || isLeadership) && (
          <div className="mt-16 pt-8 border-t border-dashed">
            <div className="flex items-center gap-3 mb-8">
              <ClipboardList className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-serif font-medium">Gestão de Cuidado</h2>
            </div>

            <Tabs defaultValue="prayers_mgmt" className="space-y-6">
              <TabsList>
                <TabsTrigger value="prayers_mgmt">Oração & Aconselhamento</TabsTrigger>
                {isAdmin && <TabsTrigger value="social_mgmt">Assistência Social</TabsTrigger>}
              </TabsList>

              <TabsContent value="prayers_mgmt">
                <div className="max-w-4xl">
                  <PrayerManagement />
                </div>
              </TabsContent>

              <TabsContent value="social_mgmt">
                <div className="max-w-4xl">
                  <SocialManagement />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </PageBody>
    </>
  );
}
