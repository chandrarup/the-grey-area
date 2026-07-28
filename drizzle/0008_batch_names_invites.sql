-- Invite errors, friendly group names, draft batch plans

ALTER TABLE "group_participants" ADD COLUMN IF NOT EXISTS "invite_error" text;--> statement-breakpoint
ALTER TABLE "group_sessions" ADD COLUMN IF NOT EXISTS "display_name" text;--> statement-breakpoint
ALTER TABLE "group_batches" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'ready' NOT NULL;--> statement-breakpoint
ALTER TABLE "group_batches" ADD COLUMN IF NOT EXISTS "draft_plan" jsonb;
