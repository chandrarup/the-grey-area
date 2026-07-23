"use client";

import { useState, useTransition } from "react";
import { generateCohortInsightsAction } from "@/app/professor/groups/batch/actions";
import type {
  BatchCohortRollup,
  CohortInsightsPayload,
} from "@/lib/db/group-queries";

function ScoreBar({ label, average }: { label: string; average: number }) {
  const pct = Math.min(100, Math.round((average / 10) * 100));
  return (
    <div className="space-y-1">
      <div className="flex justify-between gap-2 text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums text-foreground">{average}/10</span>
      </div>
      <div className="h-1.5 w-full bg-border">
        <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function CohortInsightsPanel({
  batchId,
  initialRollup,
  initialInsights,
}: {
  batchId: string;
  initialRollup: BatchCohortRollup;
  initialInsights: CohortInsightsPayload | null;
}) {
  const [rollup] = useState(initialRollup);
  const [insights, setInsights] = useState(initialInsights);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <section className="mt-12 space-y-8 border-t border-border pt-10">
      <div>
        <h2 className="font-serif text-2xl text-foreground">Cohort insights</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Rollup across {rollup.groupCount} groups · {rollup.gradedCount} graded
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Final decisions
          </h3>
          {rollup.finalDecisionDistribution.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              No finished groups yet.
            </p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {rollup.finalDecisionDistribution.map((d) => (
                <li
                  key={d.label}
                  className="flex justify-between gap-3 border-b border-border py-1.5"
                >
                  <span className="min-w-0 truncate text-foreground">
                    {d.label}
                  </span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {d.count}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Most divergent decision points
          </h3>
          {rollup.sceneDivergence.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              No decisions committed yet.
            </p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {rollup.sceneDivergence.slice(0, 5).map((d) => (
                <li
                  key={d.sceneId}
                  className="border-b border-border py-1.5 text-foreground"
                >
                  {d.sceneTitle}
                  <span className="ml-2 text-muted-foreground">
                    {d.uniqueChoices} paths · {d.totalGroups} groups
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {rollup.averageScores.length > 0 ? (
        <div>
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Average readiness scores
          </h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {rollup.averageScores.map((s) => (
              <ScoreBar key={s.key} label={s.label} average={s.average} />
            ))}
          </div>
        </div>
      ) : null}

      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            AI cohort notes
          </h3>
          <button
            type="button"
            disabled={pending}
            className="border border-border bg-accent px-3 py-1.5 text-xs text-accent-foreground disabled:opacity-50"
            onClick={() =>
              startTransition(async () => {
                setError(null);
                try {
                  const next = await generateCohortInsightsAction(
                    batchId,
                    true,
                  );
                  setInsights(next);
                } catch (err) {
                  setError(
                    err instanceof Error
                      ? err.message
                      : "Could not generate insights",
                  );
                }
              })
            }
          >
            {pending
              ? "Generating…"
              : insights
                ? "Regenerate"
                : "Generate insights"}
          </button>
        </div>
        {insights ? (
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            {insights.insights.map((line, i) => (
              <li key={i} className="text-foreground">
                {line}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            After groups are graded, generate 3–5 cohort-level patterns.
          </p>
        )}
        {insights?.generatedAt ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Cached {new Date(insights.generatedAt).toLocaleString()} ·{" "}
            {insights.model}
          </p>
        ) : null}
        {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
      </div>
    </section>
  );
}
