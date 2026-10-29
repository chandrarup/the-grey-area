/**
 * Format locked pressure stances for AI turn prompts (ticket 06 / ADR 0002).
 * Stances bias tone only — never votes, never option.next / integrity.
 */

export type StancePromptRow = {
  roleKey: string;
  displayName: string;
  status: "locked" | "abstain";
  chipLabel: string | null;
  note: string | null;
};

/** Human-readable block injected into the AI system prompt. */
export function formatPressureStancePrompt(
  rows: readonly StancePromptRow[],
): string {
  if (rows.length === 0) {
    return [
      "PRESSURE STANCES THIS SCENE: none locked yet.",
      "Speak from your seat brief; do not invent a room tally.",
    ].join("\n");
  }

  const lines = rows.map((r) => {
    if (r.status === "abstain") {
      return `- ${r.displayName}: Abstain (no locked chip)`;
    }
    const label = r.chipLabel?.trim() || "(locked, label missing)";
    const note = r.note?.trim() ? ` — note: ${r.note.trim()}` : "";
    return `- ${r.displayName}: "${label}"${note}`;
  });

  return [
    "PRESSURE STANCES LOCKED THIS SCENE (advisory pressure — not votes, not a tally):",
    ...lines,
    "Bias your reply toward the live pressure above. Stay in character.",
    "Do not announce chip labels or call this a vote. Do not claim the room decided.",
  ].join("\n");
}
