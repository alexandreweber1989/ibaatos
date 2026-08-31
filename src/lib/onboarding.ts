import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface OnboardingStep {
  id: string;
  title: string;
  description: string | null;
  position: number;
  is_active: boolean;
}

export interface MemberStep {
  id: string;
  person_id: string;
  step_id: string;
  completed_at: string | null;
  completed_by: string | null;
  notes: string | null;
}

/** Etapas da trilha de integração, na ordem definida pela secretaria. */
export function useOnboardingSteps() {
  return useQuery({
    queryKey: ["onboarding-steps"],
    queryFn: async (): Promise<OnboardingStep[]> => {
      const { data, error } = await (supabase as any)
        .from("onboarding_steps")
        .select("*")
        .eq("is_active", true)
        .order("position");
      if (error) throw error;
      return (data ?? []) as OnboardingStep[];
    },
  });
}

/** Andamento da trilha de um membro. */
export function useMemberOnboarding(personId?: string, enabled = true) {
  return useQuery({
    queryKey: ["member-onboarding", personId],
    enabled: !!personId && enabled,
    queryFn: async (): Promise<MemberStep[]> => {
      const { data, error } = await (supabase as any)
        .from("member_onboarding_steps")
        .select("*")
        .eq("person_id", personId!);
      if (error) throw error;
      return (data ?? []) as MemberStep[];
    },
  });
}

/** Marca ou desmarca uma etapa da trilha de um membro. */
export function useToggleOnboardingStep(personId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ stepId, done }: { stepId: string; done: boolean }) => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id ?? null;
      const { error } = await (supabase as any).from("member_onboarding_steps").upsert(
        {
          person_id: personId,
          step_id: stepId,
          completed_at: done ? new Date().toISOString() : null,
          completed_by: done ? userId : null,
        },
        { onConflict: "person_id,step_id" },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["member-onboarding", personId] });
      qc.invalidateQueries({ queryKey: ["onboarding-overview"] });
    },
  });
}

export interface OnboardingProgressRow {
  person: { id: string; full_name: string; member_since: string | null; church_id: string | null };
  done: number;
  total: number;
  lastAt: string | null;
}

/**
 * Panorama da integração: membros mais recentes com a quantidade de etapas
 * concluídas, para a liderança acompanhar quem ficou parado.
 */
export function useOnboardingOverview(limit = 60) {
  const steps = useOnboardingSteps();
  const query = useQuery({
    queryKey: ["onboarding-overview", limit],
    queryFn: async () => {
      const { data: people, error } = await supabase
        .from("profiles")
        .select("id, full_name, member_since, church_id, created_at")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      const ids = (people ?? []).map((p) => p.id);
      const { data: progress } = ids.length
        ? await (supabase as any)
            .from("member_onboarding_steps")
            .select("person_id, step_id, completed_at")
            .in("person_id", ids)
        : { data: [] as any[] };
      return { people: people ?? [], progress: (progress ?? []) as any[] };
    },
  });

  const total = (steps.data ?? []).length;
  const rows: OnboardingProgressRow[] = (query.data?.people ?? []).map((p: any) => {
    const mine = (query.data?.progress ?? []).filter(
      (r: any) => r.person_id === p.id && r.completed_at,
    );
    const lastAt =
      mine
        .map((r: any) => r.completed_at as string)
        .sort()
        .pop() ?? null;
    return { person: p, done: mine.length, total, lastAt };
  });

  return { rows, total, isLoading: query.isLoading || steps.isLoading };
}
