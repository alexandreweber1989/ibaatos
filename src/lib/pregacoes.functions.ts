import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Interface para o processamento de pregações.
 * Extrai transcrição do YouTube e gera resumo estruturado.
 */

const processSermonSchema = z.object({
  youtubeUrl: z.string().url(),
});

export const processSermon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => processSermonSchema.parse(input))
  .handler(async ({ data, context }) => {
    // 1. Verificar se o usuário é admin
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin_geral",
    });
    if (roleError || !isAdmin) throw new Error("Acesso negado.");

    try {
      // Importação dinâmica para manter o bundle do cliente limpo
      const { generateSermonSummary } = await import("./sermon-ai.server");

      return await generateSermonSummary(data.youtubeUrl);
    } catch (error) {
      console.error("Erro no processamento da pregação:", error);
      throw new Error(error instanceof Error ? error.message : "Falha ao processar pregação.");
    }
  });
