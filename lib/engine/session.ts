const STORAGE_KEY = "grey-area-session";

export type DecisionRecord = {
  decision_id: string;
  choice_label: string;
  is_compromise: boolean;
  reasoning: string;
};

export type SimSession = {
  integrity: "clean" | "compromised";
  decisions: DecisionRecord[];
};

const EMPTY_SESSION: SimSession = { integrity: "clean", decisions: [] };

function read(): SimSession {
  if (typeof window === "undefined") return EMPTY_SESSION;
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return EMPTY_SESSION;
  try {
    return JSON.parse(raw) as SimSession;
  } catch {
    return EMPTY_SESSION;
  }
}

function write(session: SimSession): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function getSession(): SimSession {
  return read();
}

/**
 * Records a decision and applies the integrity latch: monotonic clean ->
 * compromised. Once any is_compromise choice is recorded, integrity never
 * flips back to clean, even if later choices are clean.
 */
export function recordDecision(record: DecisionRecord): SimSession {
  const session = read();
  const next: SimSession = {
    integrity: session.integrity === "compromised" || record.is_compromise ? "compromised" : "clean",
    decisions: [...session.decisions, record],
  };
  write(next);
  return next;
}
