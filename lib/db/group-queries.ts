import { and, asc, eq, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  aiQueue,
  groupAssessments,
  groupDecisions,
  groupMessages,
  groupParticipants,
  groupSessions,
  type GroupParticipant,
  type GroupSession,
  type Profile,
} from "@/lib/db/schema";
import { SEAT_ORDER, type SeatKey } from "@/lib/case/group-roles";
import { getCase } from "@/lib/case/registry";
import {
  isSessionExpired,
  SESSION_TTL_SECONDS,
  shouldAutoExpire,
} from "@/lib/group-session-lifetime";

function randomCode(length = 6): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < length; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

function randomToken(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

export async function createGroupSession(params: {
  createdBy: Profile;
  caseSlug: string;
  decisionCount: number;
  seats: Record<SeatKey, "human" | "ai">;
  displayNames?: Partial<Record<SeatKey, string>>;
  roleplayModel?: string;
  graderModel?: string;
}): Promise<{ session: GroupSession; participants: GroupParticipant[] }> {
  if (params.seats.ceo !== "human") {
    throw new Error("CEO seat must be human");
  }
  const caseConfig = getCase(params.caseSlug);
  const code = randomCode();
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);

  const [session] = await db
    .insert(groupSessions)
    .values({
      code,
      caseSlug: params.caseSlug,
      decisionCount: Math.min(5, Math.max(1, params.decisionCount)),
      currentSceneId: caseConfig.startScene,
      status: "lobby",
      createdBy: params.createdBy.id,
      roleplayModel: params.roleplayModel ?? "gemini-flash",
      graderModel: params.graderModel ?? "gemini-flash",
      clockSeconds: SESSION_TTL_SECONDS,
      expiresAt,
    })
    .returning();

  const participants: GroupParticipant[] = [];
  for (const roleKey of SEAT_ORDER) {
    const kind = params.seats[roleKey] ?? "ai";
    const isAi = roleKey === "ceo" ? false : kind === "ai";
    const presetName = params.displayNames?.[roleKey]?.trim() || null;
    const [row] = await db
      .insert(groupParticipants)
      .values({
        sessionId: session.id,
        roleKey,
        isAi,
        joinToken: isAi ? null : randomToken(),
        displayName: isAi ? null : presetName,
        isReady: isAi,
      })
      .returning();
    participants.push(row);
  }

  return { session, participants };
}

export async function listGroupSessions(profile?: Profile): Promise<GroupSession[]> {
  if (profile) {
    await sweepExpiredSessions(profile.id);
    return db
      .select()
      .from(groupSessions)
      .where(eq(groupSessions.createdBy, profile.id))
      .orderBy(asc(groupSessions.createdAt));
  }
  await sweepExpiredSessions();
  return db.select().from(groupSessions).orderBy(asc(groupSessions.createdAt));
}

export async function getGroupSession(sessionId: string): Promise<GroupSession | null> {
  const [row] = await db
    .select()
    .from(groupSessions)
    .where(eq(groupSessions.id, sessionId))
    .limit(1);
  if (!row) return null;
  return applySessionExpiry(row);
}

async function applySessionExpiry(session: GroupSession): Promise<GroupSession> {
  if (!shouldAutoExpire(session)) return session;
  if (!isSessionExpired(session)) return session;
  if (session.status === "expired") return session;

  const [updated] = await db
    .update(groupSessions)
    .set({ status: "expired", endedAt: session.endedAt ?? new Date() })
    .where(eq(groupSessions.id, session.id))
    .returning();
  return updated ?? { ...session, status: "expired" };
}

export async function sweepExpiredSessions(profileId?: string): Promise<number> {
  const rows = profileId
    ? await db
        .select()
        .from(groupSessions)
        .where(eq(groupSessions.createdBy, profileId))
    : await db.select().from(groupSessions);

  let count = 0;
  for (const row of rows) {
    if (shouldAutoExpire(row) && isSessionExpired(row) && row.status !== "expired") {
      await db
        .update(groupSessions)
        .set({ status: "expired", endedAt: row.endedAt ?? new Date() })
        .where(eq(groupSessions.id, row.id));
      count += 1;
    }
  }
  return count;
}

