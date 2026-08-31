/**
 * Fotos do módulo Kids.
 *
 * As imagens ficam num bucket privado ("kids-photos"). No banco guardamos
 * apenas o caminho do arquivo; a exibição usa URL assinada temporária.
 * Valores legados (links http) continuam funcionando.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const KIDS_PHOTO_BUCKET = "kids-photos";

/** Verdadeiro quando o valor salvo é um link externo (cadastro antigo por URL). */
export function isExternalPhoto(value?: string | null): boolean {
  return !!value && /^https?:\/\//i.test(value);
}

function extensionFor(file: Blob, fallback = "jpg"): string {
  const type = file.type || "";
  if (type.includes("png")) return "png";
  if (type.includes("webp")) return "webp";
  if (type.includes("jpeg") || type.includes("jpg")) return "jpg";
  return fallback;
}

/**
 * Envia a imagem para o Storage e devolve o caminho salvo no banco.
 * `folder` separa crianças de responsáveis para facilitar auditoria.
 */
export async function uploadKidsPhoto(
  file: Blob,
  folder: "criancas" | "responsaveis",
): Promise<string> {
  if (file.size > 8 * 1024 * 1024) {
    throw new Error("Imagem muito grande. Use uma foto de até 8 MB.");
  }
  const path = `${folder}/${crypto.randomUUID()}.${extensionFor(file)}`;
  const { error } = await supabase.storage.from(KIDS_PHOTO_BUCKET).upload(path, file, {
    contentType: file.type || "image/jpeg",
    upsert: false,
  });
  if (error) throw new Error(`Não foi possível enviar a foto: ${error.message}`);
  return path;
}

/** Remove uma foto do bucket; erros são silenciosos (arquivo já pode não existir). */
export async function removeKidsPhoto(value?: string | null): Promise<void> {
  if (!value || isExternalPhoto(value)) return;
  await supabase.storage.from(KIDS_PHOTO_BUCKET).remove([value]);
}

/** Resolve o valor salvo para uma URL exibível (assinada por 1 hora). */
export function useKidsPhotoUrl(value?: string | null) {
  return useQuery({
    queryKey: ["kids-photo-url", value],
    enabled: !!value,
    staleTime: 45 * 60 * 1000,
    queryFn: async () => {
      if (!value) return null;
      if (isExternalPhoto(value)) return value;
      const { data, error } = await supabase.storage
        .from(KIDS_PHOTO_BUCKET)
        .createSignedUrl(value, 60 * 60);
      if (error) return null;
      return data?.signedUrl ?? null;
    },
  });
}
