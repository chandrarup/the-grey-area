ALTER TABLE "group_sessions" ADD COLUMN IF NOT EXISTS "expires_at" timestamp with time zone;-->statement-breakpoint
UPDATE "group_sessions" SET "expires_at" = "created_at" + interval '30 minutes' WHERE "expires_at" IS NULL;
