import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { groupParticipants, type GroupParticipant, type GroupSession } from "@/lib/db/schema";
import {
  getGroupSession,
  getGroupSessionByCode,
  getParticipantByToken,
} from "@/lib/db/group-queries";
import { SEAT_COOKIE } from "@/lib/group-cookie";

export type SeatCaller = GroupParticipant & { session: GroupSession };

export const SEAT_TOKEN_HEADER = "x-seat-token";

async function resolveToken(raw: string | null | undefined): Promise<SeatCaller | null> {
  if (!raw?.trim()) return null;
  const value = raw.trim();

  // Legacy: cookie stored participant UUID
  if (value.includes("-") && value.length >= 36) {
    const [row] = await db
      .select()
      .from(groupParticipants)
      .where(eq(groupParticipants.id, value))
      .limit(1);
    if (!row) return null;
    const session = await getGroupSession(row.sessionId);
    if (!session) return null;
    return { ...row, session };
  }

  return getParticipantByToken(value);
}

/** Resolve the caller's seat from the httpOnly join-token cookie. */
export async function resolveSeatFromCookie(): Promise<SeatCaller | null> {
  const jar = await cookies();
  return resolveToken(jar.get(SEAT_COOKIE)?.value);
}

/**
 * Prefer per-request seat token (header) so two tabs in the same browser
 * can play different seats. Fall back to shared cookie.
 */
export async function resolveSeatFromRequest(
  request: Request,
): Promise<SeatCaller | null> {
  const headerToken = request.headers.get(SEAT_TOKEN_HEADER);
  if (headerToken) {
    const fromHeader = await resolveToken(headerToken);
    if (fromHeader) return fromHeader;
  }
  return resolveSeatFromCookie();
}

export async function requireSeatForSession(
  sessionId: string,
  request?: Request,
): Promise<SeatCaller> {
  const seat = request
    ? await resolveSeatFromRequest(request)
    : await resolveSeatFromCookie();
  if (!seat || seat.sessionId !== sessionId) {
    throw new Error("Not seated in this session");
  }
  return seat;
}

export async function requireSeatForCode(
  code: string,
  request?: Request,
): Promise<SeatCaller> {
  const session = await getGroupSessionByCode(code);
  if (!session) throw new Error("Session not found");
  const seat = request
    ? await resolveSeatFromRequest(request)
    : await resolveSeatFromCookie();
  if (!seat || seat.sessionId !== session.id) {
    throw new Error("Not seated in this session");
  }
  return { ...seat, session };
}

export async function setSeatCookie(joinToken: string) {
  const jar = await cookies();
  jar.set(SEAT_COOKIE, joinToken, {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
  });
}
