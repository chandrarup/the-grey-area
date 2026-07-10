import { Check } from "@phosphor-icons/react/dist/ssr";
import type { Stage } from "./stages";

type StepStatus = "complete" | "current" | "upcoming";

function statusFor(index: number, currentIndex: number): StepStatus {
  if (index < currentIndex) return "complete";
  if (index === currentIndex) return "current";
  return "upcoming";
}

export function StepRail({
  stages,
  currentSlug,
}: {
  stages: Stage[];
  currentSlug: string;
}) {
  const currentIndex = stages.findIndex((stage) => stage.slug === currentSlug);

  return (
    <nav aria-label="Simulation progress">
      <ol>
        {stages.map((stage, index) => {
          const status = statusFor(index, currentIndex);
          const isLast = index === stages.length - 1;

          return (
            <li key={stage.slug} className="relative flex gap-4 pb-10 last:pb-0">
              {!isLast && (
                <span
                  aria-hidden
                  className={
                    "absolute left-[11px] top-6 h-[calc(100%-1.5rem)] w-px " +
                    (status === "complete" ? "bg-accent" : "bg-border")
                  }
                />
              )}
              <span
                className={
                  "relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs " +
                  (status === "complete"
                    ? "border-accent bg-accent text-accent-foreground"
                    : status === "current"
                      ? "border-accent bg-background text-accent"
                      : "border-border bg-background text-muted-foreground")
                }
              >
                {status === "complete" ? (
                  <Check size={12} weight="bold" />
                ) : (
                  index + 1
                )}
              </span>
              <span
                className={
                  "pt-0.5 text-sm leading-6 " +
                  (status === "current"
                    ? "font-medium text-foreground"
                    : status === "complete"
                      ? "text-foreground"
                      : "text-muted-foreground")
                }
                aria-current={status === "current" ? "step" : undefined}
              >
                {stage.label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
