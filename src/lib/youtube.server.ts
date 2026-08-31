import { googleGateway } from "./google-gateway.server";

export async function fetchYoutubeContent(channelHandle: string) {
  console.log(`[YouTube Server] Fetching data for: ${channelHandle}`);

  try {
    const searchRes = await googleGateway.youtube("search", {
      q: channelHandle,
      type: "channel",
      part: "id",
      maxResults: "1",
    });

    const channelId = searchRes.items?.[0]?.id?.channelId;
    if (!channelId) throw new Error("Canal não encontrado.");

    const videosRes = await googleGateway.youtube("search", {
      channelId,
      part: "snippet",
      order: "date",
      type: "video",
      maxResults: "50",
    });

    return (videosRes.items || []).map((item: any) => {
      const title = item.snippet.title.toLowerCase();
      // Classificação avançada: Mesacast/Estudo vs Culto de Domingo
      let type: "service" | "podcast" = "service";

      if (
        title.includes("mesacast") ||
        title.includes("podcast") ||
        title.includes("estudo") ||
        title.includes("conversa") ||
        title.includes("entrevista") ||
        title.includes("ebd") ||
        title.includes("escola bíblica")
      ) {
        type = "podcast";
      } else if (
        title.includes("culto") ||
        title.includes("domingo") ||
        title.includes("celebração") ||
        title.includes("pregacao") ||
        title.includes("pregação") ||
        title.includes("noite")
      ) {
        type = "service";
      }

      return {
        youtube_id: item.id.videoId,
        title: item.snippet.title,
        thumbnail_url:
          item.snippet.thumbnails?.maxres?.url ||
          item.snippet.thumbnails?.high?.url ||
          item.snippet.thumbnails?.default?.url,
        type,
        published_at: item.snippet.publishedAt,
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      };
    });
  } catch (error: any) {
    console.error("[YouTube Server] Error:", error.message);
    if (error.message.includes("YouTube API Error")) throw error;
    return [];
  }
}

export async function getYoutubeMetadata(videoUrl: string) {
  const videoId = videoUrl.match(
    /(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/)([A-Za-z0-9_-]{11})/,
  )?.[1];
  if (!videoId) throw new Error("ID do vídeo inválido.");

  const data = await googleGateway.youtube("videos", {
    id: videoId,
    part: "snippet",
  });

  const item = data.items?.[0];
  if (!item) throw new Error("Vídeo não encontrado.");

  return {
    title: item.snippet.title,
    youtube_id: videoId,
    type:
      item.snippet.title.toLowerCase().includes("mesacast") ||
      item.snippet.title.toLowerCase().includes("podcast") ||
      item.snippet.title.toLowerCase().includes("estudo") ||
      item.snippet.title.toLowerCase().includes("ebd")
        ? "podcast"
        : "service",
    published_at: item.snippet.publishedAt,
    thumbnail_url:
      item.snippet.thumbnails?.maxres?.url ||
      item.snippet.thumbnails?.high?.url ||
      item.snippet.thumbnails?.default?.url,
  };
}
