import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getYoutubeVideos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z
      .object({
        type: z.enum(["service", "podcast"]).optional(),
        limit: z.number().default(50),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    let query = context.supabase
      .from("youtube_videos")
      .select("*")
      .order("published_at", { ascending: false })
      .limit(data.limit);

    if (data.type) {
      query = query.eq("type", data.type);
    }

    const { data: videos, error } = await query;
    if (error) throw new Error(error.message);
    return videos || [];
  });

export const syncYoutubeContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    console.log(`[Sync] Starting sync for user: ${context.userId}`);

    // Check for environment variables at runtime
    if (!process.env["SUPABASE_URL"] || !process.env["SUPABASE_PUBLISHABLE_KEY"]) {
      console.error("[Sync] Missing Supabase environment variables");
      throw new Error(
        "Erro de configuração do servidor (Variaveis de ambiente ausentes). Verifique o Lovable Cloud.",
      );
    }

    // 1. Verificar se é admin
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin_geral",
    });

    if (roleError) {
      console.error("[Sync] Role check error:", roleError);
      throw new Error("Falha na verificação de permissões.");
    }

    if (!isAdmin) {
      console.error(`[Sync] User ${context.userId} is not admin_geral`);
      throw new Error("Apenas administradores podem realizar esta ação.");
    }

    // 2. Buscar conteúdo
    try {
      console.log("[Sync] Fetching content via AI...");
      const { fetchYoutubeContent } = await import("./youtube.server");
      const videos = await fetchYoutubeContent("@BatistaAtos");

      console.log(`[Sync] AI returned ${videos?.length || 0} videos`);

      if (!videos || !Array.isArray(videos) || videos.length === 0) {
        console.warn("[Sync] No videos found by AI");
        return {
          success: true,
          count: 0,
          message: "Nenhum vídeo novo encontrado (AI não localizou registros).",
        };
      }

      // 3. Validar e Formatar
      const validVideos = videos
        .filter((v: any) => v.youtube_id && v.title && v.url)
        .map((v: any) => ({
          youtube_id: String(v.youtube_id),
          title: String(v.title),
          thumbnail_url: v.thumbnail_url
            ? String(v.thumbnail_url)
            : `https://img.youtube.com/vi/${v.youtube_id}/maxresdefault.jpg`,
          type: v.type === "podcast" || v.type === "service" ? v.type : "service",
          url: String(v.url),
          published_at: v.published_at || new Date().toISOString(),
        }));

      console.log(`[Sync] Validated ${validVideos.length} videos`);

      if (validVideos.length === 0) {
        return {
          success: true,
          count: 0,
          message: "Os dados retornados pelo YouTube são inválidos.",
        };
      }

      // 4. Salvar no Banco
      console.log("[Sync] Saving to database...");
      const { error: upsertError } = await context.supabase
        .from("youtube_videos")
        .upsert(validVideos, { onConflict: "youtube_id" });

      if (upsertError) {
        console.error("[Sync] Upsert error:", upsertError);
        throw new Error(`Erro de banco de dados: ${upsertError.message}`);
      }

      console.log("[Sync] Finished successfully");
      return { success: true, count: validVideos.length };
    } catch (err: any) {
      console.error("[Sync] Critical error:", err);
      throw new Error(err.message || "Ocorreu um erro inesperado ao sincronizar.");
    }
  });

export const syncSingleYoutubeVideo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z
      .object({
        url: z.string().url(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    // 1. Verificar se é admin
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin_geral",
    });

    if (roleError || !isAdmin) {
      throw new Error("Apenas administradores podem realizar esta ação.");
    }

    try {
      const { getYoutubeMetadata } = await import("./youtube.server");
      const video = await getYoutubeMetadata(data.url);

      if (!video.youtube_id || !video.title) {
        throw new Error("Dados do vídeo incompletos.");
      }

      // 3. Salvar no banco
      const payload = {
        youtube_id: video.youtube_id,
        title: video.title,
        thumbnail_url: video.thumbnail_url,
        type: video.type || "service",
        url: data.url,
        published_at: video.published_at || new Date().toISOString(),
      };

      const { error: upsertError } = await context.supabase
        .from("youtube_videos")
        .upsert(payload, { onConflict: "youtube_id" });

      if (upsertError) throw new Error(upsertError.message);

      return { success: true, video: payload };
    } catch (err: any) {
      console.error("[Sync Single] Error:", err);
      throw new Error(err.message || "Erro ao adicionar vídeo.");
    }
  });
