import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  HeartHandshake,
  Users,
  Phone,
  MessageCircle,
  MessageSquare,
  Home,
  HandHeart,
  Check,
  Undo2,
  Sprout,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { PageHeader, PageBody } from "@/components/app-shell";
import { PanelSection, Initials, EmptyLine } from "@/components/painel/ui";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { LoadingRegion, CardGridSkeleton } from "@/components/ui/loading-states";
import { CHURCH_FUNCTION_LABEL } from "@/lib/igreja";

export const Route = createFileRoute("/_authenticated/cuidado-semana")({
  head: () => ({
    meta: [
      { title: "Cuidado da Semana — Igreja Batista Atos" },
      {
        name: "description",
        content:
          "O painel pessoal do líder para acompanhar com quem já conversou nesta semana e com quem ainda quer falar.",
      },
    ],
  }),
  component: CuidadoSemanaPage,
});

/* ---------------------------------------------------------------------------
 * Canais de contato — o "como" da conversa. Só rótulo e ícone, sem hierarquia.
 * ------------------------------------------------------------------------- */
const CHANNELS = [
  { value: "presencial", label: "Presencial", icon: Users },
  { value: "ligacao", label: "Ligação", icon: Phone },
  { value: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { value: "mensagem", label: "Mensagem", icon: MessageSquare },
  { value: "visita", label: "Visita", icon: Home },
  { value: "oracao", label: "Oração", icon: HandHeart },
] as const;

const CHANNEL_LABEL: Record<string, string> = Object.fromEntries(
  CHANNELS.map((c) => [c.value, c.label]),
);

/** Segunda-feira (00:00) da semana de uma data, em horário local. */
function mondayOf(base = new Date()): Date {
  const d = new Date(base);
  const offset = (d.getDay() + 6) % 7; // 0 = segunda
  d.setDate(d.getDate() - offset);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Formata uma data como YYYY-MM-DD sem passar por UTC (evita virar o dia). */
function isoDateLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Descreve, de forma gentil, há quanto tempo não há um registro de conversa. */
function tempoDesde(iso: string | null): string {
  if (!iso) return "ainda sem registro";
  const dias = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (dias <= 0) return "conversaram hoje";
  if (dias === 1) return "faz 1 dia";
  if (dias < 7) return `faz ${dias} dias`;
  const semanas = Math.floor(dias / 7);
  return semanas === 1 ? "faz 1 semana" : `faz ${semanas} semanas`;
}

function firstName(full: string): string {
  return full.trim().split(/\s+/)[0] ?? full;
}

function initialsOf(full: string): string {
  const parts = full.trim().split(/\s+/);
  const a = parts[0]?.[0] ?? "";
  const b = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (a + b).toUpperCase();
}

function waLink(phone: string | null, nome: string): string | null {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  if (!digits.startsWith("55")) digits = "55" + digits;
  const msg = encodeURIComponent(
    `Olá, ${firstName(nome)}! Tudo bem? Passando para saber de você. 🙏`,
  );
  return `https://wa.me/${digits}?text=${msg}`;
}

interface MesaOption {
  id: string;
  name: string;
}

interface MemberRow {
  user_id: string;
  role: string;
  full_name: string;
  phone: string | null;
}

interface TouchRow {
  member_id: string;
  week_start: string;
  created_at: string;
  channel: string;
  note: string | null;
}

function CuidadoSemanaPage() {
  const { user, roles, isAdmin } = useAuth();
  const qc = useQueryClient();

  const weekStart = useMemo(() => isoDateLocal(mondayOf()), []);
  const [mesaId, setMesaId] = useState<string>("");
  const [target, setTarget] = useState<MemberRow | null>(null);
  const [channel, setChannel] = useState<string>("presencial");
  const [note, setNote] = useState("");

  // Mesas que este líder cuida (ou todas, para o admin geral).
  const myMesaIds = useMemo(
    () => roles.filter((r) => r.role === "lider_mesa" && r.mesa_id).map((r) => r.mesa_id as string),
    [roles],
  );

  const { data: mesas, isPending: mesasLoading } = useQuery({
    queryKey: ["cuidado-mesas", isAdmin, myMesaIds.join(",")],
    queryFn: async () => {
      let query = supabase.from("mesas").select("id, name").order("name");
      if (!isAdmin) {
        query = query.in(
          "id",
          myMesaIds.length ? myMesaIds : ["00000000-0000-0000-0000-000000000000"],
        );
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as MesaOption[];
    },
  });

  const activeMesa = mesaId || mesas?.[0]?.id || "";

  const { data: members, isPending: membersLoading } = useQuery({
    queryKey: ["cuidado-members", activeMesa],
    enabled: Boolean(activeMesa),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mesa_members")
        .select("user_id, role, profiles:profiles!inner(full_name, phone)")
        .eq("mesa_id", activeMesa);
      if (error) throw error;
      const rows = (data ?? []) as unknown as {
        user_id: string;
        role: string;
        profiles: { full_name: string; phone: string | null };
      }[];
      return rows
        .filter((r) => r.user_id !== user?.id) // o líder não precisa "falar consigo mesmo"
        .map<MemberRow>((r) => ({
          user_id: r.user_id,
          role: r.role,
          full_name: r.profiles.full_name,
          phone: r.profiles.phone,
        }))
        .sort((a, b) => a.full_name.localeCompare(b.full_name, "pt-BR"));
    },
  });

  const { data: touches } = useQuery({
    queryKey: ["cuidado-touchpoints", activeMesa, user?.id],
    enabled: Boolean(activeMesa && user?.id),
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("leader_touchpoints")
        .select("member_id, week_start, created_at, channel, note")
        .eq("leader_id", user!.id)
        .eq("mesa_id", activeMesa);
      if (error) throw error;
      return (data ?? []) as TouchRow[];
    },
  });

  // Contato desta semana + último contato registrado por pessoa.
  const { contactedThisWeek, lastContact } = useMemo(() => {
    const contacted = new Map<string, TouchRow>();
    const last = new Map<string, string>();
    for (const t of touches ?? []) {
      if (t.week_start === weekStart) contacted.set(t.member_id, t);
      const prev = last.get(t.member_id);
      if (!prev || t.created_at > prev) last.set(t.member_id, t.created_at);
    }
    return { contactedThisWeek: contacted, lastContact: last };
  }, [touches, weekStart]);

  const registrar = useMutation({
    mutationFn: async () => {
      if (!target || !user) return;
      const { error } = await (supabase as any).from("leader_touchpoints").upsert(
        {
          leader_id: user.id,
          member_id: target.user_id,
          mesa_id: activeMesa,
          week_start: weekStart,
          channel,
          note: note.trim() || null,
        },
        { onConflict: "leader_id,member_id,week_start" },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(`Conversa com ${firstName(target!.full_name)} registrada.`);
      setTarget(null);
      setNote("");
      setChannel("presencial");
      void qc.invalidateQueries({ queryKey: ["cuidado-touchpoints", activeMesa, user?.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const desfazer = useMutation({
    mutationFn: async (memberId: string) => {
      if (!user) return;
      const { error } = await (supabase as any)
        .from("leader_touchpoints")
        .delete()
        .eq("leader_id", user.id)
        .eq("member_id", memberId)
        .eq("mesa_id", activeMesa)
        .eq("week_start", weekStart);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["cuidado-touchpoints", activeMesa, user?.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const pendentes = (members ?? []).filter((m) => !contactedThisWeek.has(m.user_id));
  const conversados = (members ?? []).filter((m) => contactedThisWeek.has(m.user_id));
  const total = members?.length ?? 0;
  const feitos = conversados.length;
  const pct = total > 0 ? Math.round((feitos / total) * 100) : 0;

  return (
    <>
      <PageHeader
        eyebrow="Cuidado"
        title="Cuidado da Semana"
        description="Com quem você já conversou nesta semana e com quem ainda quer falar. É só seu — um lembrete de cuidado, não um controle. A cada semana o ciclo recomeça."
        actions={
          mesas && mesas.length > 1 ? (
            <Select value={activeMesa} onValueChange={setMesaId}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Escolha a mesa" />
              </SelectTrigger>
              <SelectContent>
                {mesas.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : undefined
        }
      />
      <PageBody>
        {mesasLoading ? (
          <LoadingRegion>
            <CardGridSkeleton count={4} />
          </LoadingRegion>
        ) : !mesas || mesas.length === 0 ? (
          <div className="border border-dashed border-border rounded-xl p-10 text-center">
            <Sprout className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="mt-3 font-serif text-2xl">Nenhuma mesa sob seu cuidado</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Este painel aparece para quem lidera uma mesa. Fale com a liderança para ser
              vinculado.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Resumo gentil da semana */}
            <div className="border border-border bg-card/50 rounded-xl p-5 sm:p-6">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    Esta semana
                  </div>
                  <p className="mt-1 font-serif text-2xl leading-tight">
                    {total === 0
                      ? "Sua mesa ainda não tem integrantes."
                      : feitos === 0
                        ? `Você tem ${total} ${total === 1 ? "pessoa" : "pessoas"} para cuidar esta semana.`
                        : feitos >= total
                          ? "Você já conversou com todos esta semana. Que cuidado lindo. 🙌"
                          : `Você já conversou com ${feitos} de ${total} pessoas esta semana.`}
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-serif text-4xl tabular-nums leading-none">{pct}%</div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1">
                    da mesa
                  </div>
                </div>
              </div>
              {total > 0 && <Progress value={pct} className="mt-4 h-2" />}
            </div>

            {membersLoading ? (
              <LoadingRegion>
                <CardGridSkeleton count={4} />
              </LoadingRegion>
            ) : (
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Coluna: ainda quero falar */}
                <PanelSection
                  label={`${pendentes.length} ${pendentes.length === 1 ? "pessoa" : "pessoas"}`}
                  title="Ainda quero falar"
                >
                  {pendentes.length === 0 ? (
                    <EmptyLine>
                      {total === 0
                        ? "Adicione integrantes à mesa para começar."
                        : "Ninguém pendente — você cuidou de todos esta semana."}
                    </EmptyLine>
                  ) : (
                    <ul className="space-y-2">
                      {pendentes.map((m) => {
                        const wa = waLink(m.phone, m.full_name);
                        return (
                          <li
                            key={m.user_id}
                            className="flex items-center gap-3 rounded-lg border border-border/70 bg-background/40 p-3"
                          >
                            <Initials text={initialsOf(m.full_name)} />
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium leading-tight">{m.full_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {CHURCH_FUNCTION_LABEL[m.role] ?? m.role} ·{" "}
                                {tempoDesde(lastContact.get(m.user_id) ?? null)}
                              </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-1.5">
                              {wa && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  asChild
                                  aria-label={`WhatsApp de ${firstName(m.full_name)}`}
                                >
                                  <a href={wa} target="_blank" rel="noopener noreferrer">
                                    <MessageCircle className="h-4 w-4" />
                                  </a>
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setTarget(m);
                                  setChannel("presencial");
                                  setNote("");
                                }}
                              >
                                <Check className="h-4 w-4" /> Conversei
                              </Button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </PanelSection>

                {/* Coluna: já conversei */}
                <PanelSection
                  label={`${conversados.length} ${conversados.length === 1 ? "pessoa" : "pessoas"}`}
                  title="Já conversei"
                >
                  {conversados.length === 0 ? (
                    <EmptyLine>Registre a primeira conversa da semana ao lado.</EmptyLine>
                  ) : (
                    <ul className="space-y-2">
                      {conversados.map((m) => {
                        const t = contactedThisWeek.get(m.user_id);
                        return (
                          <li
                            key={m.user_id}
                            className="flex items-center gap-3 rounded-lg border border-border/70 bg-muted/40 p-3"
                          >
                            <Initials
                              text={initialsOf(m.full_name)}
                              className="border-foreground/20 bg-foreground text-background"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium leading-tight">{m.full_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {t ? (CHANNEL_LABEL[t.channel] ?? t.channel) : "Conversaram"}
                                {t?.note ? ` · ${t.note}` : ""}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Desfazer registro"
                              onClick={() => desfazer.mutate(m.user_id)}
                            >
                              <Undo2 className="h-4 w-4" />
                            </Button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </PanelSection>
              </div>
            )}
          </div>
        )}
      </PageBody>

      {/* Diálogo: registrar a conversa (como foi + uma nota opcional) */}
      <Dialog open={Boolean(target)} onOpenChange={(o) => !o && setTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-3xl">
              {target ? `Conversa com ${firstName(target.full_name)}` : "Registrar conversa"}
            </DialogTitle>
            <DialogDescription>
              Como foi o contato desta semana? Fica registrado só para você.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {CHANNELS.map((c) => {
                const Icon = c.icon;
                const active = channel === c.value;
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setChannel(c.value)}
                    className={
                      "flex flex-col items-center gap-1.5 rounded-lg border p-3 text-xs transition-colors " +
                      (active
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-background hover:border-foreground/40")
                    }
                  >
                    <Icon className="h-4 w-4" />
                    {c.label}
                  </button>
                );
              })}
            </div>
            <Textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Uma nota do que conversaram (opcional)"
            />
            <Button
              className="w-full"
              disabled={registrar.isPending}
              onClick={() => registrar.mutate()}
            >
              <HeartHandshake className="h-4 w-4" /> Registrar conversa
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
