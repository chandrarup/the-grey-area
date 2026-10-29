-- Authored pressure stances + live stance window (ADR 0002 / ticket 05).
ALTER TABLE "group_sessions" ADD COLUMN "stance_deadline_at" timestamp with time zone;--> statement-breakpoint
CREATE TABLE "group_pressure_stances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"scene_id" text NOT NULL,
	"role_key" text NOT NULL,
	"status" text NOT NULL,
	"chip_key" text,
	"chip_label" text,
	"note" text,
	"locked_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "group_pressure_stances" ADD CONSTRAINT "group_pressure_stances_session_id_group_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."group_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_pressure_stances" ADD CONSTRAINT "group_pressure_stances_session_scene_role" UNIQUE("session_id","scene_id","role_key");
