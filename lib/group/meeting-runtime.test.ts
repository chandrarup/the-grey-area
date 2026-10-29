/**
 * Seam under test: GroupMeetingRuntime (lib/group/meeting-runtime.ts)
 * Covers scene-phase transitions, pressure-stance readiness, CEO commit gates,
 * and integrity latch — no UI/R3F.
 */
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  evaluatePhaseTransition,
  evaluateStanceReadiness,
  evaluateCeoCommitGate,
  applyIntegrityLatch,
  resolveIntegrityAfterCeoCommit,
  buildAdvisorStanceSeats,
  pickBotStanceChip,
  STANCE_TIMEOUT_MS,
  FILM_TIMEOUT_MS,
  HUMAN_MESSAGE_GATE,
  type ScenePhase,
  type PhaseEvent,
  type AdvisorStanceSeat,
  type Integrity,
} from "./meeting-runtime";

describe("evaluatePhaseTransition", () => {
  const humans = ["ceo", "marcus", "priya"] as const;

  const cases: {
    name: string;
    phase: ScenePhase;
    watchedSeatIds?: readonly string[];
    scriptDoneSeatIds?: readonly string[];
    event: PhaseEvent;
    expected: ScenePhase | null;
  }[] = [
    {
      name: "decided + begin_film → film",
      phase: "decided",
      event: { type: "begin_film" },
      expected: "film",
    },
    {
      name: "film + all humans watched → open",
      phase: "film",
      watchedSeatIds: ["ceo", "marcus", "priya"],
      event: { type: "film_watched", seatId: "priya" },
      expected: "open",
    },
    {
      name: "film + partial watched stays film",
      phase: "film",
      watchedSeatIds: ["ceo"],
      event: { type: "film_watched", seatId: "marcus" },
      expected: null,
    },
    {
      name: "film + timeout → open",
      phase: "film",
      watchedSeatIds: [],
      event: { type: "film_timeout" },
      expected: "open",
    },
    {
      name: "film + ceo_force_advance → open",
      phase: "film",
      watchedSeatIds: ["ceo"],
      event: { type: "ceo_force_advance" },
      expected: "open",
    },
    {
      name: "open + enter_script → script",
      phase: "open",
      event: { type: "enter_script" },
      expected: "script",
    },
    {
      name: "open + enter_live → live (no-script bypass)",
      phase: "open",
      event: { type: "enter_live" },
      expected: "live",
    },
    {
      name: "open + ceo_force_advance → script",
      phase: "open",
      event: { type: "ceo_force_advance" },
      expected: "script",
    },
    {
      name: "script + all humans done → live",
      phase: "script",
      scriptDoneSeatIds: ["ceo", "marcus"],
      event: { type: "script_done", seatId: "priya" },
      expected: "live",
    },
    {
      name: "script + partial done stays script",
      phase: "script",
      scriptDoneSeatIds: ["ceo"],
      event: { type: "script_done", seatId: "marcus" },
      expected: null,
    },
    {
      name: "script + enter_live → live",
      phase: "script",
      event: { type: "enter_live" },
      expected: "live",
    },
    {
      name: "script + ceo_force_advance → live",
      phase: "script",
      event: { type: "ceo_force_advance" },
      expected: "live",
    },
    {
      name: "live ignores film_timeout",
      phase: "live",
      event: { type: "film_timeout" },
      expected: null,
    },
    {
      name: "film_watched for unknown seat does not advance",
      phase: "film",
      watchedSeatIds: ["ceo", "marcus"],
      event: { type: "film_watched", seatId: "stranger" },
      expected: null,
    },
    {
      name: "script_done for unknown seat does not advance",
      phase: "script",
      scriptDoneSeatIds: ["ceo", "marcus"],
      event: { type: "script_done", seatId: "stranger" },
      expected: null,
    },
  ];

  for (const c of cases) {
    test(c.name, () => {
      const result = evaluatePhaseTransition({
        phase: c.phase,
        humanSeatIds: [...humans],
        watchedSeatIds: c.watchedSeatIds ?? [],
        scriptDoneSeatIds: c.scriptDoneSeatIds ?? [],
        event: c.event,
      });
      assert.equal(result.nextPhase, c.expected);
    });
  }

  test("FILM_TIMEOUT_MS is ~90s for hard-sync window", () => {
    assert.equal(FILM_TIMEOUT_MS, 90_000);
  });
});

