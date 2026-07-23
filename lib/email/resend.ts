/**
 * SERVER ONLY — Resend email client.
 * Never import into client components.
 */
import { Resend } from "resend";

let _client: Resend | null = null;

export function getResend(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error(
      "RESEND_API_KEY is not set. Add it to .env.local / Vercel env.",
    );
  }
  if (!_client) _client = new Resend(key);
  return _client;
}

export function emailFromAddress(): string {
  return (
    process.env.EMAIL_FROM?.trim() ||
    "The Grey Area <onboarding@resend.dev>"
  );
}

/** When set, all invites go here (intended recipient logged). */
export function emailTestTo(): string | null {
  const v = process.env.EMAIL_TEST_TO?.trim();
  return v || null;
}

export function appBaseUrlServer(): string {
  return (
    process.env.NEXT_PUBLIC_APP_BASE_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}
