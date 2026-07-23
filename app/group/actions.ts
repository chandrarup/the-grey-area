"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getProfessorActor, getStudentActor } from "@/lib/mode";
import { setSeatCookie, resolveSeatFromCookie } from "@/lib/group/seat-auth";
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
  joinGroupSeat,
  setParticipantReady,
  startGroupSession,
  commitGroupDecision,
  appendGroupMessage,
  getGroupSession,
  listGroupDecisions,
  getGroupMessages,
  upsertGroupAssessment,
  listParticipants,
  getParticipantByToken,
  claimAiTurn,
  claimPendingAi,
  finishAiJob,
  deleteExpiredGroupSessions,
  deleteGroupSession,
  markSessionGraded,
} from "@/lib/db/group-queries";
import { GROUP_ROLES, seatDisplayName, type SeatKey } from "@/lib/case/group-roles";
import { getCase, getOption, getScene } from "@/lib/case/registry";
import { gradeGroupSession } from "@/lib/engine/grader";
import { complete } from "@/lib/llm/complete";
import { z } from "zod";

export async function createSessionAction(formData: FormData) {
  const profile = await getProfessorActor();
  const prefs = await getModelPrefs();
  const decisionCount = Number(formData.get("decisionCount") ?? 5);

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

export async function joinWithTokenAction(token: string, displayName: string) {
  const profile = await getStudentActor();
  const participant = await joinByToken({ profile, token, displayName });
  if (!participant.joinToken) throw new Error("Seat has no join token");
  await setSeatCookie(participant.joinToken);
  revalidatePath("/group");
  return { sessionId: participant.sessionId, token: participant.joinToken };
}

export async function joinWithCodeAction(
  code: string,
  roleKey: SeatKey,
  displayName: string,
) {
  const profile = await getStudentActor();
  const { getGroupSessionByCode } = await import("@/lib/db/group-queries");
  const session = await getGroupSessionByCode(code);
  if (!session) throw new Error("Invalid session code");
  const participant = await joinGroupSeat({
    profile,
    sessionId: session.id,
    roleKey,
    displayName,
  });
  if (!participant.joinToken) throw new Error("Seat has no join token");
  await setSeatCookie(participant.joinToken);
  return { sessionId: session.id, token: participant.joinToken };
}

export async function toggleReadyAction(participantId: string, ready: boolean) {
  const { groupParticipants } = await import("@/lib/db/schema");
  const [row] = await db
    .select()
    .from(groupParticipants)
    .where(eq(groupParticipants.id, participantId))
    .limit(1);
  if (!row?.profileId) throw new Error("Seat not claimed");
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, row.profileId))
    .limit(1);
  if (!profile) throw new Error("Profile missing");
  await setParticipantReady(participantId, profile, ready);
  revalidatePath(`/group/${row.sessionId}`);
}

export async function startMeetingAction(
  sessionId: string,
  force = false,
  participantId?: string,
) {
  let profile = await getProfessorActor();
  if (!force && participantId) {
    const { groupParticipants } = await import("@/lib/db/schema");
    const [me] = await db
      .select()
      .from(groupParticipants)
      .where(eq(groupParticipants.id, participantId))
      .limit(1);
    if (me?.profileId) {
      const [p] = await db
        .select()
        .from(profiles)
        .where(eq(profiles.id, me.profileId))
        .limit(1);
      if (p) profile = p;
    }
  }
  await startGroupSession(sessionId, { profile, force });
  revalidatePath(`/group/${sessionId}`);
  revalidatePath(`/professor/groups/${sessionId}`);
}

export async function sendGroupMessageAction(
  sessionId: string,
  roleKey: string,
  content: string,
  participantId: string,
) {
  const { groupParticipants } = await import("@/lib/db/schema");
  const [me] = await db
    .select()
    .from(groupParticipants)
    .where(eq(groupParticipants.id, participantId))
    .limit(1);
  if (!me || me.sessionId !== sessionId || me.roleKey !== roleKey) {
    throw new Error("Not your seat");
  }

  const session = await getGroupSession(sessionId);
  if (!session?.currentSceneId) throw new Error("No active scene");
  if (session.status !== "active") throw new Error("Session is not active");

  const msg = await appendGroupMessage(
    sessionId,
    session.currentSceneId,
    roleKey,
    "human",
    content,
  );

  const participants = await listParticipants(sessionId);
  const caseConfig = getCase(session.caseSlug);
  const scene = getScene(caseConfig, session.currentSceneId);
  const lower = content.toLowerCase();

  for (const p of participants) {
    if (!p.isAi) continue;
    if (p.roleKey === "ceo") continue;
    if (!scene.cast.includes(p.roleKey)) continue;
    const mentioned = lower.includes(p.roleKey) ||
      lower.includes((GROUP_ROLES[p.roleKey as SeatKey]?.name ?? "").split(" ")[0]?.toLowerCase() ?? "___");
    // Enqueue mentioned seats first; always enqueue all AI in cast (Crucible-like coverage)
    void mentioned;
    await claimAiTurn(sessionId, msg.id, p.roleKey);
  }

  return { messageId: msg.id };
}

