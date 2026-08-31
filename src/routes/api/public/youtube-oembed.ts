import { createFileRoute } from "@tanstack/react-router";

/**
 * Busca (no servidor, sem problemas de CORS) o título e a miniatura de um vídeo
 * do YouTube via oEmbed, para preencher a pregação a partir do link.
 */
export const Route = createFileRoute("/api/public/youtube-oembed")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const target = new URL(request.url).searchParams.get("url") ?? "";
        const isYouTube = /(?:youtube\.com|youtu\.be)/i.test(target);
        if (!target || !isYouTube) {
          return new Response(JSON.stringify({ error: "Informe um link do YouTube." }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
        try {
          const oembed = `https://www.youtube.com/oembed?url=${encodeURIComponent(target)}&format=json`;
          const res = await fetch(oembed, {
            headers: { "User-Agent": "Mozilla/5.0" },
          });
          if (!res.ok) throw new Error("Vídeo não encontrado.");
          const data = (await res.json()) as {
            title?: string;
            author_name?: string;
            thumbnail_url?: string;
          };
          return new Response(
            JSON.stringify({
              title: data.title ?? "",
              author: data.author_name ?? "",
              thumbnail: data.thumbnail_url ?? "",
            }),
            { headers: { "Content-Type": "application/json" } },
          );
        } catch (e) {
          return new Response(
            JSON.stringify({
              error: e instanceof Error ? e.message : "Falha ao consultar o YouTube.",
            }),
            { status: 502, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});
