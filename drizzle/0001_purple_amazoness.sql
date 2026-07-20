CREATE TABLE "ai_queue" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "ai_queue_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"session_id" uuid NOT NULL,
	"role_key" text NOT NULL,
	"trigger_message_id" bigint,
	"status" text DEFAULT 'pending' NOT NULL,
	"claimed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "group_assessments" (
	"session_id" uuid PRIMARY KEY NOT NULL,
	"grader_model" text,
	"raw_output" text,
	"assessment" jsonb,
	"status" text DEFAULT 'ai_draft' NOT NULL,
	"professor_notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "group_decisions" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "group_decisions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"session_id" uuid NOT NULL,
	"scene_id" text NOT NULL,
	"option_key" text,
	"decision" text NOT NULL,
	"reasoning" text NOT NULL,
	"committed_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "group_decisions_session_scene" UNIQUE("session_id","scene_id")
);
--> statement-breakpoint
CREATE TABLE "group_messages" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "group_messages_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"session_id" uuid NOT NULL,
	"scene_id" text NOT NULL,
	"role_key" text NOT NULL,
	"sender_kind" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "group_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"role_key" text NOT NULL,
	"is_ai" boolean DEFAULT false NOT NULL,
	"join_token" text,
	"display_name" text,
	"profile_id" uuid,
	"joined_at" timestamp with time zone,
	"is_ready" boolean DEFAULT false NOT NULL,
	CONSTRAINT "group_participants_join_token_unique" UNIQUE("join_token"),
	CONSTRAINT "group_participants_session_role" UNIQUE("session_id","role_key")
);
--> statement-breakpoint
CREATE TABLE "group_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"case_slug" text NOT NULL,
	"decision_count" integer DEFAULT 5 NOT NULL,
	"current_scene_id" text,
	"decisions_made" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'lobby' NOT NULL,
	"clock_seconds" integer DEFAULT 1800 NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"started_at" timestamp with time zone,
	"ended_at" timestamp with time zone,
	CONSTRAINT "group_sessions_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "runs" ADD COLUMN "stage_data" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "ai_queue" ADD CONSTRAINT "ai_queue_session_id_group_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."group_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_assessments" ADD CONSTRAINT "group_assessments_session_id_group_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."group_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_decisions" ADD CONSTRAINT "group_decisions_session_id_group_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."group_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_messages" ADD CONSTRAINT "group_messages_session_id_group_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."group_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_participants" ADD CONSTRAINT "group_participants_session_id_group_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."group_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_participants" ADD CONSTRAINT "group_participants_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_sessions" ADD CONSTRAINT "group_sessions_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "group_messages_session_id_idx" ON "group_messages" USING btree ("session_id","id");