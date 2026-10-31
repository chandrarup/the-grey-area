import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { isAdmin, isStaff } from "@/lib/db/access";
import { db } from "@/lib/db";
import { profiles, type Profile } from "@/lib/db/schema";
import { createAuthClient } from "@/lib/supabase/server";
import { isAllowedAdmin, localPreviewEnabled } from "@/lib/auth/policy";

export const DEV_PROFILE_COOKIE = "dev_profile_id";
export type { Profile, ProfileRole } from "@/lib/db/schema";
export { isAdmin, isStaff };

export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  if (localPreviewEnabled()) {
    const id = (await cookies()).get(DEV_PROFILE_COOKIE)?.value;
    if (id && /^[0-9a-f-]{36}$/i.test(id)) {
      const [profile] = await db
        .select()
        .from(profiles)
        .where(eq(profiles.id, id))
        .limit(1);
      if (profile && isStaff(profile)) return profile;
    }
  }
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
    return null;
  const auth = await createAuthClient();
  const {
    data: { user },
    error,
  } = await auth.auth.getUser();
  if (
    error ||
    !user?.email_confirmed_at ||
    !isAllowedAdmin(user.email, process.env.ADMIN_EMAILS)
  )
    return null;
  const [profile] = await db
    .insert(profiles)
    .values({
      id: user.id,
      email: user.email!,
      name: user.user_metadata?.full_name || user.email!,
      role: "admin",
    })
    .onConflictDoUpdate({
      target: profiles.id,
      set: { email: user.email!, role: "admin" },
    })
    .returning();
  return profile;
});

export async function requireProfile(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  return profile;
}
export async function requireStaff(): Promise<Profile> {
  const profile = await requireProfile();
  if (!isStaff(profile)) redirect("/login");
  return profile;
}
export async function requireAdmin(): Promise<Profile> {
  const profile = await requireStaff();
  if (!isAdmin(profile)) redirect("/professor/simulations");
  return profile;
}
/** Solo runs are now a staff-only preview. Students enter through seat tokens. */
export const requireStudent = requireStaff;
