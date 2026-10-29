/**
 * Solo shared-story smoke (ticket 07): hook path → 3 decisions → terminal film
 * payload → reflections → release gate. No browser / no LLM grader.
 *
 * Usage: npx tsx --env-file=.env.local lib/db/solo-arc.smoke.ts
 */
import { config } from "dotenv";

config({ path: ".env.local" });
config();

import { eq } from "drizzle-orm";
import { closeDb, db } from "@/lib/db";
import { getCase } from "@/lib/case/registry";
import {
  commitDecision,
  getAssessmentForStudent,
  getDecisions,
  getOrCreateRun,
  getRun,
  releaseAssessment,
  resetRun,
  updateRunStageData,
  upsertAssessment,
} from "@/lib/db/queries";
import { cases, profiles } from "@/lib/db/schema";

function fail(msg: string): never {
  throw new Error(`FAIL solo-arc: ${msg}`);
}

async function main() {
  const [student] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.email, "student-a@dev.local"))
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

  if (!student || !professor || !caseRow) {
    fail("seed data missing — run npm run db:seed first");
  }

  const caseConfig = getCase("cost-of-winning");
  const run = await getOrCreateRun(student, caseRow.id);
  await resetRun(student, run.id, caseConfig.startScene);

  // Compliant path end-to-end (integrity stays clean).
  let sceneId = caseConfig.startScene;
  const reasoning =
    "Smoke test reasoning with enough characters to clear the floor.";

  for (let depth = 1; depth <= caseConfig.maxDepth; depth++) {
    const scene = caseConfig.scenes[sceneId];
    if (!scene) fail(`missing scene ${sceneId}`);
    const option =
      scene.options.find((o) => o.posture === "compliant") ?? scene.options[0];
    if (!option) fail(`no options on ${sceneId}`);
    if (!option.consequence) fail(`${sceneId}/${option.key} missing film`);

    await commitDecision(student, run.id, {
      sceneId,
      optionKey: option.key,
      choice: option.label,
      reasoning,
      nextSceneId: option.next,
      nextDepth: option.next ? depth + 1 : depth,
      isCompromise: option.isCompromise,
    });

    if (option.next) {
      sceneId = option.next;
    }
  }

  const done = await getRun(student, run.id);
  if (!done) fail("run missing after commits");
  if (done.status !== "submitted") fail(`expected submitted, got ${done.status}`);
  if (done.currentSceneId !== null) fail("terminal run should clear currentSceneId");
  if (done.integrity !== "clean") fail(`compliant path integrity=${done.integrity}`);

  const decisions = await getDecisions(student, run.id);
  if (decisions.length !== 3) fail(`expected 3 decisions, got ${decisions.length}`);

  const last = decisions[2]!;
  const lastOption = caseConfig.scenes[last.sceneId]?.options.find(
    (o) => o.key === last.optionKey,
  );
  if (!lastOption?.consequence || lastOption.next !== null) {
    fail("Decision 3 must be a terminal consequence film");
  }
  console.log("OK  solo 3 decisions → submitted + D3 film payload");

  await updateRunStageData(student, run.id, {
    reflections: caseConfig.reflectionQuestions.map(
      (_, i) => `Solo smoke reflection ${i + 1} with enough detail.`,
    ),
  });
  console.log("OK  solo reflections stored");

  const hidden = await getAssessmentForStudent(student, run.id);
  if (hidden !== null) fail("student must not see assessment before release");

  await upsertAssessment(run.id, {
    status: "draft",
    assessment: { summary: "solo smoke draft" },
    graderModel: "smoke",
  });
  await releaseAssessment(professor, run.id, "smoke release");
  const released = await getAssessmentForStudent(student, run.id);
  if (!released || released.status !== "released") {
    fail("student should see assessment after release");
  }
  console.log("OK  solo release gate");

  // Shortcut latch on a fresh reset.
  await resetRun(student, run.id, caseConfig.startScene);
  const s1 = caseConfig.scenes[caseConfig.startScene]!;
  const shortcut = s1.options.find((o) => o.posture === "shortcut");
  if (!shortcut) fail("missing shortcut on start scene");
  await commitDecision(student, run.id, {
    sceneId: s1.id,
    optionKey: shortcut.key,
    choice: shortcut.label,
    reasoning,
    nextSceneId: shortcut.next,
    nextDepth: 2,
    isCompromise: shortcut.isCompromise,
  });
  const mid = await getRun(student, run.id);
  if (mid?.integrity !== "compromised") {
    fail("shortcut commit must latch integrity");
  }
  console.log("OK  solo integrity latch on shortcut");

  console.log("PASS solo-arc smoke");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => closeDb());