export async function deleteGroupSession(
  sessionId: string,
  profile?: Profile,
): Promise<void> {
  const session = await getGroupSession(sessionId);
  if (!session) throw new Error("Session not found");
  if (profile && session.createdBy !== profile.id) {
    throw new Error("Not your session");
  }
  await db.delete(groupSessions).where(eq(groupSessions.id, sessionId));
}

export async function deleteExpiredGroupSessions(profile: Profile): Promise<number> {
  await sweepExpiredSessions(profile.id);
  const rows = await db
    .select()
    .from(groupSessions)
    .where(eq(groupSessions.createdBy, profile.id));

  const toDelete = rows.filter(
    (s) => s.status === "expired" || (shouldAutoExpire(s) && isSessionExpired(s)),
  );
  for (const row of toDelete) {
    await db.delete(groupSessions).where(eq(groupSessions.id, row.id));
  }
  return toDelete.length;
}

export function assertSessionPlayable(session: GroupSession) {
  if (session.status === "expired" || isSessionExpired(session)) {
    throw new Error("This session has expired (30-minute limit). Ask the professor for a new link.");
  }
}

export async function getGroupSessionByCode(code: string): Promise<GroupSession | null> {
  const [row] = await db
    .select()
    .from(groupSessions)
    .where(eq(groupSessions.code, code.toUpperCase()))
    .limit(1);
  return row ?? null;
}

export async function listParticipants(sessionId: string): Promise<GroupParticipant[]> {
  return db
    .select()
    .from(groupParticipants)
    .where(eq(groupParticipants.sessionId, sessionId));
}

export async function getParticipantByToken(
  token: string,
): Promise<(GroupParticipant & { session: GroupSession }) | null> {
  const [participant] = await db
    .select()
    .from(groupParticipants)
    .where(eq(groupParticipants.joinToken, token))
    .limit(1);
  if (!participant) return null;
  const session = await getGroupSession(participant.sessionId);
  if (!session) return null;
  return { ...participant, session };
}

export async function joinGroupSeat(params: {
  profile: Profile;
  sessionId: string;
  roleKey: SeatKey;
  displayName: string;
}): Promise<GroupParticipant> {
  const session = await getGroupSession(params.sessionId);
  if (!session) throw new Error("Session not found");
  assertSessionPlayable(session);

  const [participant] = await db
    .select()
    .from(groupParticipants)
    .where(
      and(
        eq(groupParticipants.sessionId, params.sessionId),
        eq(groupParticipants.roleKey, params.roleKey),
      ),
    )
    .limit(1);

  if (!participant || participant.isAi) {
    throw new Error("Seat not available");
  }
  if (participant.profileId && participant.profileId !== params.profile.id) {
    throw new Error("Seat already taken");
  }

  const [updated] = await db
    .update(groupParticipants)
    .set({
      displayName: params.displayName,
      profileId: params.profile.id,
      joinedAt: new Date(),
    })
    .where(eq(groupParticipants.id, participant.id))
    .returning();

  return updated;
}

export async function joinByToken(params: {
  profile: Profile;
  token: string;
  displayName: string;
}): Promise<GroupParticipant> {
  const found = await getParticipantByToken(params.token);
  if (!found) throw new Error("Invalid join token");
  return joinGroupSeat({
    profile: params.profile,
    sessionId: found.sessionId,
    roleKey: found.roleKey as SeatKey,
    displayName: params.displayName,
  });
}

