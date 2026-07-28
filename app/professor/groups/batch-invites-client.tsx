"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import type { BatchRosterResultRow } from "@/lib/db/group-queries";
import type { InviteEnvCheck } from "@/lib/email/types";
import { GROUP_ROLES, type SeatKey } from "@/lib/case/group-roles";
import {
  invitePreflightAction,
  refreshBatchRosterAction,
  resendInviteAction,
  sendBatchInvitesAction,
  sendTestInviteAction,
} from "@/app/professor/groups/batch-actions";
import { BusyButton } from "@/app/components/busy-button";
import { withBusyBar } from "@/app/components/navigation-progress";

function appBaseUrl() {
  if (typeof window === "undefined") return "";
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") {
    return window.location.origin;
  }
  return (
    process.env.NEXT_PUBLIC_APP_BASE_URL?.replace(/\/$/, "") ||
    window.location.origin
  );
}

function joinUrl(token: string) {
  return `${appBaseUrl()}/?join=${encodeURIComponent(token)}`;
}

export function BatchInvitesClient({
  batchId,
  initialRoster,
  initialPreflight,
}: {
  batchId: string;
  initialRoster: BatchRosterResultRow[];
  initialPreflight: InviteEnvCheck;
}) {
  const [roster, setRoster] = useState(initialRoster);
  const [preflight, setPreflight] = useState(initialPreflight);
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteNote, setInviteNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [testTo, setTestTo] = useState("");
  const [, startTransition] = useTransition();

  useEffect(() => {
    setRoster(initialRoster);
  }, [initialRoster]);

  useEffect(() => {
    startTransition(async () => {
      try {
        setPreflight(await invitePreflightAction());
      } catch {
        /* ignore */
      }
    });
  }, [startTransition]);

  const counts = useMemo(
    () => ({
      pending: roster.filter((r) => r.inviteStatus === "pending").length,
      sent: roster.filter((r) => r.inviteStatus === "sent").length,
      failed: roster.filter((r) => r.inviteStatus === "failed").length,
    }),
    [roster],
  );

  const allLines = roster
    .map(
      (r) =>
        `${r.name}\t${r.email}\t${r.groupDisplayName}\t${r.groupCode}\t${GROUP_ROLES[r.roleKey as SeatKey]?.title ?? r.roleKey}\t${joinUrl(r.joinToken)}`,
    )
    .join("\n");

  async function copyText(label: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      setCopied("failed");
    }
  }

  async function runInvites(mode: "pending" | "failed") {
    setInviteBusy(true);
    setInviteNote(null);
    setError(null);
    try {
      await withBusyBar(async () => {
        const { results, roster: next, preflight: pf } =
          await sendBatchInvitesAction(batchId, mode);
        setPreflight(pf);
        setRoster(next);
        const sent = results.filter((r) => r.status === "sent").length;
        const failed = results.filter((r) => r.status === "failed");
        const failDetail = failed
          .slice(0, 3)
          .map((r) => `${r.intendedEmail}: ${r.error ?? "failed"}`)
          .join(" · ");
        setInviteNote(
          results.length === 0
            ? "Nothing to send."
            : `Sent ${sent}${failed.length ? ` · ${failed.length} failed` : ""}${
                failDetail ? ` — ${failDetail}` : ""
              }`,
        );
        if (failed.length && !sent) {
          setError(
            failed[0]?.error ??
              "All invites failed. See per-row errors below.",
          );
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invite send failed");
    } finally {
      setInviteBusy(false);
    }
  }

  async function resendOne(participantId: string) {
    setInviteBusy(true);
    setError(null);
    try {
      await withBusyBar(async () => {
        const { result } = await resendInviteAction(participantId);
        setRoster((rows) =>
          rows.map((r) =>
            r.participantId === participantId
              ? {
                  ...r,
                  inviteStatus: result.status,
                  inviteError: result.error ?? null,
                  invitedAt: new Date().toISOString(),
                }
              : r,
          ),
        );
        setInviteNote(
          result.status === "sent"
            ? `Sent to ${result.deliveredTo}`
            : `Failed: ${result.error ?? "unknown"}`,
        );
        if (result.status === "failed") {
          setError(result.error ?? "Resend failed");
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Resend failed");
    } finally {
      setInviteBusy(false);
    }
  }

  async function sendTest() {
    setInviteBusy(true);
    setInviteNote(null);
    setError(null);
    try {
      await withBusyBar(async () => {
        const result = await sendTestInviteAction(
          batchId,
          testTo.trim() || null,
        );
        setPreflight(result.preflight);
        if (result.status === "sent") {
          setInviteNote(
            `Test invite delivered to ${result.deliveredTo} (template for ${result.intendedEmail}). Roster status unchanged.`,
          );
        } else {
          setError(result.error ?? "Test invite failed");
          setInviteNote(`Test failed: ${result.error ?? "unknown"}`);
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Test invite failed");
    } finally {
      setInviteBusy(false);
    }
  }

  async function refresh() {
    const next = await refreshBatchRosterAction(batchId);
    setRoster(next);
  }

  return (
    <div className="mt-8 space-y-6">
      <div>
        <h2 className="font-serif text-2xl text-foreground">Send invites</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {roster.length} students · invites: {counts.pending} pending ·{" "}
          {counts.sent} sent · {counts.failed} failed
        </p>
      </div>

      {!preflight.ok ? (
        <div className="border border-border border-l-2 border-l-red-700 bg-surface px-4 py-3 text-sm text-red-800 dark:text-red-400">
          <p className="font-medium">Email is not configured</p>
          <p className="mt-1">{preflight.message}</p>
          <p className="mt-2 text-xs">
            Missing: {preflight.missing.join(", ") || "—"}
          </p>
        </div>
      ) : null}

      {preflight.ok && preflight.warnings.length > 0 ? (
        <div className="border border-border border-l-2 border-l-amber-600 bg-surface px-4 py-3 text-sm text-amber-900 dark:text-amber-400">
          {preflight.warnings.map((w) => (
            <p key={w}>{w}</p>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap items-end gap-2 border border-border bg-surface p-4">
        <label className="block min-w-[14rem] flex-1 text-xs text-muted-foreground">
          Send test to myself
          <input
            className="mt-1 w-full border border-border bg-background px-3 py-2 text-sm text-foreground"
            type="email"
            placeholder="Uses EMAIL_TEST_TO if blank"
            value={testTo}
            onChange={(e) => setTestTo(e.target.value)}
          />
        </label>
        <BusyButton
          type="button"
          pending={inviteBusy}
          pendingLabel="Sending…"
          className="border border-border px-4 py-2 text-sm disabled:opacity-40"
          disabled={!preflight.ok}
          onClick={() => void sendTest()}
        >
          Send test to myself
        </BusyButton>
      </div>

      <div className="flex flex-wrap gap-2">
        <BusyButton
          type="button"
          pending={inviteBusy}
          pendingLabel="Sending…"
          className="border border-border bg-accent px-4 py-2 text-sm text-accent-foreground disabled:opacity-40"
          disabled={!preflight.ok || roster.length === 0}
          onClick={() => void runInvites("pending")}
        >
          Send invites
        </BusyButton>
        {counts.failed > 0 ? (
          <BusyButton
            type="button"
            pending={inviteBusy}
            pendingLabel="Retrying…"
            className="border border-border px-4 py-2 text-sm disabled:opacity-40"
            disabled={!preflight.ok}
            onClick={() => void runInvites("failed")}
          >
            Retry failed
          </BusyButton>
        ) : null}
        <button
          type="button"
          className="border border-border px-4 py-2 text-sm"
          onClick={() => void copyText("all", allLines)}
        >
          {copied === "all" ? "Copied all" : "Copy all links"}
        </button>
        <button
          type="button"
          className="border border-border px-4 py-2 text-sm"
          onClick={() => void refresh()}
        >
          Refresh status
        </button>
      </div>

      {inviteNote ? (
        <p className="text-sm text-muted-foreground">{inviteNote}</p>
      ) : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <div className="overflow-x-auto border border-border">
        <table className="w-full min-w-[52rem] text-left text-sm">
          <thead className="bg-surface text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Group</th>
              <th className="px-3 py-2">Character</th>
              <th className="px-3 py-2">Invite</th>
              <th className="px-3 py-2">Link</th>
            </tr>
          </thead>
          <tbody>
            {roster.map((r) => (
              <tr key={r.participantId} className="border-t border-border align-top">
                <td className="px-3 py-2">{r.name}</td>
                <td className="px-3 py-2 text-muted-foreground">{r.email}</td>
                <td className="px-3 py-2">
                  <span className="font-medium">{r.groupDisplayName}</span>
                  <span className="mt-0.5 block font-mono text-[10px] text-muted-foreground">
                    code {r.groupCode}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <span className="font-mono text-[10px] uppercase text-muted-foreground">
                    {r.roleKey}
                  </span>{" "}
                  {GROUP_ROLES[r.roleKey as SeatKey]?.name ?? r.roleKey}
                </td>
                <td className="px-3 py-2">
                  <span
                    className={
                      r.inviteStatus === "sent"
                        ? "text-xs text-emerald-700 dark:text-emerald-400"
                        : r.inviteStatus === "failed"
                          ? "text-xs text-red-700"
                          : "text-xs text-muted-foreground"
                    }
                  >
                    {r.inviteStatus}
                  </span>
                  {r.inviteError ? (
                    <p className="mt-1 max-w-[16rem] text-[11px] leading-snug text-red-700">
                      {r.inviteError}
                    </p>
                  ) : null}
                  <BusyButton
                    type="button"
                    pending={inviteBusy}
                    pendingLabel="Sending…"
                    className="mt-1 block text-xs underline disabled:opacity-40"
                    disabled={!preflight.ok}
                    onClick={() => void resendOne(r.participantId)}
                  >
                    {r.inviteStatus === "failed" ? "Retry" : "Send / resend"}
                  </BusyButton>
                </td>
                <td className="px-3 py-2">
                  <button
                    type="button"
                    className="text-xs underline"
                    onClick={() =>
                      void copyText(r.joinToken, joinUrl(r.joinToken))
                    }
                  >
                    {copied === r.joinToken ? "Copied" : "Copy link"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
