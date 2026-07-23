"use client";

import { useEffect } from "react";
import { createBrowserClient } from "@/lib/supabase/browser";

/**
 * Subscribe to session + message changes for many groups (batch board).
 * Falls back to caller polling when Supabase env is missing.
 */
export function useBatchRealtime(
  sessionIds: string[],
  onChange: () => void,
) {
  const key = sessionIds.slice().sort().join(",");

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey || sessionIds.length === 0) return;

    const supabase = createBrowserClient();
    const channels = sessionIds.map((sessionId) =>
      supabase
        .channel(`batch-board:${sessionId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "group_sessions",
            filter: `id=eq.${sessionId}`,
          },
          () => onChange(),
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "group_messages",
            filter: `session_id=eq.${sessionId}`,
          },
          () => onChange(),
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "group_participants",
            filter: `session_id=eq.${sessionId}`,
          },
          () => onChange(),
        )
        .subscribe(),
    );

    return () => {
      for (const ch of channels) {
        void supabase.removeChannel(ch);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onChange via stable refresh; key tracks ids
  }, [key]);
}
