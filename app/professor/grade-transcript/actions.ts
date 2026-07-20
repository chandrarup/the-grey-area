"use server";

import { z } from "zod";
import { getProfessorActor } from "@/lib/mode";
import { getCase } from "@/lib/case/registry";
import { complete } from "@/lib/llm/complete";
import type { AssessmentPayload } from "@/lib/engine/grader";
import { DEFAULT_GRADER_MODEL } from "@/lib/llm/models";
import { getModelPrefs } from "@/lib/model-prefs";

const Score = z.number().int().min(1).max(10);

const assessmentSchema = z.object({
  ethical_awareness: z.string(),
  decision_quality: z.string(),
  stakeholder_analysis: z.object({
    stakeholders_identified: z.array(z.string()),
    stakeholders_neglected: z.array(z.string()),
    short_vs_long_term: z.string(),
  }),
  leadership_under_pressure: z.string(),
  behavioral_ethics: z.array(
    z.object({
      bias: z.string(),
      evidence: z.string(),
      how_it_affected: z.string(),
    }),
  ),
  ethical_frameworks: z.object({
    frameworks_used: z.array(z.string()),
    frameworks_missing: z.array(z.string()),
    notes: z.string(),
  }),
  organizational_impact: z.object({
    culture_signal: z.string(),
    precedent_risk: z.string(),
    board_read: z.string(),
  }),
  coaching_feedback: z.object({
    strengths: z.array(z.string()),
    growth_areas: z.array(z.string()),
    next_practice: z.string(),
  }),
  readiness_scores: z
    .array(
      z.object({
        key: z.string(),
        label: z.string(),
        score: Score,
        rationale: z.string(),
      }),
    )
    .min(10)
    .max(10),
  coaching_letter: z.string(),
});

export async function gradeTranscriptAction(
  transcript: string,
): Promise<AssessmentPayload> {
  await getProfessorActor();
  const prefs = await getModelPrefs();
  const caseConfig = getCase("cost-of-winning");
  const result = await complete({
    model: prefs.graderModel || DEFAULT_GRADER_MODEL,
    schemaName: "assessment",
    system:
      "You are an Executive Ethics coach. Grade the transcript on reasoning quality. Return JSON matching the schema.",
    messages: [
      {
        role: "user",
        content: [
          `CASE: ${caseConfig.title}`,
          "",
          "TRANSCRIPT:",
          transcript,
          "",
          "SCORING AREAS:",
          ...caseConfig.rubric.scoringAreas.map((a) => `- ${a.key}: ${a.label}`),
        ].join("\n"),
      },
    ],
    schema: assessmentSchema,
    temperature: 0,
    maxTokens: 4000,
  });
  return result.data;
}
