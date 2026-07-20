import { NextResponse } from "next/server";
import { getStudentActor } from "@/lib/mode";
import { getCase, getScene } from "@/lib/case/registry";
import { getDecisions } from "@/lib/db/queries";
import {
  buildSceneDirectorRequest,
  capReadyToCommit,
  type SceneTurn,
} from "@/lib/engine/scene-director";
import { complete } from "@/lib/llm/complete";
import {
  LLMConfigError,
  LLMProviderError,
  LLMValidationError,
} from "@/lib/llm/errors";
import { DEFAULT_ROLEPLAY_MODEL } from "@/lib/llm/models";
import { getModelPrefs } from "@/lib/model-prefs";

type RequestBody = {
  runId: string;
  caseSlug: string;
  sceneId: string;
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
  const profile = await getStudentActor();
  const body = (await request.json()) as Partial<RequestBody>;
  const prefs = await getModelPrefs();
  const DIRECTOR_MODEL = prefs.roleplayModel || DEFAULT_ROLEPLAY_MODEL;
  if (
    typeof body.runId !== "string" ||
    typeof body.caseSlug !== "string" ||
    typeof body.sceneId !== "string" ||
    typeof body.studentMessage !== "string" ||
    typeof body.turnCount !== "number" ||
    !Array.isArray(body.history) ||
    !body.history.every(isSceneTurn)
  ) {
    return NextResponse.json({ error: "Malformed request body" }, { status: 400 });
  }

  try {
    const caseConfig = getCase(body.caseSlug);
    const scene = getScene(caseConfig, body.sceneId);
    const decisions = await getDecisions(profile, body.runId);
    const committedDecisions = decisions.map((d) => {
      const prior = caseConfig.scenes[d.sceneId];
      return {
        sceneId: d.sceneId,
        sceneTitle: prior?.title ?? d.sceneId,
        choice: d.choice,
        reasoning: d.reasoning ?? "",
      };
    });

    const llmRequest = buildSceneDirectorRequest({
      model: DIRECTOR_MODEL,
      caseConfig,
      scene,
      committedDecisions,
      history: body.history,
      turnCount: body.turnCount,
      studentMessage: body.studentMessage,
      attemptedEarlyCommit: Boolean(body.attemptedEarlyCommit),
    });

    const result = await complete(llmRequest);
    const capped = capReadyToCommit(
      result.data,
      body.turnCount,
      scene.minExchanges,
    );

    return NextResponse.json(capped);
  } catch (error) {
    if (error instanceof LLMConfigError) {
      return NextResponse.json(
        { error: "config", message: error.message },
        { status: 400 },
      );
    }
    if (error instanceof LLMValidationError) {
      return NextResponse.json(
        { error: "validation", message: error.message },
        { status: 502 },
      );
    }
    if (error instanceof LLMProviderError) {
      return NextResponse.json(
        { error: "provider", message: error.message },
        { status: 502 },
      );
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: "server", message }, { status: 500 });
  }
}
