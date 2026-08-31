import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { sendUrgentNotification } from "@/lib/notifications.functions";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Heart, HandHelping, AlertTriangle } from "lucide-react";

const formSchema = z.object({
  needs_food: z.boolean(),
  description: z
    .string()
    .min(10, "Por favor, descreva brevemente a necessidade (mínimo 10 caracteres)."),
  urgent: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

export function SocialAssistanceForm({ onSuccess }: { onSuccess?: () => void }) {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      needs_food: false,
      description: "",
      urgent: false,
    },
  });

  async function onSubmit(values: FormValues) {
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("social_assistance_requests").insert({
        user_id: user.id,
        needs_food: values.needs_food,
        description: values.description,
      });

      if (error) throw error;

      if (values.urgent || values.needs_food) {
        await sendUrgentNotification({
          data: {
            type: "social",
            content: values.description,
            userName: profile?.full_name || "Membro",
            mesaId: profile?.mesa_id,
            urgent: true,
          },
        });
      }

      toast.success(
        values.urgent
          ? "Pedido URGENTE enviado e assistência notificada!"
          : "Solicitação enviada ao Atos de Amor!",
      );
      form.reset();
      onSuccess?.();
    } catch (error: any) {
      console.error("Erro ao enviar solicitação:", error);
      toast.error("Erro ao enviar solicitação. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 flex gap-4 items-start dark:bg-rose-950/20 dark:border-rose-900/30">
        <Heart className="h-5 w-5 text-rose-500 mt-1 shrink-0" />
        <div className="text-sm text-muted-foreground leading-relaxed">
          <strong className="text-foreground block mb-1">Atos de Amor</strong>
          Nossa igreja está aqui para estender a mão. Se você ou sua família estão passando por
          dificuldades, use este canal para solicitar ajuda. A equipe responsável entrará em contato
          com total discrição.
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="needs_food"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Preciso de auxílio com alimentação (Cesta Básica)</FormLabel>
                  <FormDescription>
                    Marque esta opção se sua necessidade imediata for alimento. (Notificação
                    Automática)
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Como podemos ajudar?</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Descreva brevemente a situação para que possamos entender como melhor auxiliar..."
                    className="min-h-[120px] resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="urgent"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border border-orange-200 bg-orange-50/50 p-4 dark:bg-orange-950/10 dark:border-orange-900/20">
                <div className="space-y-0.5">
                  <FormLabel className="text-base flex items-center gap-2 text-orange-700 dark:text-orange-400">
                    <AlertTriangle className="h-4 w-4" />
                    Pedido Urgente?
                  </FormLabel>
                  <FormDescription className="text-orange-600/80 dark:text-orange-500/80">
                    Notificar a equipe do Atos de Amor imediatamente.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full gap-2 bg-rose-600 hover:bg-rose-700 text-white"
            disabled={loading}
          >
            <HandHelping className="h-4 w-4" />
            {loading ? "Enviando..." : "Solicitar Apoio"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
