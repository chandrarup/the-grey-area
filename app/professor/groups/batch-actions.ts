"use server";

import { revalidatePath } from "next/cache";
import { getProfessorActor } from "@/lib/mode";
import { getModelPrefs } from "@/lib/model-prefs";
import {
  DEFAULT_GRADER_MODEL,
  DEFAULT_ROLEPLAY_MODEL,
  isKnownModelId,
} from "@/lib/llm/models";
import {
  createGroupBatch,
  listBatchRoster,
  type BatchRosterResultRow,
} from "@/lib/db/group-queries";
import {
  seatsMapForGroup,
  validatePlan,
  type BatchPlan,
  type PlannedGroup,
} from "@/lib/group/batch-plan";
import type { SeatKey } from "@/lib/case/group-roles";
import {
  resendParticipantInvite,
  sendBatchInvites,
  type InviteSendResult,
} from "@/lib/email/send-batch-invites";

export type ConfirmBatchInput = {
  batchName: string;
  caseSlug: string;
  decisionCount: number;
  minGroupSize: number;
  roleplayModel?: string;
  graderModel?: string;
  groups: PlannedGroup[];
};

export async function confirmBatchAction(
  input: ConfirmBatchInput,
): Promise<{ batchId: string; roster: BatchRosterResultRow[] }> {
  const profile = await getProfessorActor();
  const prefs = await getModelPrefs();

  const plan: BatchPlan = {
    groups: input.groups,
    minGroupSize: input.minGroupSize,
  };
  const errors = validatePlan(plan);
  if (errors.length) {
    throw new Error(errors.join("; "));
  }

  const roleplayModel = isKnownModelId(input.roleplayModel ?? "")
    ? input.roleplayModel!
    : prefs.roleplayModel || DEFAULT_ROLEPLAY_MODEL;
  const graderModel = isKnownModelId(input.graderModel ?? "")
    ? input.graderModel!
    : prefs.graderModel || DEFAULT_GRADER_MODEL;

  const groups = input.groups.map((g) => {
    const seats = seatsMapForGroup(g);
    const assignments: Partial<
      Record<SeatKey, { name: string; email: string }>
    > = {};
    for (const m of g.members) {
      assignments[m.roleKey] = { name: m.name, email: m.email };
    }
    return { seats, assignments };
  });

  const { batch, roster } = await createGroupBatch({
    createdBy: profile,
    name: input.batchName.trim() || `Batch ${new Date().toLocaleDateString()}`,
    caseSlug: input.caseSlug || "cost-of-winning",
    decisionCount: Math.min(5, Math.max(1, input.decisionCount)),
    roleplayModel,
    graderModel,
    groups,
  });

  revalidatePath("/professor");
  revalidatePath("/professor/groups");
  return { batchId: batch.id, roster };
}

export async function sendBatchInvitesAction(
  batchId: string,
  mode: "pending" | "failed" = "pending",
): Promise<{ results: InviteSendResult[]; roster: BatchRosterResultRow[] }> {
  await getProfessorActor();
  const result = await sendBatchInvites(batchId, {
    onlyFailed: mode === "failed",
  });
  revalidatePath("/professor");
  return result;
}

export async function resendInviteAction(
  participantId: string,
): Promise<{ result: InviteSendResult }> {
  await getProfessorActor();
  const result = await resendParticipantInvite(participantId);
  return { result };
}

export async function refreshBatchRosterAction(
  batchId: string,
): Promise<BatchRosterResultRow[]> {
  await getProfessorActor();
  return listBatchRoster(batchId);
}
