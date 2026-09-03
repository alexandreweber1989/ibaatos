import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { validateNewPassword } from "@/lib/password-reset";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth/redefinir-senha")({ component: ResetPasswordPage });

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const validationError = validateNewPassword(password, confirmation);
    if (validationError) return toast.error(validationError);

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) return toast.error(error.message);
      toast.success("Senha redefinida com sucesso. Entre com a nova senha.");
      await supabase.auth.signOut();
      navigate({ to: "/auth", replace: true });
    } catch {
      toast.error("Não foi possível redefinir a senha. Solicite um novo link e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background p-4 flex items-center justify-center">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-5 rounded-lg border bg-card p-6 shadow-sm">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-primary">Recuperação de acesso</p>
          <h1 className="mt-2 font-serif text-3xl">Defina uma nova senha</h1>
          <p className="mt-2 text-sm text-muted-foreground">Use uma senha com pelo menos 6 caracteres.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-password">Nova senha</Label>
          <Input id="new-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirme a nova senha</Label>
          <Input id="confirm-password" type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="new-password" required />
        </div>
        <Button type="submit" className="w-full" loading={loading}>{loading ? "Salvando..." : "Redefinir senha"}</Button>
      </form>
    </main>
  );
}
