"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MODE_COOKIE, type AppMode } from "@/lib/mode";

async function setMode(mode: AppMode) {
  const jar = await cookies();
  jar.set(MODE_COOKIE, mode, {
    path: "/",
    sameSite: "lax",
    httpOnly: false,
  });
}

/** Landing CTA — student path (later: invite / magic-link sign-in). */
export async function enterAsStudent() {
  await setMode("student");
  redirect("/student");
}

/** Landing CTA — instructor path (later: credentialed sign-in). */
export async function enterAsInstructor() {
  await setMode("professor");
  redirect("/professor");
}
