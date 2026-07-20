import { redirect } from "next/navigation";
import type { RunStageData } from "@/lib/db/schema";
import { STAGES, stagePath } from "@/app/simulation/stages";

export const STAGE_INDEX: Record<string, number> = {
  "leadership-team": 0,
  "read-case": 1,
  values: 2,
  decisions: 3,
  debrief: 4,
};

export function unlockedStageIndex(stageData: RunStageData | null | undefined) {
  if (typeof stageData?.stageIndex === "number") return stageData.stageIndex;
  // Infer for runs that started before stage gating existed
  if (stageData?.reflections?.length) return 4;
  if (stageData?.valuesAnswer) return 3;
  if (stageData?.propsAcknowledged) return 3;
  return 0;
}

/** Redirect back if the student skipped ahead. */
export function enforceStageAccess(
  slug: string,
  stageData: RunStageData | null | undefined,
) {
  const want = STAGE_INDEX[slug] ?? 0;
  const have = unlockedStageIndex(stageData);
  if (want > have) {
    const fallback = STAGES[Math.min(have, STAGES.length - 1)];
    redirect(stagePath(fallback.slug));
  }
}

export function nextStageIndexAfter(slug: string) {
  const current = STAGE_INDEX[slug] ?? 0;
  return Math.min(current + 1, STAGES.length - 1);
}
