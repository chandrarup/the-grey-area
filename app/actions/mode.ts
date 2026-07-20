"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MODE_COOKIE, homeForMode, type AppMode } from "@/lib/mode";

export async function setAppMode(mode: AppMode) {
  const jar = await cookies();
  jar.set(MODE_COOKIE, mode, {
    path: "/",
    sameSite: "lax",
    httpOnly: false,
  });
  redirect(homeForMode(mode));
}
