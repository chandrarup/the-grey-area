"use server";

import { revalidatePath } from "next/cache";
import { getProfessorActor } from "@/lib/mode";
import { generateBatchCohortInsights } from "@/lib/batch/cohort-insights";
import {
  getBatchBoardSnapshot,
  getBatchCohortRollup,
  getGroupBatch,
  readCachedCohortInsights,
  type BatchBoardRow,
  type BatchCohortRollup,
  type CohortInsightsPayload,
} from "@/lib/db/group-queries";

export async function refreshBatchBoardAction(
  batchId: string,
): Promise<BatchBoardRow[]> {
  await getProfessorActor();
  return getBatchBoardSnapshot(batchId);
}

export async function getBatchCohortAction(batchId: string): Promise<{
  rollup: BatchCohortRollup;
  insights: CohortInsightsPayload | null;
}> {
  await getProfessorActor();
  const batch = await getGroupBatch(batchId);
  if (!batch) throw new Error("Batch not found");
  const rollup = await getBatchCohortRollup(batchId);
  return { rollup, insights: readCachedCohortInsights(batch) };
}

export async function generateCohortInsightsAction(
  batchId: string,
  force = false,
): Promise<CohortInsightsPayload> {
  await getProfessorActor();
  const payload = await generateBatchCohortInsights(batchId, { force });
  revalidatePath(`/professor/groups/batch/${batchId}`);
  return payload;
}
