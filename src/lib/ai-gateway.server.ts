/**
 * Gateway de IA centralizado para o projeto.
 * Utiliza o Lovable AI Gateway para chamadas seguras.
 */

export const aiGateway = {
  chat: async (options: {
    messages: { role: string; content: string }[];
    model?: string;
    response_format?: { type: "json_object" | "text" };
  }) => {
    const apiKey = process.env["LOVABLE_AI_GATEWAY_KEY"] || process.env["OPENAI_API_KEY"];

    // Configuração de headers padrão
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    /**
     * IMPORTANTE: No Lovable Cloud, se nenhuma chave customizada for fornecida,
     * o Gateway de IA gerenciado é injetado automaticamente pelo proxy se
     * NÃO enviarmos o header Authorization.
     */
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: options.model || "gpt-4o-mini",
          messages: options.messages,
          response_format: options.response_format,
        }),
      });

      if (!response.ok) {
        const errBody = await response.text();

        // Se retornar 401, informamos ao usuário para configurar a chave nos Secrets
        if (response.status === 401) {
          throw new Error(
            "Erro de Autenticação (401): Nenhuma chave de API (OpenAI ou Google) configurada. Para automação gratuita, adicione GOOGLE_API_KEY nos Secrets (Configurações > Secrets).",
          );
        }

        throw new Error(`AI Gateway Error (${response.status}): ${errBody}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error("[AI Gateway] Connection error:", error);
      throw error;
    }
  },
};
