"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { BatchBoardRow } from "@/lib/db/group-queries";
import { useBatchRealtime } from "@/lib/realtime/use-batch-realtime";
import { renameGroupAction } from "@/app/professor/groups/batch-actions";
import { gradeGroupAction } from "@/app/group/actions";
import { BusyButton } from "@/app/components/busy-button";
import { avatarTone, initials } from "@/app/components/chat/cast-avatar";
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
    <div className="h-0.5 w-full bg-border">
      <div
        className="h-full bg-accent transition-[width] duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function statusLabel(status: string, stalled: boolean): string {
  if (stalled) return "Stalled";
  if (status === "active") return "In meeting";
  if (status === "committed") return "Committed";
  if (status === "graded") return "Graded";
  if (status === "released") return "Released";
  return status;
}

function relativeTime(iso: string | null): string {
  if (!iso) return "No activity yet";
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return "Just now";
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
  return new Date(iso).toLocaleString();
}

function nextStep(row: BatchBoardRow): {
  label: string;
  hint: string;
  needsGrade: boolean;
} {
  if (row.status === "released") {
    return {
      label: "View released debrief",
      hint: "Students can see AI feedback.",
      needsGrade: false,
    };
  }
  if (row.status === "graded" || row.assessmentStatus) {
    return {
      label: "Review & release feedback",
      hint: "AI draft ready — release so the group can read it.",
      needsGrade: false,
    };
  }
  if (row.status === "committed") {
    return {
      label: "Open group",
      hint: "Finished — generate AI grade, then release to students.",
      needsGrade: true,
    };
  }
  if (row.status === "active") {
    return {
      label: "Open live transcript",
      hint: "Meeting in progress.",
      needsGrade: false,
    };
  }
  return {
    label: "Open group",
    hint: "Still in lobby.",
    needsGrade: false,
  };
}

