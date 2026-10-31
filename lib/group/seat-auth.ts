import { cookies } from "next/headers";
import type { GroupParticipant, GroupSession } from "@/lib/db/schema";
import { isSessionExpired, shouldAutoExpire } from "@/lib/group-session-lifetime";
import {
  getGroupSessionByCode,
  getParticipantByToken,
} from "@/lib/db/group-queries";
import { SEAT_COOKIE } from "@/lib/group-cookie";

export type SeatCaller = GroupParticipant & { session: GroupSession };

export const SEAT_TOKEN_HEADER = "x-seat-token";

async function resolveToken(raw: string | null | undefined): Promise<SeatCaller | null> {
  if (!raw?.trim()) return null;
  const value = raw.trim();

  const seat = await getParticipantByToken(value);
  if (!seat || seat.isAi) return null;
  if (seat.session.status === "expired" || (shouldAutoExpire(seat.session) && isSessionExpired(seat.session))) return null;
  return seat;
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
    return fromHeader;
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
    secure: process.env.NODE_ENV === "production",
  });
}

/** Explicit tokens preserve seat identity when several seats use different tabs. */
export async function requireParticipant(participantId: string, token?: string) {
  const seat = token ? await resolveToken(token) : await resolveSeatFromCookie();
  if (!seat || seat.id !== participantId || !seat.profileId) throw new Error("Not your seat");
  return seat;
}
