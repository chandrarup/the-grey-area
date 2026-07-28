"use client";

import { useState } from "react";
import { generateCohortInsightsAction } from "@/app/professor/groups/batch/actions";
import type {
  BatchCohortRollup,
  CohortInsightsPayload,
} from "@/lib/db/group-queries";
import { BusyButton } from "@/app/components/busy-button";
import { withBusyBar } from "@/app/components/navigation-progress";

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

const GENERATE_TIMEOUT_MS = 90_000;

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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canGenerate = rollup.gradedCount > 0;

  async function onGenerate() {
    if (busy) return;
    setError(null);

    if (!canGenerate) {
      setError(
        "No graded groups yet. Open a finished group (status committed), run Generate AI grade, then come back here.",
      );
      return;
    }

    setBusy(true);
    let timer: number | undefined;
    try {
      await withBusyBar(async () => {
        const next = await Promise.race([
          generateCohortInsightsAction(batchId, true),
          new Promise<never>((_, reject) => {
            timer = window.setTimeout(() => {
              reject(
                new Error(
                  "Insights generation timed out. Check the grader model / API key, then try again.",
                ),
              );
            }, GENERATE_TIMEOUT_MS);
          }),
        ]);
        setInsights(next);
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not generate insights",
      );
    } finally {
      if (timer != null) window.clearTimeout(timer);
      setBusy(false);
    }
  }

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
          <BusyButton
            type="button"
            pending={busy}
            pendingLabel="Generating…"
            disabled={!canGenerate}
            title={
              canGenerate
                ? "Generate cohort-level patterns from graded groups"
                : "Grade at least one finished group first"
            }
            className="border border-border bg-accent px-3 py-1.5 text-xs text-accent-foreground disabled:cursor-not-allowed disabled:opacity-40"
            onClick={() => void onGenerate()}
          >
            {insights ? "Regenerate" : "Generate insights"}
          </BusyButton>
        </div>
        {!canGenerate ? (
          <p className="mt-3 border border-border border-l-2 border-l-amber-600 bg-surface px-3 py-2 text-sm text-foreground">
            Cohort notes need graded groups. Open a{" "}
            <span className="font-medium">committed</span> group tile → run{" "}
            <span className="font-medium">Generate AI grade</span> → then
            generate notes here. Students only see feedback after you{" "}
            <span className="font-medium">Release</span>.
          </p>
        ) : insights ? (
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            {insights.insights.map((line, i) => (
              <li key={i} className="text-foreground">
                {line}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            {rollup.gradedCount} graded — generate 3–5 cohort-level patterns.
          </p>
        )}
        {insights?.generatedAt ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Cached {new Date(insights.generatedAt).toLocaleString()} ·{" "}
            {insights.model}
          </p>
        ) : null}
        {error ? (
          <p className="mt-2 text-sm text-red-700 dark:text-red-400" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </section>
  );
}
