"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { BatchBoardRow } from "@/lib/db/group-queries";
import { useBatchRealtime } from "@/lib/realtime/use-batch-realtime";

function ProgressBar({
  made,
  total,
}: {
  made: number;
  total: number;
}) {
  const pct = total > 0 ? Math.min(100, Math.round((made / total) * 100)) : 0;
  return (
    <div className="mt-2 h-1.5 w-full bg-border">
      <div
        className="h-full bg-accent transition-[width] duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function statusTone(status: string, stalled: boolean): string {
  if (stalled) return "text-amber-800 dark:text-amber-400";
  if (status === "released") return "text-emerald-800 dark:text-emerald-400";
  if (status === "active") return "text-foreground";
  return "text-muted-foreground";
}

export function BatchBoardClient({
  batchId,
  initialRows,
}: {
  batchId: string;
  initialRows: BatchBoardRow[];
}) {
  const [rows, setRows] = useState(initialRows);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/professor/batch/${batchId}/board`);
      if (!res.ok) return;
      const data = (await res.json()) as {
        rows: BatchBoardRow[];
        updatedAt: string;
      };
      setRows(data.rows);
      setUpdatedAt(data.updatedAt);
    } catch {
      // ignore transient poll errors
    }
  }, [batchId]);

  useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);

  useEffect(() => {
    const id = setInterval(() => void refresh(), 4000);
    return () => clearInterval(id);
  }, [refresh]);

  const sessionIds = rows.map((r) => r.sessionId);
  useBatchRealtime(sessionIds, () => void refresh());

  const stalledCount = rows.filter((r) => r.stalled).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-sm font-medium text-foreground">Live board</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {rows.length} groups
            {stalledCount > 0 ? ` · ${stalledCount} stalled` : ""}
            {updatedAt
              ? ` · updated ${new Date(updatedAt).toLocaleTimeString()}`
              : " · live"}
          </p>
        </div>
        <button
          type="button"
          className="border border-border px-3 py-1.5 text-xs"
          onClick={() => void refresh()}
        >
          Refresh
        </button>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        {rows.map((row) => (
          <li
            key={row.sessionId}
            className={`border border-border p-4 ${
              row.stalled ? "border-l-2 border-l-amber-600" : ""
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <Link
                  href={`/professor/groups/${row.sessionId}?batch=${batchId}`}
                  className="font-mono text-sm font-medium text-foreground underline-offset-2 hover:underline"
                >
                  {row.code}
                </Link>
                <p
                  className={`mt-0.5 text-xs uppercase tracking-wide ${statusTone(row.status, row.stalled)}`}
                >
                  {row.stalled ? "stalled · " : ""}
                  {row.status}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                {row.joinedSeats}/{row.humanSeats} joined
              </p>
            </div>

            <p className="mt-3 text-sm text-foreground">
              Decision {row.decisionsMade}/{row.decisionCount}
              {row.currentSceneTitle ? (
                <span className="text-muted-foreground">
                  {" "}
                  · {row.currentSceneTitle}
                </span>
              ) : null}
            </p>
            <ProgressBar made={row.decisionsMade} total={row.decisionCount} />

            <p className="mt-3 text-xs text-muted-foreground">
              {row.messageCount} messages
              {row.lastMessageAt
                ? ` · last ${new Date(row.lastMessageAt).toLocaleTimeString()}`
                : " · no messages yet"}
              {row.assessmentStatus
                ? ` · assessment ${row.assessmentStatus}`
                : ""}
            </p>

            <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
              {row.members
                .filter((m) => !m.isAi)
                .map((m) => m.name)
                .join(" · ") || "—"}
            </p>

            <Link
              href={`/professor/groups/${row.sessionId}?batch=${batchId}`}
              className="mt-3 inline-block text-xs underline"
            >
              Open group →
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