function MemberAvatars({ row }: { row: BatchBoardRow }) {
  const humans = row.members.filter((m) => !m.isAi).slice(0, 5);
  if (humans.length === 0) {
    return <span className="text-[11px] text-muted-foreground">—</span>;
  }
  return (
    <div className="flex">
      {humans.map((m) => {
        const tone = avatarTone(m.roleKey);
        return (
          <span
            key={m.roleKey}
            className="-mr-1.5 flex h-[22px] w-[22px] items-center justify-center rounded-full border-[1.5px] border-background text-[8.5px] font-semibold"
            style={{ background: tone.bg, color: tone.fg }}
            title={m.name}
          >
            {initials(m.name)}
          </span>
        );
      })}
    </div>
  );
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
  const [refreshing, setRefreshing] = useState(false);
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

  const manualRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);

  useEffect(() => {
    const id = setInterval(() => void refresh(), 4000);
    return () => clearInterval(id);
  }, [refresh]);

  const sessionIds = rows.map((r) => r.sessionId);
  useBatchRealtime(sessionIds, () => void refresh());

  const stats = useMemo(() => {
    const active = rows.filter(
      (r) => r.status === "active" || r.status === "lobby",
    ).length;
    const inMeeting = rows.filter((r) => r.status === "active").length;
    const committed = rows.filter((r) => r.status === "committed").length;
    const stalled = rows.filter((r) => r.stalled).length;
    return [
      { label: "Groups active", value: active },
      { label: "In meeting", value: inMeeting },
      { label: "Committed", value: committed },
      {
        label: "Stalled",
        value: stalled,
        attention: stalled > 0,
      },
    ];
  }, [rows]);

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

  async function gradeSession(sessionId: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
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

  const liveLabel = updatedAt
    ? new Date(updatedAt).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      })
    : "now";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-end gap-3">
        <div className="flex items-center gap-2 border border-border px-3 py-2">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
          <p className="text-xs text-muted-foreground">
            Live · updated {liveLabel}
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 border border-border px-4 py-2.5 text-[12.5px] text-foreground transition-colors hover:border-muted-foreground hover:bg-background"
          onClick={() => void manualRefresh()}
          disabled={refreshing}
        >
          {refreshing ? (
            <span
              className="inline-block h-[11px] w-[11px] animate-spin rounded-full border-2 border-foreground/20 border-t-foreground"
              aria-hidden
            />
          ) : null}
          Refresh
        </button>
      </div>

      {gradeError ? (
        <p className="text-sm text-muted-foreground" role="alert">
          {gradeError}
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-px border border-border bg-border lg:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="flex flex-col gap-1.5 bg-surface px-5 py-4"
          >
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              {s.label}
            </p>
            <p
              className={`font-serif text-3xl font-medium ${
                "attention" in s && s.attention
                  ? "text-attention"
                  : "text-foreground"
              }`}
            >
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <ul className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {rows.map((row) => {
          const href = `/professor/groups/${row.sessionId}?batch=${batchId}`;
          const isRenaming = renamingId === row.sessionId;
          const step = nextStep(row);
          const grading = gradingId === row.sessionId;
          const needsGrade =
            row.status === "committed" && !row.assessmentStatus;
          const leftAccent = row.stalled
            ? "border-l-attention"
            : needsGrade
              ? "border-l-accent"
              : "border-l-transparent";

          return (
            <li key={row.sessionId}>
              <Link
                href={href}
                className={`group flex h-full flex-col gap-3.5 border border-border border-l-2 bg-surface p-4 transition-[border-color,transform] hover:-translate-y-0.5 hover:border-muted-foreground ${leftAccent}`}
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
                        onClick={(e) => e.preventDefault()}
                        onChange={(e) => rename(row.sessionId, e.target.value)}
                        onBlur={() => setRenamingId(null)}
                        onKeyDown={(e) => {
                          e.stopPropagation();
                          if (e.key === "Enter" || e.key === "Escape") {
                            setRenamingId(null);
                          }
                        }}
                      />
                    ) : (
                      <p className="truncate font-serif text-lg font-medium text-foreground">
                        {row.displayName}
                      </p>
                    )}
                  </div>
                  <span
                    className={`shrink-0 border px-1.5 py-0.5 text-[9px] uppercase tracking-[0.14em] ${
                      row.stalled
                        ? "border-attention/40 text-attention"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    {statusLabel(row.status, row.stalled)}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-baseline justify-between gap-2 text-[12.5px]">
                    <p className="text-muted-foreground">
                      Decision {row.decisionsMade} of {row.decisionCount}
                    </p>
                    <p className="text-[11.5px] text-muted-foreground">
                      {row.joinedSeats}/{row.humanSeats} joined
                    </p>
                  </div>
                  <ProgressBar
                    made={row.decisionsMade}
                    total={row.decisionCount}
                  />
                </div>

                <p className="line-clamp-2 min-h-[34px] text-xs leading-relaxed text-muted-foreground">
                  {row.currentSceneTitle ?? row.currentSceneId ?? "—"}
                </p>

                <div className="flex items-center justify-between gap-2 border-t border-border pt-2.5">
                  <MemberAvatars row={row} />
                  <p
                    className={`text-[11px] ${
                      row.stalled ? "text-attention" : "text-muted-foreground"
                    }`}
                  >
                    {relativeTime(row.lastMessageAt)}
                  </p>
                </div>

                {step.needsGrade ? (
                  <div
                    className="flex flex-wrap items-center gap-2 border-t border-border pt-2"
                    onClick={(e) => e.preventDefault()}
                  >
                    <BusyButton
                      type="button"
                      pending={grading}
                      pendingLabel="Grading…"
                      disabled={Boolean(gradingId) && !grading}
                      className="border border-transparent bg-accent px-3 py-1.5 text-xs text-accent-foreground disabled:opacity-40"
                      onClick={(e) => void gradeSession(row.sessionId, e)}
                    >
                      Generate AI grade
                    </BusyButton>
                  </div>
                ) : null}
              </Link>
              {!isRenaming ? (
                <button
                  type="button"
                  className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground underline"
                  onClick={() => setRenamingId(row.sessionId)}
                >
                  Rename
                </button>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
