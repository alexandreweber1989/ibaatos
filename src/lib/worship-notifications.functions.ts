import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const notifyMusicians = createServerFn({ method: "POST" })
  .validator((data) =>
    z
      .object({
        scheduleId: z.string(),
        type: z.enum(["new_schedule", "update", "reminder"]),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    // Em produção, isso dispararia SMS/WhatsApp/Push via um serviço externo ou usando os hooks de notificação do sistema
    // Como estamos em um ambiente de desenvolvimento e focando na infraestrutura, vamos logar a intenção.
    console.log(
      `[Notification] Notifying musicians for schedule ${data.scheduleId} (Type: ${data.type})`,
    );

    // Simulação de delay de rede
    await new Promise((resolve) => setTimeout(resolve, 800));

    return { success: true, message: "Notificações enviadas com sucesso." };
  });
