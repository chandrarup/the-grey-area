-- Batch roster creation: group_batches + session/participant assignment columns

CREATE TABLE IF NOT EXISTS "group_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"case_slug" text NOT NULL,
	"decision_count" integer DEFAULT 5 NOT NULL,
	"roleplay_model" text DEFAULT 'gemini-flash' NOT NULL,
	"grader_model" text DEFAULT 'gemini-flash' NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now()
);--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "group_batches" ADD CONSTRAINT "group_batches_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint

ALTER TABLE "group_sessions" ADD COLUMN IF NOT EXISTS "batch_id" uuid;--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "group_sessions" ADD CONSTRAINT "group_sessions_batch_id_group_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."group_batches"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint

ALTER TABLE "group_participants" ADD COLUMN IF NOT EXISTS "assigned_name" text;--> statement-breakpoint
ALTER TABLE "group_participants" ADD COLUMN IF NOT EXISTS "assigned_email" text;
