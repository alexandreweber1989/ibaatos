import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";
import { updateMemberCredentials } from "@/lib/members.functions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/** Gera uma senha provisória legível para entregar ao membro. */
function suggestPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint32Array(12));
  return Array.from(bytes, (n) => chars[n % chars.length]).join("");
}

/**
 * Permite ao admin geral trocar o e-mail de acesso e/ou definir uma nova senha
 * de um membro (quando ele perde o acesso à conta).
 */
export function MemberCredentialsDialog({
  userId,
  currentEmail,
  fullName,
}: {
  userId: string;
  currentEmail?: string | null;
  fullName?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(currentEmail ?? "");
  const [password, setPassword] = useState("");
  const qc = useQueryClient();
  const update = useServerFn(updateMemberCredentials);

  const save = useMutation({
    mutationFn: async () => {
      const nextEmail = email.trim().toLowerCase();
      const changedEmail = nextEmail && nextEmail !== (currentEmail ?? "").trim().toLowerCase();
      if (!changedEmail && !password) {
        throw new Error("Altere o e-mail ou informe uma nova senha.");
      }
      if (password && password.length < 8) {
        throw new Error("A senha precisa ter ao menos 8 caracteres.");
      }
      await update({
        data: {
          user_id: userId,
          ...(changedEmail ? { email: nextEmail } : {}),
          ...(password ? { password } : {}),
        },
      });
    },
    onSuccess: () => {
      toast.success("Credenciais atualizadas.");
      setPassword("");
      setOpen(false);
      void qc.invalidateQueries({ queryKey: ["members"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) {
          setEmail(currentEmail ?? "");
          setPassword("");
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" aria-label="Alterar acesso">
          <KeyRound className="h-4 w-4" /> Acesso
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-3xl">Acesso do membro</DialogTitle>
          <DialogDescription>
            Altere o e-mail de login ou defina uma nova senha para {fullName ?? "este membro"}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cred-email">E-mail de acesso</Label>
            <Input
              id="cred-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="membro@email.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cred-password">Nova senha</Label>
            <div className="flex gap-2">
              <Input
                id="cred-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Deixe em branco para manter"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setPassword(suggestPassword())}
              >
                Gerar
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Mínimo de 8 caracteres. Anote e entregue a senha ao membro — ela não fica visível
              depois.
            </p>
          </div>
          <Button className="w-full" disabled={save.isPending} onClick={() => save.mutate()}>
            Salvar acesso
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
