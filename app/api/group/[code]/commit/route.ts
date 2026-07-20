import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import {
  appendGroupMessage,
  assertSessionPlayable,
  commitGroupDecision,
  endSession,
  getGroupMessages,
  getGroupSession,
  getGroupSessionByCode,
  listGroupDecisions,
  markSessionGraded,
  upsertGroupAssessment,
} from "@/lib/db/group-queries";
import { requireSeatForCode } from "@/lib/group/seat-auth";
import { getCase, getOption, getScene } from "@/lib/case/registry";
import { gradeGroupSession } from "@/lib/engine/grader";
import { characterName } from "@/lib/group/public-roster";
import { HUMAN_MSG_GATE, MIN_REASONING_LENGTH } from "@/lib/case/group-roles";
import { DEFAULT_GRADER_MODEL } from "@/lib/llm/models";

export async function POST(
  request: Request,
  context: { params: Promise<{ code: string }> },
) {
  try {
    const { code } = await context.params;
    const body = (await request.json()) as {
      optionKey?: string;
      customText?: string;
      reasoning?: string;
    };
    const reasoning = body.reasoning?.trim() ?? "";
    if (reasoning.length < MIN_REASONING_LENGTH) {
      return NextResponse.json(
        { error: `Reasoning must be at least ${MIN_REASONING_LENGTH} characters` },
        { status: 400 },
      );
    }

    const seat = await requireSeatForCode(code, request);
    if (seat.roleKey !== "ceo") {
      return NextResponse.json({ error: "Only the CEO can commit" }, { status: 403 });
    }
    assertSessionPlayable(seat.session);

    const session = await getGroupSessionByCode(code);
    if (!session?.currentSceneId || session.status !== "active") {
      return NextResponse.json({ error: "Session not active" }, { status: 400 });
    }
    if (!seat.profileId) {
      return NextResponse.json({ error: "Seat not claimed" }, { status: 400 });
    }

    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, seat.profileId))
      .limit(1);
    if (!profile) {
      return NextResponse.json({ error: "Profile missing" }, { status: 400 });
    }

    const caseConfig = getCase(session.caseSlug);
    const scene = getScene(caseConfig, session.currentSceneId);
    const sceneMsgs = await getGroupMessages(session.id, scene.id);
    const humanCount = sceneMsgs.filter((m) => m.senderKind === "human").length;
    if (humanCount < HUMAN_MSG_GATE) {
      return NextResponse.json(
        { error: `Need at least ${HUMAN_MSG_GATE} human messages before committing` },
        { status: 400 },
      );
    }

    let optionKey = body.optionKey?.trim() || "custom";
    let decisionLabel = body.customText?.trim() || "";
    let nextSceneId: string | null = null;
    let consequence: {
      headline: string;
      narrative: string;
      beats: { speaker: string; line: string }[];
    } | null = null;

    if (body.optionKey && body.optionKey !== "custom") {
      const option = getOption(scene, body.optionKey);
      if (!option) {
        return NextResponse.json({ error: "Unknown option" }, { status: 400 });
      }
      optionKey = option.key;
      decisionLabel = option.label;
      nextSceneId = option.next;
      consequence = option.consequence ?? null;
    } else {
      if (!decisionLabel) {
        return NextResponse.json(
          { error: "customText required for custom decision" },
          { status: 400 },
        );
      }
      nextSceneId = null;
    }

    await commitGroupDecision({
      sessionId: session.id,
      sceneId: scene.id,
      optionKey,
      decision: decisionLabel,
      reasoning,
      nextSceneId,
      profile,
    });

    await appendGroupMessage(
      session.id,
      scene.id,
      "narrator",
      "narrator",
      `The CEO has decided: ${decisionLabel}`,
    );

    const updated = await getGroupSession(session.id);
    const decisionsMade = updated?.decisionsMade ?? session.decisionsMade + 1;
    const terminal =
      !updated ||
      updated.status === "committed" ||
      nextSceneId === null ||
      decisionsMade >= session.decisionCount;

    if (!terminal && nextSceneId && consequence) {
      const interstitial = [
        consequence.headline,
        consequence.narrative,
        ...consequence.beats.map((b) => `${b.speaker}: ${b.line}`),
      ]
        .filter(Boolean)
        .join("\n\n");
      await appendGroupMessage(
        session.id,
        scene.id,
        "narrator",
        "narrator",
        interstitial,
      );
    }

    if (terminal || updated?.status === "committed") {
      if (updated && updated.status !== "committed") {
        await endSession(session.id);
      }
      // Grade in background path — await so draft exists
      try {
        await gradeAndStore(session.id);
      } catch (err) {
        console.error("[group-grade]", session.id, err);
      }
    }

    const finalSession = await getGroupSession(session.id);
    return NextResponse.json({
      ok: true,
      status: finalSession?.status,
      currentSceneId: finalSession?.currentSceneId,
      decisionsMade: finalSession?.decisionsMade,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Commit failed";
    const status = /Only the CEO|Not seated/i.test(message) ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

async function gradeAndStore(sessionId: string) {
  const session = await getGroupSession(sessionId);
  if (!session) return;
  const caseConfig = getCase(session.caseSlug);
  const decisions = await listGroupDecisions(sessionId);
  const messages = await getGroupMessages(sessionId);

  const decisionsSummary = decisions
    .map((d) => {
      const scene = caseConfig.scenes[d.sceneId];
      return `### ${scene?.title ?? d.sceneId}\nBrief: ${scene?.brief ?? ""}\nDecision: ${d.decision}\nReasoning: ${d.reasoning}`;
    })
    .join("\n\n");

  const transcript = messages
    .map((m) => {
      const who = characterName(m.roleKey, session.caseSlug);
      return `[${m.sceneId}] ${who}: ${m.content}`;
    })
    .join("\n");

  const model = session.graderModel || DEFAULT_GRADER_MODEL;
  const assessment = await gradeGroupSession({
    sessionId,
    caseConfig,
    decisionsSummary,
    transcript,
    model,
  });
  await upsertGroupAssessment(sessionId, {
    graderModel: model,
    rawOutput: JSON.stringify(assessment),
    assessment,
    status: "ai_draft",
  });
  await markSessionGraded(sessionId);
}
