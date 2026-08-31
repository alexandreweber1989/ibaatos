import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

export const Route = createFileRoute("/api/public/import-cifra")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const urlParams = new URL(request.url).searchParams;
        const targetUrl = urlParams.get("url");

        // Segurança: valida o HOSTNAME exato (não por substring), impedindo SSRF do
        // tipo https://169.254.169.254/...?x=cifraclub.com.br. Exige https.
        let host = "";
        let protocol = "";
        try {
          if (targetUrl) {
            const parsed = new URL(targetUrl);
            host = parsed.hostname.toLowerCase();
            protocol = parsed.protocol;
          }
        } catch {
          host = "";
        }
        const isCifraClub = host === "cifraclub.com.br" || host.endsWith(".cifraclub.com.br");
        const isCifras = host === "cifras.com.br" || host.endsWith(".cifras.com.br");

        if (!targetUrl || protocol !== "https:" || (!isCifraClub && !isCifras)) {
          return new Response(
            JSON.stringify({ error: "URL inválida. Use links do CifraClub ou Cifras.com.br" }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        try {
          const response = await fetch(targetUrl, {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            },
          });

          if (!response.ok) throw new Error("Falha ao buscar página");
          const html = await response.text();

          let title = "";
          let artist = "";
          let key = "";
          let bpm: number | null = null;
          let rawContent = "";
          let videoUrl = "";

          if (isCifraClub) {
            title = html.match(/<h1 class="t1">([^<]+)<\/h1>/)?.[1] || "";
            artist = html.match(/<h2 class="t3">([^<]+)<\/h2>/)?.[1] || "";
            key = html.match(/id="cifra_tom"[^>]*>([^<]+)<\/a>/)?.[1] || "";

            const bpmMatch =
              html.match(/"bpm":\s*(\d+)/i) || html.match(/<span>(\d+)<\/span>\s*bpm/i);
            if (bpmMatch) bpm = parseInt(bpmMatch[1]);

            // Pegar vídeo do YouTube associado no CifraClub
            const youtubeMatch =
              html.match(/youtube\.com\/embed\/([^"?]+)/) || html.match(/"youtubeId":\s*"([^"]+)"/);
            if (youtubeMatch) videoUrl = `https://www.youtube.com/watch?v=${youtubeMatch[1]}`;

            const chordsMatch = html.match(/<pre[^>]*>([\s\S]*?)<\/pre>/);
            rawContent = chordsMatch ? chordsMatch[1] : "";
          } else if (isCifras) {
            title = html.match(/<h1[^>]*>([^<]+)<\/h1>/)?.[1] || "";
            artist = html.match(/<h2[^>]*>([^<]+)<\/h2>/)?.[1] || "";
            key = html.match(/<span[^>]*class="[^"]*tom[^"]*"[^>]*>([^<]+)<\/span>/i)?.[1] || "";

            const bpmMatch = html.match(/(\d+)\s*bpm/i);
            if (bpmMatch) bpm = parseInt(bpmMatch[1]);

            // Pegar vídeo do YouTube associado no Cifras.com.br
            const youtubeMatch = html.match(/youtube\.com\/(?:embed\/|watch\?v=)([^"&? \n]+)/);
            if (youtubeMatch) videoUrl = `https://www.youtube.com/watch?v=${youtubeMatch[1]}`;

            const chordsMatch =
              html.match(/<pre[^>]*id="[^"]*cifra[^"]*"[^>]*>([\s\S]*?)<\/pre>/i) ||
              html.match(/<div[^>]*class="[^"]*cifra-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
            rawContent = chordsMatch ? chordsMatch[1] : "";
          }

          rawContent = rawContent.replace(/<[^>]*>/g, "");

          return new Response(
            JSON.stringify({
              title: title.trim(),
              artist: artist.trim(),
              key: key.trim(),
              bpm: bpm,
              content: rawContent.trim(),
              youtubeUrl: videoUrl,
            }),
            {
              headers: { "Content-Type": "application/json" },
            },
          );
        } catch (error) {
          return new Response(JSON.stringify({ error: "Erro ao processar a cifra" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
