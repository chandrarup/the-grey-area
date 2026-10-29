/**
 * GroupMeetingRuntime — pure domain seam for group scene-phase transitions,
 * pressure-stance readiness, CEO commit gates, and integrity latch.
 *
 * Callers (API / UI) supply session snapshots + events; this module evaluates
 * rules only. No persistence, React, or R3F.
 *
 * Vocabulary: GLOSSARY.md. Behaviour: ADRs 0001–0003.
 */

import { HUMAN_MSG_GATE } from "../case/group-roles";

/** Scene phase sequence: decided → film → open → live (commit inside live). */
export type ScenePhase = "decided" | "film" | "open" | "live";

export type Integrity = "clean" | "compromised";

export type StanceStatus = "pending" | "locked" | "abstain";

export type PhaseEvent =
  | { type: "begin_film" }
  | { type: "film_watched"; seatId: string }
  | { type: "film_timeout" }
  | { type: "ceo_force_advance" }
  | { type: "enter_live" };

export type AdvisorStanceSeat = {
  seatId: string;
  kind: "human" | "bot";
  status: StanceStatus;
};

/** Hard-sync film window (~90s) before auto-advance to open. */
export const FILM_TIMEOUT_MS = 90_000;

/** Minimum human messages before CEO may commit (same gate as meeting UI). */
export const HUMAN_MESSAGE_GATE = HUMAN_MSG_GATE;

export type PhaseTransitionInput = {
  phase: ScenePhase;
  /** Human seats that must watch the film for all-watched advance. */
  humanSeatIds: readonly string[];
  /** Seats that have already marked the film watched (before this event). */
  watchedSeatIds: readonly string[];
  event: PhaseEvent;
};

export type PhaseTransitionResult = {
  /** Next phase, or null when the event does not advance. */
  nextPhase: ScenePhase | null;
};

function uniqueIds(ids: readonly string[]): string[] {
  return [...new Set(ids)];
}

function allHumansWatched(
  humanSeatIds: readonly string[],
  watchedSeatIds: readonly string[],
): boolean {
  if (humanSeatIds.length === 0) return true;
  const watched = new Set(watchedSeatIds);
  return humanSeatIds.every((id) => watched.has(id));
}

/**
 * Evaluate a hard-synced scene-phase transition from session snapshot + event.
 * Film → open advances on all-watched, timeout, or CEO force.
 */
export function evaluatePhaseTransition(
  input: PhaseTransitionInput,
): PhaseTransitionResult {
  const { phase, event } = input;
  const humans = uniqueIds(input.humanSeatIds);

  if (phase === "decided" && event.type === "begin_film") {
    return { nextPhase: "film" };
  }

  if (phase === "film") {
    if (event.type === "film_timeout" || event.type === "ceo_force_advance") {
      return { nextPhase: "open" };
    }
    if (event.type === "film_watched") {
      if (!humans.includes(event.seatId)) {
        return { nextPhase: null };
      }
      const watched = uniqueIds([...input.watchedSeatIds, event.seatId]);
      if (allHumansWatched(humans, watched)) {
        return { nextPhase: "open" };
      }
      return { nextPhase: null };
    }
  }

  if (phase === "open") {
    if (event.type === "enter_live" || event.type === "ceo_force_advance") {
      return { nextPhase: "live" };
    }
  }

  return { nextPhase: null };
}

export type StanceReadinessInput = {
  /** Advisor seats only (CEO has no pressure stance). */
  advisors: readonly AdvisorStanceSeat[];
};

export type StanceReadinessResult = {
  allHumanAdvisorsReady: boolean;
  pendingHumanSeatIds: string[];
};

/**
 * Human advisors are ready when each has locked or abstained.
 * Bot seats never block readiness (they auto-stance elsewhere).
 */
export function evaluateStanceReadiness(
  input: StanceReadinessInput,
): StanceReadinessResult {
  const pendingHumanSeatIds = input.advisors
    .filter((s) => s.kind === "human" && s.status === "pending")
    .map((s) => s.seatId);
  return {
    allHumanAdvisorsReady: pendingHumanSeatIds.length === 0,
    pendingHumanSeatIds,
  };
}

export type CeoCommitGateInput = {
  humanMessageCount: number;
  allHumanAdvisorsReady: boolean;
  /** Override for tests; defaults to HUMAN_MESSAGE_GATE. */
  humanMessageGate?: number;
};

export type CeoCommitGateResult = {
  canCommit: boolean;
  messagesReady: boolean;
  stancesReady: boolean;
};

/**
 * CEO commit requires ≥N human messages and human-advisor stance readiness.
 * Stances are not votes — this only gates whether the CEO may commit.
 */
export function evaluateCeoCommitGate(
  input: CeoCommitGateInput,
): CeoCommitGateResult {
  const gate = input.humanMessageGate ?? HUMAN_MESSAGE_GATE;
  const messagesReady = input.humanMessageCount >= gate;
  const stancesReady = input.allHumanAdvisorsReady;
  return {
    canCommit: messagesReady && stancesReady,
    messagesReady,
    stancesReady,
  };
}

/**
 * Monotonic integrity latch: clean → compromised on compromising CEO commit.
 * Never flips back. Pressure stances do not call this.
 */
export function applyIntegrityLatch(
  current: Integrity,
  commit: { isCompromise: boolean },
): Integrity {
  if (current === "compromised" || commit.isCompromise) return "compromised";
  return "clean";
}

/**
 * Commit-path helper: normalize persisted session integrity, then latch.
 * Only CEO commits call this — never pressure stances.
 */
export function resolveIntegrityAfterCeoCommit(
  sessionIntegrity: string | null | undefined,
  isCompromise: boolean,
): Integrity {
  const current: Integrity =
    sessionIntegrity === "compromised" ? "compromised" : "clean";
  return applyIntegrityLatch(current, { isCompromise });
}

/** Named seam export for later API/UI wiring. */
export const GroupMeetingRuntime = {
  evaluatePhaseTransition,
  evaluateStanceReadiness,
  evaluateCeoCommitGate,
  applyIntegrityLatch,
  resolveIntegrityAfterCeoCommit,
  FILM_TIMEOUT_MS,
  HUMAN_MESSAGE_GATE,
} as const;
