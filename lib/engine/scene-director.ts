import { z } from "zod";
import type { CaseConfig, CastMember, Scene } from "@/lib/case/types";
import type { LLMMessage, LLMRequest } from "@/lib/llm/types";

export type SceneTurn =
  | { speaker: "student"; text: string }
  | { speaker: "director"; messages: { cast_id: string; text: string }[] };

export type SceneDirectorResult = {
  messages: { cast_id: string; text: string }[];
  ready_to_commit: boolean;
};

export type CommittedPathDecision = {
  sceneId: string;
  sceneTitle: string;
  choice: string;
  reasoning: string;
};

function personaBlock(member: CastMember): string {
  return [
    `${member.name} (${member.role}, cast_id: "${member.id}")`,
    `Persona: ${member.persona}`,
  ].join("\n");
}

export function buildSceneSystemPrompt(params: {
  caseConfig: CaseConfig;
  scene: Scene;
  present: CastMember[];
  committedDecisions: CommittedPathDecision[];
  studentTurns: number;
  attemptedEarlyCommit: boolean;
}): string {
  const {
    caseConfig,
    scene,
    present,
    committedDecisions,
    studentTurns,
    attemptedEarlyCommit,
  } = params;
  const castIds = present.map((m) => m.id);
  const minExchanges = scene.minExchanges ?? 2;
  const parts: string[] = [
    caseConfig.globalSystemPrompt,
    "",
    `SCENE: ${scene.title}`,
    `TIME: ${scene.timeLabel}`,
    `BRIEF: ${scene.brief}`,
    "",
    "CHARACTERS IN THIS SCENE — voice ONLY these, stay true to each persona:",
    present.map(personaBlock).join("\n\n"),
  ];

  if (scene.sceneDirective) {
    parts.push("", "SCENE DIRECTIVE:", scene.sceneDirective);
  }

  parts.push("", "PATH SO FAR (the CEO's own prior commitments):");
  if (committedDecisions.length > 0) {
    for (const decision of committedDecisions) {
      parts.push(
        `- ${decision.sceneTitle}`,
        `  Chose: ${decision.choice}`,
        `  Reasoning: ${decision.reasoning}`,
      );
    }
    parts.push(
      "These are the CEO's own prior commitments. Reference them when realistic — a character may hold the CEO to a decision they already made.",
    );
  } else {
    parts.push("- None yet.");
  }

  parts.push(
    "",
    "RULES:",
    '- Apply pressure persuasively with real human reasons: jobs, loyalty, trust, "everyone else is comfortable." No cartoon villainy.',
    "- Respond directly to what the CEO just said. Do not ignore their argument or repeat a prior line.",
    `- This scene unlocks commit after ${minExchanges} CEO exchanges. This is exchange ${studentTurns + 1}.`,
    `- Decide ready_to_commit: false until pressure has played out; true once the CEO has been reasonably challenged (typically by exchange ${minExchanges}). Once exchange ${minExchanges} is reached, ready_to_commit should be true.`,
    `- Return 1-3 character messages this turn, using cast_id values only from: ${castIds.join(", ")}.`,
  );

  if (studentTurns + 1 >= minExchanges) {
    parts.push(
      "",
      "CONVERSATION WRAP-UP: The CEO has heard enough pressure. Steer toward a decision without choosing for them.",
    );
  }

  if (attemptedEarlyCommit) {
    parts.push(
      "",
      "The CEO tried to lock in a choice early. Deliver one strong final round of pressure; only then may ready_to_commit be true.",
    );
  }

  return parts.join("\n");
}

function buildResponseSchema(castIds: string[]) {
  if (castIds.length === 0) {
    throw new Error("Scene cast must include at least one character.");
  }
  const [first, ...rest] = castIds;
  return z.object({
    messages: z.array(
      z.object({
        cast_id: z.enum([first, ...rest]),
        text: z.string(),
      }),
    ),
    ready_to_commit: z.boolean(),
  });
}

function turnsToMessages(history: SceneTurn[]): LLMMessage[] {
  return history.map((turn) =>
    turn.speaker === "student"
      ? { role: "user", content: turn.text }
      : {
          role: "assistant",
          content: JSON.stringify({
            messages: turn.messages,
            ready_to_commit: false,
          }),
        },
  );
}

export function buildSceneDirectorRequest(params: {
  model: string;
  caseConfig: CaseConfig;
  scene: Scene;
  committedDecisions: CommittedPathDecision[];
  history: SceneTurn[];
  turnCount: number;
  studentMessage: string;
  attemptedEarlyCommit: boolean;
}): LLMRequest<SceneDirectorResult> {
  const {
    model,
    caseConfig,
    scene,
    committedDecisions,
    history,
    turnCount,
    studentMessage,
    attemptedEarlyCommit,
  } = params;

  const present = caseConfig.cast.filter((member) =>
    scene.cast.includes(member.id),
  );
  const castIds = present.map((m) => m.id);

  return {
    model,
    schemaName: "scene_turn",
    system: buildSceneSystemPrompt({
      caseConfig,
      scene,
      present,
      committedDecisions,
      studentTurns: turnCount,
      attemptedEarlyCommit,
    }),
    messages: [
      ...turnsToMessages(history),
      { role: "user", content: studentMessage },
    ],
    schema: buildResponseSchema(castIds),
    temperature: 0.8,
    maxTokens: 800,
  };
}

export function capReadyToCommit(
  result: SceneDirectorResult,
  turnCount: number,
  minExchanges: number,
): SceneDirectorResult {
  if (turnCount + 1 >= minExchanges && !result.ready_to_commit) {
    return { ...result, ready_to_commit: true };
  }
  return result;
}
