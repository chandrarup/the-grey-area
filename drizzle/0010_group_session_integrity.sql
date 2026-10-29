-- Group sessions share solo's monotonic integrity latch (ADR 0003).
ALTER TABLE "group_sessions" ADD COLUMN "integrity" text DEFAULT 'clean' NOT NULL;
