import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Check, Search, Sticker } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  KIDS_CLASSROOM_LABEL,
  ageInYears,
  childDisplayName,
  generateSecurityCode,
  shortTime,
  type KidsChild,
  type KidsCheckin,
  type KidsSession,
} from "@/lib/kids";
import { CheckoutDialog } from "@/components/kids/checkout-dialog";
import { CheckinQrDialog } from "@/components/kids/checkin-qr-dialog";
import { KidsPhoto } from "@/components/kids/kids-photo";
import { EmergencyAlertButton } from "@/components/kids/emergency-alert-button";

interface CheckinBoardProps {
  session: KidsSession;
  children: KidsChild[];
}

/** Painel operacional do culto: entrada, etiqueta com código e retirada. */
export function CheckinBoard({ session, children }: CheckinBoardProps) {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: checkins } = useQuery({
    queryKey: ["kids-checkins", session.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kids_checkins")
        .select("*")
        .eq("session_id", session.id)
        .order("checked_in_at");
      if (error) throw error;
      return data as KidsCheckin[];
    },
    refetchInterval: 20000,
  });

  const byChild = useMemo(() => new Map((checkins ?? []).map((c) => [c.child_id, c])), [checkins]);

  const checkIn = useMutation({
    mutationFn: async (child: KidsChild) => {
      const used = (checkins ?? []).map((c) => c.security_code);
      const { error } = await supabase.from("kids_checkins").insert({
        session_id: session.id,
        child_id: child.id,
        security_code: generateSecurityCode(used),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["kids-checkins", session.id] });
      toast.success("Check-in registrado. Entregue a etiqueta ao responsável.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const term = search.trim().toLowerCase();
  const filtered = children.filter((c) =>
    term ? `${c.full_name} ${c.nickname ?? ""}`.toLowerCase().includes(term) : true,
  );

  const presentes = (checkins ?? []).filter((c) => c.status === "presente").length;
  const retiradas = (checkins ?? []).filter((c) => c.status === "retirada").length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Na sala agora" value={presentes} />
        <Stat label="Já retiradas" value={retiradas} />
        <Stat label="Total do dia" value={checkins?.length ?? 0} />
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar criança pelo nome"
          className="pl-9"
        />
      </div>

      <ul className="grid md:grid-cols-2 gap-3">
        {filtered.map((child) => {
          const checkin = byChild.get(child.id);
          const age = ageInYears(child.birth_date);
          const alerta = child.allergies || child.health_notes || child.special_needs;
          return (
            <li key={child.id} className="border border-border bg-card rounded-sm p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-4 min-w-0">
                  <KidsPhoto
                    value={child.photo_url}
                    alt={child.full_name}
                    variant="crianca"
                    className="h-12 w-12 rounded-lg shrink-0"
                  />
                  <div className="min-w-0">
                    <h4 className="font-serif text-lg truncate">{childDisplayName(child)}</h4>
                    <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
                      {KIDS_CLASSROOM_LABEL[child.classroom] ?? child.classroom}
                      {age !== null ? ` · ${age} anos` : ""}
                    </div>
                  </div>
                </div>
                {checkin && (
                  <div className="text-right">
                    <div className="font-mono text-xl tracking-[0.25em] text-primary">
                      {checkin.security_code}
                    </div>
                    <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      {checkin.status === "retirada"
                        ? `Saiu ${shortTime(checkin.checked_out_at)}`
                        : `Entrou ${shortTime(checkin.checked_in_at)}`}
                    </div>
                  </div>
                )}
              </div>

              {alerta && (
                <div className="mt-3 flex items-start gap-2 text-xs text-destructive">
                  <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>
                    {[child.allergies, child.health_notes, child.special_needs]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </div>
              )}

              <div className="mt-4 flex items-center gap-2">
                {!checkin && (
                  <Button
                    size="sm"
                    onClick={() => checkIn.mutate(child)}
                    disabled={checkIn.isPending}
                  >
                    <Sticker className="h-3.5 w-3.5" /> Fazer check-in
                  </Button>
                )}
                {checkin?.status === "presente" && (
                  <>
                    <CheckoutDialog checkin={checkin} childName={childDisplayName(child)} />
                    <CheckinQrDialog checkin={checkin} childName={childDisplayName(child)} />
                    <EmergencyAlertButton child={child} session={session} />
                  </>
                )}
                {checkin?.status === "retirada" && (
                  <Badge variant="secondary" className="gap-1">
                    <Check className="h-3 w-3" /> Entregue a {checkin.picked_up_by_name}
                  </Badge>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {filtered.length === 0 && (
        <p className="text-muted-foreground">Nenhuma criança encontrada com esse nome.</p>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-border bg-card rounded-sm p-4">
      <div className="font-serif text-3xl">{value}</div>
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
        {label}
      </div>
    </div>
  );
}
