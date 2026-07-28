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
  planFromBatchSessions,
  renameGroupSession,
  saveDraftBatch,
  type BatchRosterResultRow,
  type DraftBatchPayload,
} from "@/lib/db/group-queries";
import {
  seatsMapForGroup,
  validatePlan,
  type BatchPlan,
  type PlannedGroup,
} from "@/lib/group/batch-plan";
import type { SeatKey } from "@/lib/case/group-roles";
import {
  getInvitePreflight,
  resendParticipantInvite,
  sendBatchInvites,
  sendTestInvite,
  type InviteSendResult,
} from "@/lib/email/send-batch-invites";
import type { InviteEnvCheck } from "@/lib/email/types";

export type ConfirmBatchInput = {
  batchId?: string | null;
  batchName: string;
  caseSlug: string;
  decisionCount: number;
  minGroupSize: number;
  roleplayModel?: string;
  graderModel?: string;
  groups: PlannedGroup[];
};

function resolveModels(input: {
  roleplayModel?: string;
  graderModel?: string;
  prefsRoleplay: string;
  prefsGrader: string;
}) {
  const roleplayModel = isKnownModelId(input.roleplayModel ?? "")
    ? input.roleplayModel!
    : input.prefsRoleplay || DEFAULT_ROLEPLAY_MODEL;
  const graderModel = isKnownModelId(input.graderModel ?? "")
    ? input.graderModel!
    : input.prefsGrader || DEFAULT_GRADER_MODEL;
  return { roleplayModel, graderModel };
}

function groupsForCreate(groups: PlannedGroup[]) {
  return groups.map((g) => {
    const seats = seatsMapForGroup(g);
    const assignments: Partial<
      Record<SeatKey, { name: string; email: string }>
    > = {};
    for (const m of g.members) {
      assignments[m.roleKey] = { name: m.name, email: m.email };
    }
    return {
      displayName: g.displayName,
      seats,
      assignments,
    };
  });
}

/** Persist draft plan so navigation does not lose the editor. */
export async function saveDraftBatchAction(input: {
  batchId?: string | null;
  batchName: string;
  caseSlug: string;
  decisionCount: number;
  minGroupSize: number;
  roleplayModel?: string;
  graderModel?: string;
  plan: BatchPlan;
}): Promise<{ batchId: string }> {
  const profile = await getProfessorActor();
  const prefs = await getModelPrefs();
  const { roleplayModel, graderModel } = resolveModels({
    roleplayModel: input.roleplayModel,
    graderModel: input.graderModel,
    prefsRoleplay: prefs.roleplayModel,
    prefsGrader: prefs.graderModel,
  });

  const payload: DraftBatchPayload = {
    batchName: input.batchName,
    caseSlug: input.caseSlug || "cost-of-winning",
    decisionCount: Math.min(5, Math.max(1, input.decisionCount)),
    minGroupSize: input.minGroupSize,
    roleplayModel,
    graderModel,
    plan: {
      minGroupSize: input.plan.minGroupSize,
      groups: input.plan.groups.map((g) => ({
        id: g.id,
        displayName: g.displayName || "Untitled Group",
        members: g.members.map((m) => ({
          studentId: m.studentId,
          name: m.name,
          email: m.email,
          roleKey: m.roleKey,
        })),
        aiSeats: g.aiSeats,
      })),
    },
  };

  const batch = await saveDraftBatch({
    createdBy: profile,
    batchId: input.batchId,
    payload,
  });
  revalidatePath("/professor");
  revalidatePath(`/professor/groups/batch/${batch.id}`);
  return { batchId: batch.id };
}

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

  const { roleplayModel, graderModel } = resolveModels({
    roleplayModel: input.roleplayModel,
    graderModel: input.graderModel,
    prefsRoleplay: prefs.roleplayModel,
    prefsGrader: prefs.graderModel,
  });

  const { batch, roster } = await createGroupBatch({
    createdBy: profile,
    batchId: input.batchId ?? undefined,
    name: input.batchName.trim() || `Batch ${new Date().toLocaleDateString()}`,
    caseSlug: input.caseSlug || "cost-of-winning",
    decisionCount: Math.min(5, Math.max(1, input.decisionCount)),
    roleplayModel,
    graderModel,
    groups: groupsForCreate(input.groups),
  });

  revalidatePath("/professor");
  revalidatePath("/professor/groups");
  revalidatePath(`/professor/groups/batch/${batch.id}`);
  return { batchId: batch.id, roster };
}

export async function loadBatchPlanAction(
  batchId: string,
): Promise<DraftBatchPayload | null> {
  await getProfessorActor();
  return planFromBatchSessions(batchId);
}

export async function renameGroupAction(
  sessionId: string,
  displayName: string,
  batchId: string,
): Promise<void> {
  await getProfessorActor();
  await renameGroupSession(sessionId, displayName);
  revalidatePath(`/professor/groups/batch/${batchId}`);
  revalidatePath(`/professor/groups/${sessionId}`);
}

export async function invitePreflightAction(): Promise<InviteEnvCheck> {
  await getProfessorActor();
  return getInvitePreflight();
}

export async function sendBatchInvitesAction(
  batchId: string,
  mode: "pending" | "failed" = "pending",
): Promise<{
  results: InviteSendResult[];
  roster: BatchRosterResultRow[];
  preflight: InviteEnvCheck;
}> {
  await getProfessorActor();
  const result = await sendBatchInvites(batchId, {
    onlyFailed: mode === "failed",
  });
  revalidatePath(`/professor/groups/batch/${batchId}`);
  return result;
}

export async function resendInviteAction(
  participantId: string,
): Promise<{ result: InviteSendResult }> {
  await getProfessorActor();
  const result = await resendParticipantInvite(participantId);
  return { result };
}

export async function sendTestInviteAction(
  batchId: string,
  toAddress?: string | null,
): Promise<InviteSendResult & { preflight: InviteEnvCheck }> {
  await getProfessorActor();
  return sendTestInvite(batchId, toAddress);
}

export async function refreshBatchRosterAction(
  batchId: string,
): Promise<BatchRosterResultRow[]> {
  await getProfessorActor();
  return listBatchRoster(batchId);
}
