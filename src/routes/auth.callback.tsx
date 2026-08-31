import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = Route.useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const handleCallback = async () => {
      try {
        // Tenta obter a sessão que pode já ter sido estabelecida pelo cliente
        const {
          data: { session },
          error: authError,
        } = await supabase.auth.getSession();

        if (authError) throw authError;

        if (session && mounted) {
          toast.success("Login realizado com sucesso!");
          navigate({ to: "/dashboard", replace: true });
          return;
        }

        // Escuta mudanças no estado de autenticação para capturar o login
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === "SIGNED_IN" && session && mounted) {
            subscription.unsubscribe();
            toast.success("Login realizado com sucesso!");
            navigate({ to: "/dashboard", replace: true });
          }
        });

        // Timeout de segurança: se após 5 segundos não houver sessão, volta para o login
        const timeout = setTimeout(() => {
          if (mounted) {
            subscription.unsubscribe();
            setError("Tempo esgotado ao aguardar autenticação. Tente novamente.");
            setTimeout(() => navigate({ to: "/auth", replace: true }), 3000);
          }
        }, 5000);

        return () => {
          subscription.unsubscribe();
          clearTimeout(timeout);
        };
      } catch (err: any) {
        if (mounted) {
          console.error("Erro no callback de autenticação:", err);
          setError(err.message || "Erro ao processar login.");
          setTimeout(() => navigate({ to: "/auth", replace: true }), 3000);
        }
      }
    };

    handleCallback();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
        <h2 className="text-xl font-serif mb-2 text-destructive">Falha na Autenticação</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <p className="text-xs font-mono uppercase tracking-widest animate-pulse">
          Redirecionando para login...
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground font-mono text-xs uppercase tracking-widest">
          Finalizando autenticação...
        </p>
      </div>
    </div>
  );
}
