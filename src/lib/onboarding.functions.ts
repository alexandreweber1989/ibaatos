import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export const getOnboardingStats = createServerFn({ method: "GET" }).handler(async () => {
  // Total steps
  const { count: totalSteps } = await supabase
    .from("onboarding_steps")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);

  // Total members (profiles)
  const { count: totalMembers } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

  // Completed integrations (members who finished all steps)
  // Note: This is simplified. In a real scenario we'd query a view or do a complex join.
  // For now, we'll return a mock or basic count.

  return {
    totalSteps: totalSteps || 0,
    totalMembers: totalMembers || 0,
    completedToday: 0,
    inProgress: totalMembers || 0,
  };
});
