import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, PageBody } from "@/components/app-shell";
import { useMusicians } from "@/lib/use-worship";
import { VisaoGeral } from "@/components/louvor/visao-geral";
import { Repertorio } from "@/components/louvor/repertorio";
import { Escalas } from "@/components/louvor/escalas";
import { Elenco } from "@/components/louvor/elenco";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Music, LayoutDashboard, ListMusic, CalendarDays, Users } from "lucide-react";

export const Route = createFileRoute("/_authenticated/louvor")({
  component: LouvorPage,
});

function LouvorPage() {
  const { data: musicians, isLoading } = useMusicians();

  return (
    <>
      <PageHeader
        eyebrow="Ministério"
        title="Louvor & Adoração"
        className="border-b-[3px] border-[var(--group-primary)]"
        description="Gestão de escalas, repertório e elenco musical da Igreja Batista Atos."
      />
      <PageBody>
        <Tabs defaultValue="overview" className="space-y-6">
          <div className="flex overflow-x-auto pb-1 scrollbar-none">
            <TabsList className="inline-flex h-auto p-1 bg-muted/50 backdrop-blur-sm border border-border/50 w-full sm:w-auto">
              <TabsTrigger
                value="overview"
                className="flex-1 sm:flex-none gap-2 px-4 py-2 data-[state=active]:bg-background"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">Visão Geral</span>
              </TabsTrigger>
              <TabsTrigger
                value="repertorio"
                className="flex-1 sm:flex-none gap-2 px-4 py-2 data-[state=active]:bg-background"
              >
                <Music className="h-4 w-4" />
                <span className="hidden sm:inline">Repertório</span>
              </TabsTrigger>
              <TabsTrigger
                value="escalas"
                className="flex-1 sm:flex-none gap-2 px-4 py-2 data-[state=active]:bg-background"
              >
                <CalendarDays className="h-4 w-4" />
                <span className="hidden sm:inline">Escalas</span>
              </TabsTrigger>
              <TabsTrigger
                value="elenco"
                className="flex-1 sm:flex-none gap-2 px-4 py-2 data-[state=active]:bg-background"
              >
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Elenco</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="animate-in fade-in duration-500">
            <VisaoGeral />
          </TabsContent>
          <TabsContent value="repertorio" className="animate-in fade-in duration-500">
            <Repertorio />
          </TabsContent>
          <TabsContent value="escalas" className="animate-in fade-in duration-500">
            <Escalas />
          </TabsContent>
          <TabsContent value="elenco" className="animate-in fade-in duration-500">
            <Elenco />
          </TabsContent>
        </Tabs>
      </PageBody>
    </>
  );
}
