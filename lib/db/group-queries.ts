import { and, asc, desc, eq, gt, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  aiTurns,
  groupAssessments,
  groupBatches,
  groupDecisions,
  groupMessages,
  groupParticipants,
  groupSessions,
  type GroupBatch,
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
  /** Pre-assigned roster identity (before student joins). */
  assignments?: Partial<
    Record<SeatKey, { name: string; email: string }>
  >;
  roleplayModel?: string;
  graderModel?: string;
  batchId?: string | null;
}): Promise<{
  session: GroupSession;
  participants: GroupParticipant[];
  tokens: Record<string, string>;
}> {
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
      batchId: params.batchId ?? null,
    })
    .returning();

  const participants: GroupParticipant[] = [];
  for (const roleKey of SEAT_ORDER) {
    const kind = params.seats[roleKey] ?? "ai";
    const isAi = roleKey === "ceo" ? false : kind === "ai";
    const assignment = params.assignments?.[roleKey];
    const presetName =
      assignment?.name?.trim() ||
      params.displayNames?.[roleKey]?.trim() ||
      null;
    const [row] = await db
      .insert(groupParticipants)
      .values({
        sessionId: session.id,
        roleKey,
        isAi,
        joinToken: isAi ? null : randomToken(),
        displayName: isAi ? null : presetName,
        assignedName: isAi ? null : assignment?.name?.trim() || presetName,
        assignedEmail: isAi
          ? null
          : assignment?.email?.trim().toLowerCase() || null,
        isReady: isAi,
      })
      .returning();
    participants.push(row);
  }

  const tokens: Record<string, string> = {};
  for (const p of participants) {
    if (p.joinToken) tokens[p.roleKey] = p.joinToken;
  }

  return { session, participants, tokens };
}

export type BatchRosterResultRow = {
  participantId: string;
  name: string;
  email: string;
  groupCode: string;
  sessionId: string;
  caseSlug: string;
  roleKey: string;
  joinToken: string;
  inviteStatus: string;
  invitedAt: string | null;
};

function toRosterRow(
  p: GroupParticipant,
  session: GroupSession,
): BatchRosterResultRow | null {
  if (p.isAi || !p.joinToken) return null;
  return {
    participantId: p.id,
    name: p.assignedName ?? p.displayName ?? p.roleKey,
    email: p.assignedEmail ?? "",
    groupCode: session.code,
    sessionId: session.id,
    caseSlug: session.caseSlug,
    roleKey: p.roleKey,
    joinToken: p.joinToken,
    inviteStatus: p.inviteStatus ?? "pending",
    invitedAt: p.invitedAt ? p.invitedAt.toISOString() : null,
  };
}

export async function createGroupBatch(params: {
  createdBy: Profile;
  name: string;
  caseSlug: string;
  decisionCount: number;
  roleplayModel?: string;
  graderModel?: string;
  groups: {
    seats: Record<SeatKey, "human" | "ai">;
    assignments: Partial<Record<SeatKey, { name: string; email: string }>>;
  }[];
}): Promise<{
  batch: GroupBatch;
  sessions: GroupSession[];
  roster: BatchRosterResultRow[];
}> {
  const [batch] = await db
    .insert(groupBatches)
    .values({
      name: params.name,
      caseSlug: params.caseSlug,
      decisionCount: params.decisionCount,
      roleplayModel: params.roleplayModel ?? "gemini-flash",
      graderModel: params.graderModel ?? "gemini-flash",
      createdBy: params.createdBy.id,
    })
    .returning();

  const sessions: GroupSession[] = [];
  const roster: BatchRosterResultRow[] = [];

  for (const group of params.groups) {
    if (group.seats.ceo !== "human" || !group.assignments.ceo) {
      throw new Error("Every group must have a human CEO with a roster assignment");
    }
    const { session, participants } = await createGroupSession({
      createdBy: params.createdBy,
      caseSlug: params.caseSlug,
      decisionCount: params.decisionCount,
      seats: group.seats,
      assignments: group.assignments,
      roleplayModel: params.roleplayModel,
      graderModel: params.graderModel,
      batchId: batch.id,
    });
    sessions.push(session);
    for (const p of participants) {
      const row = toRosterRow(p, session);
      if (row) roster.push(row);
    }
  }

  return { batch, sessions, roster };
}

