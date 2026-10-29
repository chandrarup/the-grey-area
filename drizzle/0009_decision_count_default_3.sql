-- Align DB defaults with Cost of Winning maxDepth (3 decisions).
ALTER TABLE "group_sessions" ALTER COLUMN "decision_count" SET DEFAULT 3;--> statement-breakpoint
ALTER TABLE "group_batches" ALTER COLUMN "decision_count" SET DEFAULT 3;
