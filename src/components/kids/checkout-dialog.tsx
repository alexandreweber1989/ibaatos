import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, LogOut, MessageSquare, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { KidsPhoto } from "@/components/kids/kids-photo";
import { GUARDIAN_RELATION_LABEL, type KidsCheckin } from "@/lib/kids";

interface CheckoutPanelProps {
  checkin: KidsCheckin;
  childName: string;
  onDone?: () => void;
}

export function CheckoutPanel({ checkin, childName, onDone }: CheckoutPanelProps) {
  const qc = useQueryClient();
  const [code, setCode] = useState("");
  const [pickedBy, setPickedBy] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const { data: child } = useQuery({
    queryKey: ["kids-child-photo", checkin.child_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kids_children")
        .select("photo_url")
        .eq("id", checkin.child_id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: guardians } = useQuery({
    queryKey: ["kids-guardians", checkin.child_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kids_guardians")
        .select("id, full_name, phone, relation, can_pickup, is_primary, photo_url")
        .eq("child_id", checkin.child_id)
        .order("is_primary", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const confirm = useMutation({
    mutationFn: async () => {
      if (code.trim().toUpperCase() !== checkin.security_code)
        throw new Error(
          "Código de segurança incorreto. Peça ao responsável para mostrar o código no celular.",
        );
      if (!pickedBy.trim()) throw new Error("Selecione ou informe quem está retirando a criança.");

      const { error } = await supabase
        .from("kids_checkins")
        .update({
          status: "retirada",
          checked_out_at: new Date().toISOString(),
          picked_up_by_name: pickedBy.trim(),
        })
        .eq("id", checkin.id);
      if (error) throw error;
    },
    onSuccess: () => {
      setIsSuccess(true);
      void qc.invalidateQueries({ queryKey: ["kids-checkins"] });
      toast.success(`${childName} entregue com sucesso.`);
      setTimeout(() => {
        onDone?.();
      }, 2000);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4 animate-in zoom-in duration-500">
        <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10 text-primary animate-bounce" />
        </div>
        <div className="text-center space-y-1">
          <h3 className="text-2xl font-serif">Retirada Confirmada!</h3>
          <p className="text-muted-foreground">{childName} foi liberado(a) com segurança.</p>
        </div>
      </div>
    );
  }

  const authorized = (guardians ?? []).filter((g) => g.can_pickup);

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-3">
        <KidsPhoto
          value={child?.photo_url}
          alt={childName}
          variant="crianca"
          className="h-32 w-32 rounded-3xl border-4 border-background shadow-2xl ring-1 ring-primary/10"
        />
        <div className="text-center">
          <h2 className="text-2xl font-serif">{childName}</h2>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary/70">
            Conferência de Segurança
          </span>
        </div>
      </div>

      <div className="bg-card/50 border border-primary/5 rounded-3xl overflow-hidden shadow-sm">
        <div className="bg-muted/30 px-4 py-3 border-b border-primary/5">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Responsáveis Autorizados
          </span>
        </div>
        <div className="p-2 space-y-1 max-h-[300px] overflow-y-auto scrollbar-none">
          {authorized.length === 0 ? (
            <div className="flex items-center gap-3 p-4 text-destructive bg-destructive/5 rounded-2xl">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <p className="text-xs font-medium">
                ALERTA: Nenhum responsável autorizado cadastrado. Não libere sem consultar a
                coordenação.
              </p>
            </div>
          ) : (
            authorized.map((g) => (
              <div
                key={g.id}
                className={`group flex items-center justify-between gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                  pickedBy === g.full_name
                    ? "border-primary bg-primary/5 shadow-inner"
                    : "border-transparent hover:bg-accent/50"
                }`}
                onClick={() => setPickedBy(g.full_name)}
              >
                <div className="flex gap-3 items-center min-w-0">
                  <KidsPhoto
                    value={g.photo_url}
                    alt={g.full_name}
                    variant="responsavel"
                    className="h-12 w-12 rounded-2xl shrink-0 shadow-sm transition-transform group-hover:scale-105"
                  />
                  <div className="min-w-0">
                    <span className="font-medium text-sm block truncate">{g.full_name}</span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">
                      {GUARDIAN_RELATION_LABEL[g.relation] ?? g.relation}
                      {g.is_primary && " · Principal"}
                    </span>
                  </div>
                </div>
                {g.phone && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-primary/60 hover:text-primary hover:bg-primary/10 rounded-xl"
                    asChild
                  >
                    <a
                      href={`https://wa.me/55${g.phone.replace(/\D/g, "")}?text=${encodeURIComponent(
                        `Olá ${g.full_name}, aqui é do Kids da Igreja Atos. ${childName} está saindo da sala agora.`,
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="WhatsApp"
                    >
                      <span>
                        <MessageSquare className="h-4 w-4" />
                      </span>
                    </a>
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground ml-1">
            Código de Segurança
          </Label>
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="????"
            maxLength={6}
            className="font-mono tracking-[0.4em] text-center text-xl h-12 rounded-2xl bg-background/50 border-primary/10 focus:ring-primary/20"
          />
        </div>
        <div className="space-y-2">
          <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground ml-1">
            Nome de quem retirou
          </Label>
          <Input
            value={pickedBy}
            onChange={(e) => setPickedBy(e.target.value)}
            placeholder="Nome completo..."
            className="h-12 rounded-2xl bg-background/50 border-primary/10 focus:ring-primary/20"
          />
        </div>
      </div>

      <Button
        className="w-full h-14 rounded-2xl text-lg font-serif shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98] transition-all"
        onClick={() => confirm.mutate()}
        disabled={confirm.isPending || !code || !pickedBy}
      >
        {confirm.isPending ? "Confirmando..." : "Finalizar Retirada"}
      </Button>
    </div>
  );
}

interface CheckoutDialogProps {
  checkin: KidsCheckin;
  childName: string;
}

export function CheckoutDialog({ checkin, childName }: CheckoutDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="rounded-xl border-primary/10 hover:bg-primary/5 hover:text-primary transition-all group"
        >
          <LogOut className="mr-1.5 h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />{" "}
          Entregar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto rounded-[2rem] border-primary/5 p-6 sm:p-8 scrollbar-thin">
        <DialogHeader className="mb-2">
          <DialogTitle className="flex items-center gap-2 font-serif text-2xl">
            <ShieldCheck className="h-6 w-6 text-primary" /> Fluxo de Saída
          </DialogTitle>
          <DialogDescription className="text-muted-foreground/80">
            Confirme a identidade visual e o código de segurança do responsável.
          </DialogDescription>
        </DialogHeader>

        <CheckoutPanel checkin={checkin} childName={childName} onDone={() => setOpen(false)} />

        <DialogFooter className="mt-4 pt-4 border-t border-primary/5">
          <Button variant="ghost" onClick={() => setOpen(false)} className="rounded-xl">
            Voltar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
