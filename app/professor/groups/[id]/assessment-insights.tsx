"use client";

/**
 * Read-only assessment + score bars for staff drill-in.
 * Editing remains in SessionStaffControls.
 */
export function AssessmentInsights({
  assessment,
}: {
  assessment: unknown;
}) {
  if (!assessment || typeof assessment !== "object") return null;
  const a = assessment as {
    epilogue?: string;
    summary?: string;
    what_went_well?: string[];
    what_to_improve?: string[];
    better_decisions?: string[];
    evidence?: string[];
    readiness_scores?: {
      key: string;
      label: string;
      score: number;
      rationale?: string;
    }[];
  };

  return (
    <section className="mt-10 space-y-6">
      <h2 className="text-sm font-medium text-foreground">Assessment</h2>
      {a.epilogue ? (
        <p className="font-serif text-xl leading-relaxed text-foreground">
          {a.epilogue}
        </p>
      ) : null}
      {a.summary ? (
        <p className="text-sm leading-relaxed text-muted-foreground">
          {a.summary}
        </p>
      ) : null}

      {a.readiness_scores && a.readiness_scores.length > 0 ? (
        <div>
          <h3 className="text-xs uppercase tracking-wide text-muted-foreground">
            Readiness scores
          </h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {a.readiness_scores.map((s) => {
              const pct = Math.min(100, Math.round((s.score / 10) * 100));
              return (
                <div key={s.key} className="space-y-1">
                  <div className="flex justify-between gap-2 text-xs">
                    <span className="text-muted-foreground">{s.label}</span>
                    <span className="tabular-nums text-foreground">
                      {s.score}/10
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-border">
                    <div
                      className="h-full bg-accent"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {(
        [
          ["What went well", a.what_went_well],
          ["What to improve", a.what_to_improve],
          ["Better decisions", a.better_decisions],
          ["Evidence", a.evidence],
        ] as const
      ).map(([title, items]) =>
        items?.length ? (
          <div key={title}>
            <h3 className="text-xs uppercase tracking-wide text-muted-foreground">
              {title}
            </h3>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
              {items.map((item, i) => (
                <li key={i} className="text-foreground">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ) : null,
      )}
    </section>
  );
}
