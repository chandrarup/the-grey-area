import { NextResponse } from "next/server";
import {
  appendGroupMessage,
  assertSessionPlayable,
  getGroupSessionByCode,
} from "@/lib/db/group-queries";
import { requireSeatForCode } from "@/lib/group/seat-auth";
import { detectMentionedAiRoles } from "@/lib/group/public-roster";
import { listAiRoleKeys } from "@/lib/group/ai-turn";
import { getCase } from "@/lib/case/registry";

export async function POST(
  request: Request,
  context: { params: Promise<{ code: string }> },
) {
  try {
    const { code } = await context.params;
    const body = (await request.json()) as {
      roleKey?: string;
      text?: string;
    };
    const text = body.text?.trim() ?? "";
    const roleKey = body.roleKey?.trim() ?? "";
    if (!text || !roleKey) {
      return NextResponse.json({ error: "roleKey and text required" }, { status: 400 });
    }

    const seat = await requireSeatForCode(code, request);
    assertSessionPlayable(seat.session);
    if (seat.roleKey !== roleKey) {
      return NextResponse.json({ error: "Not your seat" }, { status: 403 });
    }
    if (seat.session.status !== "active" || !seat.session.currentSceneId) {
      return NextResponse.json({ error: "Session not active" }, { status: 400 });
    }

    const session = await getGroupSessionByCode(code);
    if (!session?.currentSceneId) {
      return NextResponse.json({ error: "No scene" }, { status: 400 });
    }

    const msg = await appendGroupMessage(
      session.id,
      session.currentSceneId,
      roleKey,
      "human",
      text,
    );

    const aiKeys = await listAiRoleKeys(
      session.id,
      session.currentSceneId,
      session.caseSlug,
    );
    const mentioned = detectMentionedAiRoles(text, session.caseSlug, aiKeys);
    // Hint for the sender client — only the sender should fire ai-turn
    const scene = getCase(session.caseSlug).scenes[session.currentSceneId];

    return NextResponse.json({
      message: {
        id: msg.id,
        roleKey: msg.roleKey,
        senderKind: msg.senderKind,
        content: msg.content,
        sceneId: msg.sceneId,
        createdAt: msg.createdAt,
      },
      mentionedAiRoles: mentioned,
      sceneCast: scene?.cast ?? [],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Send failed";
    const status = /not seated|Not your seat/i.test(message) ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
