"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import type { BatchBoardRow } from "@/lib/db/group-queries";
import { useBatchRealtime } from "@/lib/realtime/use-batch-realtime";
import { renameGroupAction } from "@/app/professor/groups/batch-actions";
import { gradeGroupAction } from "@/app/group/actions";
import { BusyButton } from "@/app/components/busy-button";
import { withBusyBar } from "@/app/components/navigation-progress";

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
  if (status === "graded" || status === "committed") return "text-foreground";
  if (status === "active") return "text-foreground";
  return "text-muted-foreground";
}

function relativeTime(iso: string | null): string {
  if (!iso) return "no activity yet";
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return "just now";
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
  return new Date(iso).toLocaleString();
}

function seatSummary(row: BatchBoardRow): string {
  const emailed = row.inviteSent + row.inviteFailed;
  const parts = [
    `${row.joinedSeats}/${row.humanSeats} joined`,
    `${row.inviteSent} emailed`,
  ];
  if (row.inviteFailed > 0) parts.push(`${row.inviteFailed} failed`);
  if (emailed === 0 && row.invitePending > 0) {
    return `${row.joinedSeats}/${row.humanSeats} joined · 0 emailed`;
  }
  return parts.join(" · ");
}

function nextStep(row: BatchBoardRow): {
  label: string;
  hint: string;
  needsGrade: boolean;
} {
  if (row.status === "released") {
    return {
      label: "View released debrief →",
      hint: "Students can see AI feedback.",
      needsGrade: false,
    };
  }
  if (row.status === "graded" || row.assessmentStatus) {
    return {
      label: "Review & release feedback →",
      hint: "AI draft ready — release so the group can read it.",
      needsGrade: false,
    };
  }
  if (row.status === "committed") {
    return {
      label: "Open group →",
      hint: "Finished — generate AI grade, then release to students.",
      needsGrade: true,
    };
  }
  if (row.status === "active") {
    return {
      label: "Open live transcript →",
      hint: "Meeting in progress.",
      needsGrade: false,
    };
  }
  return {
    label: "Open group →",
    hint: "Still in lobby.",
    needsGrade: false,
  };
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
  const [pending, startTransition] = useTransition();
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [gradingId, setGradingId] = useState<string | null>(null);
  const [gradeError, setGradeError] = useState<string | null>(null);

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
  const renameTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>(
    {},
  );

  function rename(sessionId: string, displayName: string) {
    setRows((prev) =>
      prev.map((r) =>
        r.sessionId === sessionId ? { ...r, displayName } : r,
      ),
    );
    const existing = renameTimers.current[sessionId];
    if (existing) clearTimeout(existing);
    renameTimers.current[sessionId] = setTimeout(() => {
      startTransition(async () => {
        try {
          await renameGroupAction(sessionId, displayName, batchId);
        } catch {
          void refresh();
        }
      });
    }, 500);
  }

  async function gradeSession(sessionId: string) {
    if (gradingId) return;
    setGradeError(null);
    setGradingId(sessionId);
    try {
      await withBusyBar(async () => {
        await gradeGroupAction(sessionId);
        await refresh();
      });
    } catch (err) {
      setGradeError(
        err instanceof Error ? err.message : "Could not generate AI grade",
      );
    } finally {
      setGradingId(null);
    }
  }

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
            {" · click a group name to open transcript & feedback"}
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

      {gradeError ? (
        <p className="text-sm text-red-700 dark:text-red-400" role="alert">
          {gradeError}
        </p>
      ) : null}

      <ul className="grid gap-3 sm:grid-cols-2">
        {rows.map((row) => {
          const href = `/professor/groups/${row.sessionId}?batch=${batchId}`;
          const isRenaming = renamingId === row.sessionId;
          const step = nextStep(row);
          const grading = gradingId === row.sessionId;
          return (
            <li
              key={row.sessionId}
              className={`border border-border p-4 transition-colors hover:border-accent/60 ${
                row.stalled ? "border-l-2 border-l-amber-600" : ""
              } ${
                row.status === "committed" && !row.assessmentStatus
                  ? "border-l-2 border-l-accent"
                  : ""
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  {isRenaming ? (
                    <input
                      className="w-full border-0 border-b border-border bg-transparent font-serif text-lg text-foreground outline-none"
                      value={row.displayName}
                      aria-label="Group name"
                      autoFocus
                      disabled={pending}
                      onChange={(e) => rename(row.sessionId, e.target.value)}
                      onBlur={() => setRenamingId(null)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === "Escape") {
                          setRenamingId(null);
                        }
                      }}
                    />
                  ) : (
                    <div className="flex flex-wrap items-baseline gap-2">
                      <Link
                        href={href}
                        className="font-serif text-lg text-foreground underline-offset-2 hover:underline"
                      >
                        {row.displayName}
                      </Link>
                      <button
                        type="button"
                        className="text-[10px] uppercase tracking-wide text-muted-foreground underline"
                        onClick={(e) => {
                          e.preventDefault();
                          setRenamingId(row.sessionId);
                        }}
                      >
                        Rename
                      </button>
                    </div>
                  )}
                  <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                    code {row.code}
                  </p>
                  <p
                    className={`mt-1 text-xs uppercase tracking-wide ${statusTone(row.status, row.stalled)}`}
                  >
                    {row.stalled ? "stalled · " : ""}
                    {row.status}
                  </p>
                </div>
                <p className="max-w-[9rem] shrink-0 text-right text-xs text-muted-foreground">
                  {seatSummary(row)}
                </p>
              </div>

              <p className="mt-3 text-sm text-foreground">
                Scene:{" "}
                {row.currentSceneTitle ?? row.currentSceneId ?? "—"}
                <span className="text-muted-foreground">
                  {" "}
                  · decision {row.decisionsMade}/{row.decisionCount}
                </span>
              </p>
              <ProgressBar made={row.decisionsMade} total={row.decisionCount} />

              <p className="mt-3 text-xs text-muted-foreground">
                Last activity: {relativeTime(row.lastMessageAt)}
                {row.messageCount ? ` · ${row.messageCount} messages` : ""}
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

              <p className="mt-3 text-xs text-muted-foreground">{step.hint}</p>

              <div className="mt-2 flex flex-wrap items-center gap-3">
                <Link
                  href={href}
                  className="inline-block text-xs font-medium text-foreground underline"
                >
                  {step.label}
                </Link>
                {step.needsGrade ? (
                  <BusyButton
                    type="button"
                    pending={grading}
                    pendingLabel="Grading…"
                    disabled={Boolean(gradingId) && !grading}
                    className="border border-transparent bg-accent px-3 py-1.5 text-xs text-accent-foreground disabled:opacity-40"
                    onClick={() => void gradeSession(row.sessionId)}
                  >
                    Generate AI grade
                  </BusyButton>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
