import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { LoadingRegion } from "@/components/ui/loading-states";
import { toast } from "sonner";
import { Utensils, Info } from "lucide-react";

export function SocialManagement() {
  const { isAdmin } = useAuth();
  const qc = useQueryClient();

  const { data: requests, isLoading } = useQuery({
    queryKey: ["social-assistance-management"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("social_assistance_requests")
        .select("*, profiles!social_assistance_requests_user_id_fkey(full_name, phone)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: any }) => {
      const { error } = await supabase
        .from("social_assistance_requests")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["social-assistance-management"] });
      toast.success("Status atualizado!");
    },
  });

  if (isLoading)
    return <LoadingRegion label="Carregando solicitações de assistência..." children={<div />} />;

  if (!requests || requests.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-xl">
        <p className="text-muted-foreground">Nenhuma solicitação de ajuda encontrada.</p>
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
                Solicitado em {format(new Date(request.created_at), "PPP", { locale: ptBR })}
                {(request.profiles as any)?.phone && ` • ${(request.profiles as any).phone}`}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {request.needs_food && (
                <Badge variant="destructive" className="gap-1">
                  <Utensils className="h-3 w-3" /> Alimento
                </Badge>
              )}
              <Select
                defaultValue={request.status}
                onValueChange={(val) =>
                  updateStatusMutation.mutate({ id: request.id, status: val })
                }
              >
                <SelectTrigger className="h-7 w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="in_review">Em Análise</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/30 p-3 rounded-lg flex gap-3">
              <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-sm leading-relaxed">{request.description}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
