import { NextResponse } from "next/server";
import { COST_OF_WINNING } from "@/lib/cases/cost-of-winning";
import { buildSceneDirectorRequest, capReadyToCommit, type SceneTurn } from "@/lib/engine/scene-director";
import { complete } from "@/lib/llm/complete";
import { LLMConfigError, LLMProviderError, LLMValidationError } from "@/lib/llm/errors";

const DIRECTOR_MODEL = "claude-haiku";

type RequestBody = {
  decisionId: string;
  history: SceneTurn[];
  turnCount: number;
  studentMessage: string;
  attemptedEarlyCommit: boolean;
};

function isSceneTurn(value: unknown): value is SceneTurn {
  if (typeof value !== "object" || value === null) return false;
  const turn = value as Record<string, unknown>;
  if (turn.speaker === "student") return typeof turn.text === "string";
  if (turn.speaker === "director") return Array.isArray(turn.messages);
  return false;
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<RequestBody>;

  if (
    typeof body.decisionId !== "string" ||
    typeof body.studentMessage !== "string" ||
    typeof body.turnCount !== "number" ||
    !Array.isArray(body.history) ||
    !body.history.every(isSceneTurn)
  ) {
    return NextResponse.json({ error: "Malformed request body" }, { status: 400 });
  }

  const decision = COST_OF_WINNING.decisions.find((d) => d.id === body.decisionId);
  if (!decision) {
    return NextResponse.json({ error: `Unknown decision id "${body.decisionId}"` }, { status: 400 });
  }

  try {
    const llmRequest = buildSceneDirectorRequest({
      model: DIRECTOR_MODEL,
      meta: COST_OF_WINNING.meta,
      cast: COST_OF_WINNING.cast,
      decision,
      history: body.history,
      turnCount: body.turnCount,
      studentMessage: body.studentMessage,
      attemptedEarlyCommit: Boolean(body.attemptedEarlyCommit),
    });

    const result = await complete(llmRequest);
    const capped = capReadyToCommit(result.data, body.turnCount, decision.max_turns);

    return NextResponse.json(capped);
  } catch (error) {
    if (error instanceof LLMConfigError) {
      return NextResponse.json({ error: "config", message: error.message }, { status: 400 });
    }
    if (error instanceof LLMValidationError) {
      return NextResponse.json({ error: "validation", message: error.message }, { status: 502 });
    }
    if (error instanceof LLMProviderError) {
      return NextResponse.json({ error: "provider", message: error.message }, { status: 502 });
    }
    throw error;
  }
}
