import { NextResponse } from "next/server";
import { getGroupSessionByCode } from "@/lib/db/group-queries";
import { requireSeatForCode } from "@/lib/group/seat-auth";
import { runAiTurn } from "@/lib/group/ai-turn";

export async function POST(
  request: Request,
  context: { params: Promise<{ code: string }> },
) {
  try {
    const { code } = await context.params;
    const body = (await request.json()) as {
      triggerMessageId?: number;
      roleKey?: string;
    };
    const triggerMessageId = Number(body.triggerMessageId);
    const roleKey = body.roleKey?.trim() ?? "";
    if (!triggerMessageId || !roleKey) {
      return NextResponse.json(
        { error: "triggerMessageId and roleKey required" },
        { status: 400 },
      );
    }

    // Only a seated human in this session may trigger (the sender)
    await requireSeatForCode(code, request);
    const session = await getGroupSessionByCode(code);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const result = await runAiTurn({
      sessionId: session.id,
      triggerMessageId,
      roleKey,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    // Failures must not break the meeting
    console.error("[api ai-turn]", err);
    return NextResponse.json({ ok: true, claimed: false, failed: true });
  }
}
