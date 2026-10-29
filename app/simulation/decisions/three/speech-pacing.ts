/**
 * Delivery pacing for HeadTTS / browser speech — ellipsis pauses before
 * fee reveals and bad-news clauses (no ElevenLabs / breath markup).
 */

const FEE_OR_REVEAL =
  /\b(success fee|eight point four|\$?\s*8\.4\s*million|million dollars)\b/i;

const BAD_NEWS =
  /\b(signed with|invoice has arrived|I'd like the record|ministry has stopped|board sees the pipeline)\b/i;

/** Insert natural `…` pauses before fee/reveal and bad-news clauses. Idempotent. */
export function paceSpeechDelivery(text: string): string {
  let t = text.replace(/\s+/g, " ").trim();
  if (!t) return t;

  // Normalize ASCII "..." to a single ellipsis character for TTS.
  t = t.replace(/\.{3,}/g, "…");

  // "A modest retainer. Then a success fee…" → pause before the fee turn.
  t = t.replace(
    /([.!?…])\s+(Then (?:a |the )?success fee)/gi,
    "$1 … $2",
  );

  // Pause immediately before the dollar figure when it follows other words.
  t = t.replace(
    /([^…\s])\s+(Eight point four million(?:\s+dollars)?)/gi,
    "$1 … $2",
  );
  t = t.replace(/([^…\s])\s+(\$?8\.4\s*million)/gi, "$1 … $2");

  // Soft beat before classic bad-news follow-ups.
  t = t.replace(
    /([.!?…])\s+(I'd like the record)/gi,
    "$1 … $2",
  );
  t = t.replace(
    /([.!?…])\s+(Did (?:he|she|they) say)/gi,
    "$1 … $2",
  );

  // If the line opens on a fee/reveal with no pause yet, lead with a breath.
  if (
    FEE_OR_REVEAL.test(t) &&
    !t.includes("…") &&
    /^(A modest|Then a|The fee|Eight point)/i.test(t)
  ) {
    t = t.replace(
      /^(A modest retainer\.)\s+/i,
      "$1 … ",
    );
  }

  // Long fee sentences without any ellipsis: pause before the first reveal token.
  if (FEE_OR_REVEAL.test(t) && !t.includes("…")) {
    t = t.replace(
      /\b(success fee|Eight point four|\$?8\.4\s*million)/i,
      "… $1",
    );
  }

  if (BAD_NEWS.test(t) && !t.includes("…")) {
    t = t.replace(
      /\b(signed with Meridian|invoice has arrived)/i,
      "… $1",
    );
  }

  t = t.replace(/(?:\s*…\s*)+/g, " … ").replace(/\s{2,}/g, " ").trim();
  // Don't leave a leading ellipsis dangling alone.
  t = t.replace(/^…\s+/, "");
  return t;
}

/** Slightly slower delivery for paced / high-stakes lines. */
export function speechSpeedMultiplier(text: string): number {
  if (/…/.test(text) || FEE_OR_REVEAL.test(text)) return 0.92;
  if (BAD_NEWS.test(text)) return 0.95;
  return 1;
}
