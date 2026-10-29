/**
 * Group shared-story smoke (ticket 07): mixed human/bot seats → phases →
 * stances → commit → integrity → D3 film → reflections → release.
 * No browser / no LLM.
 *
 * Usage: npx tsx --env-file=.env.local lib/db/group-arc.smoke.ts
 */
import { config } from "dotenv";

config({ path: ".env.local" });
config();

import { eq } from "drizzle-orm";
import { closeDb, db } from "@/lib/db";
import { getCase } from "@/lib/case/registry";
import { HUMAN_MSG_GATE } from "@/lib/case/group-roles";
import {
  appendGroupMessage,
  applyGroupPhaseEvent,
  commitGroupDecision,
  createGroupSession,
  deleteGroupSession,
  getGroupSession,
  joinByToken,
  listGroupDecisions,
  listParticipants,
  listPressureStances,
  lockPressureStance,
  markSessionGraded,
  saveParticipantReflections,
  setParticipantReady,
  startGroupSession,
  upsertGroupAssessment,
} from "@/lib/db/group-queries";
import { profiles } from "@/lib/db/schema";

const reasoning =
  "Smoke test reasoning with enough characters to clear the floor.";

function fail(msg: string): never {
  throw new Error(`FAIL group-arc: ${msg}`);
}

async function advanceToLive(sessionId: string) {
  let session = await getGroupSession(sessionId);
  if (!session) fail("session lost");
  if (session.scenePhase === "open") {
    session = await applyGroupPhaseEvent({
      sessionId,
      event: { type: "enter_script" },
      actorRoleKey: "ceo",
      isCeo: true,
    });
  }

  const humans = (await listParticipants(sessionId)).filter(
    (p) => !p.isAi && p.profileId,
  );
  for (const h of humans) {
    session = await getGroupSession(sessionId);
    if (!session || session.scenePhase !== "script") break;
    session = await applyGroupPhaseEvent({
      sessionId,
      event: { type: "script_done", seatId: h.roleKey },
      actorRoleKey: h.roleKey,
      isCeo: h.roleKey === "ceo",
    });
  }

  session = await getGroupSession(sessionId);
  if (session?.scenePhase === "script") {
    session = await applyGroupPhaseEvent({
      sessionId,
      event: { type: "enter_live" },
      actorRoleKey: "ceo",
      isCeo: true,
    });
  }
  if (session?.scenePhase !== "live") {
    fail(`expected live after script, got ${session?.scenePhase}`);
  }
}

async function playFilmIfNeeded(sessionId: string) {
  let session = await getGroupSession(sessionId);
  if (!session || session.status !== "active") return;
  if (session.scenePhase === "decided") {
    session = await applyGroupPhaseEvent({
      sessionId,
      event: { type: "begin_film" },
      actorRoleKey: "ceo",
      isCeo: true,
    });
  }
  if (session.scenePhase === "film") {
    const humans = (await listParticipants(sessionId)).filter(
      (p) => !p.isAi && p.profileId,
    );
    for (const h of humans) {
      session = await applyGroupPhaseEvent({
        sessionId,
        event: { type: "film_watched", seatId: h.roleKey },
        actorRoleKey: h.roleKey,
        isCeo: h.roleKey === "ceo",
      });
    }
  }
}

