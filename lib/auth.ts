import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { isStaff } from "@/lib/db/access";
import { db } from "@/lib/db";
import { profiles, type Profile, type ProfileRole } from "@/lib/db/schema";

export const DEV_PROFILE_COOKIE = "dev_profile_id";

export type { Profile, ProfileRole };
export { isStaff };

function assertDevIdentityEnabled(): void {
  if (process.env.DEV_IDENTITY !== "true") {
    throw new Error("dev identity disabled");
  }
}

/**
 * Public auth surface. When Supabase Auth lands, only the bodies of these three
 * functions change — callers stay the same.
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  assertDevIdentityEnabled();

  const jar = await cookies();
  const profileId = jar.get(DEV_PROFILE_COOKIE)?.value;
  if (!profileId) return null;

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, profileId))
    .limit(1);

  return profile ?? null;
}

export async function requireProfile(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) {
    if (process.env.DEV_IDENTITY === "true") {
      redirect("/dev/identity");
    }
    throw new Error("Not authenticated");
  }
  return profile;
}

export async function requireStaff(): Promise<Profile> {
  const profile = await requireProfile();
  if (!isStaff(profile)) {
    throw new Error("Staff access required");
  }
  return profile;
}
