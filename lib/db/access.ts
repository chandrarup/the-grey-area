import type { Profile } from "./schema";

export function isStaff(profile: Profile): boolean {
  return profile.role === "professor" || profile.role === "admin";
}

export function isAdmin(profile: Profile): boolean {
  return profile.role === "admin";
}

export function isProfessor(profile: Profile): boolean {
  return profile.role === "professor" || profile.role === "admin";
}

export function homePathForRole(role: Profile["role"]): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "professor":
      return "/professor";
    default:
      return "/";
  }
}
