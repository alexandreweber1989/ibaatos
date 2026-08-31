import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Megaphone, Send, Clock, Info, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "../ui/dialog";
import { enviarNotificacao } from "@/lib/push.functions";

type Audience = "todos" | "mesa" | "rede" | "ministerio" | "lideranca";

const PUBLICOS: { value: Audience; label: string }[] = [
  { value: "todos", label: "Toda a igreja" },
  { value: "lideranca", label: "Somente a liderança" },
  { value: "rede", label: "Uma rede" },
  { value: "mesa", label: "Uma mesa" },
  { value: "ministerio", label: "Um ministério" },
];

export const GlobalBroadcast = () => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<"emergency" | "announcement" | "event">("announcement");
  const [audience, setAudience] = useState<Audience>("todos");
  const [audienceRef, setAudienceRef] = useState<string>("");

  const precisaGrupo = audience === "mesa" || audience === "rede" || audience === "ministerio";

  // Opções do grupo escolhido (só carrega quando necessário).
  const { data: grupos } = useQuery({
    queryKey: ["broadcast-grupos", audience],
    enabled: open && precisaGrupo,
    queryFn: async () => {
      const tabela = audience === "mesa" ? "mesas" : audience === "rede" ? "redes" : "ministries";
      const { data, error } = await supabase
        .from(tabela as any)
        .select("id, name")
        .order("name");
      if (error) throw error;
      return (data ?? []) as unknown as { id: string; name: string }[];
    },
  });

  const broadcastMutation = useMutation({
    mutationFn: async () => {
      if (!title.trim() || !message.trim()) throw new Error("Preencha o título e a mensagem.");
      if (precisaGrupo && !audienceRef) throw new Error("Escolha o grupo que vai receber.");
      return enviarNotificacao({
        data: {
          title: title.trim(),
          message: message.trim(),
          type,
          audience,
          audienceRef: precisaGrupo ? audienceRef : undefined,
        },
      });
    },
    onSuccess: (r: any) => {
      if (!r?.pessoas) {
        toast.info("Ninguém encontrado nesse público.");
        return;
      }
      const partes = [`${r.enviados} aparelho(s) notificado(s)`];
      if (r.semAparelho) partes.push(`${r.semAparelho} sem notificação ativada`);
      toast.success(partes.join(" · "));
      setOpen(false);
      setTitle("");
      setMessage("");
    },
    onError: (err: any) => toast.error(err.message || "Erro ao realizar o disparo."),
  });

  const templates = [
    {
      label: "Culto Iniciado",
      title: "O Culto Começou! 🔥",
      message: "Nossa celebração acabou de começar. Venha se juntar a nós ou acompanhe a live!",
      type: "event" as const,
    },
    {
      label: "Culto Encerrado",
      title: "Culto Encerrado ✨",
      message: "Que tempo precioso tivemos hoje! Uma semana abençoada a todos.",
      type: "event" as const,
    },
    {
      label: "Aviso Urgente",
      title: "COMUNICADO URGENTE 🚨",
      message: "",
      type: "emergency" as const,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-full gap-2 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90">
          <Megaphone className="h-4 w-4" />
          Notificar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto border-none bg-background/95 backdrop-blur-xl">
        <DialogHeader>
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
            <Megaphone className="h-6 w-6" />
          </div>
          <DialogTitle className="font-serif text-2xl tracking-tight">
            Enviar notificação
          </DialogTitle>
          <DialogDescription>
            Chega como alerta no celular de quem ativou as notificações.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              Modelos Rápidos
            </label>
            <div className="flex flex-wrap gap-2">
              {templates.map((t) => (
                <Button
                  key={t.label}
                  variant="outline"
                  size="sm"
                  className="text-[10px] h-7 rounded-full uppercase tracking-tighter"
                  onClick={() => {
                    setTitle(t.title);
                    setMessage(t.message);
                    setType(t.type);
                  }}
                >
                  {t.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" /> Quem vai receber
            </label>
            <div className="grid gap-2 sm:grid-cols-2">
              <Select
                value={audience}
                onValueChange={(v) => {
                  setAudience(v as Audience);
                  setAudienceRef("");
                }}
              >
                <SelectTrigger className="bg-card/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PUBLICOS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {precisaGrupo && (
                <Select value={audienceRef} onValueChange={setAudienceRef}>
                  <SelectTrigger className="bg-card/50">
                    <SelectValue placeholder="Escolha..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {(grupos ?? []).map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Título do Alerta</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Culto de Domingo Iniciado"
                className="bg-card/50"
                maxLength={80}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Mensagem</label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Descreva o comunicado detalhadamente..."
                className="min-h-[100px] bg-card/50"
                maxLength={400}
              />
            </div>
          </div>

          {/* Prévia fiel do que aparece na tela de bloqueio do celular. */}
          {(title || message) && (
            <div className="rounded-xl border border-border bg-card/60 p-3 shadow-sm">
              <p className="mb-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Prévia no celular
              </p>
              <div className="flex gap-3">
                <img
                  src="/icons/icon-192.png"
                  alt=""
                  className="h-9 w-9 rounded-lg"
                  loading="lazy"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{title || "Título do alerta"}</p>
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {message || "Sua mensagem aparece aqui."}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 flex gap-3">
            <Info className="h-5 w-5 text-primary shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong>Atenção:</strong> não é possível desfazer. Só recebe quem ativou as
              notificações no aparelho; os demais veem o registro no histórico.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={broadcastMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={() => broadcastMutation.mutate()}
            disabled={broadcastMutation.isPending}
            className="gap-2"
          >
            {broadcastMutation.isPending ? (
              <Clock className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {broadcastMutation.isPending ? "Enviando..." : "Enviar agora"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
