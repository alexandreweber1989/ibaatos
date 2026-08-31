import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AnnouncementScope = "geral" | "igreja" | "ministerio" | "rede" | "mesa";
export type AnnouncementCategory = "aviso" | "comunicado" | "urgente" | "acao";

export interface Announcement {
  id: string;
  title: string;
  body: string;
  category: AnnouncementCategory;
  scope: AnnouncementScope;
  church_id: string | null;
  ministry_id: string | null;
  rede_id: string | null;
  mesa_id: string | null;
  is_pinned: boolean;
  is_published: boolean;
  published_at: string | null;
  expires_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export const CATEGORY_LABEL: Record<AnnouncementCategory, string> = {
  aviso: "Aviso",
  comunicado: "Comunicado",
  urgente: "Urgente",
  acao: "Ação / Louvor",
};

export const CATEGORY_CLASS: Record<AnnouncementCategory, string> = {
  aviso: "border-border text-muted-foreground",
  comunicado: "border-primary/40 text-primary",
  urgente: "border-destructive/50 text-destructive",
  acao: "border-primary/40 text-primary",
};

export const SCOPE_LABEL: Record<AnnouncementScope, string> = {
  geral: "Toda a igreja",
  igreja: "Igreja específica",
  ministerio: "Ministério",
  rede: "Rede",
  mesa: "Mesa",
};

/** Um aviso está no ar quando publicado, já liberado e ainda não expirado. */
export function isVigente(a: Announcement): boolean {
  if (!a.is_published) return false;
  const now = Date.now();
  if (a.published_at && new Date(a.published_at).getTime() > now) return false;
  if (a.expires_at && new Date(a.expires_at).getTime() <= now) return false;
  return true;
}

export function formatData(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Lista os avisos que o RLS libera para a pessoa logada — inclui rascunhos
 * próprios (o autor precisa enxergá-los) e tudo para o admin geral.
 */
export function useAvisos() {
  return useQuery({
    queryKey: ["avisos"],
    queryFn: async (): Promise<Announcement[]> => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("is_pinned", { ascending: false })
        .order("published_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Announcement[];
    },
  });
}

/** Ids dos avisos que a própria pessoa já marcou como lidos. */
export function useMinhasLeituras(userId?: string) {
  return useQuery({
    queryKey: ["avisos", "leituras", userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<Set<string>> => {
      const { data, error } = await supabase
        .from("announcement_reads")
        .select("announcement_id")
        .eq("user_id", userId!);
      if (error) throw error;
      return new Set((data ?? []).map((r: any) => r.announcement_id as string));
    },
  });
}

export function useMarcarLido() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ announcementId, userId }: { announcementId: string; userId: string }) => {
      const { error } = await supabase
        .from("announcement_reads")
        .upsert({ announcement_id: announcementId, user_id: userId } as any, {
          onConflict: "announcement_id,user_id",
          ignoreDuplicates: true,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["avisos"] });
    },
  });
}

/** Quantidade de leitores por aviso (visível ao autor e ao admin geral). */
export function useContagemLeituras(ids: string[]) {
  return useQuery({
    queryKey: ["avisos", "contagem", ids.join(",")],
    enabled: ids.length > 0,
    queryFn: async (): Promise<Record<string, number>> => {
      const { data, error } = await supabase
        .from("announcement_reads")
        .select("announcement_id")
        .in("announcement_id", ids);
      if (error) throw error;
      const map: Record<string, number> = {};
      for (const row of (data ?? []) as any[]) {
        map[row.announcement_id] = (map[row.announcement_id] ?? 0) + 1;
      }
      return map;
    },
  });
}
