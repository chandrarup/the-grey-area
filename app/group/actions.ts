"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getProfessorActor } from "@/lib/mode";
import {
  requireParticipant,
  setSeatCookie,
  resolveSeatFromCookie,
} from "@/lib/group/seat-auth";
import { getModelPrefs } from "@/lib/model-prefs";
import {
  DEFAULT_GRADER_MODEL,
  DEFAULT_ROLEPLAY_MODEL,
  isKnownModelId,
} from "@/lib/llm/models";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import {
  createGroupSession,
  joinByToken,
  setParticipantReady,
  startGroupSession,
  getGroupSession,
  listGroupDecisions,
  getGroupMessages,
  upsertGroupAssessment,
  listParticipants,
  getParticipantByToken,
  deleteExpiredGroupSessions,
  deleteGroupSession,
  markSessionGraded,
  saveParticipantReflections,
} from "@/lib/db/group-queries";
import { seatDisplayName, type SeatKey } from "@/lib/case/group-roles";
import { getCase } from "@/lib/case/registry";
import { gradeGroupSession } from "@/lib/engine/grader";

export async function createSessionAction(formData: FormData) {
  const profile = await getProfessorActor();
  const prefs = await getModelPrefs();
  const decisionCount = Number(formData.get("decisionCount") ?? 3);

  const seats = {
    ceo: "human" as const,
    marcus: (formData.get("marcus") === "ai" ? "ai" : "human") as "human" | "ai",
    david: (formData.get("david") === "ai" ? "ai" : "human") as "human" | "ai",
    priya: (formData.get("priya") === "ai" ? "ai" : "human") as "human" | "ai",
    tom: (formData.get("tom") === "ai" ? "ai" : "human") as "human" | "ai",
  };

  const displayNames: Partial<Record<SeatKey, string>> = {};
  for (const seat of ["ceo", "marcus", "david", "priya", "tom"] as SeatKey[]) {
    const name = String(formData.get(`name_${seat}`) ?? "").trim();
    if (name) displayNames[seat] = name;
  }

  const roleplayRaw = String(formData.get("roleplayModel") ?? "");
  const graderRaw = String(formData.get("graderModel") ?? "");
  const roleplayModel = isKnownModelId(roleplayRaw)
    ? roleplayRaw
    : prefs.roleplayModel || DEFAULT_ROLEPLAY_MODEL;
  const graderModel = isKnownModelId(graderRaw)
    ? graderRaw
    : prefs.graderModel || DEFAULT_GRADER_MODEL;

  const { session } = await createGroupSession({
    createdBy: profile,
    caseSlug: "cost-of-winning",
    decisionCount,
    seats,
    displayNames,
    roleplayModel,
    graderModel,
  });
  revalidatePath("/professor");
  revalidatePath("/professor/groups");
  return session.id;
}

/** Open a seat in this browser tab — creates a guest profile for that seat only. */
export async function openSeatWindowAction(token: string) {
  const found = await getParticipantByToken(token);
  if (!found || found.isAi) throw new Error("Invalid seat token");

  const email = `seat-${found.sessionId.slice(0, 8)}-${found.roleKey}@dev.local`;
  const rawName = found.displayName?.trim();
  const displayName =
    rawName && !/^you\b/i.test(rawName) && !rawName.startsWith("You —")
      ? rawName
      : seatDisplayName(found.roleKey);

  let [guest] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.email, email))
    .limit(1);

  if (!guest) {
    [guest] = await db
      .insert(profiles)
      .values({ email, name: displayName, role: "student" })
      .returning();
  }

  const participant = await joinByToken({
    profile: guest,
    token,
    displayName,
  });

  await setSeatCookie(participant.joinToken ?? token);

  return { sessionId: participant.sessionId, token: participant.joinToken ?? token };
}

export async function getSeatParticipantId(): Promise<string | null> {
  const seat = await resolveSeatFromCookie();
  return seat?.id ?? null;
}

export async function joinWithTokenAction(token: string, _displayName: string) {
  void _displayName;
  return openSeatWindowAction(token);
}

export async function joinWithCodeAction(_code: string, _roleKey: SeatKey, _displayName: string): Promise<{ sessionId: string; token: string }> {
  void _code; void _roleKey; void _displayName;
  throw new Error("Use the personal invitation link from your instructor.");
}

export async function toggleReadyAction(participantId: string, ready: boolean, token?: string) {
  const seat = await requireParticipant(participantId, token);
  const [profile] = await db.select().from(profiles).where(eq(profiles.id, seat.profileId!)).limit(1);
  if (!profile) throw new Error("Profile missing");
  await setParticipantReady(participantId, profile, ready);
  revalidatePath(`/group/${seat.sessionId}`);
}

