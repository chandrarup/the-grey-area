import type { Profile } from "./schema";

export function isStaff(profile: Profile): boolean {
  return profile.role === "professor" || profile.role === "admin";
}
