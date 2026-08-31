import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, QrCode, ShieldQuestion, Sticker, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  GUARDIAN_RELATION_LABEL,
  KIDS_CLASSROOM_LABEL,
  generateSecurityCode,
  shortTime,
  type KidsSession,
} from "@/lib/kids";

export interface VisitorRequest {
  id: string;
  child_id: string | null;
  child_full_name: string;
  child_nickname: string | null;
  birth_date: string | null;
  classroom: string;
  allergies: string | null;
  health_notes: string | null;
  special_needs: string | null;
  photo_consent: boolean;
  guardian_full_name: string;
  guardian_phone: string;
  guardian_relation: string;
  guardian_document: string | null;
  other_pickup: string | null;
  notes: string | null;
  status: string;
  created_at: string;
}

interface VisitorQueueProps {
  /** Sessão ativa: quando existe, aprovar já faz o check-in e gera a etiqueta. */
  session: KidsSession | null;
  churchId?: string | null;
}

/**
 * Fila de conferência dos cadastros feitos pelos pais no QR Code.
 * Nada entra na sala sem passar por aqui — a equipe confere o documento
 * do responsável antes de aprovar.
 */
export function VisitorQueue({ session, churchId }: VisitorQueueProps) {
  const qc = useQueryClient();

  const { data: requests } = useQuery({
    queryKey: ["kids-visitor-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kids_visitor_requests")
        .select("*")
        .eq("status", "pendente")
        .order("created_at");
      if (error) throw error;
      return data as VisitorRequest[];
    },
    refetchInterval: 20000,
  });

  const approve = useMutation({
    mutationFn: async (req: VisitorRequest) => {
      let childId = req.child_id;

      // Família nova: cria a criança e o responsável autorizado.
      if (!childId) {
        const { data: child, error: childError } = await supabase
          .from("kids_children")
          .insert({
            full_name: req.child_full_name,
            nickname: req.child_nickname,
            birth_date: req.birth_date,
            classroom: req.classroom,
            church_id: churchId ?? null,
            allergies: req.allergies,
            health_notes: req.health_notes,
            special_needs: req.special_needs,
            photo_consent: req.photo_consent,
            can_leave_alone: false,
            notes:
              [req.notes, req.other_pickup ? `Também podem retirar: ${req.other_pickup}` : null]
                .filter(Boolean)
                .join(" · ") || null,
          })
          .select("id")
          .single();
        if (childError) throw childError;
        childId = child.id;

        const { error: guardianError } = await supabase.from("kids_guardians").insert({
          child_id: childId,
          full_name: req.guardian_full_name,
          phone: req.guardian_phone,
          relation: req.guardian_relation,
          document: req.guardian_document,
          is_primary: true,
          can_pickup: true,
        });
        if (guardianError) throw guardianError;
      }

      // Check-in imediato quando há sessão aberta.
      let code: string | null = null;
      if (session) {
        const { data: existing } = await supabase
          .from("kids_checkins")
          .select("security_code, child_id")
          .eq("session_id", session.id);
        const already = (existing ?? []).some((c) => c.child_id === childId);
        if (!already) {
          code = generateSecurityCode((existing ?? []).map((c) => c.security_code));
          const { error } = await supabase.from("kids_checkins").insert({
            session_id: session.id,
            child_id: childId,
            security_code: code,
            dropped_by_name: req.guardian_full_name,
          });
          if (error) throw error;
        }
      }

      const { error: updateError } = await supabase
        .from("kids_visitor_requests")
        .update({
          status: "aprovado",
          child_id: childId,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", req.id);
      if (updateError) throw updateError;

      return code;
    },
    onSuccess: (code) => {
      void qc.invalidateQueries({ queryKey: ["kids-visitor-requests"] });
      void qc.invalidateQueries({ queryKey: ["kids-children"] });
      if (session) void qc.invalidateQueries({ queryKey: ["kids-checkins", session.id] });
      toast.success(
        code
          ? `Aprovado e check-in feito. Código da etiqueta: ${code}`
          : "Cadastro aprovado. A criança já aparece na lista.",
      );
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reject = useMutation({
    mutationFn: async (req: VisitorRequest) => {
      const { error } = await supabase
        .from("kids_visitor_requests")
        .update({ status: "recusado", reviewed_at: new Date().toISOString() })
        .eq("id", req.id);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["kids-visitor-requests"] });
      toast.success("Cadastro descartado.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const list = requests ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-serif text-2xl">Visitantes aguardando conferência</h3>
          <p className="text-muted-foreground text-sm mt-1">
            Confira o documento de quem trouxe a criança antes de aprovar. A aprovação
            {session ? " já gera a etiqueta com o código de retirada." : " cadastra a criança."}
          </p>
        </div>
        <QrDialog />
      </div>

      {list.length === 0 ? (
        <div className="border border-dashed border-border rounded-sm p-10 text-center">
          <ShieldQuestion className="h-8 w-8 text-muted-foreground mx-auto" />
          <h4 className="font-serif text-xl mt-4">Nenhum cadastro pendente</h4>
          <p className="text-muted-foreground mt-2">
            Assim que um pai preencher o QR Code da porta, ele aparece aqui na hora.
          </p>
        </div>
      ) : (
        <ul className="grid md:grid-cols-2 gap-3">
          {list.map((req) => (
            <li key={req.id} className="border border-border bg-card rounded-sm p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="font-serif text-lg truncate">
                    {req.child_nickname
                      ? `${req.child_full_name} (${req.child_nickname})`
                      : req.child_full_name}
                  </h4>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
                    {KIDS_CLASSROOM_LABEL[req.classroom] ?? req.classroom} ·{" "}
                    {shortTime(req.created_at)}
                  </div>
                </div>
                <Badge variant="secondary">{req.child_id ? "Retorno" : "Visitante"}</Badge>
              </div>

              <dl className="mt-3 text-sm space-y-1">
                <Line
                  label="Responsável"
                  value={`${req.guardian_full_name} · ${
                    GUARDIAN_RELATION_LABEL[req.guardian_relation] ?? req.guardian_relation
                  }`}
                />
                <Line label="Telefone" value={req.guardian_phone} />
                {req.guardian_document && <Line label="Documento" value={req.guardian_document} />}
                {req.other_pickup && <Line label="Também retiram" value={req.other_pickup} />}
                {req.notes && <Line label="Observações" value={req.notes} />}
              </dl>

              {(req.allergies || req.health_notes || req.special_needs) && (
                <p className="mt-3 text-xs text-destructive">
                  {[req.allergies, req.health_notes, req.special_needs].filter(Boolean).join(" · ")}
                </p>
              )}

              <div className="mt-4 flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => approve.mutate(req)}
                  disabled={approve.isPending || reject.isPending}
                >
                  <Sticker className="h-3.5 w-3.5" />
                  {session ? "Aprovar e fazer check-in" : "Aprovar cadastro"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => reject.mutate(req)}
                  disabled={approve.isPending || reject.isPending}
                >
                  <X className="h-3.5 w-3.5" /> Descartar
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground pt-1 w-28 shrink-0">
        {label}
      </dt>
      <dd className="text-foreground">{value}</dd>
    </div>
  );
}

/** Link + QR Code para imprimir e colar na porta da sala. */
function QrDialog() {
  const [open, setOpen] = useState(false);
  const url =
    typeof window !== "undefined" ? `${window.location.origin}/kids/visitante` : "/kids/visitante";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <QrCode className="h-4 w-4" /> QR da porta
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cadastro do visitante</DialogTitle>
          <DialogDescription>
            Imprima e cole na porta do Kids. Os pais leem com a câmera do celular e preenchem em
            menos de um minuto.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(url)}`}
            alt="QR Code do cadastro de crianças visitantes"
            width={260}
            height={260}
            className="rounded-sm bg-card p-2"
          />
          <code className="text-xs text-muted-foreground break-all text-center">{url}</code>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                void navigator.clipboard.writeText(url);
                toast.success("Link copiado.");
              }}
            >
              <Copy className="h-3.5 w-3.5" /> Copiar link
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={`${url}?kiosk=1`} target="_blank" rel="noreferrer">
                <span>
                  <Check className="h-3.5 w-3.5 inline-block" /> Abrir no tablet (quiosque)
                </span>
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
