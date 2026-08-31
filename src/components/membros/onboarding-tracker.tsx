import { toast } from "sonner";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { useMemberOnboarding, useOnboardingSteps, useToggleOnboardingStep } from "@/lib/onboarding";

/**
 * Trilha de integração do membro. A liderança marca as etapas concluídas;
 * o próprio membro apenas visualiza o andamento.
 */
export function OnboardingTracker({
  personId,
  enabled,
  canEdit,
}: {
  personId: string;
  enabled: boolean;
  canEdit: boolean;
}) {
  const { data: steps } = useOnboardingSteps();
  const { data: progress } = useMemberOnboarding(personId, enabled);
  const toggle = useToggleOnboardingStep(personId);

  const list = steps ?? [];
  const doneIds = new Set((progress ?? []).filter((p) => p.completed_at).map((p) => p.step_id));
  const pct = list.length ? Math.round((doneIds.size / list.length) * 100) : 0;

  if (!list.length) {
    return <p className="text-sm text-muted-foreground">Nenhuma etapa cadastrada.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Progress value={pct} className="h-2 flex-1" />
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {doneIds.size}/{list.length}
        </span>
      </div>
      <ul className="space-y-1.5">
        {list.map((step) => {
          const done = doneIds.has(step.id);
          return (
            <li key={step.id} className="flex items-start gap-3">
              <button
                type="button"
                disabled={!canEdit || toggle.isPending}
                onClick={() =>
                  toggle.mutate(
                    { stepId: step.id, done: !done },
                    { onError: (e: Error) => toast.error(e.message) },
                  )
                }
                className={cn(
                  "mt-0.5 h-5 w-5 shrink-0 rounded-sm border grid place-items-center transition-colors",
                  done
                    ? "bg-primary border-primary text-primary-foreground"
                    : "border-border bg-background",
                  canEdit ? "hover:border-primary cursor-pointer" : "cursor-default",
                )}
                aria-label={done ? `Desmarcar ${step.title}` : `Concluir ${step.title}`}
              >
                {done && <Check className="h-3.5 w-3.5" />}
              </button>
              <div className="min-w-0">
                <div className={cn("text-sm", done && "text-muted-foreground line-through")}>
                  {step.title}
                </div>
                {step.description && (
                  <div className="text-xs text-muted-foreground">{step.description}</div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
