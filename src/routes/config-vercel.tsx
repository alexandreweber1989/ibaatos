import { createFileRoute } from "@tanstack/react-router";
import {
  Code,
  ExternalLink,
  Zap,
  Settings,
  Globe,
  Code2,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/config-vercel")({
  head: () => ({
    meta: [
      { title: "Guia Vercel + GitHub — Igreja Batista Atos" },
      {
        name: "description",
        content: "Como conectar seu projeto Lovable ao GitHub e Vercel para deploy automático.",
      },
    ],
  }),
  component: ConfigVercelPage,
});

function ConfigVercelPage() {
  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="space-y-4">
          <div className="flex items-center gap-2 text-primary font-mono text-xs uppercase tracking-[0.3em]">
            <Zap className="h-4 w-4" /> Infraestrutura & Deploy
          </div>
          <h1 className="font-serif text-4xl md:text-5xl tracking-tight leading-none text-balance">
            Integrando GitHub & Vercel
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl leading-relaxed">
            Aprenda a conectar sua plataforma para que cada mudança feita no Lovable seja publicada
            automaticamente no seu domínio.
          </p>
        </header>

        <Alert className="bg-primary/5 border-primary/20 rounded-2xl p-6">
          <Globe className="h-5 w-5 text-primary" />
          <AlertTitle className="text-lg font-serif">Fluxo de Sincronização</AlertTitle>
          <AlertDescription className="text-muted-foreground mt-2">
            <strong>Lovable</strong> (Editor) → <strong>GitHub</strong> (Código/Backup) →{" "}
            <strong>Vercel</strong> (Site no Ar)
          </AlertDescription>
        </Alert>

        <div className="grid gap-10">
          {/* Passo 1 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-foreground text-background flex items-center justify-center font-bold text-lg">
                1
              </div>
              <h2 className="text-2xl font-serif">Conectar ao GitHub</h2>
            </div>
            <Card className="border-border/40 bg-card/40 backdrop-blur-sm overflow-hidden rounded-2xl">
              <CardContent className="pt-6 space-y-4">
                <p className="text-muted-foreground">
                  Primeiro, o Lovable precisa ter permissão para salvar seu código no GitHub.
                </p>
                <ul className="space-y-4 text-sm text-muted-foreground">
                  <li className="flex gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                    <span>
                      No editor do Lovable, clique em <strong>GitHub</strong> no canto inferior
                      esquerdo (ou nas configurações).
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                    <span>
                      Crie um novo repositório ou conecte um existente. Isso criará o "backup vivo"
                      do seu projeto.
                    </span>
                  </li>
                </ul>
                <div className="p-4 bg-muted/50 rounded-xl flex items-center gap-3 border border-border/50">
                  <Code className="h-5 w-5" />
                  <span className="text-xs font-mono uppercase tracking-widest opacity-70">
                    Github Repository Connected
                  </span>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Passo 2 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-foreground text-background flex items-center justify-center font-bold text-lg">
                2
              </div>
              <h2 className="text-2xl font-serif">Configurar no Vercel</h2>
            </div>
            <Card className="border-border/40 bg-card/40 backdrop-blur-sm overflow-hidden rounded-2xl">
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="mt-1 p-2 bg-primary/10 rounded-lg text-primary">
                      <ExternalLink className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-medium text-lg">Importe o Repositório</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Acesse{" "}
                        <a
                          href="https://vercel.com/new"
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary underline font-medium"
                        >
                          vercel.com/new
                        </a>
                        , conecte sua conta do GitHub e selecione o repositório que o Lovable criou.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="mt-1 p-2 bg-primary/10 rounded-lg text-primary">
                      <Settings className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-medium text-lg">Configurações de Build</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        O Vercel deve detectar automaticamente como um projeto <strong>Vite</strong>
                        . Se pedir o comando de build, use:{" "}
                        <code className="bg-muted px-2 py-1 rounded">npm run build</code>.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="mt-1 p-2 bg-primary/10 rounded-lg text-primary">
                      <Code2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-medium text-lg">Variáveis de Ambiente</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Copie as variáveis do Lovable (Configurações {" > "} Environment Variables)
                        para o Vercel:
                      </p>
                      <div className="mt-3 grid grid-cols-1 gap-2">
                        <code className="text-[10px] bg-muted/50 p-2 rounded border border-border/50">
                          VITE_SUPABASE_URL
                        </code>
                        <code className="text-[10px] bg-muted/50 p-2 rounded border border-border/50">
                          VITE_SUPABASE_PUBLISHABLE_KEY
                        </code>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Passo 3 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-foreground text-background flex items-center justify-center font-bold text-lg">
                3
              </div>
              <h2 className="text-2xl font-serif">A Mágica da Sincronização</h2>
            </div>
            <div className="bg-foreground text-background p-8 rounded-3xl space-y-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                <Zap className="h-24 w-24 fill-current" />
              </div>
              <p className="text-lg leading-relaxed relative z-10">
                A partir de agora, toda vez que você fizer uma mudança aqui no editor do Lovable, o
                GitHub receberá um commit e o Vercel publicará o site sozinho.
              </p>
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest opacity-60 relative z-10">
                <CheckCircle2 className="h-3 w-3" /> Deploy Automático Ativado
              </div>
            </div>
          </section>
        </div>

        <footer className="pt-16 pb-8 flex flex-col items-center gap-6">
          <Button size="lg" className="rounded-full px-8 h-14 group" asChild>
            <a href="/">
              Ir para o Início{" "}
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </Button>
          <p className="text-xs text-muted-foreground font-mono uppercase tracking-[0.2em]">
            Igreja Batista Atos · Infraestrutura
          </p>
        </footer>
      </div>
    </div>
  );
}
