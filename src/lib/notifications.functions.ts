import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const sendUrgentNotification = createServerFn({ method: "POST" })
  .validator((data) =>
    z
      .object({
        type: z.enum(["prayer", "social"]),
        content: z.string(),
        userName: z.string(),
        mesaId: z.string().optional(),
        urgent: z.boolean().default(true),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { getLeaderContactsForMesa, getSocialAdmins } = await import("./notifications.server");
    const { sendWhatsAppNotification } = await import("./whatsapp.functions");

    const { type, content, userName, mesaId, urgent } = data;

    let targets: { full_name: string; phone: string | null }[] = [];

    if (type === "prayer" && mesaId) {
      targets = await getLeaderContactsForMesa(mesaId);
    } else {
      targets = await getSocialAdmins();
    }

    const results = await Promise.all(
      targets.map((leader) => {
        if (!leader.phone) return Promise.resolve(null);

        const message = `Olá ${leader.full_name}, um novo pedido URGENTE foi recebido!\n\nSolicitante: ${userName}\nTipo: ${type === "prayer" ? "Oração" : "Assistência Social"}\n\nConteúdo: ${content}\n\nPor favor, acesse a plataforma para mais detalhes.`;

        return sendWhatsAppNotification({
          data: {
            phone: leader.phone,
            message,
            childName: userName,
            type: "checkin",
          },
        });
      }),
    );

    return { success: true, targetsNotified: targets.length };
  });

export const notifyAllMembers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) =>
    z
      .object({
        title: z.string(),
        message: z.string(),
        type: z.enum(["emergency", "announcement", "event"]).default("announcement"),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    // Antes esta função chamava http://localhost:8080 — o que nunca funcionaria
    // em produção. Agora entrega de fato, pelo mesmo caminho do painel de envio.
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin_geral",
    });
    if (!isAdmin) throw new Error("Apenas a administração pode notificar todos os membros.");

    const { enviarPush, resolverPublico } = await import("./push.server");
    const userIds = await resolverPublico("todos");
    if (userIds.length === 0) return { success: true, count: 0 };

    const resultado = await enviarPush(
      userIds,
      { title: data.title, body: data.message, url: "/dashboard", type: data.type },
      { audience: "todos", sentBy: context.userId },
    );
    return { success: true, count: userIds.length, ...resultado };
  });
