import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/**
 * Pastores, apascentadores e líderes indicam alguém para entrar na plataforma.
 * A indicação vira uma pendência que só o admin geral pode aprovar.
 */
export function RequestMemberDialog() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      if (fullName.trim().length < 3) throw new Error("Informe o nome completo.");
      if (!/^\S+@\S+\.\S+$/.test(email.trim())) throw new Error("Informe um e-mail válido.");
      const { error } = await supabase.from("membership_requests").insert({
        full_name: fullName.trim().slice(0, 120),
        email: email.trim().toLowerCase().slice(0, 255),
        phone: phone.trim().slice(0, 30) || null,
        notes: notes.trim().slice(0, 500) || null,
        requested_by: user?.id ?? null,
        requester_name:
          (user?.user_metadata?.["full_name"] as string | undefined) ?? user?.email ?? null,
        status: "pendente",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Solicitação enviada para aprovação do administrador.");
      setOpen(false);
      setFullName("");
      setEmail("");
      setPhone("");
      setNotes("");
      void qc.invalidateQueries({ queryKey: ["membership-requests"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <UserPlus className="h-4 w-4" /> Indicar membro
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-3xl">Indicar membro</DialogTitle>
          <DialogDescription>
            A indicação fica pendente até que o administrador aprove o acesso à plataforma.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nome completo</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>E-mail</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Telefone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Mesa, rede ou ministério de origem, vínculo com a igreja…"
            />
          </div>
          <Button
            className="w-full"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            Enviar solicitação
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
