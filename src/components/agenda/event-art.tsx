import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

/** Resolve a URL exibível de uma arte de evento (URL externa ou caminho no bucket privado). */
export function useEventArtUrl(value: string | null | undefined) {
  const isExternal = !!value && /^https?:\/\//i.test(value);
  const query = useQuery({
    queryKey: ["event-art", value],
    enabled: !!value && !isExternal,
    staleTime: 45 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from("event-arts")
        .createSignedUrl(value as string, 60 * 60);
      if (error) throw error;
      return data.signedUrl;
    },
  });
  if (!value) return null;
  return isExternal ? value : (query.data ?? null);
}

/** Arte de divulgação do evento (produzida pelo ministério de Mídia). */
export function EventArt({
  value,
  alt,
  className,
}: {
  value: string | null | undefined;
  alt: string;
  className?: string;
}) {
  const url = useEventArtUrl(value);
  if (!url) return null;
  return (
    <img
      src={url}
      alt={alt}
      loading="lazy"
      className={cn("w-full h-full object-cover", className)}
    />
  );
}
