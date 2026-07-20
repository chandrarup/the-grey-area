import { cookies } from "next/headers";
import {
  DEFAULT_GRADER_MODEL,
  DEFAULT_ROLEPLAY_MODEL,
  isKnownModelId,
} from "@/lib/llm/models";

export const MODEL_PREFS_COOKIE = "tga_model_prefs";

export type ModelPrefs = {
  roleplayModel: string;
  graderModel: string;
};

export function parseModelPrefs(raw: string | undefined): ModelPrefs {
  if (!raw) {
    return {
      roleplayModel: DEFAULT_ROLEPLAY_MODEL,
      graderModel: DEFAULT_GRADER_MODEL,
    };
  }
  try {
    const parsed = JSON.parse(raw) as Partial<ModelPrefs>;
    const roleplayModel =
      parsed.roleplayModel && isKnownModelId(parsed.roleplayModel)
        ? parsed.roleplayModel
        : DEFAULT_ROLEPLAY_MODEL;
    const graderModel =
      parsed.graderModel && isKnownModelId(parsed.graderModel)
        ? parsed.graderModel
        : DEFAULT_GRADER_MODEL;
    return { roleplayModel, graderModel };
  } catch {
    return {
      roleplayModel: DEFAULT_ROLEPLAY_MODEL,
      graderModel: DEFAULT_GRADER_MODEL,
    };
  }
}

export async function getModelPrefs(): Promise<ModelPrefs> {
  const jar = await cookies();
  return parseModelPrefs(jar.get(MODEL_PREFS_COOKIE)?.value);
}
