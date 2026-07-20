"use client";

import { useEffect } from "react";
import { createBrowserClient } from "@/lib/supabase/browser";

type MessageRow = {
  id: number | string;
  role_key: string;
  sender_kind: string;
  content: string;
  scene_id: string;
  session_id: string;
};

/**
 * Subscribe to Supabase Realtime postgres_changes for a group session.
 * Clients read via anon + RLS; writes stay on server routes.
 */
export function useGroupRealtime(
  sessionId: string,
  handlers: {
    onChange?: () => void;
    onMessageInsert?: (row: MessageRow) => void;
  },
) {
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) return;

    const supabase = createBrowserClient();
    const channel = supabase
      .channel(`group:${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "group_messages",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          handlers.onMessageInsert?.(payload.new as MessageRow);
          handlers.onChange?.();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "group_participants",
          filter: `session_id=eq.${sessionId}`,
        },
        () => handlers.onChange?.(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "group_sessions",
          filter: `id=eq.${sessionId}`,
        },
        () => handlers.onChange?.(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handlers intentionally stable via refs in callers
  }, [sessionId]);
}
