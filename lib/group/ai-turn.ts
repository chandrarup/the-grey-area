import { z } from "zod";
import { complete } from "@/lib/llm/complete";
import { getCase } from "@/lib/case/registry";
import {
  appendGroupMessage,
  claimAiTurn,
  finishAiJob,
  getGroupMessages,
  getGroupSession,
  listGroupDecisions,
  listParticipants,
} from "@/lib/db/group-queries";
import { db } from "@/lib/db";
import { aiTurns } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { DEFAULT_ROLEPLAY_MODEL } from "@/lib/llm/models";

/**
 * Claim + generate one AI seat reply. Idempotent via claimAiTurn.
 * Returns { claimed: false } if already claimed; never throws for LLM failure
 * (marks failed, returns ok so the meeting continues).
 */
export async function runAiTurn(params: {
  sessionId: string;
  triggerMessageId: number;
  roleKey: string;
}): Promise<{ claimed: boolean; messageId?: number; failed?: boolean }> {
  const claimed = await claimAiTurn(
    params.sessionId,
    params.triggerMessageId,
    params.roleKey,
  );
  if (!claimed) return { claimed: false };

  const [turn] = await db
    .select()
    .from(aiTurns)
    .where(
      and(
        eq(aiTurns.sessionId, params.sessionId),
        eq(aiTurns.triggerMessageId, params.triggerMessageId),
        eq(aiTurns.roleKey, params.roleKey),
      ),
    )
    .limit(1);

  try {
    const session = await getGroupSession(params.sessionId);
    if (!session?.currentSceneId || session.status !== "active") {
      if (turn) await finishAiJob(turn.id, "failed");
      return { claimed: true, failed: true };
    }

    const caseConfig = getCase(session.caseSlug);
    const member = caseConfig.cast.find((c) => c.id === params.roleKey);
    if (!member) {
      if (turn) await finishAiJob(turn.id, "failed");
      return { claimed: true, failed: true };
    }

    const scene = caseConfig.scenes[session.currentSceneId];
    const decisions = await listGroupDecisions(params.sessionId);
    const transcript = await getGroupMessages(
      params.sessionId,
      session.currentSceneId,
    );

    const aiRepliesAsRole = transcript.filter(
      (m) => m.roleKey === params.roleKey && m.senderKind === "ai",
    ).length;

    const marcusFeeNote =
      params.roleKey === "marcus" &&
      session.currentSceneId.startsWith("s1") &&
      aiRepliesAsRole < 2
        ? `\nCRITICAL SCENE DIRECTIVE: By this reply (at latest your second), you MUST disclose the commercial terms out loud: a modest retainer plus an $8.4 MILLION success fee payable only if GIS wins. Frame it as roughly one-tenth of one percent of the contract, paid only if you win.`
        : "";

    const characterLines = transcript.map((m) => {
      const who =
        caseConfig.cast.find((c) => c.id === m.roleKey)?.name ??
        (m.roleKey === "narrator" ? "Narrator" : m.roleKey);
      return `${who}: ${m.content}`;
    });

    const decisionLines = decisions.map((d) => {
      const s = caseConfig.scenes[d.sceneId];
      return `${s?.title ?? d.sceneId}: ${d.decision} — ${d.reasoning}`;
    });

    const model =
      process.env.ANTHROPIC_API_KEY
        ? "claude-haiku"
        : session.roleplayModel || DEFAULT_ROLEPLAY_MODEL;

    const schema = z.object({ text: z.string() });
    const result = await complete({
      model,
      schemaName: "group_ai_reply",
      system: [
        caseConfig.globalSystemPrompt,
        "",
        `CURRENT SCENE: ${scene?.title ?? session.currentSceneId}`,
        scene?.brief ?? "",
        scene?.sceneDirective ? `STAGING: ${scene.sceneDirective}` : "",
        "",
        member.persona,
        marcusFeeNote,
        "",
        `Reply ONLY as ${member.name}, 2-4 sentences, in character, no name prefix.`,
      ]
        .filter(Boolean)
        .join("\n"),
      messages: [
        {
          role: "user",
          content: [
            decisionLines.length
              ? `Committed decisions so far:\n${decisionLines.join("\n")}`
              : "No decisions committed yet.",
            "",
            "Current scene transcript:",
            characterLines.join("\n") || "(empty)",
            "",
            "Your turn.",
          ].join("\n"),
        },
      ],
      schema,
      temperature: 0.4,
      maxTokens: 400,
    });

    const row = await appendGroupMessage(
      params.sessionId,
      session.currentSceneId,
      params.roleKey,
      "ai",
      result.data.text.trim(),
    );
    if (turn) await finishAiJob(turn.id, "done");
    return { claimed: true, messageId: row.id };
  } catch (err) {
    console.error("[ai-turn]", params.sessionId, params.roleKey, err);
    if (turn) await finishAiJob(turn.id, "failed");
    return { claimed: true, failed: true };
  }
}

/** AI role keys for a session: AI seats + eleanor when she is in the scene cast. */
export function aiRoleKeysForScene(
  participants: { roleKey: string; isAi: boolean }[],
  sceneCast: string[],
): string[] {
  const keys = new Set<string>();
  for (const p of participants) {
    if (p.isAi && sceneCast.includes(p.roleKey)) keys.add(p.roleKey);
  }
  if (sceneCast.includes("eleanor")) keys.add("eleanor");
  return [...keys];
}

export async function listAiRoleKeys(
  sessionId: string,
  sceneId: string,
  caseSlug: string,
): Promise<string[]> {
  const participants = await listParticipants(sessionId);
  const scene = getCase(caseSlug).scenes[sceneId];
  return aiRoleKeysForScene(participants, scene?.cast ?? []);
}
