import { getCurrentProfile, requireStaff } from "@/lib/auth";
import { localPreviewEnabled } from "./policy";
import type { ProfileRole } from "@/lib/db/schema";
export type AppRole = ProfileRole;
export async function resolveAppRole(): Promise<AppRole> {
  return ((await getCurrentProfile())?.role as AppRole) ?? "student";
}
export function homeForRole(role: AppRole): string {
  return role === "student" ? "/login" : "/professor/simulations";
}
export async function requireInstructorArea(): Promise<AppRole> {
  return (await requireStaff()).role as AppRole;
}
export const requireStudentArea = requireInstructorArea;
export const isDevIdentityEnabled = localPreviewEnabled;
