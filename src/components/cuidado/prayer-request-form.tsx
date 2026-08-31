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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ShieldCheck, HeartPulse, AlertTriangle } from "lucide-react";

const formSchema = z.object({
  category: z.enum(["prayer", "counseling"]),
  content: z.string().min(10, "Por favor, descreva seu pedido com pelo menos 10 caracteres."),
  urgent: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

export function PrayerRequestForm({ onSuccess }: { onSuccess?: () => void }) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: "prayer",
      content: "",
      urgent: false,
    },
  });

  async function onSubmit(values: FormValues) {
    if (!profile) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("prayer_requests").insert({
        user_id: profile.id,
        mesa_id: profile.mesa_id,
        category: values.category,
        content: values.content,
        is_private: true,
      });

      if (error) throw error;

      if (values.urgent) {
        await sendUrgentNotification({
          data: {
            type: "prayer",
            content: values.content,
            userName: profile.full_name || "Membro",
            mesaId: profile.mesa_id,
            urgent: true,
          },
        });
      }

      toast.success(
        values.urgent
          ? "Pedido URGENTE enviado e líderes notificados!"
          : "Pedido enviado com sucesso!",
      );
      form.reset();
      onSuccess?.();
    } catch (error: any) {
      console.error("Erro ao enviar pedido:", error);
      toast.error("Erro ao enviar pedido. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex gap-4 items-start">
        <ShieldCheck className="h-5 w-5 text-primary mt-1 shrink-0" />
        <div className="text-sm text-muted-foreground leading-relaxed">
          <strong className="text-foreground block mb-1">Privacidade Garantida</strong>
          Este é um canal privado. Seu pedido de oração ou aconselhamento será visualizado{" "}
          <span className="text-primary font-medium italic underline underline-offset-4">
            exclusivamente pelo líder ou pastor responsável pela sua Mesa
          </span>
          . Ninguém mais terá acesso a estas informações.
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Solicitação</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="prayer">Pedido de Oração</SelectItem>
                    <SelectItem value="counseling">Pedido de Aconselhamento</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sua mensagem</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Escreva aqui como podemos orar por você ou o que deseja conversar..."
                    className="min-h-[120px] resize-none"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Seja específico para que seu líder possa te acompanhar melhor.
                </FormDescription>
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
                    Ative para notificar seus líderes imediatamente via WhatsApp.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full gap-2" disabled={loading}>
            <HeartPulse className="h-4 w-4" />
            {loading ? "Enviando..." : "Enviar Pedido"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