export async function startMeetingAction(sessionId: string, force = false, participantId?: string, token?: string) {
  let profile;
  if (force) {
    profile = await getProfessorActor();
  } else {
    if (!participantId) throw new Error("Open your invitation first");
    const seat = await requireParticipant(participantId, token);
    if (seat.sessionId !== sessionId || seat.roleKey !== "ceo") throw new Error("Only the CEO can start");
    [profile] = await db.select().from(profiles).where(eq(profiles.id, seat.profileId!)).limit(1);
    if (!profile) throw new Error("Profile missing");
  }
  await startGroupSession(sessionId, { profile, force });
  revalidatePath(`/group/${sessionId}`);
  revalidatePath(`/professor/groups/${sessionId}`);
}

export async function saveGroupReflectionsAction(input: {
  sessionId: string;
  participantId: string;
  joinToken: string;
  reflections: string[];
}) {
  const byToken = input.joinToken.trim()
    ? await getParticipantByToken(input.joinToken.trim())
    : null;
  const seat = byToken ?? (await resolveSeatFromCookie());
  if (
    !seat ||
    seat.id !== input.participantId ||
    seat.sessionId !== input.sessionId
  ) {
    throw new Error("Not your seat");
  }

  await saveParticipantReflections({
    participantId: input.participantId,
    sessionId: input.sessionId,
    reflections: input.reflections,
  });
  revalidatePath(`/group/${input.sessionId}`);
}

export async function gradeGroupAction(sessionId: string) {
  await getProfessorActor();
  const session = await getGroupSession(sessionId);
  if (!session) throw new Error("Missing session");
  const caseConfig = getCase(session.caseSlug);
  const decisions = await listGroupDecisions(sessionId);
  const messages = await getGroupMessages(sessionId);
  const participants = await listParticipants(sessionId);
  const reflectionBlocks = participants
    .filter((p) => !p.isAi && p.reflections?.length)
    .map((p) => {
      const lines = caseConfig.reflectionQuestions.map((q, i) => {
        return `Q: ${q}\nA: ${p.reflections?.[i] ?? ""}`;
      });
      return `Seat ${p.roleKey}:\n${lines.join("\n")}`;
    });
  const model = session.graderModel || DEFAULT_GRADER_MODEL;
  const assessment = await gradeGroupSession({
    sessionId,
    caseConfig,
    decisionsSummary: decisions
      .map((d) => `${d.sceneId}: ${d.decision} — ${d.reasoning}`)
      .join("\n"),
    transcript: [
      messages.map((m) => `${m.roleKey}: ${m.content}`).join("\n"),
      reflectionBlocks.length
        ? `\nPARTICIPANT REFLECTIONS:\n${reflectionBlocks.join("\n\n")}`
        : "",
    ].join(""),
    model,
  });
  await upsertGroupAssessment(sessionId, {
    graderModel: model,
    rawOutput: JSON.stringify(assessment),
    assessment,
    status: "ai_draft",
  });
  await markSessionGraded(sessionId);
  revalidatePath(`/professor/groups/${sessionId}`);
}

export async function saveGroupAssessmentAction(
  sessionId: string,
  assessment: unknown,
  notes: string,
) {
  await getProfessorActor();
  await upsertGroupAssessment(sessionId, {
    assessment,
    professorNotes: notes,
    status: "reviewed",
  });
  revalidatePath(`/professor/groups/${sessionId}`);
}

export async function releaseGroupAction(sessionId: string, notes: string) {
  await getProfessorActor();
  await upsertGroupAssessment(sessionId, {
    status: "released",
    professorNotes: notes,
  });
  const { groupSessions } = await import("@/lib/db/schema");
  await db
    .update(groupSessions)
    .set({ status: "released" })
    .where(eq(groupSessions.id, sessionId));
  revalidatePath(`/professor/groups/${sessionId}`);
  revalidatePath(`/group/${sessionId}`);
}

export async function saveProfessorNotesAction(
  sessionId: string,
  notes: string,
) {
  await getProfessorActor();
  await upsertGroupAssessment(sessionId, {
    professorNotes: notes,
  });
  revalidatePath(`/professor/groups/${sessionId}`);
}

export async function deleteGroupSessionAction(sessionId: string) {
  const profile = await getProfessorActor();
  await deleteGroupSession(sessionId, profile);
  revalidatePath("/professor");
  revalidatePath("/professor/groups");
}

export async function deleteExpiredGroupSessionsAction() {
  const profile = await getProfessorActor();
  const count = await deleteExpiredGroupSessions(profile);
  revalidatePath("/professor");
  revalidatePath("/professor/groups");
  return count;
}
