"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  MODEL_PREFS_COOKIE,
  type ModelPrefs,
  parseModelPrefs,
} from "@/lib/model-prefs";
import { isKnownModelId } from "@/lib/llm/models";

export async function saveModelPrefsAction(formData: FormData) {
  const roleplayModel = String(formData.get("roleplayModel") ?? "");
  const graderModel = String(formData.get("graderModel") ?? "");
  if (!isKnownModelId(roleplayModel) || !isKnownModelId(graderModel)) {
    throw new Error("Unknown model");
  }
  const prefs: ModelPrefs = { roleplayModel, graderModel };
  const jar = await cookies();
  jar.set(MODEL_PREFS_COOKIE, JSON.stringify(prefs), {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath("/settings");
  revalidatePath("/professor");
}

export async function readModelPrefsAction(): Promise<ModelPrefs> {
  const jar = await cookies();
  return parseModelPrefs(jar.get(MODEL_PREFS_COOKIE)?.value);
}
