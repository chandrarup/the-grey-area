"use client";


type MessageRow = {
  id: number | string;
  role_key: string;
  sender_kind: string;
  content: string;
  scene_id: string;
  session_id: string;
};

/**
 * Compatibility hook while meetings use their seat-authenticated polling loop.
 */
export function useGroupRealtime(
  sessionId: string,
  handlers: {
    onChange?: () => void;
    onMessageInsert?: (row: MessageRow) => void;
  },
) {
  // Every consumer has its own authenticated state polling loop. Anonymous
  // postgres_changes subscriptions exposed other groups and seat tokens.
  void sessionId;
  void handlers;
}
