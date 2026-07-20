import { z } from "zod";
import { complete } from "@/lib/llm/complete";
import type { CaseConfig } from "@/lib/case/types";
import type { Decision, Message } from "@/lib/db/schema";
import { upsertAssessment } from "@/lib/db/queries";
import { DEFAULT_GRADER_MODEL } from "@/lib/llm/models";

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

export type AssessmentPayload = z.infer<typeof assessmentSchema>;

const groupAssessmentSchema = z.object({
  epilogue: z.string(),
  summary: z.string(),
  what_went_well: z.array(z.string()).min(3).max(3),
  what_to_improve: z.array(z.string()).min(3).max(3),
  better_decisions: z.array(z.string()).min(3).max(3),
  evidence: z.array(z.string()).max(4),
});

export type GroupAssessmentPayload = z.infer<typeof groupAssessmentSchema>;

const GRADING_SYSTEM = `You are an Executive Ethics and Responsible Leadership Coach preparing a confidential assessment for a Board of Directors.

Evaluate the QUALITY of ethical reasoning, leadership judgment, and decision-making process from the transcript. Do NOT grade whether decisions were "correct." Where evidence is missing, say so.

Return JSON matching the schema. Assess all readiness dimensions with scores 1-10. Keep each prose field concise (2-5 sentences). The coaching_letter should be a short board-facing letter.`;

const GROUP_GRADING_SYSTEM = `You are grading a group leadership ethics simulation debrief. Focus on collective process, not individuals. Never name participants. Return JSON matching the schema.`;

function buildSoloPayload(params: {
  caseConfig: CaseConfig;
  decisions: Decision[];
  messages: Message[];
  reflections: string[];
}): string {
  const { caseConfig, decisions, messages, reflections } = params;
  const parts: string[] = [
    `CASE: ${caseConfig.title}`,
    "",
    "BRIEFING SUMMARY:",
    ...caseConfig.briefingPages.map((p) => `## ${p.title}\n${p.body}`),
    "",
    "TRANSCRIPT AND DECISIONS:",
  ];

  for (const decision of decisions) {
    const scene = caseConfig.scenes[decision.sceneId];
    parts.push(`\n### ${scene?.title ?? decision.sceneId}`);
    const sceneMessages = messages.filter((m) => m.sceneId === decision.sceneId);
    for (const msg of sceneMessages) {
      const who =
        msg.sender === "student"
          ? "CEO"
          : msg.castId
            ? caseConfig.cast.find((c) => c.id === msg.castId)?.name ?? msg.castId
            : msg.sender;
      parts.push(`${who}: ${msg.content}`);
    }
    parts.push(`COMMITTED DECISION: ${decision.choice}`);
    parts.push(`REASONING: ${decision.reasoning ?? ""}`);
  }

  if (reflections.length > 0) {
    parts.push("", "REFLECTIONS:");
    caseConfig.reflectionQuestions.forEach((q, i) => {
      parts.push(`Q: ${q}`);
      parts.push(`A: ${reflections[i] ?? ""}`);
    });
  }

  parts.push(
    "",
    "SCORING AREAS (use these exact keys in readiness_scores):",
    ...caseConfig.rubric.scoringAreas.map((a) => `- ${a.key}: ${a.label}`),
    "",
    caseConfig.rubric.instructions,
  );

  return parts.join("\n");
}

export async function gradeRun(params: {
  runId: string;
  caseConfig: CaseConfig;
  decisions: Decision[];
  messages: Message[];
  reflections: string[];
  model?: string;
}): Promise<AssessmentPayload> {
  const userContent = buildSoloPayload(params);
  const model = params.model ?? DEFAULT_GRADER_MODEL;

  const request = {
    model,
    schemaName: "assessment",
    system: GRADING_SYSTEM,
    messages: [{ role: "user" as const, content: userContent }],
    schema: assessmentSchema,
    temperature: 0,
    maxTokens: 4000,
  };

  let result;
  try {
    result = await complete(request);
  } catch {
    result = await complete({
      ...request,
      messages: [
        {
          role: "user",
          content:
            userContent +
            "\n\nYour previous response failed schema validation. Return valid JSON only matching the schema.",
        },
      ],
    });
  }

  await upsertAssessment(params.runId, {
    graderModel: model,
    rawOutput: JSON.stringify(result.data),
    assessment: result.data,
    status: "ai_draft",
  });

  return result.data;
}

export async function gradeGroupSession(params: {
  sessionId: string;
  caseConfig: CaseConfig;
  transcript: string;
  decisionsSummary: string;
  model?: string;
}): Promise<GroupAssessmentPayload> {
  const userContent = [
    `CASE: ${params.caseConfig.title}`,
    "",
    "DECISIONS:",
    params.decisionsSummary,
    "",
    "TRANSCRIPT:",
    params.transcript,
  ].join("\n");

  const model = params.model ?? DEFAULT_GRADER_MODEL;

  const result = await complete({
    model,
    schemaName: "group_assessment",
    system: GROUP_GRADING_SYSTEM,
    messages: [{ role: "user", content: userContent }],
    schema: groupAssessmentSchema,
    temperature: 0,
    maxTokens: 2500,
  });

  return result.data;
}

export function overallReadiness(assessment: AssessmentPayload): number {
  if (assessment.readiness_scores.length === 0) return 0;
  const sum = assessment.readiness_scores.reduce((acc, s) => acc + s.score, 0);
  return Math.round(sum / assessment.readiness_scores.length);
}
