import type { CaseConfig, CastMember, Decision } from "../cases/types";
import type { JSONSchema, LLMMessage, LLMRequest } from "../llm/types";

export type SceneTurn =
  | { speaker: "student"; text: string }
  | { speaker: "director"; messages: { cast_id: string; text: string }[] };

export type SceneDirectorResult = {
  messages: { cast_id: string; text: string }[];
  ready_to_commit: boolean;
};

function personaBlock(member: CastMember): string {
  return [
    `${member.name} (${member.role}, cast_id: "${member.id}")`,
    `Persona: ${member.persona}`,
    `Private agenda (never state this outright): ${member.private_agenda}`,
  ].join("\n");
}

function buildSystemPrompt(params: {
  meta: CaseConfig["meta"];
  present: CastMember[];
  decision: Decision;
  turnCount: number;
  attemptedEarlyCommit: boolean;
}): string {
  const { meta, present, decision, turnCount, attemptedEarlyCommit } = params;
  const castIds = present.map((member) => member.id);

  return [
    `You are the scene director for a leadership-ethics simulation. The student plays the CEO of ${meta.company}. You voice every character present in this scene EXCEPT the CEO.`,
    "",
    `CASE: ${meta.title}`,
    `DECISION: ${decision.title}`,
    `SCENARIO: ${decision.scenario_setup}`,
    "",
    "CHARACTERS IN THIS SCENE — voice ONLY these, and stay strictly true to each persona and private agenda:",
    present.map(personaBlock).join("\n\n"),
    "",
    "RULES:",
    '- Apply pressure persuasively, always with real, human reasons: jobs, loyalty, trust, "everyone else is comfortable with this." No cartoon villainy — nobody admits to wrongdoing.',
    "- Directly respond to what the CEO just said. Do not ignore their argument, and do not repeat a line you already used.",
    "- Each character speaks only within the voice and boundaries their persona describes above.",
    `- This scene caps at ${decision.max_turns} CEO turns. This is turn ${turnCount + 1} of ${decision.max_turns}.`,
    `- Decide ready_to_commit: false if there should be at least one more round of pushback before the CEO locks in a choice; true once the pressure has reasonably played out (usually by turn 2-3 of ${decision.max_turns}, or immediately if the CEO is clearly resolved and unmoved). Once turn ${decision.max_turns} is reached, ready_to_commit must be true.`,
    attemptedEarlyCommit
      ? "- The CEO just tried to lock in a choice before any real back-and-forth. Do not allow it yet: deliver one strong, final round of pressure now, and only then may ready_to_commit be true."
      : "",
    `- Return 1-3 character messages this turn, using cast_id values only from: ${castIds.join(", ")}.`,
  ]
    .filter(Boolean)
    .join("\n");
}

function buildResponseSchema(castIds: string[]): JSONSchema {
  return {
    type: "object",
    properties: {
      messages: {
        type: "array",
        items: {
          type: "object",
          properties: {
            cast_id: { type: "string", enum: castIds },
            text: { type: "string" },
          },
          required: ["cast_id", "text"],
        },
      },
      ready_to_commit: { type: "boolean" },
    },
    required: ["messages", "ready_to_commit"],
  };
}

function turnsToMessages(history: SceneTurn[]): LLMMessage[] {
  return history.map((turn) =>
    turn.speaker === "student"
      ? { role: "user", content: turn.text }
      : {
          role: "assistant",
          content: JSON.stringify({ messages: turn.messages, ready_to_commit: false }),
        },
  );
}

/**
 * Builds the LLM request for one decision turn. Pure and side-effect free —
 * the caller (the /api/decision route) feeds the result into complete().
 */
export function buildSceneDirectorRequest(params: {
  model: string;
  meta: CaseConfig["meta"];
  cast: CastMember[];
  decision: Decision;
  /** Prior turns, oldest first, NOT including the student message that triggered this call. */
  history: SceneTurn[];
  /** Number of completed student turns before this one. */
  turnCount: number;
  studentMessage: string;
  attemptedEarlyCommit: boolean;
}): LLMRequest {
  const { model, meta, cast, decision, history, turnCount, studentMessage, attemptedEarlyCommit } = params;

  const present = cast.filter((member) => decision.characters_present.includes(member.id));
  const castIds = present.map((member) => member.id);

  const messages: LLMMessage[] = [
    ...turnsToMessages(history),
    { role: "user", content: studentMessage },
  ];

  return {
    model,
    schemaName: "scene_turn",
    system: buildSystemPrompt({ meta, present, decision, turnCount, attemptedEarlyCommit }),
    messages,
    schema: buildResponseSchema(castIds),
    temperature: 0.8,
    maxTokens: 800,
  };
}

/** Deterministic backstop: never let the model keep stalling past max_turns. */
export function capReadyToCommit(
  result: SceneDirectorResult,
  turnCount: number,
  maxTurns: number,
): SceneDirectorResult {
  if (turnCount + 1 >= maxTurns && !result.ready_to_commit) {
    return { ...result, ready_to_commit: true };
  }
  return result;
}
