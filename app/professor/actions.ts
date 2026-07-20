"use server";

import { revalidatePath } from "next/cache";
import { getProfessorActor } from "@/lib/mode";
import {
  getDecisions,
  getMessages,
  getRun,
  releaseAssessment,
  getPublishedCase,
} from "@/lib/db/queries";
import { gradeRun } from "@/lib/engine/grader";
import type { RunStageData } from "@/lib/db/schema";

export async function releaseRunAssessment(runId: string, notes: string) {
  const profile = await getProfessorActor();
  await releaseAssessment(profile, runId, notes || undefined);
  revalidatePath("/professor/runs");
}

export async function triggerGradeRun(runId: string) {
  const profile = await getProfessorActor();
  const run = await getRun(profile, runId);
  if (!run) throw new Error("Run not found");
  const caseRow = await getPublishedCase("cost-of-winning");
  if (!caseRow) throw new Error("Case missing");
  const decisions = await getDecisions(profile, runId);
  const messages = await getMessages(profile, runId);
  const stageData = (run.stageData ?? {}) as RunStageData;
  await gradeRun({
    runId,
    caseConfig: caseRow.config,
    decisions,
    messages,
    reflections: stageData.reflections ?? [],
  });
  revalidatePath("/professor/runs");
}
