-- Hard-synced scene phases (ADR 0001 / ticket 03).
ALTER TABLE "group_sessions" ADD COLUMN "scene_phase" text DEFAULT 'open' NOT NULL;--> statement-breakpoint
ALTER TABLE "group_sessions" ADD COLUMN "phase_deadline_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "group_sessions" ADD COLUMN "film_watched_seat_ids" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "group_sessions" ADD COLUMN "script_done_seat_ids" jsonb DEFAULT '[]'::jsonb NOT NULL;
