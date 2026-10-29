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

/** Scene phase sequence: decided → film → open → script → live (commit inside live). */
export type ScenePhase = "decided" | "film" | "open" | "script" | "live";

export type Integrity = "clean" | "compromised";

export type StanceStatus = "pending" | "locked" | "abstain";

export type PhaseEvent =
  | { type: "begin_film" }
  | { type: "film_watched"; seatId: string }
  | { type: "film_timeout" }
  | { type: "ceo_force_advance" }
  | { type: "enter_script" }
  | { type: "script_done"; seatId: string }
  | { type: "enter_live" };

export type AdvisorStanceSeat = {
  seatId: string;
  kind: "human" | "bot";
  status: StanceStatus;
};

/** Hard-sync film window (~90s) before auto-advance to open. */
export const FILM_TIMEOUT_MS = 90_000;

/** Human advisor pressure-stance window (~2 min) before Abstain. */
export const STANCE_TIMEOUT_MS = 120_000;

/** Minimum human messages before CEO may commit (same gate as meeting UI). */
export const HUMAN_MESSAGE_GATE = HUMAN_MSG_GATE;

export type PressureStanceChip = {
  key: string;
  label: string;
};

/**
 * Bot advisors auto-lock the first authored chip (author the brief-aligned
 * default first). Empty list → null (do not invent a stance).
 */
export function pickBotStanceChip(
  chips: readonly PressureStanceChip[],
): PressureStanceChip | null {
  return chips[0] ?? null;
}

export type AdvisorSeatKind = {
  seatId: string;
  kind: "human" | "bot";
};

export type StanceRecordRef = {
  seatId: string;
  status: "locked" | "abstain";
};

/**
 * Map advisor seats + persisted stance rows to readiness input.
 * Missing records stay pending. CEO is never passed in.
 */
export function buildAdvisorStanceSeats(input: {
  advisorSeats: readonly AdvisorSeatKind[];
  records: readonly StanceRecordRef[];
}): AdvisorStanceSeat[] {
  const bySeat = new Map(input.records.map((r) => [r.seatId, r.status]));
  return input.advisorSeats.map((seat) => ({
    seatId: seat.seatId,
    kind: seat.kind,
    status: bySeat.get(seat.seatId) ?? "pending",
  }));
}

export const SCENE_PHASES: readonly ScenePhase[] = [
  "decided",
  "film",
  "open",
  "script",
  "live",
] as const;

export function isScenePhase(value: string): value is ScenePhase {
  return (SCENE_PHASES as readonly string[]).includes(value);
}

export type PhaseTransitionInput = {
  phase: ScenePhase;
  /** Human seats that must watch the film / finish the script for all-ready advance. */
  humanSeatIds: readonly string[];
  /** Seats that have already marked the film watched (before this event). */
  watchedSeatIds: readonly string[];
  /** Seats that have already finished the shared script (before this event). */
  scriptDoneSeatIds?: readonly string[];
  event: PhaseEvent;
};

export type PhaseTransitionResult = {
  /** Next phase, or null when the event does not advance. */
  nextPhase: ScenePhase | null;
};

function uniqueIds(ids: readonly string[]): string[] {
  return [...new Set(ids)];
}

function allHumansReady(
  humanSeatIds: readonly string[],
  readySeatIds: readonly string[],
): boolean {
  if (humanSeatIds.length === 0) return true;
  const ready = new Set(readySeatIds);
  return humanSeatIds.every((id) => ready.has(id));
}

/**
 * Evaluate a hard-synced scene-phase transition from session snapshot + event.
 * Film → open advances on all-watched, timeout, or CEO force.
 * Script → live advances on all-done, enter_live, or CEO force.
 */
export function evaluatePhaseTransition(
  input: PhaseTransitionInput,
): PhaseTransitionResult {
  const { phase, event } = input;
  const humans = uniqueIds(input.humanSeatIds);
  const scriptDone = input.scriptDoneSeatIds ?? [];

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
      if (allHumansReady(humans, watched)) {
        return { nextPhase: "open" };
      }
      return { nextPhase: null };
    }
  }

  if (phase === "open") {
    if (event.type === "enter_script" || event.type === "ceo_force_advance") {
      return { nextPhase: "script" };
    }
    if (event.type === "enter_live") {
      return { nextPhase: "live" };
    }
  }

  if (phase === "script") {
    if (event.type === "enter_live" || event.type === "ceo_force_advance") {
      return { nextPhase: "live" };
    }
    if (event.type === "script_done") {
      if (!humans.includes(event.seatId)) {
        return { nextPhase: null };
      }
      const done = uniqueIds([...scriptDone, event.seatId]);
      if (allHumansReady(humans, done)) {
        return { nextPhase: "live" };
      }
      return { nextPhase: null };
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
 * How advisory pressure felt before the CEO commit — presentation / AI bias
 * only. Never selects `option.next` and never touches integrity.
 *
 * - aligned: every locked seat chose the same brief-side (all first chip, or
 *   all non-first). Abstains ignored when ≥2 locks agree.
 * - split: locked seats disagree on brief-side, or the room is thin
 *   (0–1 locks among recorded rows → conflicted / incomplete pressure).
 */
export type RoomStanceClimate = "aligned" | "split";

export type StanceClimateRecord = {
  seatId: string;
  status: "locked" | "abstain";
  chipKey: string | null;
};

export type StanceClimateInput = {
  /** Authored chips per advisor seat (CEO omitted). */
  authored: Readonly<Record<string, readonly PressureStanceChip[]>>;
  records: readonly StanceClimateRecord[];
};

/**
 * Classify the room's locked pressure as aligned vs split/conflicted.
 * Does not invent stances; abstain-only or sparse locks → split.
 */
export function evaluateRoomStanceClimate(
  input: StanceClimateInput,
): RoomStanceClimate {
  const lockedSides: Array<"brief" | "alt"> = [];
  for (const row of input.records) {
    if (row.status !== "locked" || !row.chipKey) continue;
    const chips = input.authored[row.seatId] ?? [];
    const idx = chips.findIndex((c) => c.key === row.chipKey);
    if (idx < 0) continue;
    lockedSides.push(idx === 0 ? "brief" : "alt");
  }
  if (lockedSides.length < 2) return "split";
  const first = lockedSides[0]!;
  return lockedSides.every((s) => s === first) ? "aligned" : "split";
}

/** Copy for the consequence film title card — same story beats, different frame. */
export function filmClimatePlace(climate: RoomStanceClimate): string {
  return climate === "aligned"
    ? "The room held one line"
    : "The room was already divided";
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
  evaluateRoomStanceClimate,
  filmClimatePlace,
  applyIntegrityLatch,
  resolveIntegrityAfterCeoCommit,
  buildAdvisorStanceSeats,
  pickBotStanceChip,
  isScenePhase,
  FILM_TIMEOUT_MS,
  STANCE_TIMEOUT_MS,
  HUMAN_MESSAGE_GATE,
  SCENE_PHASES,
} as const;
