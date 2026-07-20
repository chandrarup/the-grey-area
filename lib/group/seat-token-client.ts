/** Client-side per-tab seat token (survives refresh; not shared across profiles). */
const key = (sessionId: string) => `tga_seat_token:${sessionId}`;

export function storeSeatToken(sessionId: string, token: string) {
  try {
    sessionStorage.setItem(key(sessionId), token);
  } catch {
    // ignore
  }
}

export function readSeatToken(sessionId: string): string | null {
  try {
    return sessionStorage.getItem(key(sessionId));
  } catch {
    return null;
  }
}

export function seatHeaders(token: string | null | undefined): HeadersInit {
  if (!token) return {};
  return { "x-seat-token": token };
}
