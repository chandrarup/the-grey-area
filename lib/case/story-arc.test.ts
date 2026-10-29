/**
 * Shared-story arc assertions (ticket 07): grey-area options, D3 films,
 * scripts, stances, integrity along every complete path — no DB.
 */
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { getCase } from "./registry";
import { enumerateCompletePaths } from "./story-paths";
import { resolveIntegrityAfterCeoCommit } from "@/lib/group/meeting-runtime";

describe("cost-of-winning story arc", () => {
  const caseConfig = getCase("cost-of-winning");
  const paths = enumerateCompletePaths(caseConfig);

  test("enumerates 27 complete paths (3^3) across maxDepth 3", () => {
    assert.equal(caseConfig.maxDepth, 3);
    assert.equal(paths.length, 27);
    for (const path of paths) {
      assert.equal(path.length, 3);
      assert.equal(path[2]!.next, null);
    }
  });

  test("every decision scene has script beats and advisor pressureStances", () => {
    for (const scene of Object.values(caseConfig.scenes)) {
      assert.ok(
        (scene.script?.length ?? 0) > 0,
        `${scene.id} missing shared script`,
      );
      assert.ok(scene.pressureStances, `${scene.id} missing pressureStances`);
      for (const seatId of scene.cast) {
        if (seatId === "ceo" || seatId === "eleanor") continue;
        const chips = scene.pressureStances?.[seatId];
        assert.ok(
          chips && chips.length >= 2 && chips.length <= 3,
          `${scene.id}/${seatId} stance chips`,
        );
      }
      assert.equal(
        scene.pressureStances?.ceo,
        undefined,
        `${scene.id} must not author CEO stances`,
      );
    }
  });

  test("every option including Decision 3 terminals has a lived consequence film", () => {
    for (const scene of Object.values(caseConfig.scenes)) {
      for (const option of scene.options) {
        assert.ok(
          option.consequence,
          `${scene.id}/${option.key} missing consequence`,
        );
        assert.ok(
          option.consequence!.headline.trim().length > 0,
          `${scene.id}/${option.key} empty headline`,
        );
        assert.ok(
          (option.consequence!.story?.length ?? 0) > 0 ||
            option.consequence!.narrative.trim().length > 0,
          `${scene.id}/${option.key} empty story/narrative`,
        );
        assert.ok(
          option.consequence!.beats.length > 0,
          `${scene.id}/${option.key} missing consequence beats`,
        );
        if (option.next === null) {
          assert.equal(scene.depth, 3, `terminal ${option.key} not at depth 3`);
        }
      }
    }
  });

  test("integrity latches monotonically along every path (shortcut/compromise)", () => {
    for (const path of paths) {
      let integrity: "clean" | "compromised" = "clean";
      for (const step of path) {
        integrity = resolveIntegrityAfterCeoCommit(
          integrity,
          step.isCompromise,
        );
        if (step.isCompromise) {
          assert.equal(integrity, "compromised");
        }
      }
      const anyCompromise = path.some((s) => s.isCompromise);
      assert.equal(
        integrity,
        anyCompromise ? "compromised" : "clean",
        path.map((s) => `${s.sceneId}:${s.optionKey}`).join(" → "),
      );
    }
  });

  test("reflection questions include pressure-appeal prompt", () => {
    const joined = caseConfig.reflectionQuestions.join(" ").toLowerCase();
    assert.match(joined, /pressure/);
    assert.ok(caseConfig.reflectionQuestions.length >= 2);
  });
});
