"use client";

import { useCallback, useEffect, useState } from "react";
import { useGroupRealtime } from "@/lib/realtime/use-group-realtime";
import { startMeetingAction } from "@/app/group/actions";
import { GROUP_ROLES, type SeatKey } from "@/lib/case/group-roles";

type Participant = {
  id: string;
  roleKey: string;
  isAi: boolean;
  displayName: string | null;
  isReady: boolean;
  joined: boolean;
};

export function ProfessorLiveLobby({
  sessionId,
  status: initialStatus,
}: {
  sessionId: string;
  status: string;
}) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [status, setStatus] = useState(initialStatus);
  const [error, setError] = useState<string | null>(null);
  const [forcing, setForcing] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/group/${sessionId}/state?after=0`);
      if (!res.ok) return;
      const data = await res.json();
      setParticipants(data.participants ?? []);
      setStatus(data.status);
    } catch {
      // ignore
    }
  }, [sessionId]);

  useEffect(() => {
    void refresh();
    const id = setInterval(() => void refresh(), 4000);
    return () => clearInterval(id);
  }, [refresh]);

  useGroupRealtime(sessionId, { onChange: () => void refresh() });

  const humans = participants.filter((p) => !p.isAi);
  const ready = humans.filter((p) => p.joined && p.isReady).length;

  if (status !== "lobby" && status !== "active") {
    return null;
  }

  return (
    <section className="mt-10">
      <h2 className="text-sm font-medium text-foreground">Live lobby</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        {ready} / {humans.length || "—"} ready · updates via Realtime
      </p>
      <ul className="mt-4 space-y-2 text-sm">
        {participants.map((p) => (
          <li key={p.id} className="flex justify-between gap-2 border-b border-border py-2">
            <span>
              {GROUP_ROLES[p.roleKey as SeatKey]?.title ?? p.roleKey}
            </span>
            <span className="text-muted-foreground">
              {p.isAi
                ? "AI"
                : p.joined
                  ? `${p.displayName ?? "Joined"}${p.isReady ? " · ready" : ""}`
                  : "Waiting…"}
            </span>
          </li>
        ))}
      </ul>
      {status === "lobby" ? (
        <button
          type="button"
          disabled={forcing}
          className="mt-4 border border-border px-4 py-2 text-sm disabled:opacity-50"
          onClick={() => {
            setForcing(true);
            setError(null);
            void startMeetingAction(sessionId, true)
              .then(() => refresh())
              .catch((err) =>
                setError(err instanceof Error ? err.message : "Force start failed"),
              )
              .finally(() => setForcing(false));
          }}
        >
          Force start
        </button>
      ) : null}
      {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
    </section>
  );
}
