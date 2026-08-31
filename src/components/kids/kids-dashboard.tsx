import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Baby,
  CalendarDays,
  QrCode,
  ShieldCheck,
  Users,
  Search,
  Filter,
  FileText,
} from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";
import { CheckinBoard } from "@/components/kids/checkin-board";
import { VisitorQueue } from "@/components/kids/visitor-queue";
import { SessionDialog, EditSessionButton } from "@/components/kids/session-dialog";
import { ChildDialog, EditChildButton } from "@/components/kids/child-dialog";
import { KidsPhoto } from "@/components/kids/kids-photo";
import {
  KIDS_CLASSROOMS,
  KIDS_CLASSROOM_LABEL,
  ageInYears,
  childDisplayName,
  type KidsChild,
  type KidsSession,
} from "@/lib/kids";

export function KidsCheckinDashboard() {
  const { isKidsAdmin } = useAuth();
  const navigate = useNavigate();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [classroom, setClassroom] = useState("all");

  const { data: sessions, isLoading: loadingSessions } = useQuery({
    queryKey: ["kids-sessions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kids_sessions")
        .select("*")
        .order("session_date", { ascending: false })
        .limit(30);
      if (error) throw error;
      return (data ?? []) as KidsSession[];
    },
  });

  const { data: children, isLoading: loadingChildren } = useQuery({
    queryKey: ["kids-children"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kids_children")
        .select("*")
        .eq("is_active", true)
        .order("full_name");
      if (error) throw error;
      return (data ?? []) as KidsChild[];
    },
  });

  const activeSession = useMemo<KidsSession | null>(() => {
    const list = sessions ?? [];
    if (list.length === 0) return null;
    return list.find((s) => s.id === sessionId) ?? list[0] ?? null;
  }, [sessions, sessionId]);

  const filteredChildren = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (children ?? []).filter((c) => {
      if (classroom !== "all" && c.classroom !== classroom) return false;
      if (!q) return true;
      return [c.full_name, c.nickname, KIDS_CLASSROOM_LABEL[c.classroom]]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [children, search, classroom]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-kids selection:bg-yellow-200 selection:text-yellow-900">
      {/* Barra de operação: sessão do dia + acesso ao QR Code dos visitantes */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-4 border-primary/20 bg-white rounded-[3rem] p-8 sticky top-4 z-20 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-all duration-500 hover:shadow-primary/10 hover:border-primary/40">
        <div className="flex flex-col gap-1.5 min-w-0">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary/70">
            Sessão Ativa
          </span>
          {loadingSessions ? (
            <div className="h-10 w-48 bg-muted animate-pulse rounded-lg" />
          ) : (sessions ?? []).length === 0 ? (
            <span className="text-sm text-muted-foreground italic">
              Aguardando criação de sessão...
            </span>
          ) : (
            <div className="flex items-center gap-2">
              <Select value={activeSession?.id ?? ""} onValueChange={(v) => setSessionId(v)}>
                <SelectTrigger
                  className="w-full sm:w-80 bg-background/50 hover:bg-background transition-colors border-primary/10 rounded-xl"
                  aria-label="Selecionar sessão"
                >
                  <SelectValue placeholder="Selecione a sessão" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-primary/10">
                  {(sessions ?? []).map((s) => (
                    <SelectItem key={s.id} value={s.id} className="rounded-lg">
                      {new Date(`${s.session_date}T00:00:00`).toLocaleDateString("pt-BR")} ·{" "}
                      {s.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isKidsAdmin && activeSession && <EditSessionButton session={activeSession} />}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="rounded-xl hover:scale-105 active:scale-95 transition-all"
          >
            <Link to="/kids/visitante" search={{ kiosk: true }}>
              <span>
                <QrCode className="mr-2 h-4 w-4 inline-block" /> Kiosk Visitantes
              </span>
            </Link>
          </Button>
          {isKidsAdmin && <SessionDialog />}
        </div>
      </div>

      <Tabs defaultValue="checkin" className="w-full">
        <TabsList className="bg-primary/5 p-2 rounded-3xl border-2 border-primary/10 h-16 backdrop-blur-md">
          <TabsTrigger
            value="checkin"
            className="rounded-2xl px-8 h-full data-[state=active]:bg-yellow-400 data-[state=active]:text-yellow-950 data-[state=active]:shadow-lg data-[state=active]:scale-105 transition-all duration-300 font-bold text-lg"
          >
            <ShieldCheck className="mr-2 h-5 w-5" /> Check-in
          </TabsTrigger>

          <TabsTrigger
            value="visitantes"
            className="rounded-2xl px-8 h-full data-[state=active]:bg-pink-400 data-[state=active]:text-pink-950 data-[state=active]:shadow-lg data-[state=active]:scale-105 transition-all duration-300 font-bold text-lg"
          >
            <Users className="mr-2 h-5 w-5" /> Visitantes
          </TabsTrigger>
          <TabsTrigger
            value="escalas"
            className="rounded-2xl px-8 h-full data-[state=active]:bg-orange-400 data-[state=active]:text-orange-950 data-[state=active]:shadow-lg data-[state=active]:scale-105 transition-all duration-300 font-bold text-lg"
          >
            <CalendarDays className="mr-2 h-5 w-5" /> Escalas
          </TabsTrigger>
          <TabsTrigger
            value="criancas"
            className="rounded-2xl px-8 h-full data-[state=active]:bg-blue-400 data-[state=active]:text-blue-950 data-[state=active]:shadow-lg data-[state=active]:scale-105 transition-all duration-300 font-bold text-lg"
          >
            <Baby className="mr-2 h-5 w-5" /> Cadastro
          </TabsTrigger>
          <TabsTrigger
            value="relatorios"
            className="rounded-2xl px-8 h-full data-[state=active]:bg-purple-400 data-[state=active]:text-purple-950 data-[state=active]:shadow-lg data-[state=active]:scale-105 transition-all duration-300 font-bold text-lg"
            onClick={() => navigate({ to: "/kids/relatorios" })}
          >
            <FileText className="mr-2 h-5 w-5" /> Relatórios
          </TabsTrigger>
        </TabsList>

        <TabsContent value="checkin" className="mt-8 focus-visible:outline-none">
          {activeSession ? (
            <CheckinBoard session={activeSession} children={children ?? []} />
          ) : (
            <EmptyState
              icon={<CalendarDays className="h-8 w-8 text-primary/40" />}
              title="Aguardando Sessão"
              description="Inicie um novo culto ou evento para habilitar o painel de check-in."
            />
          )}
        </TabsContent>

        <TabsContent value="visitantes" className="mt-8 focus-visible:outline-none">
          <div className="bg-card/40 border border-border/50 rounded-[2.5rem] p-10 shadow-2xl shadow-black/5 backdrop-blur-xl">
            <VisitorQueue session={activeSession} churchId={activeSession?.church_id ?? null} />
          </div>
        </TabsContent>

        <TabsContent value="escalas" className="mt-8 focus-visible:outline-none">
          <div className="bg-card/40 border-4 border-orange-200 rounded-[2.5rem] p-10 shadow-2xl shadow-orange-900/5 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-serif text-3xl text-orange-900">Escalas Kids</h2>
              {isKidsAdmin && (
                <Button className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white">
                  Nova Escala
                </Button>
              )}
            </div>
            <div className="space-y-4">
              <div className="p-6 border-2 border-dashed border-orange-200 rounded-3xl text-center">
                <CalendarDays className="mx-auto h-12 w-12 text-orange-300 mb-4" />
                <p className="text-orange-900/60 font-medium">
                  As escalas iniciais do Kids estão sendo preparadas.
                </p>
                <p className="text-orange-900/40 text-sm mt-1">
                  Configure voluntários, turmas e horários aqui.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="criancas" className="mt-8 space-y-6 focus-visible:outline-none">
          <div className="flex flex-col gap-4 sm:flex-row items-end sm:items-center bg-card/30 border border-primary/5 p-4 rounded-2xl shadow-sm">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nome ou apelido da criança..."
                className="pl-10 bg-background/50 border-primary/10 rounded-xl focus:ring-primary/20"
                aria-label="Buscar crianças"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-56">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                <Select value={classroom} onValueChange={setClassroom}>
                  <SelectTrigger
                    className="pl-10 bg-background/50 border-primary/10 rounded-xl"
                    aria-label="Filtrar por turma"
                  >
                    <SelectValue placeholder="Turma" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all">Todas as turmas</SelectItem>
                    {KIDS_CLASSROOMS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isKidsAdmin && <ChildDialog />}
            </div>
          </div>

          <div className="flex items-center justify-between px-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary/70">
              Listagem Geral ({filteredChildren.length})
            </span>
          </div>

          {loadingChildren ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-40 animate-pulse rounded-3xl border border-primary/5 bg-card/50"
                />
              ))}
            </div>
          ) : filteredChildren.length === 0 ? (
            <EmptyState
              icon={<Baby className="h-8 w-8 text-primary/40" />}
              title="Sem resultados"
              description="Não encontramos nenhuma criança com estes critérios de busca."
            />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredChildren.map((child, i) => {
                const age = ageInYears(child.birth_date);
                const colors = [
                  "border-yellow-200 bg-yellow-50 hover:bg-yellow-100",
                  "border-pink-200 bg-pink-50 hover:bg-pink-100",
                  "border-blue-200 bg-blue-50 hover:bg-blue-100",
                  "border-green-200 bg-green-50 hover:bg-green-100",
                  "border-purple-200 bg-purple-50 hover:bg-purple-100",
                ];
                const colorClass = colors[i % colors.length];

                return (
                  <article
                    key={child.id}
                    className={`group relative flex flex-col rounded-[2.5rem] border-4 p-6 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 overflow-hidden ${colorClass}`}
                  >
                    <div className="flex gap-4 items-center">
                      <KidsPhoto
                        value={child.photo_url}
                        alt={child.full_name}
                        variant="crianca"
                        className="h-16 w-16 rounded-2xl shadow-md group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="min-w-0 flex-1">
                        <h3 className="font-serif text-lg leading-tight truncate group-hover:text-primary transition-colors">
                          {childDisplayName(child)}
                        </h3>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge
                            variant="secondary"
                            className="bg-primary/5 text-primary border-none rounded-lg text-[10px] py-0 px-2 uppercase tracking-wider font-mono"
                          >
                            {KIDS_CLASSROOM_LABEL[child.classroom] ?? "???"}
                          </Badge>
                          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground self-center">
                            {age === null ? "S/I" : `${age}a`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {(child.allergies || child.special_needs) && (
                      <div className="mt-4 pt-4 border-t border-primary/5 space-y-1">
                        {child.allergies && (
                          <p className="text-[11px] text-destructive leading-relaxed flex items-center gap-1.5">
                            <span className="h-1 w-1 rounded-full bg-destructive shrink-0" />
                            Alergia: {child.allergies}
                          </p>
                        )}
                        {child.special_needs && (
                          <p className="text-[11px] text-muted-foreground leading-relaxed flex items-center gap-1.5">
                            <span className="h-1 w-1 rounded-full bg-primary/40 shrink-0" />
                            {child.special_needs}
                          </p>
                        )}
                      </div>
                    )}

                    {isKidsAdmin && (
                      <div className="mt-auto pt-4 flex opacity-0 group-hover:opacity-100 transition-opacity">
                        <EditChildButton child={child} />
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-[2rem] border border-dashed border-primary/20 bg-card/20 px-6 py-20 text-center animate-in zoom-in duration-300">
      <div className="p-4 bg-background rounded-full shadow-sm ring-1 ring-primary/5">{icon}</div>
      <div className="space-y-1">
        <h3 className="font-serif text-2xl text-foreground/80">{title}</h3>
        <p className="max-w-xs text-sm text-muted-foreground/70">{description}</p>
      </div>
    </div>
  );
}
