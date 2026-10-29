/**
 * Transport-agnostic realtime event shapes.
 * Today: delivered via JSON state poll.
 * Later: same events can be published over Ably/WebSocket without rewriting meeting reducers.
 */

export type RealtimeMessage = {
  id: number;
  roleKey: string;
  senderKind: string;
  content: string;
  sceneId: string;
};

export type RealtimeParticipant = {
  id: string;
  roleKey: string;
  isAi: boolean;
  displayName: string | null;
  isReady: boolean;
  joined: boolean;
};

/** Persisted pressure stance for one advisor seat (ADR 0002). */
export type RealtimePressureStance = {
  roleKey: string;
  status: "locked" | "abstain";
  chipKey: string | null;
  chipLabel: string | null;
  note: string | null;
};

export type GroupSessionState = {
  sessionId: string;
  code: string;
  status: string;
  currentSceneId: string | null;
  decisionsMade: number;
  decisionCount: number;
  /** Monotonic clean → compromised (ADR 0003). */
  integrity: "clean" | "compromised";
  /** Hard-synced scene phase (ADR 0001). */
  scenePhase: string;
  /** ISO deadline for film window; null outside a timed phase. */
  phaseDeadlineAt: string | null;
  /** ISO deadline for human advisor stance window; null when not timing. */
  stanceDeadlineAt: string | null;
  filmWatchedSeatIds: string[];
  scriptDoneSeatIds: string[];
  /** Locked / abstain pressure stances for the current scene. */
  stances: RealtimePressureStance[];
  roleplayModel: string;
  graderModel: string;
  cursor: number;
  messages: RealtimeMessage[];
  participants: RealtimeParticipant[];
  thinkingRoleKeys: string[];
  expiresAt: string;
  msRemaining: number;
  updatedAt: string;
};