export async function getGroupBatch(batchId: string): Promise<GroupBatch | null> {
  const [row] = await db
    .select()
    .from(groupBatches)
    .where(eq(groupBatches.id, batchId))
    .limit(1);
  return row ?? null;
}

export async function listBatchRoster(
  batchId: string,
): Promise<BatchRosterResultRow[]> {
  const sessions = await db
    .select()
    .from(groupSessions)
    .where(eq(groupSessions.batchId, batchId));
  const roster: BatchRosterResultRow[] = [];
  for (const session of sessions) {
    const parts = await listParticipants(session.id);
    for (const p of parts) {
      const row = toRosterRow(p, session);
      if (row) roster.push(row);
    }
  }
  return roster;
}

export async function setParticipantInviteStatus(
  participantId: string,
  status: "pending" | "sent" | "failed",
): Promise<void> {
  await db
    .update(groupParticipants)
    .set({
      inviteStatus: status,
      invitedAt: status === "pending" ? null : new Date(),
    })
    .where(eq(groupParticipants.id, participantId));
}

export async function getParticipantInviteTarget(participantId: string) {
  const [p] = await db
    .select()
    .from(groupParticipants)
    .where(eq(groupParticipants.id, participantId))
    .limit(1);
  if (!p || p.isAi || !p.joinToken || !p.assignedEmail) return null;
  const session = await getGroupSession(p.sessionId);
  if (!session) return null;
  return { participant: p, session };
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

export async function appendGroupMessage(
  sessionId: string,
  sceneId: string,
  roleKey: string,
  senderKind: "human" | "ai" | "narrator",
  content: string,
) {
  const [row] = await db
    .insert(groupMessages)
    .values({ sessionId, sceneId, roleKey, senderKind, content })
    .returning();
  return row;
}

/** @param sceneIdOrAfterId Scene id filter, or numeric message cursor for incremental fetch. */
export async function getGroupMessages(
  sessionId: string,
  sceneIdOrAfterId?: string | number,
) {
  if (typeof sceneIdOrAfterId === "string") {
    return db
      .select()
      .from(groupMessages)
      .where(
        and(
          eq(groupMessages.sessionId, sessionId),
          eq(groupMessages.sceneId, sceneIdOrAfterId),
        ),
      )
      .orderBy(asc(groupMessages.id));
  }

  const afterId = sceneIdOrAfterId ?? 0;
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

/**
 * Idempotent AI turn claim — returns false if this seat already queued for the message.
 */
export async function claimAiTurn(
  sessionId: string,
  triggerMessageId: number,
  roleKey: string,
): Promise<boolean> {
  try {
    await db.insert(aiTurns).values({
      sessionId,
      triggerMessageId,
      roleKey,
      status: "pending",
    });
    return true;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/unique|duplicate key/i.test(msg)) return false;
    throw err;
  }
}

export async function claimPendingAi(sessionId: string, limit = 4) {
  const pending = await db
    .select()
    .from(aiTurns)
    .where(and(eq(aiTurns.sessionId, sessionId), eq(aiTurns.status, "pending")))
    .orderBy(asc(aiTurns.id))
    .limit(limit);

  const claimed = [];
  for (const job of pending) {
    const [updated] = await db
      .update(aiTurns)
      .set({ status: "claimed" })
      .where(and(eq(aiTurns.id, job.id), eq(aiTurns.status, "pending")))
      .returning();
    if (updated) claimed.push(updated);
  }
  return claimed;
}

export async function finishAiJob(id: number, status: "done" | "failed") {
  await db.update(aiTurns).set({ status }).where(eq(aiTurns.id, id));
}

export async function listThinkingRoleKeys(sessionId: string): Promise<string[]> {
  const rows = await db
    .select()
    .from(aiTurns)
    .where(
      and(eq(aiTurns.sessionId, sessionId), eq(aiTurns.status, "pending")),
    );
  const claimed = await db
    .select()
    .from(aiTurns)
    .where(
      and(eq(aiTurns.sessionId, sessionId), eq(aiTurns.status, "claimed")),
    );
  return [...rows, ...claimed].map((r) => r.roleKey);
}

export async function advanceGroupScene(
  sessionId: string,
  sceneId: string,
): Promise<GroupSession> {
  const [updated] = await db
    .update(groupSessions)
    .set({ currentSceneId: sceneId })
    .where(eq(groupSessions.id, sessionId))
    .returning();
  if (!updated) throw new Error("Session not found");
  return updated;
}

export async function endSession(sessionId: string): Promise<GroupSession> {
  const [updated] = await db
    .update(groupSessions)
    .set({ status: "committed", endedAt: new Date() })
    .where(eq(groupSessions.id, sessionId))
    .returning();
  if (!updated) throw new Error("Session not found");
  return updated;
}

/** Spec aliases — keep existing names for in-app call sites. */
export const getSession = getGroupSession;
export const getSessionByCode = getGroupSessionByCode;
export const startSession = startGroupSession;

export async function joinParticipant(
  token: string,
  displayName: string,
  profile: Profile,
) {
  return joinByToken({ profile, token, displayName });
}

export async function setReady(
  participantId: string,
  ready: boolean,
  profile: Profile,
) {
  return setParticipantReady(participantId, profile, ready);
}

/** @deprecated Use claimAiTurn */
export async function enqueueAiReply(
  sessionId: string,
  roleKey: string,
  triggerMessageId?: number,
) {
  if (triggerMessageId == null) return null;
  const ok = await claimAiTurn(sessionId, triggerMessageId, roleKey);
  return ok ? { sessionId, roleKey, triggerMessageId } : null;
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

/** Minutes with no new message while status=active → stalled on the batch board. */
export const BATCH_STALL_MINUTES = 5;

export type BatchBoardMember = {
  roleKey: string;
  name: string;
  joined: boolean;
  isAi: boolean;
};

export type BatchBoardRow = {
  sessionId: string;
  code: string;
  status: string;
  decisionsMade: number;
  decisionCount: number;
  currentSceneId: string | null;
  currentSceneTitle: string | null;
  messageCount: number;
  lastMessageAt: string | null;
  stalled: boolean;
  humanSeats: number;
  joinedSeats: number;
  members: BatchBoardMember[];
  assessmentStatus: string | null;
};

export async function listSessionsForBatch(
  batchId: string,
): Promise<GroupSession[]> {
  return db
    .select()
    .from(groupSessions)
    .where(eq(groupSessions.batchId, batchId))
    .orderBy(asc(groupSessions.createdAt));
}

export async function listBatchesForProfessor(
  profileId: string,
): Promise<GroupBatch[]> {
  return db
    .select()
    .from(groupBatches)
    .where(eq(groupBatches.createdBy, profileId))
    .orderBy(desc(groupBatches.createdAt));
}

export async function getBatchBoardSnapshot(
  batchId: string,
  stallMinutes = BATCH_STALL_MINUTES,
): Promise<BatchBoardRow[]> {
  const sessions = await listSessionsForBatch(batchId);
  if (sessions.length === 0) return [];

  const sessionIds = sessions.map((s) => s.id);
  const caseSlug = sessions[0]!.caseSlug;
  const caseConfig = getCase(caseSlug);

  const allParts = await db
    .select()
    .from(groupParticipants)
    .where(inArray(groupParticipants.sessionId, sessionIds));

  const msgStats = await db
    .select({
      sessionId: groupMessages.sessionId,
      messageCount: sql<number>`count(*)::int`,
      lastMessageAt: sql<Date | null>`max(${groupMessages.createdAt})`,
    })
    .from(groupMessages)
    .where(inArray(groupMessages.sessionId, sessionIds))
    .groupBy(groupMessages.sessionId);

  const assessments = await db
    .select({
      sessionId: groupAssessments.sessionId,
      status: groupAssessments.status,
    })
    .from(groupAssessments)
    .where(inArray(groupAssessments.sessionId, sessionIds));

  const msgBySession = new Map(
    msgStats.map((m) => [m.sessionId, m] as const),
  );
  const assessBySession = new Map(
    assessments.map((a) => [a.sessionId, a.status] as const),
  );
  const partsBySession = new Map<string, GroupParticipant[]>();
  for (const p of allParts) {
    const list = partsBySession.get(p.sessionId) ?? [];
    list.push(p);
    partsBySession.set(p.sessionId, list);
  }

  const stallMs = stallMinutes * 60_000;
  const now = Date.now();

  return sessions.map((session) => {
    const parts = partsBySession.get(session.id) ?? [];
    const humans = parts.filter((p) => !p.isAi);
    const joined = humans.filter(
      (p) => Boolean(p.profileId) || Boolean(p.displayName),
    );
    const stats = msgBySession.get(session.id);
    const lastAt = stats?.lastMessageAt
      ? new Date(stats.lastMessageAt)
      : null;
    const stalled =
      session.status === "active" &&
      (!lastAt || now - lastAt.getTime() > stallMs);

    const sceneId = session.currentSceneId;
    const sceneTitle = sceneId
      ? caseConfig.scenes[sceneId]?.title ?? sceneId
      : null;

    const members: BatchBoardMember[] = parts
      .slice()
      .sort(
        (a, b) =>
          SEAT_ORDER.indexOf(a.roleKey as SeatKey) -
          SEAT_ORDER.indexOf(b.roleKey as SeatKey),
      )
      .map((p) => ({
        roleKey: p.roleKey,
        name:
          p.assignedName ??
          p.displayName ??
          (p.isAi
            ? (getCase(caseSlug).cast.find((c) => c.id === p.roleKey)?.name ??
              p.roleKey)
            : p.roleKey),
        joined: p.isAi
          ? true
          : Boolean(p.profileId) || Boolean(p.displayName),
        isAi: p.isAi,
      }));

    return {
      sessionId: session.id,
      code: session.code,
      status: session.status,
      decisionsMade: session.decisionsMade,
      decisionCount: session.decisionCount,
      currentSceneId: sceneId,
      currentSceneTitle: sceneTitle,
      messageCount: Number(stats?.messageCount ?? 0),
      lastMessageAt: lastAt?.toISOString() ?? null,
      stalled,
      humanSeats: humans.length,
      joinedSeats: joined.length,
      members,
      assessmentStatus: assessBySession.get(session.id) ?? null,
    };
  });
}

export type CohortDecisionBucket = {
  label: string;
  count: number;
};

export type CohortSceneDivergence = {
  sceneId: string;
  sceneTitle: string;
  uniqueChoices: number;
  totalGroups: number;
  topChoice: string | null;
};

export type CohortScoreAvg = {
  key: string;
  label: string;
  average: number;
  n: number;
};

export type BatchCohortRollup = {
  groupCount: number;
  gradedCount: number;
  finalDecisionDistribution: CohortDecisionBucket[];
  sceneDivergence: CohortSceneDivergence[];
  averageScores: CohortScoreAvg[];
};

export async function getBatchCohortRollup(
  batchId: string,
): Promise<BatchCohortRollup> {
  const sessions = await listSessionsForBatch(batchId);
  if (sessions.length === 0) {
    return {
      groupCount: 0,
      gradedCount: 0,
      finalDecisionDistribution: [],
      sceneDivergence: [],
      averageScores: [],
    };
  }

  const sessionIds = sessions.map((s) => s.id);
  const caseConfig = getCase(sessions[0]!.caseSlug);

  const decisions = await db
    .select()
    .from(groupDecisions)
    .where(inArray(groupDecisions.sessionId, sessionIds))
    .orderBy(asc(groupDecisions.id));

  const assessments = await db
    .select()
    .from(groupAssessments)
    .where(inArray(groupAssessments.sessionId, sessionIds));

  const bySession = new Map<string, typeof decisions>();
  for (const d of decisions) {
    const list = bySession.get(d.sessionId) ?? [];
    list.push(d);
    bySession.set(d.sessionId, list);
  }

  const finished = sessions.filter((s) =>
    ["committed", "graded", "released"].includes(s.status),
  );

  const finalCounts = new Map<string, number>();
  for (const s of finished) {
    const list = bySession.get(s.id) ?? [];
    const last = list[list.length - 1];
    if (!last) continue;
    const label = last.decision.trim() || last.optionKey || "Unknown";
    finalCounts.set(label, (finalCounts.get(label) ?? 0) + 1);
  }

  const finalDecisionDistribution = [...finalCounts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);

  const sceneMap = new Map<
    string,
    { choices: Map<string, number>; groups: Set<string> }
  >();
  for (const d of decisions) {
    const entry = sceneMap.get(d.sceneId) ?? {
      choices: new Map(),
      groups: new Set(),
    };
    const key = d.optionKey || d.decision.trim() || "unknown";
    entry.choices.set(key, (entry.choices.get(key) ?? 0) + 1);
    entry.groups.add(d.sessionId);
    sceneMap.set(d.sceneId, entry);
  }

  const sceneDivergence: CohortSceneDivergence[] = [...sceneMap.entries()]
    .map(([sceneId, data]) => {
      let topChoice: string | null = null;
      let topN = 0;
      for (const [choice, n] of data.choices) {
        if (n > topN) {
          topN = n;
          topChoice = choice;
        }
      }
      return {
        sceneId,
        sceneTitle: caseConfig.scenes[sceneId]?.title ?? sceneId,
        uniqueChoices: data.choices.size,
        totalGroups: data.groups.size,
        topChoice,
      };
    })
    .sort((a, b) => b.uniqueChoices - a.uniqueChoices);

  const scoreAcc = new Map<string, { label: string; sum: number; n: number }>();
  for (const row of assessments) {
    const a = row.assessment as {
      readiness_scores?: { key: string; label: string; score: number }[];
    } | null;
    if (!a?.readiness_scores?.length) continue;
    for (const s of a.readiness_scores) {
      if (typeof s.score !== "number") continue;
      const cur = scoreAcc.get(s.key) ?? {
        label: s.label || s.key,
        sum: 0,
        n: 0,
      };
      cur.sum += s.score;
      cur.n += 1;
      if (s.label) cur.label = s.label;
      scoreAcc.set(s.key, cur);
    }
  }

  const averageScores: CohortScoreAvg[] = [...scoreAcc.entries()]
    .map(([key, v]) => ({
      key,
      label: v.label,
      average: Math.round((v.sum / v.n) * 10) / 10,
      n: v.n,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return {
    groupCount: sessions.length,
    gradedCount: assessments.filter((a) => a.assessment).length,
    finalDecisionDistribution,
    sceneDivergence,
    averageScores,
  };
}

export type CohortInsightsPayload = {
  insights: string[];
  generatedAt: string;
  model: string;
};

export async function saveBatchCohortInsights(
  batchId: string,
  insights: string[],
  model: string,
): Promise<CohortInsightsPayload> {
  const payload: CohortInsightsPayload = {
    insights,
    generatedAt: new Date().toISOString(),
    model,
  };
  await db
    .update(groupBatches)
    .set({
      cohortInsights: payload,
      cohortInsightsAt: new Date(),
      cohortInsightsModel: model,
    })
    .where(eq(groupBatches.id, batchId));
  return payload;
}

export function readCachedCohortInsights(
  batch: GroupBatch,
): CohortInsightsPayload | null {
  if (!batch.cohortInsights) return null;
  const raw = batch.cohortInsights as Partial<CohortInsightsPayload>;
  if (!Array.isArray(raw.insights) || raw.insights.length === 0) return null;
  return {
    insights: raw.insights.map(String),
    generatedAt:
      raw.generatedAt ??
      batch.cohortInsightsAt?.toISOString() ??
      new Date().toISOString(),
    model: raw.model ?? batch.cohortInsightsModel ?? "unknown",
  };
}

