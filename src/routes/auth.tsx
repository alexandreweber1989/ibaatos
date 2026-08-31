import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Church, ArrowLeft, Key } from "lucide-react";
import { VersiculoAnimado } from "@/components/auth/VersiculoAnimado";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useServerFn } from "@tanstack/react-start";
import { updateUserPassword } from "@/lib/auth-admin.functions";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Igreja Batista Atos" },
      { name: "description", content: "Entre na plataforma da Igreja Batista Atos." },
      { property: "og:title", content: "Entrar — Igreja Batista Atos" },
      { property: "og:description", content: "Acesse a plataforma dos ministérios." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [adminSetupEmail, setAdminSetupEmail] = useState("alew15_7@hotmail.com");
  const [adminSetupPassword, setAdminSetupPassword] = useState("");
  const updatePasswordFn = useServerFn(updateUserPassword);

  useEffect(() => {
    if (user) navigate({ to: "/dashboard", replace: true });
  }, [user, navigate]);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Bem-vindo(a)!");
    navigate({ to: "/dashboard", replace: true });
  }

  /**
   * O acesso é restrito a membros da igreja: em vez de criar a conta na hora,
   * registramos uma solicitação que fica pendente para o administrador aprovar.
   */
  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from("membership_requests").insert({
      full_name: fullName.trim().slice(0, 120),
      email: email.trim().toLowerCase().slice(0, 255),
      phone: phone.trim().slice(0, 30) || null,
      notes: notes.trim().slice(0, 500) || null,
      status: "pendente",
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Solicitação enviada. Um administrador vai avaliar seu cadastro.");
    setFullName("");
    setPhone("");
    setNotes("");
    setMode("signin");
  }

  /**
   * Login com Google via Supabase (OAuth direto).
   *
   * Antes usávamos o broker do Lovable (`lovable.auth.signInWithOAuth`), que
   * envia o navegador para `/~oauth/initiate` — um caminho RELATIVO, servido
   * apenas pela hospedagem do Lovable. Fora dela (Vercel) ninguém atende esse
   * endereço e o app caía no 404. Ver #22.
   *
   * O Supabase devolve para `redirectTo` com o código na URL; o cliente tem
   * `detectSessionInUrl` ligado (padrão) e conclui a sessão sozinho, por isso
   * não é preciso uma rota de callback dedicada.
   */
  async function handleGoogle() {
    try {
      setLoading(true);

      const callbackUrl = `${window.location.origin}/auth/callback`;
      console.log("Iniciando OAuth com Google. Callback:", callbackUrl);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        console.error("Erro no signInWithOAuth:", error);
        toast.error("Erro ao conectar com Google: " + error.message);
        setLoading(false);
      }
    } catch (err) {
      console.error("Exceção no handleGoogle:", err);
      toast.error("Erro inesperado no login social.");
      setLoading(false);
    }
  }

  /** Envia o e-mail de redefinição de senha. */
  async function handleRecuperarSenha() {
    if (!email) {
      return toast.error("Digite seu e-mail acima para receber o link de redefinição.");
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth`,
    });
    setLoading(false);
    if (error) {
      if (error.message.includes("Email rate limit exceeded")) {
        return toast.error(
          "Limite de envios atingido. Tente novamente em alguns minutos ou verifique sua caixa de spam.",
        );
      }
      return toast.error(error.message);
    }
    toast.success(
      "Enviamos um link de redefinição para o seu e-mail. Verifique também a pasta de Spam.",
    );
  }

  async function handleAdminSetup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await updatePasswordFn({ data: { email: adminSetupEmail, password: adminSetupPassword } });
      toast.success("Senha configurada com sucesso! Agora você já pode entrar.");
      setMode("signin");
      setEmail(adminSetupEmail);
      setPassword(adminSetupPassword);
    } catch (err: any) {
      toast.error(err.message || "Erro ao configurar senha.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground grid grid-cols-1 lg:grid-cols-2">
      <aside className="hidden lg:flex flex-col justify-between bg-sidebar text-sidebar-foreground p-12">
        <Link
          to="/"
          className="flex items-center gap-2 text-sidebar-foreground/70 hover:text-sidebar-foreground text-sm"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar ao início
        </Link>
        <div>
          <Church className="h-8 w-8 text-sidebar-primary mb-6" />
          <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-sidebar-primary mb-4">
            Plataforma interna
          </div>
          <VersiculoAnimado />
        </div>
        <div className="text-xs font-mono uppercase tracking-widest text-sidebar-foreground/40">
          Igreja Batista Atos
        </div>
      </aside>

      <div className="flex items-center justify-center p-4 sm:p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-primary mb-2">
              Acesso à plataforma
            </div>
            <h1 className="font-serif text-3xl">Bem-vindo(a) de volta</h1>
          </div>

          <Tabs value={mode} onValueChange={(v) => setMode(v as any)}>
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="signin">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Solicitar</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4 mt-6">
                <div className="space-y-1.5">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <Label htmlFor="password">Senha</Label>
                    <button
                      type="button"
                      onClick={handleRecuperarSenha}
                      disabled={loading}
                      className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline disabled:opacity-50"
                    >
                      Esqueci minha senha
                    </button>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" loading={loading}>
                  {loading ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4 mt-6">
                <p className="text-xs text-muted-foreground">
                  A plataforma é exclusiva para membros da Igreja Batista Atos. Envie sua
                  solicitação: um administrador avalia e libera o acesso.
                </p>
                <div className="space-y-1.5">
                  <Label htmlFor="fn">Nome completo</Label>
                  <Input
                    id="fn"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email2">E-mail</Label>
                  <Input
                    id="email2"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone2">Telefone</Label>
                  <Input id="phone2" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="notes2">Seu vínculo com a igreja</Label>
                  <Textarea
                    id="notes2"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Mesa, rede ou ministério que frequenta, quem pode confirmar…"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Enviando..." : "Solicitar cadastro"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            <span className="font-mono uppercase tracking-widest">ou</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full relative overflow-hidden group"
            onClick={handleGoogle}
            loading={loading}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continuar com Google
            </span>
          </Button>

          <p className="mt-6 text-xs text-muted-foreground text-center">
            O acesso é liberado por um administrador. O primeiro usuário a entrar se torna Admin
            geral.
          </p>
        </div>
      </div>
    </div>
  );
}
