import type { GroupSession } from "@/lib/db/schema";

export const SESSION_TTL_SECONDS = 1800; // 30 minutes

/** When the session window closes (from createdAt + clockSeconds). */
export function sessionExpiresAt(session: GroupSession): Date {
  if (session.expiresAt) {
    return new Date(session.expiresAt);
  }
  const base = session.createdAt ? new Date(session.createdAt).getTime() : Date.now();
  return new Date(base + session.clockSeconds * 1000);
}

export function isSessionExpired(session: GroupSession, now = Date.now()): boolean {
  if (session.status === "expired") return true;
  return sessionExpiresAt(session).getTime() <= now;
}

export function sessionMsRemaining(
  session: GroupSession,
  now = Date.now(),
): number {
  return Math.max(0, sessionExpiresAt(session).getTime() - now);
}

export function formatSessionRemaining(ms: number): string {
  if (ms <= 0) return "Expired";
  const totalSec = Math.ceil(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, "0")} left`;
}

/** Lobby/active sessions auto-expire; finished sessions stay for debrief. */
export function shouldAutoExpire(session: GroupSession): boolean {
  return session.status === "lobby" || session.status === "active";
}
