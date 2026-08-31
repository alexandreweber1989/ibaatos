/**
 * Gateway centralizado para serviços Google (Gemini e YouTube).
 * Focado em utilizar o tier gratuito (Gemini 1.5 Flash).
 */

export const googleGateway = {
  /**
   * Chamada ao Gemini 2.5 Flash (Gratuito até 15 RPM).
   */
  gemini: async (prompt: string, options: { jsonMode?: boolean } = {}) => {
    const apiKey = process.env["GOOGLE_API_KEY"];

    if (!apiKey) {
      throw new Error(
        "Google API Key não configurada. Por favor, adicione GOOGLE_API_KEY nos Secrets da plataforma.",
      );
    }

    const model = "gemini-2.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const body = {
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        responseMimeType: options.jsonMode ? "application/json" : "text/plain",
      },
    };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Gemini API Error (${response.status}): ${err}`);
      }

      const result = await response.json();
      return result.candidates[0].content.parts[0].text;
    } catch (error: any) {
      console.error("[Google Gateway] Gemini error:", error);
      throw error;
    }
  },

  /**
   * Busca dados do YouTube via Data API v3.
   */
  youtube: async (endpoint: string, params: Record<string, string>) => {
    const apiKey = process.env["GOOGLE_API_KEY"];
    if (!apiKey) {
      throw new Error("Google API Key não configurada.");
    }

    const query = new URLSearchParams({ ...params, key: apiKey }).toString();
    const url = `https://www.googleapis.com/youtube/v3/${endpoint}?${query}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        const err = await response.text();
        throw new Error(`YouTube API Error (${response.status}): ${err}`);
      }
      return await response.json();
    } catch (error) {
      console.error("[Google Gateway] YouTube error:", error);
      throw error;
    }
  },
};
