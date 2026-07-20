ALTER TABLE "group_sessions" ADD COLUMN IF NOT EXISTS "roleplay_model" text DEFAULT 'gemini-flash' NOT NULL;-->statement-breakpoint
ALTER TABLE "group_sessions" ADD COLUMN IF NOT EXISTS "grader_model" text DEFAULT 'gemini-flash' NOT NULL;
