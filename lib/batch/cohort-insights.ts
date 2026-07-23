/**
 * SERVER ONLY — LLM cohort insights across a batch of group assessments.
 */
import { z } from "zod";
import { complete } from "@/lib/llm/complete";
import { getCase } from "@/lib/case/registry";
import {
  getBatchCohortRollup,
  getGroupAssessment,
  getGroupBatch,
  listSessionsForBatch,
  saveBatchCohortInsights,
  type CohortInsightsPayload,
} from "@/lib/db/group-queries";
import { DEFAULT_GRADER_MODEL } from "@/lib/llm/models";

const cohortSchema = z.object({
  insights: z.array(z.string()).min(3).max(5),
});

export async function generateBatchCohortInsights(
  batchId: string,
  opts?: { model?: string; force?: boolean },
): Promise<CohortInsightsPayload> {
  const batch = await getGroupBatch(batchId);
  if (!batch) throw new Error("Batch not found");

  if (!opts?.force && batch.cohortInsights) {
    const cached = batch.cohortInsights as CohortInsightsPayload;
    if (Array.isArray(cached.insights) && cached.insights.length > 0) {
      return {
        insights: cached.insights.map(String),
        generatedAt:
          cached.generatedAt ??
          batch.cohortInsightsAt?.toISOString() ??
          new Date().toISOString(),
        model: cached.model ?? batch.cohortInsightsModel ?? "cached",
      };
    }
  }

  const sessions = await listSessionsForBatch(batchId);
  const caseConfig = getCase(batch.caseSlug);
  const rollup = await getBatchCohortRollup(batchId);

  const assessmentBlocks: string[] = [];
  for (const s of sessions) {
    const row = await getGroupAssessment(s.id);
    if (!row?.assessment) continue;
    const a = row.assessment as {
      summary?: string;
      what_went_well?: string[];
      what_to_improve?: string[];
      readiness_scores?: { key: string; label: string; score: number }[];
    };
    const scores =
      a.readiness_scores
        ?.map((sc) => `${sc.label}: ${sc.score}`)
        .join("; ") ?? "";
    assessmentBlocks.push(
      [
        `Group ${s.code} (${s.status}):`,
        a.summary ? `Summary: ${a.summary}` : "",
        a.what_went_well?.length
          ? `Went well: ${a.what_went_well.join(" | ")}`
          : "",
        a.what_to_improve?.length
          ? `Improve: ${a.what_to_improve.join(" | ")}`
          : "",
        scores ? `Scores: ${scores}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    );
  }

  if (assessmentBlocks.length === 0) {
    throw new Error(
      "No graded assessments yet. Grade at least one group before generating cohort insights.",
    );
  }

  const model =
    opts?.model || batch.graderModel || DEFAULT_GRADER_MODEL;

  const userContent = [
    `CASE: ${caseConfig.title}`,
    `BATCH: ${batch.name} (${sessions.length} groups, ${assessmentBlocks.length} graded)`,
    "",
    "FINAL DECISION DISTRIBUTION:",
    rollup.finalDecisionDistribution
      .map((d) => `- ${d.label}: ${d.count}`)
      .join("\n") || "(none finished)",
    "",
    "MOST DIVERGENT DECISION POINTS:",
    rollup.sceneDivergence
      .slice(0, 5)
      .map(
        (d) =>
          `- ${d.sceneTitle}: ${d.uniqueChoices} unique choices across ${d.totalGroups} groups`,
      )
      .join("\n") || "(none)",
    "",
    "AVERAGE READINESS SCORES:",
    rollup.averageScores
      .map((s) => `- ${s.label}: ${s.average}/10 (n=${s.n})`)
      .join("\n") || "(none yet)",
    "",
    "PER-GROUP ASSESSMENTS:",
    ...assessmentBlocks,
    "",
    "Write 3–5 short cohort-level insights for the professor (patterns across groups, not individuals). No names.",
  ].join("\n");

  const result = await complete({
    model,
    schemaName: "batch_cohort_insights",
    system:
      "You summarize a class cohort's ethics simulation. Return JSON with 3-5 concise insight strings for a professor.",
    messages: [{ role: "user", content: userContent }],
    schema: cohortSchema,
    temperature: 0.2,
    maxTokens: 1200,
  });

  return saveBatchCohortInsights(batchId, result.data.insights, model);
}
