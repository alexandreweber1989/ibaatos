import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Envia uma notificação via WhatsApp para o responsável
 * Nota: Como este é um ambiente de demonstração, simulamos o envio.
 * Em produção, aqui integraríamos com uma API como Twilio, Zapi, ou similar.
 */
export const sendWhatsAppNotification = createServerFn({ method: "POST" })
  .validator((data) =>
    z
      .object({
        phone: z.string(),
        message: z.string(),
        childName: z.string(),
        type: z.enum(["checkin", "checkout"]),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    console.log(`[WhatsApp Simulation] Sending ${data.type} to ${data.phone}: ${data.message}`);

    // Aqui poderíamos registrar o log de envio no banco
    // const { error } = await supabaseAdmin.from('notification_logs').insert(...)

    return { success: true, timestamp: new Date().toISOString() };
  });

export const getKidsConfig = createServerFn({ method: "GET" }).handler(async () => {
  return {
    whatsappEnabled: true,
    provider: "MockService",
  };
});