describe("evaluateStanceReadiness", () => {
  const cases: {
    name: string;
    seats: AdvisorStanceSeat[];
    expectedReady: boolean;
    expectedPending: string[];
  }[] = [
    {
      name: "all human advisors locked → ready",
      seats: [
        { seatId: "marcus", kind: "human", status: "locked" },
        { seatId: "priya", kind: "human", status: "locked" },
      ],
      expectedReady: true,
      expectedPending: [],
    },
    {
      name: "abstain counts as ready",
      seats: [
        { seatId: "marcus", kind: "human", status: "abstain" },
        { seatId: "priya", kind: "human", status: "locked" },
      ],
      expectedReady: true,
      expectedPending: [],
    },
    {
      name: "pending human advisor blocks readiness",
      seats: [
        { seatId: "marcus", kind: "human", status: "pending" },
        { seatId: "priya", kind: "human", status: "locked" },
      ],
      expectedReady: false,
      expectedPending: ["marcus"],
    },
    {
      name: "bot seats do not block; only humans matter",
      seats: [
        { seatId: "marcus", kind: "human", status: "locked" },
        { seatId: "tom", kind: "bot", status: "pending" },
        { seatId: "david", kind: "bot", status: "locked" },
      ],
      expectedReady: true,
      expectedPending: [],
    },
    {
      name: "no human advisors → ready",
      seats: [{ seatId: "tom", kind: "bot", status: "pending" }],
      expectedReady: true,
      expectedPending: [],
    },
  ];

  for (const c of cases) {
    test(c.name, () => {
      const result = evaluateStanceReadiness({ advisors: c.seats });
      assert.equal(result.allHumanAdvisorsReady, c.expectedReady);
      assert.deepEqual(result.pendingHumanSeatIds, c.expectedPending);
    });
  }
});

describe("evaluateCeoCommitGate", () => {
  const cases: {
    name: string;
    humanMessageCount: number;
    allHumanAdvisorsReady: boolean;
    canCommit: boolean;
  }[] = [
    {
      name: "messages and stances both pass",
      humanMessageCount: HUMAN_MESSAGE_GATE,
      allHumanAdvisorsReady: true,
      canCommit: true,
    },
    {
      name: "above gate with readiness passes",
      humanMessageCount: HUMAN_MESSAGE_GATE + 2,
      allHumanAdvisorsReady: true,
      canCommit: true,
    },
    {
      name: "under message gate blocked",
      humanMessageCount: HUMAN_MESSAGE_GATE - 1,
      allHumanAdvisorsReady: true,
      canCommit: false,
    },
    {
      name: "stances not ready blocked even with messages",
      humanMessageCount: HUMAN_MESSAGE_GATE,
      allHumanAdvisorsReady: false,
      canCommit: false,
    },
    {
      name: "both gates fail",
      humanMessageCount: 0,
      allHumanAdvisorsReady: false,
      canCommit: false,
    },
  ];

  for (const c of cases) {
    test(c.name, () => {
      const result = evaluateCeoCommitGate({
        humanMessageCount: c.humanMessageCount,
        allHumanAdvisorsReady: c.allHumanAdvisorsReady,
      });
      assert.equal(result.canCommit, c.canCommit);
      assert.equal(HUMAN_MESSAGE_GATE, 6);
    });
  }
});

describe("applyIntegrityLatch", () => {
  const cases: {
    name: string;
    current: Integrity;
    isCompromise: boolean;
    expected: Integrity;
  }[] = [
    {
      name: "compromise commit latches clean → compromised",
      current: "clean",
      isCompromise: true,
      expected: "compromised",
    },
    {
      name: "non-compromise leaves clean",
      current: "clean",
      isCompromise: false,
      expected: "clean",
    },
    {
      name: "already compromised stays compromised on clean option",
      current: "compromised",
      isCompromise: false,
      expected: "compromised",
    },
    {
      name: "already compromised stays on further compromise",
      current: "compromised",
      isCompromise: true,
      expected: "compromised",
    },
  ];

  for (const c of cases) {
    test(c.name, () => {
      assert.equal(
        applyIntegrityLatch(c.current, { isCompromise: c.isCompromise }),
        c.expected,
      );
    });
  }
});

