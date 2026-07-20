"use server";

import { revalidatePath } from "next/cache";
import { getStudentActor, getProfessorActor } from "@/lib/mode";
import {
  appendMessage,
  commitDecision,
  getDecisions,
  getMessages,
  getOrCreateRun,
  getPublishedCase,
  getRun,
  resetRun,
  updateRunStageData,
} from "@/lib/db/queries";
import { getCase, getOption, getScene } from "@/lib/case/registry";
import { gradeRun } from "@/lib/engine/grader";
import type { RunStageData } from "@/lib/db/schema";
import { nextStageIndexAfter } from "@/lib/simulation/progress";

async function actor() {
  return getStudentActor();
}

export async function advanceStage(runId: string, fromSlug: string) {
  const profile = await actor();
  const run = await getRun(profile, runId);
  if (!run) throw new Error("Run not found");
  const data = (run.stageData ?? {}) as RunStageData;
  const current = data.stageIndex ?? 0;
  const next = nextStageIndexAfter(fromSlug);
  if (next > current) {
    await updateRunStageData(profile, runId, { stageIndex: next });
  }
  revalidatePath("/simulation");
}

export async function resetSoloRunAction(targetRunId?: string) {
  const student = await getStudentActor();
  const caseRow = await getPublishedCase("cost-of-winning");
  if (!caseRow) throw new Error("Case missing — open home and wait for auto-seed");
  const run = targetRunId
    ? await getRun(student, targetRunId)
    : await getOrCreateRun(student, caseRow.id);
  if (!run) throw new Error("Run not found");
  await resetRun(student, run.id, caseRow.config.startScene);
  revalidatePath("/simulation");
  revalidatePath("/professor/runs");
  revalidatePath("/");
  return run.id;
}

export async function resetSoloRunAsStaff(runId: string) {
  await getProfessorActor();
  const student = await getStudentActor();
  const caseRow = await getPublishedCase("cost-of-winning");
  if (!caseRow) throw new Error("Case missing");
  await resetRun(student, runId, caseRow.config.startScene);
  revalidatePath("/professor/runs");
  revalidatePath("/simulation");
}

export async function saveValuesAnswer(runId: string, valuesAnswer: string) {
  const profile = await actor();
  await updateRunStageData(profile, runId, {
    valuesAnswer,
    stageIndex: nextStageIndexAfter("values"),
  });
  revalidatePath("/simulation/values");
}

export async function acknowledgeProps(runId: string) {
  const profile = await actor();
  await updateRunStageData(profile, runId, { propsAcknowledged: true });
  revalidatePath("/simulation/decisions");
}

export async function saveReflections(runId: string, reflections: string[]) {
  const profile = await actor();
  await updateRunStageData(profile, runId, {
    reflections,
    stageIndex: nextStageIndexAfter("decisions"),
  });
  const run = await getRun(profile, runId);
  if (!run) throw new Error("Run not found");

  const caseRow = await getPublishedCase("cost-of-winning");
  if (!caseRow) throw new Error("Case missing");
  await gradeRun({
    runId,
    caseConfig: caseRow.config,
    decisions: await getDecisions(profile, runId),
    messages: await getMessages(profile, runId),
    reflections,
  });
  revalidatePath("/simulation/debrief");
}

export async function persistStudentMessage(
  runId: string,
  sceneId: string,
  content: string,
) {
  const profile = await actor();
  return appendMessage(profile, runId, {
    sceneId,
    sender: "student",
    content,
  });
}

export async function persistCharacterMessages(
  runId: string,
  sceneId: string,
  messages: { cast_id: string; text: string }[],
) {
  const profile = await actor();
  const rows = [];
  for (const msg of messages) {
    rows.push(
      await appendMessage(profile, runId, {
        sceneId,
        sender: "character",
        content: msg.text,
        castId: msg.cast_id,
      }),
    );
  }
  return rows;
}

export async function commitSceneDecision(input: {
  runId: string;
  caseSlug: string;
  sceneId: string;
  optionKey: string;
  reasoning: string;
}) {
  const profile = await actor();
  if (input.reasoning.trim().length < 20) {
    throw new Error("Reasoning must be at least 20 characters");
  }
  const caseConfig = getCase(input.caseSlug);
  const scene = getScene(caseConfig, input.sceneId);
  const option = getOption(scene, input.optionKey);
  if (!option) throw new Error("Unknown option");

  const nextSceneId = option.next;
  const nextDepth = nextSceneId
    ? getScene(caseConfig, nextSceneId).depth
    : scene.depth;

  const decision = await commitDecision(profile, input.runId, {
    sceneId: input.sceneId,
    optionKey: option.key,
    choice: option.label,
    reasoning: input.reasoning.trim(),
    nextSceneId,
    nextDepth,
    isCompromise: option.isCompromise,
  });

  revalidatePath("/simulation/decisions");
  return {
    decision,
    nextSceneId,
    consequence: option.consequence ?? null,
    isTerminal: nextSceneId === null,
  };
}

export async function getRunStageData(runId: string): Promise<RunStageData> {
  const profile = await actor();
  const run = await getRun(profile, runId);
  return (run?.stageData ?? {}) as RunStageData;
}
