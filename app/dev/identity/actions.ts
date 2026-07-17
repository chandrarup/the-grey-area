"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { DEV_PROFILE_COOKIE } from "@/lib/auth";
import { db } from "@/lib/db";
import { profiles, type ProfileRole } from "@/lib/db/schema";

function assertDevIdentityEnabled() {
  if (process.env.DEV_IDENTITY !== "true") {
    throw new Error("dev identity disabled");
  }
}

async function setProfileCookie(profileId: string) {
  const jar = await cookies();
  jar.set(DEV_PROFILE_COOKIE, profileId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function selectDevProfile(formData: FormData) {
  assertDevIdentityEnabled();

  const profileId = String(formData.get("profileId") ?? "");
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, profileId))
    .limit(1);

  if (!profile) {
    throw new Error("Profile not found");
  }

  await setProfileCookie(profile.id);
  redirect("/");
}

export async function createDevProfile(formData: FormData) {
  assertDevIdentityEnabled();

  const name = String(formData.get("name") ?? "").trim();
  const role = String(formData.get("role") ?? "student") as ProfileRole;
  const emailRaw = String(formData.get("email") ?? "").trim();

  if (!name) {
    throw new Error("Name is required");
  }
  if (!["student", "professor", "admin"].includes(role)) {
    throw new Error("Invalid role");
  }

  const email =
    emailRaw || `${name.toLowerCase().replace(/\s+/g, ".")}@dev.local`;

  const [created] = await db
    .insert(profiles)
    .values({ name, role, email })
    .returning();

  await setProfileCookie(created.id);
  redirect("/");
}

export async function clearDevProfile() {
  assertDevIdentityEnabled();
  const jar = await cookies();
  jar.delete(DEV_PROFILE_COOKIE);
  redirect("/dev/identity");
}
