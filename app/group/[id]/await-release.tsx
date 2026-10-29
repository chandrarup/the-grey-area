"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const POLL_MS = 8000;

/** Refreshes the concluded-meeting page once the professor releases the debrief. */
export function AwaitRelease({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  useEffect(() => {
    let stopped = false;
    const id = window.setInterval(async () => {
      try {
        const res = await fetch(`/api/group/${sessionId}/state?after=999999999`);
        if (!res.ok) return;
        const state = (await res.json()) as { status?: string };
        if (!stopped && state.status === "released") router.refresh();
      } catch {
        /* offline — try again next tick */
      }
    }, POLL_MS);
    return () => {
      stopped = true;
      window.clearInterval(id);
    };
  }, [sessionId, router]);
  return null;
}