export async function setParticipantReady(
  participantId: string,
  profile: Profile,
  ready: boolean,
): Promise<GroupParticipant> {
  const [participant] = await db
    .select()
    .from(groupParticipants)
    .where(eq(groupParticipants.id, participantId))
    .limit(1);
  if (!participant || participant.profileId !== profile.id) {
    throw new Error("Not your seat");
  }
  const [updated] = await db
    .update(groupParticipants)
    .set({ isReady: ready })
    .where(eq(groupParticipants.id, participantId))
    .returning();
  return updated;
}

export async function startGroupSession(
  sessionId: string,
  opts: { force?: boolean; profile: Profile },
): Promise<GroupSession> {
  const session = await getGroupSession(sessionId);
  if (!session) throw new Error("Session not found");
  assertSessionPlayable(session);
  if (session.status !== "lobby") return session;

  const participants = await listParticipants(sessionId);
  const humans = participants.filter((p) => !p.isAi && p.displayName);

  if (!opts.force) {
    const ceo = humans.find((p) => p.roleKey === "ceo");
    if (!ceo || ceo.profileId !== opts.profile.id) {
      throw new Error("Only the CEO can open the meeting");
    }
    const notReady = humans.filter((p) => !p.isReady);
    if (notReady.length > 0) {
      throw new Error("Not everyone is ready");
    }
  }

  const [updated] = await db
    .update(groupSessions)
    .set({ status: "active", startedAt: new Date() })
    .where(eq(groupSessions.id, sessionId))
    .returning();
  return updated;
}

export async function appendGroupMessage(params: {
  sessionId: string;
  sceneId: string;
  roleKey: string;
  senderKind: "human" | "ai" | "narrator";
  content: string;
}) {
  const [row] = await db
    .insert(groupMessages)
    .values(params)
    .returning();
  return row;
}

export async function getGroupMessages(sessionId: string, afterId = 0) {
  if (afterId > 0) {
    return db
      .select()
      .from(groupMessages)
      .where(and(eq(groupMessages.sessionId, sessionId), gt(groupMessages.id, afterId)))
      .orderBy(asc(groupMessages.id));
  }
  return db
    .select()
    .from(groupMessages)
    .where(eq(groupMessages.sessionId, sessionId))
    .orderBy(asc(groupMessages.id));
}

export async function commitGroupDecision(params: {
  sessionId: string;
  sceneId: string;
  optionKey: string;
  decision: string;
  reasoning: string;
  nextSceneId: string | null;
  profile: Profile;
}) {
  const session = await getGroupSession(params.sessionId);
  if (!session || session.status !== "active") {
    throw new Error("Session not active");
  }
  const participants = await listParticipants(params.sessionId);
  const ceo = participants.find((p) => p.roleKey === "ceo");
  if (!ceo || ceo.profileId !== params.profile.id) {
    throw new Error("Only the CEO can commit");
  }

  const msgs = await getGroupMessages(params.sessionId);
  const humanCount = msgs.filter(
    (m) => m.sceneId === params.sceneId && m.senderKind === "human",
  ).length;
  if (humanCount < 6) {
    throw new Error("Need at least 6 human messages before committing");
  }
  if (params.reasoning.trim().length < 20) {
    throw new Error("Reasoning must be at least 20 characters");
  }

  const [decision] = await db
    .insert(groupDecisions)
    .values({
      sessionId: params.sessionId,
      sceneId: params.sceneId,
      optionKey: params.optionKey,
      decision: params.decision,
      reasoning: params.reasoning,
    })
    .returning();

  const decisionsMade = session.decisionsMade + 1;
  const terminal =
    params.nextSceneId === null || decisionsMade >= session.decisionCount;

  await db
    .update(groupSessions)
    .set({
      decisionsMade,
      currentSceneId: terminal ? null : params.nextSceneId,
      status: terminal ? "committed" : "active",
      endedAt: terminal ? new Date() : null,
    })
    .where(eq(groupSessions.id, params.sessionId));

  return decision;
}

