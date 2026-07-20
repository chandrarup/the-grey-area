/**
 * Ownership is enforced here. When RLS is added these checks stay — defence in
 * depth, not duplication.
 */
import { and, asc, eq, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  assessments,
  cases,
  decisions,
  messages,
  profiles,
  runs,
  type Assessment,
  type CaseRow,
  type Decision,
  type Message,
  type Profile,
  type Run,
  type RunStageData,
} from "@/lib/db/schema";
import { isAdmin, isStaff } from "@/lib/db/access";
import type { CaseConfig } from "@/lib/case/types";

async function getOwnedRun(
  profile: Profile,
  runId: string,
): Promise<Run | null> {
  const [run] = await db
    .select()
    .from(runs)
    .where(eq(runs.id, runId))
    .limit(1);

  if (!run) return null;
  if (run.userId === profile.id || isStaff(profile)) return run;
  return null;
}

async function requireOwnedRun(profile: Profile, runId: string): Promise<Run> {
  const run = await getOwnedRun(profile, runId);
  if (!run) {
    throw new Error("Run not found or access denied");
  }
  return run;
}

export async function getPublishedCase(
  slug: string,
): Promise<(CaseRow & { config: CaseConfig }) | null> {
  const [row] = await db
    .select()
    .from(cases)
    .where(and(eq(cases.slug, slug), eq(cases.status, "published")))
    .limit(1);

  if (!row) return null;
  return row as CaseRow & { config: CaseConfig };
}

export async function getOrCreateRun(
  profile: Profile,
  caseId: string,
): Promise<Run> {
  const [existing] = await db
    .select()
    .from(runs)
    .where(and(eq(runs.caseId, caseId), eq(runs.userId, profile.id)))
    .limit(1);

  if (existing) return existing;

  const [caseRow] = await db
    .select()
    .from(cases)
    .where(eq(cases.id, caseId))
    .limit(1);

  if (!caseRow) {
    throw new Error(`Case not found: ${caseId}`);
  }

  const config = caseRow.config as CaseConfig | null;
  const startScene = config?.startScene ?? null;

  try {
    const [created] = await db
      .insert(runs)
      .values({
        caseId,
        userId: profile.id,
        mode: "solo",
        status: "in_progress",
        currentSceneId: startScene,
        depth: 1,
        integrity: "clean",
      })
      .returning();

    return created;
  } catch (error) {
    // Race: another request won the UNIQUE(case_id, user_id) insert.
    const [again] = await db
      .select()
      .from(runs)
      .where(and(eq(runs.caseId, caseId), eq(runs.userId, profile.id)))
      .limit(1);
    if (again) return again;
    throw error;
  }
}

export async function getRun(
  profile: Profile,
  runId: string,
): Promise<Run | null> {
  return getOwnedRun(profile, runId);
}

export async function appendMessage(
  profile: Profile,
  runId: string,
  input: {
    sceneId: string;
    sender: "student" | "character" | "narrator";
    content: string;
    castId?: string | null;
  },
): Promise<Message> {
  await requireOwnedRun(profile, runId);

  const [row] = await db
    .insert(messages)
    .values({
      runId,
      sceneId: input.sceneId,
      castId: input.castId ?? null,
      sender: input.sender,
      content: input.content,
    })
    .returning();

  return row;
}

export async function getMessages(
  profile: Profile,
  runId: string,
  afterId?: number,
): Promise<Message[]> {
  await requireOwnedRun(profile, runId);

  if (afterId !== undefined) {
    return db
      .select()
      .from(messages)
      .where(and(eq(messages.runId, runId), gt(messages.id, afterId)))
      .orderBy(asc(messages.id));
  }

  return db
    .select()
    .from(messages)
    .where(eq(messages.runId, runId))
    .orderBy(asc(messages.id));
}

export async function commitDecision(
  profile: Profile,
  runId: string,
  input: {
    sceneId: string;
    optionKey: string;
    choice: string;
    reasoning: string;
    nextSceneId: string | null;
    nextDepth: number;
    isCompromise: boolean;
  },
): Promise<Decision> {
  const run = await requireOwnedRun(profile, runId);

  const [existing] = await db
    .select()
    .from(decisions)
    .where(and(eq(decisions.runId, runId), eq(decisions.sceneId, input.sceneId)))
    .limit(1);

  if (existing) {
    throw new Error(
      `Decision already committed for scene "${input.sceneId}" on this run`,
    );
  }

  const [decision] = await db
    .insert(decisions)
    .values({
      runId,
      sceneId: input.sceneId,
      optionKey: input.optionKey,
      choice: input.choice,
      reasoning: input.reasoning,
    })
    .returning();

  const nextIntegrity =
    input.isCompromise || run.integrity === "compromised"
      ? "compromised"
      : "clean";

  await db
    .update(runs)
    .set({
      currentSceneId: input.nextSceneId,
      depth: input.nextDepth,
      integrity: nextIntegrity,
      ...(input.nextSceneId === null
        ? { status: "submitted", submittedAt: new Date() }
        : {}),
    })
    .where(eq(runs.id, runId));

  return decision;
}

export async function getDecisions(
  profile: Profile,
  runId: string,
): Promise<Decision[]> {
  await requireOwnedRun(profile, runId);

  return db
    .select()
    .from(decisions)
    .where(eq(decisions.runId, runId))
    .orderBy(asc(decisions.id));
}

