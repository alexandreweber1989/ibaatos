import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const notificationSchema = z.object({
  userIds: z.array(z.string().uuid()),
  title: z.string(),
  body: z.string(),
  type: z.enum(["emergency", "announcement", "event"]),
  data: z.record(z.any()).optional(),
});

export const Route = createFileRoute("/api/public/notifications")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          // Segurança: este endpoint escreve via service-role (ignora o RLS), então
          // exige um usuário autenticado com papel de administrador. O cliente deve
          // enviar o token de acesso no cabeçalho Authorization: Bearer <token>.
          const authHeader = request.headers.get("Authorization") ?? "";
          const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
          if (!token) {
            return new Response(JSON.stringify({ error: "Não autenticado." }), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            });
          }
          const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(token);
          if (authError || !userData?.user) {
            return new Response(JSON.stringify({ error: "Sessão inválida." }), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            });
          }
          const { data: adminRole } = await (supabaseAdmin.from("user_roles" as any) as any)
            .select("role")
            .eq("user_id", userData.user.id)
            .eq("role", "admin_geral")
            .maybeSingle();
          if (!adminRole) {
            return new Response(JSON.stringify({ error: "Acesso negado." }), {
              status: 403,
              headers: { "Content-Type": "application/json" },
            });
          }

          const body = await request.json();
          const { userIds, title, body: content, type, data } = notificationSchema.parse(body);

          const { error: histError } = await (
            supabaseAdmin.from("notifications_history" as any) as any
          ).insert(
            userIds.map((uid) => ({
              user_id: uid,
              title,
              body: content,
              type,
              metadata: data || {},
            })),
          );

          if (histError) throw histError;

          console.log(`[PUSH NOTIFICATION] Enviando para ${userIds.length} usuários: ${title}`);

          return new Response(JSON.stringify({ success: true, count: userIds.length }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          console.error("Erro na API de Notificações:", err);
          return new Response(JSON.stringify({ error: "Erro ao processar notificações." }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
