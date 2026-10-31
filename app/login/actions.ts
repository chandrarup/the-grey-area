"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { createAuthClient } from "@/lib/supabase/server";
import { isAllowedAdmin, localPreviewEnabled } from "@/lib/auth/policy";
import { DEV_PROFILE_COOKIE } from "@/lib/auth";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";

export async function login(_previous: { error: string }, form: FormData) {
  const email = String(form.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(form.get("password") ?? "");
  const failed = {
    error:
      "Unable to sign in. Check your credentials and administrator access.",
  };
  if (!isAllowedAdmin(email, process.env.ADMIN_EMAILS) || !password)
    return failed;
  const auth = await createAuthClient();
  const { data, error } = await auth.auth.signInWithPassword({
    email,
    password,
  });
  if (error || !data.user?.email_confirmed_at) return failed;
  redirect("/professor/simulations");
}
export async function logout() {
  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    await (await createAuthClient()).auth.signOut();
  }
  const jar = await cookies();
  jar.delete(DEV_PROFILE_COOKIE);
  jar.delete("tga_mode");
  redirect("/login");
}
export async function enterLocalPreview() {
  if (!localPreviewEnabled()) throw new Error("Local preview is disabled");
  let [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.email, "admin@dev.local"))
    .limit(1);
  if (!profile)
    [profile] = await db
      .insert(profiles)
      .values({
        email: "admin@dev.local",
        name: "Local preview",
        role: "admin",
      })
      .returning();
  (await cookies()).set(DEV_PROFILE_COOKIE, profile.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 28800,
  });
  redirect("/professor/simulations");
}
