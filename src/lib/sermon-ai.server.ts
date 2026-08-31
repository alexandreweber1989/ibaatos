import { googleGateway } from "@/lib/google-gateway.server";

/**
 * Lógica de processamento de pregações no servidor utilizando Google Gemini (Gratuito).
 */

export async function generateSermonSummary(youtubeUrl: string) {
  const videoId = youtubeUrl.match(
    /(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/)([A-Za-z0-9_-]{11})/,
  )?.[1];
  if (!videoId) throw new Error("ID do vídeo não encontrado no link.");

  // Como não temos transcrição real no Worker, usamos o Gemini para simular baseado no título/contexto
  // se o link for público ou se houver metadados disponíveis.

  const prompt = `
    Analise a pregação do vídeo do YouTube: ${youtubeUrl}
    
    OBJETIVO:
    Gerar um resumo completo e estruturado da pregação para a Igreja Batista Atos.
    
    REGRAS:
    1. Foque APENAS na mensagem central.
    2. Identifique tópicos principais.
    3. Extraia versículos bíblicos.
    
    RETORNE EXCLUSIVAMENTE UM JSON com esta estrutura:
    {
      "title": "Título sugerido",
      "theme": "Frase de impacto",
      "base_verse": "Versículo principal",
      "summary": "Resumo completo",
      "points": [{ "title": "Ponto", "detail": "Detalhe" }],
      "verses": ["Versículo 1", "Versículo 2"]
    }
  `;

  try {
    const responseText = await googleGateway.gemini(prompt, { jsonMode: true });
    return JSON.parse(responseText);
  } catch (error) {
    console.error("[Sermon AI] Gemini processing error:", error);
    throw new Error("Falha ao gerar resumo da pregação via Gemini.");
  }
}
