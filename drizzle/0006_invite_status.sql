-- Invite status on group participants (batch email)

ALTER TABLE "group_participants" ADD COLUMN IF NOT EXISTS "invite_status" text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "group_participants" ADD COLUMN IF NOT EXISTS "invited_at" timestamp with time zone;
