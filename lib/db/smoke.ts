/**
 * Smoke-test ownership, uniqueness, and staff listRuns.
 * Usage: npx tsx --env-file=.env.local lib/db/smoke.ts
 */
import { config } from "dotenv";

config({ path: ".env.local" });
config();

import { eq } from "drizzle-orm";
import { db, closeDb } from "@/lib/db";
import {
  getOrCreateRun,
  getRun,
  listRuns,
} from "@/lib/db/queries";
import { cases, profiles, runs } from "@/lib/db/schema";

async function main() {
  const [studentA] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.email, "student-a@dev.local"))
    .limit(1);
  const [studentB] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.email, "student-b@dev.local"))
    .limit(1);
  const [professor] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.email, "professor@dev.local"))
    .limit(1);
  const [caseRow] = await db
    .select()
    .from(cases)
    .where(eq(cases.slug, "cost-of-winning"))
    .limit(1);

  if (!studentA || !studentB || !professor || !caseRow) {
    throw new Error("Seed data missing — run npm run db:seed first");
  }

  const runA = await getOrCreateRun(studentA, caseRow.id);
  const runB = await getOrCreateRun(studentB, caseRow.id);

  const asALookingAtB = await getRun(studentA, runB.id);
  if (asALookingAtB !== null) {
    throw new Error("FAIL: student A should not see student B's run");
  }
  console.log("OK  student A getRun(B) => null");

  const asBLookingAtA = await getRun(studentB, runA.id);
  if (asBLookingAtA !== null) {
    throw new Error("FAIL: student B should not see student A's run");
  }
  console.log("OK  student B getRun(A) => null");

  const asProfA = await getRun(professor, runA.id);
  const asProfB = await getRun(professor, runB.id);
  if (!asProfA || !asProfB) {
    throw new Error("FAIL: professor should see both runs");
  }
  console.log("OK  professor getRun(A/B) => both");

  const listed = await listRuns(professor);
  const ids = new Set(listed.map((r) => r.id));
  if (!ids.has(runA.id) || !ids.has(runB.id)) {
    throw new Error("FAIL: listRuns missing student runs");
  }
  console.log(`OK  listRuns => ${listed.length} run(s)`);

  let uniqueFailed = false;
  try {
    await db.insert(runs).values({
      caseId: caseRow.id,
      userId: studentA.id,
      currentSceneId: "s1_emergency_meeting",
    });
  } catch {
    uniqueFailed = true;
  }
  if (!uniqueFailed) {
    throw new Error("FAIL: second insert for same (case, user) should violate UNIQUE");
  }
  console.log("OK  UNIQUE(case_id, user_id) rejects second insert");

  let studentListThrew = false;
  try {
    await listRuns(studentA);
  } catch {
    studentListThrew = true;
  }
  if (!studentListThrew) {
    throw new Error("FAIL: listRuns(student) should throw");
  }
  console.log("OK  listRuns(student) throws");

  console.log("All smoke checks passed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => closeDb());
