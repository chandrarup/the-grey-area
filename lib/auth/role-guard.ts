/**
 * Layout-level role decision for student vs instructor areas.
 *
 * TODO: When Supabase Auth lands, change ONLY the body of `resolveAppRole()`
 * (and optionally `assertAreaAccess`) to read `session.user` → `profiles.role`.
 * Keep the exports and redirect paths the same so layouts do not need a redesign.
 * Today this maps the DEV_IDENTITY mode cookie to seeded profiles via `getAppMode()`.
 *
 * Design intent for future sign-in:
 * - Student entry ≈ invite/join link or magic link → student area
 * - Instructor entry ≈ separate credentialed sign-in → professor area
 */
import { redirect } from "next/navigation";
import { getAppMode, type AppMode } from "@/lib/mode";
import type { ProfileRole } from "@/lib/db/schema";

export type AppRole = ProfileRole; // student | professor | admin

export async function resolveAppRole(): Promise<AppRole> {
  const mode: AppMode = await getAppMode();
  if (mode === "admin") return "admin";
  if (mode === "professor") return "professor";
  return "student";
}

export function homeForRole(role: AppRole): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "professor":
      return "/professor";
    default:
      return "/student";
  }
}

/** Student-only surfaces (solo sim, student hub). */
export async function requireStudentArea(): Promise<AppRole> {
  const role = await resolveAppRole();
  if (role !== "student") {
    redirect(homeForRole(role));
  }
  return role;
}

/** Instructor surfaces (professor + admin). */
export async function requireInstructorArea(): Promise<AppRole> {
  const role = await resolveAppRole();
  if (role !== "professor" && role !== "admin") {
    redirect(homeForRole(role));
  }
  return role;
}

export function isDevIdentityEnabled(): boolean {
  return process.env.DEV_IDENTITY === "true";
}
