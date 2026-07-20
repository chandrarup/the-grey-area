-- ai_turns replaces ai_queue; assessment overrides; Supabase Realtime + demo RLS

ALTER TABLE "group_assessments" ADD COLUMN IF NOT EXISTS "overrides" jsonb;--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "ai_turns" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	"session_id" uuid NOT NULL,
	"trigger_message_id" bigint NOT NULL,
	"role_key" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "ai_turns_session_trigger_role" UNIQUE("session_id","trigger_message_id","role_key")
);--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "ai_turns" ADD CONSTRAINT "ai_turns_session_id_group_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."group_sessions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint

INSERT INTO "ai_turns" ("session_id", "trigger_message_id", "role_key", "status", "created_at")
SELECT "session_id", "trigger_message_id", "role_key", "status", "created_at"
FROM "ai_queue"
WHERE "trigger_message_id" IS NOT NULL
ON CONFLICT ("session_id", "trigger_message_id", "role_key") DO NOTHING;--> statement-breakpoint

DROP TABLE IF EXISTS "ai_queue";--> statement-breakpoint

-- Supabase Realtime (skipped on plain Postgres / Neon during local transition)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE group_messages;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE group_participants;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE group_sessions;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;--> statement-breakpoint

-- DEMO-GRADE: public read on group tables. When Supabase Auth lands, replace with
-- membership-scoped policies + private channels.
ALTER TABLE group_sessions ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE group_participants ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

DROP POLICY IF EXISTS "demo_anon_read_group_sessions" ON group_sessions;--> statement-breakpoint
CREATE POLICY "demo_anon_read_group_sessions" ON group_sessions FOR SELECT TO anon USING (true);--> statement-breakpoint

DROP POLICY IF EXISTS "demo_anon_read_group_participants" ON group_participants;--> statement-breakpoint
CREATE POLICY "demo_anon_read_group_participants" ON group_participants FOR SELECT TO anon USING (true);--> statement-breakpoint

DROP POLICY IF EXISTS "demo_anon_read_group_messages" ON group_messages;--> statement-breakpoint
CREATE POLICY "demo_anon_read_group_messages" ON group_messages FOR SELECT TO anon USING (true);
