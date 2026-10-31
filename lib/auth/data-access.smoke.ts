/** Validate the privacy migration in a transaction that ALWAYS rolls back. */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import postgres from "postgres";
const sql = postgres(process.env.DATABASE_URL!, { prepare: false, max: 1 });
const rollback = new Error("validation rollback");
async function main() {
  const migration = await readFile(
    new URL("../../drizzle/0014_private_training_data.sql", import.meta.url),
    "utf8",
  );
  try {
    await sql.begin(async (tx) => {
      await tx`SET LOCAL lock_timeout = '2s'`;
      // Plain local Postgres has no Supabase roles. Create NOLOGIN fixtures only
      // inside this rolled-back transaction so the permission check cannot pass vacuously.
      for (const name of ["anon", "authenticated"]) {
        const existing = await tx`SELECT 1 FROM pg_roles WHERE rolname = ${name}`;
        if (!existing.length) await tx.unsafe(`CREATE ROLE ${name} NOLOGIN`);
      }
      await tx`GRANT SELECT ON public.group_sessions TO anon, authenticated`;
      await tx.unsafe(migration);
      const roles =
        await tx`SELECT rolname FROM pg_roles WHERE rolname IN ('anon','authenticated')`;
      assert.equal(roles.length, 2, "Both Supabase browser roles must exist for this check");
      for (const role of roles) {
        const tables =
          await tx`SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('group_sessions','group_participants','group_messages','group_assessments','profiles','runs','assessments')`;
        assert.equal(tables.length, 7, "All seven expected application tables must exist");
        for (const table of tables) {
          const [row] =
            await tx`SELECT has_table_privilege(${role.rolname}, ${`public.${table.tablename}`}, 'SELECT') AS can_read`;
          assert.equal(
            row.can_read,
            false,
            `${role.rolname} can still read ${table.tablename}`,
          );
        }
      }
      throw rollback;
    });
  } catch (err) {
    if (err !== rollback) throw err;
  }
  console.log(
    "PASS: privacy migration revokes browser table reads for both roles; all test grants, fixture roles, and migration changes rolled back.",
  );
}
main()
  .finally(() => sql.end())
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
