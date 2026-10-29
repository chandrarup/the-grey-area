import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { formatPressureStancePrompt } from "./stance-prompt";

describe("formatPressureStancePrompt", () => {
  test("lists locked chips, notes, and abstains without vote language", () => {
    const text = formatPressureStancePrompt([
      {
        roleKey: "marcus",
        displayName: "Marcus Reed",
        status: "locked",
        chipLabel: "Meet Salim tonight",
        note: "Keep the channel warm",
      },
      {
        roleKey: "tom",
        displayName: "Tom Hale",
        status: "abstain",
        chipLabel: null,
        note: null,
      },
    ]);
    assert.match(text, /Marcus Reed: "Meet Salim tonight"/);
    assert.match(text, /note: Keep the channel warm/);
    assert.match(text, /Tom Hale: Abstain/);
    assert.match(text, /not votes/i);
    assert.doesNotMatch(text, /\bvote tally\b/i);
  });

  test("empty rows still instruct the model not to invent a tally", () => {
    const text = formatPressureStancePrompt([]);
    assert.match(text, /none locked yet/i);
    assert.match(text, /do not invent a room tally/i);
  });
});
