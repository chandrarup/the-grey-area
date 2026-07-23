import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Supabase-shaped schema. uuid user columns and role exist now so RLS policies
 * can attach later without a rewrite. profiles.id will become a FK to auth.users.
 */

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email"),
  name: text("name"),
  role: text("role").notNull().default("student"), // 'student' | 'professor' | 'admin'
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const cases = pgTable("cases", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  config: jsonb("config"),
  status: text("status").default("draft"), // draft | published | archived
  version: integer("version").default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export type RunStageData = {
  valuesAnswer?: string;
  reflections?: string[];
  propsAcknowledged?: boolean;
  /** Furthest stage unlocked (index into STAGES). 0 = leadership only. */
  stageIndex?: number;
};

export const runs = pgTable(
  "runs",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    caseId: uuid("case_id")
      .notNull()
      .references(() => cases.id),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id),
    mode: text("mode").default("solo"), // 'solo' | 'group'
    status: text("status").default("in_progress"), // in_progress|submitted|graded|released
    currentSceneId: text("current_scene_id"),
    depth: integer("depth").default(1),
    integrity: text("integrity").default("clean"), // 'clean' | 'compromised' (monotonic)
    /** Values pre-reflection + end-of-run reflections, etc. */
    stageData: jsonb("stage_data").$type<RunStageData>().default({}),
    startedAt: timestamp("started_at", { withTimezone: true }).defaultNow(),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
  },
  (table) => [unique("runs_case_user_unique").on(table.caseId, table.userId)],
);

export const messages = pgTable(
  "messages",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    runId: uuid("run_id")
      .notNull()
      .references(() => runs.id),
    sceneId: text("scene_id").notNull(),
    castId: text("cast_id"),
    sender: text("sender").notNull(), // 'student' | 'character' | 'narrator'
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [index("messages_run_id_id_idx").on(table.runId, table.id)],
);

export const decisions = pgTable(
  "decisions",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    runId: uuid("run_id")
      .notNull()
      .references(() => runs.id),
    sceneId: text("scene_id").notNull(),
    optionKey: text("option_key").notNull(),
    choice: text("choice").notNull(),
    reasoning: text("reasoning"),
    committedAt: timestamp("committed_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [unique("decisions_run_scene_unique").on(table.runId, table.sceneId)],
);

export const assessments = pgTable("assessments", {
  runId: uuid("run_id")
    .primaryKey()
    .references(() => runs.id),
  graderModel: text("grader_model"),
  rawOutput: text("raw_output"),
  assessment: jsonb("assessment"),
  overrides: jsonb("overrides"),
  professorNotes: text("professor_notes"),
  status: text("status").default("ai_draft"), // ai_draft|reviewed|released
  reviewedBy: uuid("reviewed_by").references(() => profiles.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

/** Group mode — professor-created multiplayer sessions */
export const groupBatches = pgTable("group_batches", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  caseSlug: text("case_slug").notNull(),
  decisionCount: integer("decision_count").notNull().default(5),
  roleplayModel: text("roleplay_model").notNull().default("gemini-flash"),
  graderModel: text("grader_model").notNull().default("gemini-flash"),
  cohortInsights: jsonb("cohort_insights"),
  cohortInsightsAt: timestamp("cohort_insights_at", { withTimezone: true }),
  cohortInsightsModel: text("cohort_insights_model"),
  createdBy: uuid("created_by").references(() => profiles.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const groupSessions = pgTable("group_sessions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  caseSlug: text("case_slug").notNull(),
  decisionCount: integer("decision_count").notNull().default(5),
  currentSceneId: text("current_scene_id"),
  decisionsMade: integer("decisions_made").notNull().default(0),
  status: text("status").notNull().default("lobby"), // lobby|active|committed|graded|released|expired
  clockSeconds: integer("clock_seconds").notNull().default(1800),
  roleplayModel: text("roleplay_model").notNull().default("gemini-flash"),
  graderModel: text("grader_model").notNull().default("gemini-flash"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  batchId: uuid("batch_id").references(() => groupBatches.id, { onDelete: "set null" }),
  createdBy: uuid("created_by").references(() => profiles.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  startedAt: timestamp("started_at", { withTimezone: true }),
  endedAt: timestamp("ended_at", { withTimezone: true }),
});

export const groupParticipants = pgTable(
  "group_participants",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => groupSessions.id, { onDelete: "cascade" }),
    roleKey: text("role_key").notNull(),
    isAi: boolean("is_ai").notNull().default(false),
    joinToken: text("join_token").unique(),
    displayName: text("display_name"),
    assignedName: text("assigned_name"),
    assignedEmail: text("assigned_email"),
    inviteStatus: text("invite_status").notNull().default("pending"), // pending|sent|failed
    invitedAt: timestamp("invited_at", { withTimezone: true }),
    profileId: uuid("profile_id").references(() => profiles.id),
    joinedAt: timestamp("joined_at", { withTimezone: true }),
    isReady: boolean("is_ready").notNull().default(false),
  },
  (table) => [unique("group_participants_session_role").on(table.sessionId, table.roleKey)],
);

export const groupMessages = pgTable(
  "group_messages",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => groupSessions.id, { onDelete: "cascade" }),
    sceneId: text("scene_id").notNull(),
    roleKey: text("role_key").notNull(),
    senderKind: text("sender_kind").notNull(), // human|ai|narrator
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [index("group_messages_session_id_idx").on(table.sessionId, table.id)],
);

export const groupDecisions = pgTable(
  "group_decisions",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => groupSessions.id, { onDelete: "cascade" }),
    sceneId: text("scene_id").notNull(),
    optionKey: text("option_key"),
    decision: text("decision").notNull(),
    reasoning: text("reasoning").notNull(),
    committedAt: timestamp("committed_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [unique("group_decisions_session_scene").on(table.sessionId, table.sceneId)],
);

export const groupAssessments = pgTable("group_assessments", {
  sessionId: uuid("session_id")
    .primaryKey()
    .references(() => groupSessions.id, { onDelete: "cascade" }),
  graderModel: text("grader_model"),
  rawOutput: text("raw_output"),
  assessment: jsonb("assessment"),
  overrides: jsonb("overrides"),
  status: text("status").notNull().default("ai_draft"),
  professorNotes: text("professor_notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

/** Idempotent AI reply queue — one row per (session, trigger message, role). */
export const aiTurns = pgTable(
  "ai_turns",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => groupSessions.id, { onDelete: "cascade" }),
    triggerMessageId: bigint("trigger_message_id", { mode: "number" }).notNull(),
    roleKey: text("role_key").notNull(),
    status: text("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    unique("ai_turns_session_trigger_role").on(
      table.sessionId,
      table.triggerMessageId,
      table.roleKey,
    ),
  ],
);

export type Profile = typeof profiles.$inferSelect;
export type CaseRow = typeof cases.$inferSelect;
export type Run = typeof runs.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Decision = typeof decisions.$inferSelect;
export type Assessment = typeof assessments.$inferSelect;
export type GroupSession = typeof groupSessions.$inferSelect;
export type GroupParticipant = typeof groupParticipants.$inferSelect;
export type GroupBatch = typeof groupBatches.$inferSelect;
export type GroupMessage = typeof groupMessages.$inferSelect;
export type GroupDecision = typeof groupDecisions.$inferSelect;
export type GroupAssessment = typeof groupAssessments.$inferSelect;

export type ProfileRole = "student" | "professor" | "admin";
export type RunStatus = "in_progress" | "submitted" | "graded" | "released";
export type Integrity = "clean" | "compromised";
export type AssessmentStatus = "ai_draft" | "reviewed" | "released";
