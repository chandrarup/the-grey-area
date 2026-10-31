-- Remove prototype-wide browser access. Drizzle server queries use the database
-- owner; students use scoped invite tokens and instructors use verified auth.
DO $$
DECLARE table_name text; role_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['profiles','cases','runs','messages','decisions','assessments',
    'group_sessions','group_participants','group_messages','group_decisions','group_assessments',
    'group_batches','group_pressure_stances','ai_queue','ai_turns']
  LOOP
    IF to_regclass(format('public.%I', table_name)) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
      FOREACH role_name IN ARRAY ARRAY['anon','authenticated'] LOOP
        IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = role_name) THEN
          EXECUTE format('REVOKE ALL ON TABLE public.%I FROM %I', table_name, role_name);
        END IF;
      END LOOP;
    END IF;
  END LOOP;
END $$;
--> statement-breakpoint
DROP POLICY IF EXISTS "demo_anon_read_group_sessions" ON group_sessions;
--> statement-breakpoint
DROP POLICY IF EXISTS "demo_anon_read_group_participants" ON group_participants;
--> statement-breakpoint
DROP POLICY IF EXISTS "demo_anon_read_group_messages" ON group_messages;
