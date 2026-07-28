/**
 * SERVER ONLY — Resend email client + invite env preflight.
 * Never import into client components.
 */
import { Resend } from "resend";
import type { InviteEnvCheck } from "@/lib/email/types";

export type { InviteEnvCheck } from "@/lib/email/types";

let _client: Resend | null = null;

export function getResend(): Resend {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) {
    throw new Error(
      "RESEND_API_KEY is not set. Add it to .env.local / Vercel env.",
    );
  }
  if (!_client) _client = new Resend(key);
  return _client;
}

export function emailFromAddress(): string {
  const from = process.env.EMAIL_FROM?.trim();
  if (!from) {
    throw new Error(
      "EMAIL_FROM is not set. Set it to a verified sender, e.g. The Cost of Winning <invites@yourdomain.com>.",
    );
  }
  return from;
}

/** When set, all invites go here (intended recipient logged). */
export function emailTestTo(): string | null {
  const v = process.env.EMAIL_TEST_TO?.trim();
  return v || null;
}

export function appBaseUrlServer(): string {
  const base = process.env.NEXT_PUBLIC_APP_BASE_URL?.trim().replace(/\/$/, "");
  if (!base) {
    throw new Error(
      "NEXT_PUBLIC_APP_BASE_URL is not set. Set it to your app origin (e.g. https://your-app.vercel.app) so join links work in email.",
    );
  }
  return base;
}

/**
 * Preflight before any send. Names the missing variables explicitly.
 */
export function checkInviteEnv(): InviteEnvCheck {
  const missing: string[] = [];
  if (!process.env.RESEND_API_KEY?.trim()) missing.push("RESEND_API_KEY");
  if (!process.env.EMAIL_FROM?.trim()) missing.push("EMAIL_FROM");
  if (!process.env.NEXT_PUBLIC_APP_BASE_URL?.trim()) {
    missing.push("NEXT_PUBLIC_APP_BASE_URL");
  }

  const warnings: string[] = [];
  const from = process.env.EMAIL_FROM?.trim() ?? "";
  if (from.includes("onboarding@resend.dev")) {
    warnings.push(
      "EMAIL_FROM uses Resend's sandbox address (onboarding@resend.dev), which can only deliver to your Resend account owner's email. Verify a domain in Resend and set EMAIL_FROM to that domain to email a class.",
    );
  }

  if (missing.length) {
    return {
      ok: false,
      missing,
      warnings,
      message: `Email is not configured. Set ${missing.join(", ")} in .env.local (or Vercel env), then retry.`,
    };
  }

  return {
    ok: true,
    missing: [],
    warnings,
    message: warnings[0] ?? null,
  };
}
