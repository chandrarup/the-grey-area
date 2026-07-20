import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { profiles, type Profile, type ProfileRole } from "@/lib/db/schema";

export type AppMode = "admin" | "professor" | "student";

export const MODE_COOKIE = "tga_mode";

const SEED_EMAIL: Record<AppMode, string> = {
  student: "student-a@dev.local",
  professor: "professor@dev.local",
  admin: "admin@dev.local",
};

export function homeForMode(mode: AppMode): string {
  switch (mode) {
    case "admin":
      return "/";
    case "professor":
      return "/professor";
    case "student":
      return "/simulation/leadership-team";
  }
}

export async function getAppMode(): Promise<AppMode> {
  const jar = await cookies();
  const raw = jar.get(MODE_COOKIE)?.value;
  if (raw === "admin" || raw === "professor" || raw === "student") return raw;
  return "admin";
}

/** Always returns a seeded profile for the active mode — no login. */
export async function getActor(): Promise<Profile> {
  const mode = await getAppMode();
  return getSeededProfile(SEED_EMAIL[mode]);
}

export async function getStudentActor(): Promise<Profile> {
  return getSeededProfile(SEED_EMAIL.student);
}

export async function getProfessorActor(): Promise<Profile> {
  return getSeededProfile(SEED_EMAIL.professor);
}

async function getSeededProfile(email: string): Promise<Profile> {
  const [existing] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.email, email))
    .limit(1);

  if (existing) return existing;

  const role = (Object.entries(SEED_EMAIL).find(([, e]) => e === email)?.[0] ??
    "student") as ProfileRole;
  const name =
    role === "admin"
      ? "US Admin"
      : role === "professor"
        ? "Professor"
        : "Student A";

  const [created] = await db
    .insert(profiles)
    .values({ email, name, role })
    .returning();
  return created;
}
