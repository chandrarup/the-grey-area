import { NextResponse } from "next/server";
import {
  abstainPressureStance,
  assertSessionPlayable,
  getGroupSessionByCode,
  lockPressureStance,
} from "@/lib/db/group-queries";
import { requireSeatForCode } from "@/lib/group/seat-auth";

type StanceBody = {
  /** lock = choose authored chip; abstain = record Abstain (or timeout). */
  action?: "lock" | "abstain";
  chipKey?: string;
  note?: string;
};

export async function POST(
  request: Request,
  context: { params: Promise<{ code: string }> },
) {
  try {
    const { code } = await context.params;
    const body = (await request.json()) as StanceBody;
    const action = body.action ?? "lock";

    const seat = await requireSeatForCode(code, request);
    assertSessionPlayable(seat.session);
    if (seat.session.status !== "active") {
      return NextResponse.json({ error: "Session not active" }, { status: 400 });
    }
    if (seat.roleKey === "ceo") {
      return NextResponse.json(
        { error: "CEO has no pressure stance" },
        { status: 403 },
      );
    }

    const session = await getGroupSessionByCode(code);
    if (!session?.currentSceneId) {
      return NextResponse.json({ error: "No active scene" }, { status: 400 });
    }

    if (action === "abstain") {
      const row = await abstainPressureStance({
        sessionId: session.id,
        sceneId: session.currentSceneId,
        roleKey: seat.roleKey,
      });
      return NextResponse.json({
        ok: true,
        stance: row
          ? {
              roleKey: row.roleKey,
              status: row.status,
              chipKey: row.chipKey,
              chipLabel: row.chipLabel,
              note: row.note,
            }
          : null,
      });
    }

    const chipKey = body.chipKey?.trim();
    if (!chipKey) {
      return NextResponse.json({ error: "chipKey required" }, { status: 400 });
    }

    const row = await lockPressureStance({
      sessionId: session.id,
      sceneId: session.currentSceneId,
      roleKey: seat.roleKey,
      chipKey,
      note: body.note,
    });

    return NextResponse.json({
      ok: true,
      stance: {
        roleKey: row.roleKey,
        status: row.status,
        chipKey: row.chipKey,
        chipLabel: row.chipLabel,
        note: row.note,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Stance update failed";
    const status = /Only the CEO|Not seated|CEO has no|Only advisor|Only human/i.test(
      message,
    )
      ? 403
      : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
