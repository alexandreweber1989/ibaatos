import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LOUVOR_MINISTRY_ID } from "@/lib/louvor";

export interface Musician {
  id: string;
  user_id: string;
  functions: string[];
  notes: string | null;
  is_active: boolean;
  profile: { full_name: string; avatar_url: string | null } | null;
}

/** Elenco do louvor: pessoas do cadastro de Membros vinculadas a funções/instrumentos. */
export function useMusicians() {
  return useQuery({
    queryKey: ["worship-musicians"],
    queryFn: async (): Promise<Musician[]> => {
      const { data, error } = await supabase
        .from("worship_musicians")
        .select(
          "id, user_id, functions, notes, is_active, profile:profiles!inner(full_name, avatar_url)",
        )
        .eq("ministry_id", LOUVOR_MINISTRY_ID);
      if (error) throw error;
      return ((data ?? []) as unknown as Musician[]).sort((a, b) =>
        (a.profile?.full_name ?? "").localeCompare(b.profile?.full_name ?? ""),
      );
    },
  });
}

export interface Participation {
  lastDate: string | null;
  count: number;
}

/**
 * Histórico de participação em cultos de domingo já realizados.
 * Retorna, por pessoa, a última data e o total de cultos.
 */
export function useSundayHistory() {
  return useQuery({
    queryKey: ["worship-sunday-history"],
    queryFn: async (): Promise<Record<string, Participation>> => {
      const today = new Date().toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from("worship_schedule_assignments")
        .select("user_id, schedule:worship_schedules!inner(event_date, schedule_type)")
        .eq("schedule.schedule_type", "culto")
        .lte("schedule.event_date", today);
      if (error) throw error;
      const map: Record<string, Participation> = {};
      for (const row of (data ?? []) as unknown as {
        user_id: string;
        schedule: { event_date: string } | null;
      }[]) {
        const date = row.schedule?.event_date ?? null;
        // Considera apenas domingos (getUTCDay 0) para o histórico de cultos dominicais.
        if (!date || new Date(date + "T12:00:00").getDay() !== 0) continue;
        const current = map[row.user_id] ?? { lastDate: null, count: 0 };
        map[row.user_id] = {
          lastDate: !current.lastDate || date > current.lastDate ? date : current.lastDate,
          count: current.count + 1,
        };
      }
      return map;
    },
  });
}