/**
 * Commit-path smoke (no DB): mirrors how commitGroupDecision resolves latch
 * from persisted session.integrity + option.isCompromise. Stances never call this.
 */
describe("resolveIntegrityAfterCeoCommit (commit path)", () => {
  const cases: {
    name: string;
    sessionIntegrity: string | null | undefined;
    isCompromise: boolean;
    expected: Integrity;
  }[] = [
    {
      name: "new session null integrity + non-compromise stays clean",
      sessionIntegrity: null,
      isCompromise: false,
      expected: "clean",
    },
    {
      name: "undefined integrity + compromise latches",
      sessionIntegrity: undefined,
      isCompromise: true,
      expected: "compromised",
    },
    {
      name: "clean + compromise latches",
      sessionIntegrity: "clean",
      isCompromise: true,
      expected: "compromised",
    },
    {
      name: "clean + non-compromise stays clean",
      sessionIntegrity: "clean",
      isCompromise: false,
      expected: "clean",
    },
    {
      name: "compromised + non-compromise cannot restore clean",
      sessionIntegrity: "compromised",
      isCompromise: false,
      expected: "compromised",
    },
    {
      name: "junk persisted value treated as clean until compromise",
      sessionIntegrity: "unknown",
      isCompromise: false,
      expected: "clean",
    },
  ];

  for (const c of cases) {
    test(c.name, () => {
      assert.equal(
        resolveIntegrityAfterCeoCommit(c.sessionIntegrity, c.isCompromise),
        c.expected,
      );
    });
  }

  test("stance-shaped input is not a latch API (commit uses isCompromise only)", () => {
    // Pressure stances must never call resolveIntegrityAfterCeoCommit.
    // Documented contract: only CEO commit path passes isCompromise.
    const afterStanceWouldHaveBeen = resolveIntegrityAfterCeoCommit(
      "clean",
      false,
    );
    assert.equal(afterStanceWouldHaveBeen, "clean");
  });
});

describe("STANCE_TIMEOUT_MS", () => {
  test("~2 min window before human advisor Abstain", () => {
    assert.equal(STANCE_TIMEOUT_MS, 120_000);
  });
});

describe("pickBotStanceChip", () => {
  const chips = [
    { key: "meet", label: "Meet Salim tonight" },
    { key: "diligence", label: "Diligence in parallel" },
    { key: "walk", label: "Walk if unclear" },
  ] as const;

  test("bots lock the first authored chip (brief-aligned default)", () => {
    assert.deepEqual(pickBotStanceChip(chips), {
      key: "meet",
      label: "Meet Salim tonight",
    });
  });

  test("empty chip list yields null (caller must not auto-stance)", () => {
    assert.equal(pickBotStanceChip([]), null);
  });
});

describe("buildAdvisorStanceSeats", () => {
  test("maps locked/abstain/pending; CEO never included; bots ignore missing rows as pending", () => {
    const seats = buildAdvisorStanceSeats({
      advisorSeats: [
        { seatId: "marcus", kind: "human" },
        { seatId: "david", kind: "bot" },
        { seatId: "priya", kind: "human" },
        { seatId: "tom", kind: "bot" },
      ],
      records: [
        { seatId: "marcus", status: "locked" },
        { seatId: "priya", status: "abstain" },
        { seatId: "tom", status: "locked" },
      ],
    });
    assert.deepEqual(seats, [
      { seatId: "marcus", kind: "human", status: "locked" },
      { seatId: "david", kind: "bot", status: "pending" },
      { seatId: "priya", kind: "human", status: "abstain" },
      { seatId: "tom", kind: "bot", status: "locked" },
    ]);
  });

  test("missing human record stays pending so commit gate stays closed", () => {
    const seats = buildAdvisorStanceSeats({
      advisorSeats: [{ seatId: "marcus", kind: "human" }],
      records: [],
    });
    const ready = evaluateStanceReadiness({ advisors: seats });
    assert.equal(ready.allHumanAdvisorsReady, false);
    assert.deepEqual(ready.pendingHumanSeatIds, ["marcus"]);
  });
});
