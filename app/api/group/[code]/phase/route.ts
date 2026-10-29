import { NextResponse } from "next/server";
import {
  applyGroupPhaseEvent,
  assertSessionPlayable,
  getGroupSessionByCode,
} from "@/lib/db/group-queries";
import { requireSeatForCode } from "@/lib/group/seat-auth";
import type { PhaseEvent } from "@/lib/group/meeting-runtime";

type PhaseBody = {
  /** Event type from GroupMeetingRuntime (seat id filled server-side). */
  type?: string;
};

function parseEvent(
  type: string,
  seatId: string,
): PhaseEvent | null {
  switch (type) {
    case "begin_film":
      return { type: "begin_film" };
    case "film_watched":
      return { type: "film_watched", seatId };
    case "film_timeout":
      return { type: "film_timeout" };
    case "ceo_force_advance":
      return { type: "ceo_force_advance" };
    case "enter_script":
      return { type: "enter_script" };
    case "script_done":
      return { type: "script_done", seatId };
    case "enter_live":
      return { type: "enter_live" };
    default:
      return null;
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ code: string }> },
) {
  try {
    const { code } = await context.params;
    const body = (await request.json()) as PhaseBody;
    const type = body.type?.trim() ?? "";
    if (!type) {
      return NextResponse.json({ error: "type required" }, { status: 400 });
    }

    const seat = await requireSeatForCode(code, request);
    assertSessionPlayable(seat.session);
    if (seat.session.status !== "active") {
      return NextResponse.json({ error: "Session not active" }, { status: 400 });
    }

    const event = parseEvent(type, seat.roleKey);
    if (!event) {
      return NextResponse.json({ error: "Unknown phase event" }, { status: 400 });
    }

    const session = await getGroupSessionByCode(code);
    if (!session) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const updated = await applyGroupPhaseEvent({
      sessionId: session.id,
      event,
      actorRoleKey: seat.roleKey,
      isCeo: seat.roleKey === "ceo",
    });

    const filmWatched = Array.isArray(updated.filmWatchedSeatIds)
      ? updated.filmWatchedSeatIds.filter((v): v is string => typeof v === "string")
      : [];
    const scriptDone = Array.isArray(updated.scriptDoneSeatIds)
      ? updated.scriptDoneSeatIds.filter((v): v is string => typeof v === "string")
      : [];

    return NextResponse.json({
      ok: true,
      scenePhase: updated.scenePhase,
      phaseDeadlineAt: updated.phaseDeadlineAt
        ? updated.phaseDeadlineAt.toISOString()
        : null,
      filmWatchedSeatIds: filmWatched,
      scriptDoneSeatIds: scriptDone,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Phase update failed";
    const status = /Only the CEO|Not seated/i.test(message) ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