/** Wipe messages/decisions/assessment and restart the run at scene 1. */
export async function resetRun(
  profile: Profile,
  runId: string,
  startSceneId: string,
): Promise<Run> {
  const run = await requireOwnedRun(profile, runId);

  await db.delete(assessments).where(eq(assessments.runId, runId));
  await db.delete(messages).where(eq(messages.runId, runId));
  await db.delete(decisions).where(eq(decisions.runId, runId));

  const [updated] = await db
    .update(runs)
    .set({
      status: "in_progress",
      currentSceneId: startSceneId,
      depth: 1,
      integrity: "clean",
      stageData: {},
      submittedAt: null,
    })
    .where(eq(runs.id, run.id))
    .returning();

  return updated;
}

/** Staff/server only. Call from grader jobs or routes gated by requireStaff(). */
export async function upsertAssessment(
  runId: string,
  input: {
    graderModel?: string | null;
    rawOutput?: string | null;
    assessment?: unknown;
    overrides?: unknown;
    professorNotes?: string | null;
    status?: string;
    reviewedBy?: string | null;
  },
): Promise<Assessment> {
  const [existing] = await db
    .select()
    .from(assessments)
    .where(eq(assessments.runId, runId))
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(assessments)
      .set({
        graderModel: input.graderModel ?? existing.graderModel,
        rawOutput: input.rawOutput ?? existing.rawOutput,
        assessment:
          input.assessment !== undefined
            ? input.assessment
            : existing.assessment,
        overrides:
          input.overrides !== undefined ? input.overrides : existing.overrides,
        professorNotes:
          input.professorNotes !== undefined
            ? input.professorNotes
            : existing.professorNotes,
        status: input.status ?? existing.status,
        reviewedBy:
          input.reviewedBy !== undefined
            ? input.reviewedBy
            : existing.reviewedBy,
        updatedAt: new Date(),
      })
      .where(eq(assessments.runId, runId))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(assessments)
    .values({
      runId,
      graderModel: input.graderModel ?? null,
      rawOutput: input.rawOutput ?? null,
      assessment: input.assessment ?? null,
      overrides: input.overrides ?? null,
      professorNotes: input.professorNotes ?? null,
      status: input.status ?? "ai_draft",
      reviewedBy: input.reviewedBy ?? null,
    })
    .returning();

  return created;
}

export async function getAssessmentForStudent(
  profile: Profile,
  runId: string,
): Promise<Assessment | null> {
  const run = await getOwnedRun(profile, runId);
  if (!run) return null;

  const [row] = await db
    .select()
    .from(assessments)
    .where(eq(assessments.runId, runId))
    .limit(1);

  if (!row) return null;
  if (row.status !== "released" && !isStaff(profile)) return null;
  return row;
}

export async function listRuns(profile: Profile): Promise<Run[]> {
  if (!isStaff(profile)) {
    throw new Error("Staff access required to list runs");
  }
  return db.select().from(runs).orderBy(asc(runs.startedAt));
}

export async function listRunsWithProfiles(profile: Profile) {
  if (!isStaff(profile)) {
    throw new Error("Staff access required");
  }
  return db
    .select({
      run: runs,
      studentName: profiles.name,
      studentEmail: profiles.email,
    })
    .from(runs)
    .innerJoin(profiles, eq(runs.userId, profiles.id))
    .orderBy(asc(runs.startedAt));
}

export async function updateRunStageData(
  profile: Profile,
  runId: string,
  patch: Partial<RunStageData>,
): Promise<Run> {
  const run = await requireOwnedRun(profile, runId);
  const current = (run.stageData ?? {}) as RunStageData;
  const next = { ...current, ...patch };
  const [updated] = await db
    .update(runs)
    .set({ stageData: next })
    .where(eq(runs.id, runId))
    .returning();
  return updated;
}

export async function getAssessmentRaw(
  profile: Profile,
  runId: string,
): Promise<Assessment | null> {
  await requireOwnedRun(profile, runId);
  if (!isStaff(profile)) {
    throw new Error("Staff access required");
  }
  const [row] = await db
    .select()
    .from(assessments)
    .where(eq(assessments.runId, runId))
    .limit(1);
  return row ?? null;
}

export async function releaseAssessment(
  profile: Profile,
  runId: string,
  notes?: string,
): Promise<Assessment> {
  if (!isStaff(profile)) {
    throw new Error("Staff access required");
  }
  await requireOwnedRun(profile, runId);
  return upsertAssessment(runId, {
    status: "released",
    professorNotes: notes,
    reviewedBy: profile.id,
  });
}

export async function listAllProfiles(profile: Profile) {
  if (!isStaff(profile)) {
    throw new Error("Staff access required");
  }
  return db.select().from(profiles).orderBy(asc(profiles.createdAt));
}

export async function updateProfileRole(
  actor: Profile,
  targetId: string,
  role: "student" | "professor" | "admin",
) {
  if (!isAdmin(actor)) {
    throw new Error("Admin access required");
  }
  const [updated] = await db
    .update(profiles)
    .set({ role })
    .where(eq(profiles.id, targetId))
    .returning();
  return updated;
}

export async function updateCaseStatus(
  actor: Profile,
  caseId: string,
  status: "draft" | "published" | "archived",
) {
  if (!isAdmin(actor)) {
    throw new Error("Admin access required");
  }
  const [updated] = await db
    .update(cases)
    .set({ status })
    .where(eq(cases.id, caseId))
    .returning();
  return updated;
}

export async function listAllCases(actor: Profile) {
  if (!isAdmin(actor) && !isStaff(actor)) {
    throw new Error("Staff access required");
  }
  return db.select().from(cases).orderBy(asc(cases.createdAt));
}
