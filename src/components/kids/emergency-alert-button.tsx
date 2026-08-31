import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, BellRing, Loader2, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type KidsChild, type KidsSession } from "@/lib/kids";

interface EmergencyAlertButtonProps {
  child: KidsChild;
  session: KidsSession;
}

export function EmergencyAlertButton({ child, session }: EmergencyAlertButtonProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState<"baixa" | "media" | "alta">("media");
  const qc = useQueryClient();

  const sendAlert = useMutation({
    mutationFn: async () => {
      if (!message.trim()) throw new Error("Informe o motivo da emergência.");

      // Busca o responsável principal para notificar
      const { data: guardians, error: gError } = await supabase
        .from("kids_guardians")
        .select("id, phone, full_name, profile_id")
        .eq("child_id", child.id)
        .eq("is_primary", true)
        .single();

      if (gError) throw new Error("Não foi possível localizar o responsável principal.");

      // Registra o alerta no banco
      const { data: alert, error: aError } = await supabase
        .from("kids_emergency_alerts")
        .insert({
          session_id: session.id,
          child_id: child.id,
          guardian_id: guardians.id,
          message: message.trim(),
          severity,
          status: "enviado",
        } as any)
        .select()
        .single();

      if (aError) throw aError;

      // Disparo real via Edge Function (Rota de API)
      try {
        await fetch("/api/public/sms-whatsapp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: guardians.phone,
            message: `[EMERGÊNCIA KIDS] ${child.full_name}: ${message.trim()}`,
            type: "both",
          }),
        });

        if (guardians.profile_id) {
          await fetch("/api/public/notifications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userIds: [guardians.profile_id],
              title: "⚠️ Emergência no Kids",
              body: `Seu filho(a) ${child.full_name} precisa de você.`,
              type: "emergency",
              data: { childId: child.id, sessionId: session.id },
            }),
          });
        }
      } catch (err) {
        console.error("Erro no disparo externo:", err);
      }

      return alert;
    },
    onSuccess: () => {
      toast.success("Alerta enviado com sucesso. O responsável será notificado.");
      setOpen(false);
      setMessage("");
      void qc.invalidateQueries({ queryKey: ["kids-emergency-alerts"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <BellRing className="h-4 w-4 mr-2" /> Emergência
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" /> Acionar Emergência
          </DialogTitle>
          <DialogDescription>
            Isso enviará uma notificação imediata para os responsáveis de{" "}
            <strong>{child.full_name}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Gravidade</Label>
            <Select value={severity} onValueChange={(v: any) => setSeverity(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="baixa">Baixa (Aviso simples)</SelectItem>
                <SelectItem value="media">Média (Atenção necessária)</SelectItem>
                <SelectItem value="alta">Alta (Crítico / Comparecer agora)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Mensagem</Label>
            <Textarea
              placeholder="Ex: A criança não para de chorar e pede pela mãe. / Febre repentina. / Queda leve."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={() => sendAlert.mutate()}
            disabled={sendAlert.isPending}
          >
            {sendAlert.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enviando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" /> Disparar Alerta
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
