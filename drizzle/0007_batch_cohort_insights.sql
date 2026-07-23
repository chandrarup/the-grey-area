-- Cached cohort insights on group batches

ALTER TABLE "group_batches" ADD COLUMN IF NOT EXISTS "cohort_insights" jsonb;--> statement-breakpoint
ALTER TABLE "group_batches" ADD COLUMN IF NOT EXISTS "cohort_insights_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "group_batches" ADD COLUMN IF NOT EXISTS "cohort_insights_model" text;
