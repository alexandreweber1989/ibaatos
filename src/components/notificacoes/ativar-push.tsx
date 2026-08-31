import { useEffect, useState } from "react";
import {
  BellRing,
  BellOff,
  Smartphone,
  ShieldAlert,
  Check,
  Loader2,
  Share,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { configurarPushIgreja, enviarNotificacaoTeste } from "@/lib/push.functions";
import {
  ativarPush,
  desativarPush,
  precisaInstalarNoIOS,
  statusPush,
  type PushStatus,
} from "@/lib/push";

/**
 * Cartão onde a pessoa liga as notificações da igreja neste aparelho.
 * Cada celular é assinado separadamente — ligar no celular não afeta o computador.
 */
export function AtivarPush({ compact = false }: { compact?: boolean }) {
  const { user, isAdmin } = useAuth();
  const [status, setStatus] = useState<PushStatus>("desativado");
  const [carregando, setCarregando] = useState(false);
  const [testando, setTestando] = useState(false);
  const [pronto, setPronto] = useState(false);
  const iosPendente = precisaInstalarNoIOS();

  useEffect(() => {
    statusPush().then((s) => {
      setStatus(s);
      setPronto(true);
    });
  }, []);

  async function alternar() {
    if (!user) return;
    setCarregando(true);
    try {
      if (status === "ativo") {
        setStatus(await desativarPush());
        toast.success("Notificações desligadas neste aparelho.");
      } else {
        let novo: PushStatus;
        try {
          novo = await ativarPush(user.id);
        } catch (erro) {
          // Primeira vez: a igreja ainda não tem chaves. O admin ativa aqui mesmo,
          // sem precisar mexer em variáveis de ambiente nem refazer o deploy.
          const naoConfigurado =
            erro instanceof Error && /não foram ativadas|não configurad/i.test(erro.message);
          if (!naoConfigurado) throw erro;
          if (!isAdmin) {
            toast.error("As notificações ainda não foram ativadas pela igreja.");
            return;
          }
          toast.info("Ativando as notificações da igreja...");
          await configurarPushIgreja();
          novo = await ativarPush(user.id);
        }
        setStatus(novo);
        if (novo === "ativo") toast.success("Pronto! Você receberá os avisos da igreja.");
        else if (novo === "bloqueado")
          toast.error("As notificações estão bloqueadas nas configurações do navegador.");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível ativar agora.");
    } finally {
      setCarregando(false);
    }
  }

  /** Dispara uma notificação real para o próprio aparelho — confirma que tudo funciona. */
  async function testar() {
    setTestando(true);
    try {
      const r: any = await enviarNotificacaoTeste();
      if (r?.enviados > 0) toast.success("Enviada! O aviso deve aparecer em instantes.");
      else if (r?.semAparelho > 0)
        toast.error("Nenhum aparelho ativo encontrado. Ative acima e tente de novo.");
      else toast.error("Não foi possível entregar. Confira as chaves VAPID no ambiente.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao enviar o teste.");
    } finally {
      setTestando(false);
    }
  }

  if (!pronto) return null;

  // iOS só entrega push quando o app está na tela de início.
  if (iosPendente) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/40 p-5">
        <div className="flex items-start gap-3">
          <Smartphone className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
          <div>
            <p className="font-serif text-lg leading-tight">Instale o app para receber avisos</p>
            <p className="mt-1 text-sm text-muted-foreground">
              No iPhone, toque em <Share className="inline h-3.5 w-3.5" />{" "}
              <strong>Compartilhar</strong> e depois em <strong>Adicionar à Tela de Início</strong>.
              Abra o app por ali e as notificações ficarão disponíveis.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "indisponivel") {
    return compact ? null : (
      <div className="rounded-xl border border-border bg-card/40 p-5 text-sm text-muted-foreground">
        Este navegador não suporta notificações. Tente pelo Chrome (Android) ou instale o app.
      </div>
    );
  }

  const ativo = status === "ativo";
  const bloqueado = status === "bloqueado";

  return (
    <div className="rounded-xl border border-border bg-card/50 p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className={
              "grid h-10 w-10 shrink-0 place-items-center rounded-lg " +
              (ativo ? "bg-foreground text-background" : "bg-muted text-muted-foreground")
            }
          >
            {bloqueado ? (
              <ShieldAlert className="h-5 w-5" />
            ) : ativo ? (
              <BellRing className="h-5 w-5" />
            ) : (
              <BellOff className="h-5 w-5" />
            )}
          </div>
          <div className="min-w-0">
            <p className="font-serif text-lg leading-tight">
              {ativo ? "Notificações ativas" : "Avisos da igreja no seu celular"}
            </p>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              {bloqueado
                ? "Você bloqueou as notificações. Libere nas configurações do navegador (cadeado ao lado do endereço) e tente de novo."
                : ativo
                  ? "Você recebe avisos, escalas e comunicados neste aparelho."
                  : "Receba avisos importantes, lembretes de escala e comunicados — mesmo com o app fechado."}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {ativo && (
            <Button variant="ghost" onClick={testar} disabled={testando}>
              {testando ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Testar
            </Button>
          )}
          <Button
            onClick={alternar}
            disabled={carregando || bloqueado}
            variant={ativo ? "outline" : "default"}
          >
            {carregando ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : ativo ? (
              <Check className="h-4 w-4" />
            ) : (
              <BellRing className="h-4 w-4" />
            )}
            {ativo ? "Ativado" : "Ativar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