export async function processGroupAiQueueAction(sessionId: string) {
  const session = await getGroupSession(sessionId);
  if (!session?.currentSceneId || session.status !== "active") {
    return { processed: 0 };
  }

  const jobs = await claimPendingAi(sessionId, 4);
  let processed = 0;
  for (const job of jobs) {
    try {
      await generateAiSeatReply(
        sessionId,
        job.roleKey,
        session.currentSceneId,
        session.roleplayModel || DEFAULT_ROLEPLAY_MODEL,
      );
      await finishAiJob(job.id, "done");
      processed += 1;
    } catch (err) {
      console.error("[group-ai]", sessionId, job.roleKey, err);
      await finishAiJob(job.id, "failed");
    }
  }
  return { processed };
}

async function generateAiSeatReply(
  sessionId: string,
  roleKey: string,
  sceneId: string,
  model: string,
) {
  const session = await getGroupSession(sessionId);
  if (!session) return;
  const caseConfig = getCase(session.caseSlug);
  const member = caseConfig.cast.find((c) => c.id === roleKey);
  if (!member) throw new Error(`Unknown cast ${roleKey}`);

  const messages = await getGroupMessages(sessionId);
  const recent = messages
    .slice(-12)
    .map((m) => `${m.roleKey}: ${m.content}`)
    .join("\n");

  const schema = z.object({ text: z.string() });
  const result = await complete({
    model,
    schemaName: "group_ai_reply",
    system: `${member.persona}\n\nYou are in a live executive meeting. Reply in 1-3 short sentences as yourself. Never break character.`,
    messages: [
      {
        role: "user",
        content: `Recent transcript:\n${recent}\n\nYour turn.`,
      },
    ],
    schema,
    temperature: 0.7,
    maxTokens: 300,
  });
  await appendGroupMessage(sessionId, sceneId, roleKey, "ai", result.data.text);
}

export async function commitGroupDecisionAction(input: {
  sessionId: string;
  optionKey: string;
  reasoning: string;
  participantId: string;
}) {
  const { groupParticipants } = await import("@/lib/db/schema");
  const [me] = await db
    .select()
    .from(groupParticipants)
    .where(eq(groupParticipants.id, input.participantId))
    .limit(1);
  if (!me || me.sessionId !== input.sessionId || me.roleKey !== "ceo") {
    throw new Error("Only the CEO can commit");
  }
  if (!me.profileId) throw new Error("Seat not claimed");

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, me.profileId))
    .limit(1);
  if (!profile) throw new Error("Profile missing");

  const session = await getGroupSession(input.sessionId);
  if (!session?.currentSceneId) throw new Error("No scene");
  const caseConfig = getCase(session.caseSlug);
  const scene = getScene(caseConfig, session.currentSceneId);
  const option = getOption(scene, input.optionKey);
  if (!option) throw new Error("Unknown option");

  await commitGroupDecision({
    sessionId: input.sessionId,
    sceneId: scene.id,
    optionKey: option.key,
    decision: option.label,
    reasoning: input.reasoning,
    nextSceneId: option.next,
    profile,
  });

  const updated = await getGroupSession(input.sessionId);
  if (updated?.status === "committed") {
    try {
      await gradeGroupAction(input.sessionId);
    } catch (err) {
      console.error("[group-grade]", input.sessionId, err);
    }
  }

  revalidatePath(`/group/${input.sessionId}`);
  revalidatePath(`/professor/groups/${input.sessionId}`);
}

export async function gradeGroupAction(sessionId: string) {
  await getProfessorActor();
  const session = await getGroupSession(sessionId);
  if (!session) throw new Error("Missing session");
  const caseConfig = getCase(session.caseSlug);
  const decisions = await listGroupDecisions(sessionId);
  const messages = await getGroupMessages(sessionId);
  const model = session.graderModel || DEFAULT_GRADER_MODEL;
  const assessment = await gradeGroupSession({
    sessionId,
    caseConfig,
    decisionsSummary: decisions
      .map((d) => `${d.sceneId}: ${d.decision} — ${d.reasoning}`)
      .join("\n"),
    transcript: messages.map((m) => `${m.roleKey}: ${m.content}`).join("\n"),
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
