import { createFileRoute } from "@tanstack/react-router";

/**
 * Endpoint de legado para metadados do YouTube.
 * Mantido para compatibilidade, mas a lógica agora deve ser usada via youtube.server.ts
 */
export const Route = createFileRoute("/api/public/youtube-metadata")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const target = new URL(request.url).searchParams.get("url") ?? "";

        try {
          const { getYoutubeMetadata } = await import("@/lib/youtube.server");
          const finalData = await getYoutubeMetadata(target);

          return new Response(JSON.stringify(finalData), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (error: any) {
          console.error("[YouTube Metadata] API Error:", error);
          return new Response(
            JSON.stringify({ error: error.message || "Falha ao processar metadados." }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});
