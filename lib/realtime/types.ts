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

export type GroupSessionState = {
  sessionId: string;
  code: string;
  status: string;
  currentSceneId: string | null;
  decisionsMade: number;
  decisionCount: number;
  /** Monotonic clean → compromised (ADR 0003). */
  integrity: "clean" | "compromised";
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
