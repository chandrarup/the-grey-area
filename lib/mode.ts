import { getCurrentProfile, requireStaff } from "@/lib/auth";
export type AppMode = "admin" | "professor" | "student";
export const MODE_COOKIE = "tga_mode";
export function homeForMode(mode: AppMode): string {
  return mode === "student" ? "/group/join" : "/professor/simulations";
}
export async function getAppMode(): Promise<AppMode> {
  const profile = await getCurrentProfile();
  return profile?.role === "admin"
    ? "admin"
    : profile?.role === "professor"
      ? "professor"
      : "student";
}
export const getActor = requireStaff;
export const getProfessorActor = requireStaff;
/** Preview uses the signed-in instructor's own run, never shared Student A. */
export const getStudentActor = requireStaff;
