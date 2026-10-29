import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  paceSpeechDelivery,
  speechSpeedMultiplier,
} from "./speech-pacing";

describe("paceSpeechDelivery", () => {
  test("inserts a pause before the success-fee turn", () => {
    const out = paceSpeechDelivery(
      "A modest retainer. Then a success fee: one-tenth of one percent of the contract. Eight point four million dollars — and we pay nothing if we lose.",
    );
    assert.match(out, /retainer\.\s*…\s*Then a success fee/i);
    assert.match(out, /…\s*Eight point four million/i);
  });

  test("is idempotent when ellipses are already authored", () => {
    const authored =
      "A modest retainer. … Then a success fee — one-tenth of one percent. … Eight point four million dollars.";
    assert.equal(paceSpeechDelivery(authored), paceSpeechDelivery(authored));
    assert.equal(
      (paceSpeechDelivery(authored).match(/…/g) ?? []).length,
      (authored.match(/…/g) ?? []).length,
    );
  });

  test("paces the Priya reconnect check", () => {
    const out = paceSpeechDelivery(
      "Sorry — connection dropped. Did he say $8.4 million?",
    );
    assert.match(out, /dropped\.\s*…\s*Did he say/i);
  });

  test("paces Meridian bad-news line", () => {
    const out = paceSpeechDelivery(
      "Salim signed with Meridian on Wednesday. I'd like the record to show I flagged this.",
    );
    assert.match(out, /Wednesday\.\s*…\s*I'd like the record/i);
  });
});

describe("speechSpeedMultiplier", () => {
  test("slows fee and ellipsis lines", () => {
    assert.ok(speechSpeedMultiplier("… Eight point four million") < 1);
    assert.ok(speechSpeedMultiplier("Hello everyone.") === 1);
  });
});
