import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const smsSchema = z.object({
  to: z.string(),
  message: z.string(),
  type: z.enum(["sms", "whatsapp", "both"]),
});

export const Route = createFileRoute("/api/public/sms-whatsapp")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const { to, message, type } = smsSchema.parse(body);

          console.log(`[DISPARO ${type.toUpperCase()}] Para: ${to} | Msg: ${message}`);

          // Integração com Twilio / Z-API / Evolution API etc.
          // const res = await fetch('https://api.whatsapp.com/send', { ... })

          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          return new Response(JSON.stringify({ error: "Erro ao processar envio." }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