export async function listGroupDecisions(sessionId: string) {
  return db
    .select()
    .from(groupDecisions)
    .where(eq(groupDecisions.sessionId, sessionId))
    .orderBy(asc(groupDecisions.id));
}

export async function upsertGroupAssessment(
  sessionId: string,
  input: {
    graderModel?: string;
    rawOutput?: string;
    assessment?: unknown;
    status?: string;
    professorNotes?: string;
  },
) {
  const [existing] = await db
    .select()
    .from(groupAssessments)
    .where(eq(groupAssessments.sessionId, sessionId))
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(groupAssessments)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(eq(groupAssessments.sessionId, sessionId))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(groupAssessments)
    .values({
      sessionId,
      graderModel: input.graderModel ?? null,
      rawOutput: input.rawOutput ?? null,
      assessment: input.assessment ?? null,
      status: input.status ?? "ai_draft",
      professorNotes: input.professorNotes ?? null,
    })
    .returning();
  return created;
}

export async function getGroupAssessment(sessionId: string) {
  const [row] = await db
    .select()
    .from(groupAssessments)
    .where(eq(groupAssessments.sessionId, sessionId))
    .limit(1);
  return row ?? null;
}

export async function enqueueAiReply(sessionId: string, roleKey: string, triggerMessageId?: number) {
  const [row] = await db
    .insert(aiQueue)
    .values({
      sessionId,
      roleKey,
      triggerMessageId: triggerMessageId ?? null,
      status: "pending",
    })
    .returning();
  return row;
}

export async function claimPendingAi(sessionId: string, limit = 4) {
  const pending = await db
    .select()
    .from(aiQueue)
    .where(and(eq(aiQueue.sessionId, sessionId), eq(aiQueue.status, "pending")))
    .orderBy(asc(aiQueue.id))
    .limit(limit);

  const claimed = [];
  for (const job of pending) {
    const [updated] = await db
      .update(aiQueue)
      .set({ status: "claimed", claimedAt: new Date() })
      .where(and(eq(aiQueue.id, job.id), eq(aiQueue.status, "pending")))
      .returning();
    if (updated) claimed.push(updated);
  }
  return claimed;
}

export async function finishAiJob(id: number, status: "done" | "failed") {
  await db.update(aiQueue).set({ status }).where(eq(aiQueue.id, id));
}

export async function listThinkingRoleKeys(sessionId: string): Promise<string[]> {
  const rows = await db
    .select()
    .from(aiQueue)
    .where(
      and(
        eq(aiQueue.sessionId, sessionId),
        eq(aiQueue.status, "pending"),
      ),
    );
  const claimed = await db
    .select()
    .from(aiQueue)
    .where(
      and(
        eq(aiQueue.sessionId, sessionId),
        eq(aiQueue.status, "claimed"),
      ),
    );
  return [...rows, ...claimed].map((r) => r.roleKey);
}

export async function markSessionGraded(sessionId: string) {
  await db
    .update(groupSessions)
    .set({ status: "graded" })
    .where(eq(groupSessions.id, sessionId));
}

export async function getGroupSessionState(
  sessionId: string,
  afterId = 0,
): Promise<{
  session: GroupSession;
  messages: Awaited<ReturnType<typeof getGroupMessages>>;
  participants: GroupParticipant[];
  thinkingRoleKeys: string[];
  cursor: number;
} | null> {
  const session = await getGroupSession(sessionId);
  if (!session) return null;
  const messages = await getGroupMessages(sessionId, afterId);
  const participants = await listParticipants(sessionId);
  const thinkingRoleKeys = await listThinkingRoleKeys(sessionId);
  let cursor = afterId;
  if (messages.length > 0) {
    cursor = messages[messages.length - 1]!.id;
  } else if (afterId === 0) {
    const all = await getGroupMessages(sessionId, 0);
    cursor = all.length > 0 ? all[all.length - 1]!.id : 0;
  }
  return {
    session,
    messages,
    participants,
    thinkingRoleKeys,
    cursor,
  };
}