async function main() {
  const [studentCeo] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.email, "student-a@dev.local"))
    .limit(1);
  const [studentAdvisor] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.email, "student-b@dev.local"))
    .limit(1);
  const [professor] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.email, "professor@dev.local"))
    .limit(1);

  if (!studentCeo || !studentAdvisor || !professor) {
    fail("seed data missing — run npm run db:seed first");
  }

  const caseConfig = getCase("cost-of-winning");
  const { session: created, tokens } = await createGroupSession({
    createdBy: professor,
    caseSlug: "cost-of-winning",
    decisionCount: 3,
    seats: {
      ceo: "human",
      marcus: "human",
      david: "ai",
      priya: "ai",
      tom: "ai",
    },
    displayName: "Smoke Immersion Table",
  });

  const sessionId = created.id;
  try {
    if (!tokens.ceo || !tokens.marcus) fail("missing join tokens");
    const ceo = await joinByToken({
      profile: studentCeo,
      token: tokens.ceo,
      displayName: "Smoke CEO",
    });
    const marcus = await joinByToken({
      profile: studentAdvisor,
      token: tokens.marcus,
      displayName: "Smoke Marcus",
    });
    await setParticipantReady(ceo.id, studentCeo, true);
    await setParticipantReady(marcus.id, studentAdvisor, true);
    await startGroupSession(sessionId, { profile: studentCeo, force: true });
    console.log("OK  group lobby → active (mixed human/bot)");

    for (let d = 0; d < 3; d++) {
      await playFilmIfNeeded(sessionId);
      await advanceToLive(sessionId);

      const session = await getGroupSession(sessionId);
      if (!session?.currentSceneId) fail("missing currentSceneId in live");
      const sceneId = session.currentSceneId;
      const scene = caseConfig.scenes[sceneId];
      if (!scene) fail(`unknown scene ${sceneId}`);

      const stances = await listPressureStances(sessionId, sceneId);
      const botLocks = stances.filter(
        (s) =>
          (s.roleKey === "david" ||
            s.roleKey === "priya" ||
            s.roleKey === "tom") &&
          s.status === "locked",
      );
      if (botLocks.length < 3) {
        fail(`expected bot auto-stances on ${sceneId}, got ${botLocks.length}`);
      }

      const marcusChip = scene.pressureStances?.marcus?.[0];
      if (!marcusChip) fail(`no marcus stance on ${sceneId}`);
      await lockPressureStance({
        sessionId,
        sceneId,
        roleKey: "marcus",
        chipKey: marcusChip.key,
        note: "Smoke advisor pressure",
      });

      try {
        await commitGroupDecision({
          sessionId,
          sceneId,
          optionKey: scene.options[0]!.key,
          decision: scene.options[0]!.label,
          reasoning,
          nextSceneId: scene.options[0]!.next,
          isCompromise: scene.options[0]!.isCompromise,
          profile: studentCeo,
        });
        fail("commit should block under message gate");
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (!/6 human messages|message/i.test(msg)) {
          fail(`unexpected under-gate error: ${msg}`);
        }
      }

      for (let i = 0; i < HUMAN_MSG_GATE; i++) {
        await appendGroupMessage(
          sessionId,
          sceneId,
          i % 2 === 0 ? "ceo" : "marcus",
          "human",
          `Smoke human message ${i + 1} on ${sceneId}.`,
        );
      }

      const option =
        scene.options.find((o) => o.posture === "compliant") ?? scene.options[0]!;
      if (!option.consequence) fail(`${sceneId}/${option.key} missing film`);

      await commitGroupDecision({
        sessionId,
        sceneId,
        optionKey: option.key,
        decision: option.label,
        reasoning,
        nextSceneId: option.next,
        isCompromise: option.isCompromise,
        profile: studentCeo,
      });
    }

    const finished = await getGroupSession(sessionId);
    if (finished?.status !== "committed") {
      fail(`expected committed, got ${finished?.status}`);
    }
    if (finished.integrity !== "clean") {
      fail(`compliant path integrity=${finished.integrity}`);
    }
    const decisions = await listGroupDecisions(sessionId);
    if (decisions.length !== 3) {
      fail(`expected 3 decisions, got ${decisions.length}`);
    }
    const last = decisions[2]!;
    const lastOption = caseConfig.scenes[last.sceneId]?.options.find(
      (o) => o.key === last.optionKey,
    );
    if (!lastOption?.consequence || lastOption.next !== null) {
      fail("Decision 3 must be terminal with consequence film");
    }
    console.log("OK  group phases → stances → 3 commits → D3 film");

    await saveParticipantReflections({
      participantId: ceo.id,
      sessionId,
      reflections: caseConfig.reflectionQuestions.map(
        (_, i) => `Group smoke reflection ${i + 1} with enough detail.`,
      ),
    });
    console.log("OK  group reflections");

    await upsertGroupAssessment(sessionId, {
      status: "ai_draft",
      assessment: { summary: "group smoke draft" },
      graderModel: "smoke",
    });
    await markSessionGraded(sessionId);
    await upsertGroupAssessment(sessionId, { status: "released" });
    console.log("OK  group assessment released (release gate path)");
    console.log("PASS group-arc smoke");
  } finally {
    await deleteGroupSession(sessionId, professor).catch(() => null);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => closeDb());
