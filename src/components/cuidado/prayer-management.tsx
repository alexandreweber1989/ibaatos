import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { LoadingRegion } from "@/components/ui/loading-states";
import { toast } from "sonner";
import { MessageSquareReply, CheckCircle2, Clock } from "lucide-react";

export function PrayerManagement() {
  const { roles, isAdmin } = useAuth();
  const qc = useQueryClient();
  const [replies, setReplies] = useState<{ [key: string]: string }>({});

  const mesaIds = roles
    .filter((r) => r.role === "lider_mesa")
    .map((r) => r.mesa_id)
    .filter(Boolean) as string[];

  const { data: requests, isLoading } = useQuery({
    queryKey: ["prayer-requests-management", mesaIds],
    queryFn: async () => {
      let query = supabase
        .from("prayer_requests")
        .select("*, profiles!prayer_requests_user_id_fkey(full_name)")
        .order("created_at", { ascending: false });

      if (!isAdmin) {
        query = query.in("mesa_id", mesaIds);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: isAdmin || mesaIds.length > 0,
  });

  const replyMutation = useMutation({
    mutationFn: async ({ id, response }: { id: string; response: string }) => {
      const { error } = await supabase
        .from("prayer_requests")
        .update({
          response,
          status: "replied",
          responded_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["prayer-requests-management"] });
      toast.success("Resposta enviada com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao enviar resposta.");
    },
  });

  if (isLoading)
    return <LoadingRegion label="Carregando pedidos de oração..." children={<div />} />;

  if (!requests || requests.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-xl">
        <p className="text-muted-foreground">Nenhum pedido de oração pendente.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <Card key={request.id}>
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <div className="space-y-1">
              <CardTitle className="text-base font-medium">
                {(request.profiles as any)?.full_name || "Membro"}
              </CardTitle>
              <CardDescription>
                {format(new Date(request.created_at), "PPP 'às' p", { locale: ptBR })}
              </CardDescription>
            </div>
            <Badge variant={request.status === "replied" ? "secondary" : "default"}>
              {request.status === "replied" ? (
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Respondido
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Pendente
                </span>
              )}
            </Badge>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{request.content}</p>
            {request.response && (
              <div className="mt-4 bg-muted/50 p-3 rounded-lg border">
                <p className="text-xs font-semibold text-primary mb-1">Sua resposta:</p>
                <p className="text-sm italic">"{request.response}"</p>
                {request.responded_at && (
                  <p className="text-[10px] text-muted-foreground mt-2">
                    Em {format(new Date(request.responded_at), "PPP 'às' p", { locale: ptBR })}
                  </p>
                )}
              </div>
            )}
          </CardContent>
          {request.status !== "replied" && (
            <CardFooter className="flex flex-col gap-3">
              <Textarea
                placeholder="Escreva uma mensagem de encorajamento ou 'Estarei orando por isso'..."
                className="min-h-[80px]"
                value={replies[request.id] || ""}
                onChange={(e) => setReplies({ ...replies, [request.id]: e.target.value })}
              />
              <Button
                className="w-full gap-2"
                onClick={() =>
                  replyMutation.mutate({
                    id: request.id,
                    response: replies[request.id] || "Vou colocar em minhas orações esse pedido.",
                  })
                }
                disabled={replyMutation.isPending}
              >
                <MessageSquareReply className="h-4 w-4" />
                Confirmar que irá orar
              </Button>
            </CardFooter>
          )}
        </Card>
      ))}
    </div>
  );
}
