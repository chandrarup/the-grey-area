import { sql } from "drizzle-orm";
import {
  bigint,
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

export type Profile = typeof profiles.$inferSelect;
export type CaseRow = typeof cases.$inferSelect;
export type Run = typeof runs.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Decision = typeof decisions.$inferSelect;
export type Assessment = typeof assessments.$inferSelect;

export type ProfileRole = "student" | "professor" | "admin";
export type RunStatus = "in_progress" | "submitted" | "graded" | "released";
export type Integrity = "clean" | "compromised";
export type AssessmentStatus = "ai_draft" | "reviewed" | "released";
