import { NextResponse } from "next/server";
import {
  getGroupSessionByCode,
  getGroupSessionState,
} from "@/lib/db/group-queries";
import {
  sessionExpiresAt,
  sessionMsRemaining,
} from "@/lib/group-session-lifetime";
import type { GroupSessionState } from "@/lib/realtime/types";

/** Accept session UUID or 6-char code (same [code] segment as message/ai-turn/commit). */
async function resolveSessionId(key: string): Promise<string | null> {
  if (key.includes("-")) return key; // UUID
  const session = await getGroupSessionByCode(key);
  return session?.id ?? null;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ code: string }> },
) {
  const { code: key } = await context.params;
  const url = new URL(request.url);
  const afterId = Number(url.searchParams.get("after") ?? "0") || 0;

  const sessionId = await resolveSessionId(key);
  if (!sessionId) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const state = await getGroupSessionState(sessionId, afterId);
  if (!state) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const payload: GroupSessionState = {
    sessionId: state.session.id,
    code: state.session.code,
    status: state.session.status,
    currentSceneId: state.session.currentSceneId,
    decisionsMade: state.session.decisionsMade,
    decisionCount: state.session.decisionCount,
    roleplayModel: state.session.roleplayModel,
    graderModel: state.session.graderModel,
    cursor: state.cursor,
    expiresAt: sessionExpiresAt(state.session).toISOString(),
    msRemaining: sessionMsRemaining(state.session),
    messages: state.messages.map((m) => ({
      id: m.id,
      roleKey: m.roleKey,
      senderKind: m.senderKind,
      content: m.content,
      sceneId: m.sceneId,
    })),
    participants: state.participants.map((p) => ({
      id: p.id,
      roleKey: p.roleKey,
      isAi: p.isAi,
      displayName: p.displayName,
      isReady: p.isReady,
      joined: Boolean(p.profileId),
    })),
    thinkingRoleKeys: state.thinkingRoleKeys,
    updatedAt: new Date().toISOString(),
  };

  return NextResponse.json(payload);
}
