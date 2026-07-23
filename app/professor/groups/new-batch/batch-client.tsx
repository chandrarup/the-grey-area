"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { GROUP_ROLES, SEAT_ORDER, type SeatKey } from "@/lib/case/group-roles";
import { MODELS } from "@/lib/llm/models";
import { parseRosterArrayBuffer } from "@/lib/group/parse-roster";
import {
  changeSeat,
  moveMember,
  recomputeAiSeats,
  splitRosterIntoGroups,
  validatePlan,
  type BatchPlan,
  type PlannedGroup,
  type RosterStudent,
} from "@/lib/group/batch-plan";
import { confirmBatchAction, resendInviteAction, sendBatchInvitesAction } from "@/app/professor/groups/batch-actions";
import type { BatchRosterResultRow } from "@/lib/db/group-queries";

type Step = "upload" | "groups" | "results";

function appBaseUrl() {
  if (typeof window === "undefined") return "";
  return (
    process.env.NEXT_PUBLIC_APP_BASE_URL?.replace(/\/$/, "") ||
    window.location.origin
  );
}

function joinUrl(token: string) {
  return `${appBaseUrl()}/?join=${encodeURIComponent(token)}`;
}

export function NewBatchClient({
  defaultRoleplayModel,
  defaultGraderModel,
}: {
  defaultRoleplayModel: string;
  defaultGraderModel: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState<Step>("upload");
  const [students, setStudents] = useState<RosterStudent[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [batchName, setBatchName] = useState("");
  const [decisionCount, setDecisionCount] = useState(5);
  const [minGroupSize, setMinGroupSize] = useState(4);
  const [roleplayModel, setRoleplayModel] = useState(defaultRoleplayModel);
  const [graderModel, setGraderModel] = useState(defaultGraderModel);
  const [plan, setPlan] = useState<BatchPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [roster, setRoster] = useState<BatchRosterResultRow[]>([]);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteNote, setInviteNote] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  const planErrors = useMemo(
    () => (plan ? validatePlan(plan) : []),
    [plan],
  );

  async function onFile(file: File) {
    setError(null);
    setParseErrors([]);
    setUploadedFileName(file.name);
    try {
      const buf = await file.arrayBuffer();
      const parsed = parseRosterArrayBuffer(buf);
      setStudents(parsed.students);
      setParseErrors(parsed.errors);
      if (!batchName) {
        setBatchName(file.name.replace(/\.(xlsx|xls|csv)$/i, ""));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not parse file");
    }
  }

  function updateStudent(id: string, patch: Partial<RosterStudent>) {
    setStudents((rows) =>
      rows.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    );
  }

  function removeStudent(id: string) {
    setStudents((rows) => rows.filter((r) => r.id !== id));
  }

  function buildPlan(list: RosterStudent[] = students) {
    const groups = splitRosterIntoGroups(list, {
      minSize: minGroupSize,
      maxSize: SEAT_ORDER.length,
      shuffleFirst: true,
    }).map(recomputeAiSeats);
    setPlan({ groups, minGroupSize });
    setStep("groups");
  }

  function reshuffle() {
    if (!students.length) return;
    buildPlan(students);
  }

  function onDropToGroup(groupId: string) {
    if (!plan || !dragId) return;
    setPlan(moveMember(plan, dragId, groupId));
    setDragId(null);
  }

  function confirm() {
    if (!plan) return;
    setError(null);
    startTransition(async () => {
      try {
        const result = await confirmBatchAction({
          batchName,
          caseSlug: "cost-of-winning",
          decisionCount,
          minGroupSize,
          roleplayModel,
          graderModel,
          groups: plan.groups,
        });
        setBatchId(result.batchId);
        setRoster(result.roster);
        setStep("results");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Create failed");
      }
    });
  }

  async function copyText(label: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      setCopied("failed");
    }
  }

  const input =
    "mt-1 w-full border border-border bg-background px-3 py-2 text-sm";

  if (step === "results") {
    const allLines = roster
      .map(
        (r) =>
          `${r.name}\t${r.email}\t${r.groupCode}\t${GROUP_ROLES[r.roleKey as SeatKey]?.title ?? r.roleKey}\t${joinUrl(r.joinToken)}`,
      )
      .join("\n");

    const counts = {
      pending: roster.filter((r) => r.inviteStatus === "pending").length,
      sent: roster.filter((r) => r.inviteStatus === "sent").length,
      failed: roster.filter((r) => r.inviteStatus === "failed").length,
    };

    async function runInvites(mode: "pending" | "failed") {
      if (!batchId) return;
      setInviteBusy(true);
      setInviteNote(null);
      setError(null);
      try {
        const { results, roster: next } = await sendBatchInvitesAction(
          batchId,
          mode,
        );
        setRoster(next);
        const sent = results.filter((r) => r.status === "sent").length;
        const failed = results.filter((r) => r.status === "failed").length;
        setInviteNote(
          `Sent ${sent}${failed ? ` · ${failed} failed` : ""}${
            results[0]?.deliveredTo && results[0].deliveredTo !== results[0].intendedEmail
              ? ` · test inbox ${results[0].deliveredTo}`
              : ""
          }`,
        );
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
        const { result } = await resendInviteAction(participantId);
        setRoster((rows) =>
          rows.map((r) =>
            r.participantId === participantId
              ? {
                  ...r,
                  inviteStatus: result.status,
                  invitedAt: new Date().toISOString(),
                }
              : r,
          ),
        );
        setInviteNote(
          result.status === "sent"
            ? `Resent to ${result.intendedEmail}`
            : `Resend failed: ${result.error ?? "unknown"}`,
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Resend failed");
      } finally {
        setInviteBusy(false);
      }
    }

    return (
      <div className="mt-8 space-y-6">
        <div>
          <h2 className="font-serif text-2xl text-foreground">Batch ready</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {roster.length} students across{" "}
            {new Set(roster.map((r) => r.groupCode)).size} groups
            {batchId ? ` · batch ${batchId.slice(0, 8)}…` : ""}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Invites: {counts.pending} pending · {counts.sent} sent ·{" "}
            {counts.failed} failed
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="border border-border bg-accent px-4 py-2 text-sm text-accent-foreground disabled:opacity-40"
            disabled={!batchId || inviteBusy}
            onClick={() => void runInvites("pending")}
          >
            {inviteBusy ? "Sending…" : "Send invites"}
          </button>
          {counts.failed > 0 ? (
            <button
              type="button"
              className="border border-border px-4 py-2 text-sm disabled:opacity-40"
              disabled={!batchId || inviteBusy}
              onClick={() => void runInvites("failed")}
            >
              Resend all failed
            </button>
          ) : null}
          <button
            type="button"
            className="border border-border px-4 py-2 text-sm"
            onClick={() => void copyText("all", allLines)}
          >
            {copied === "all" ? "Copied all" : "Copy all links"}
          </button>
        </div>
        {inviteNote ? (
          <p className="text-sm text-muted-foreground">{inviteNote}</p>
        ) : null}
        {error ? <p className="text-sm text-red-700">{error}</p> : null}

        <div className="overflow-x-auto border border-border">
          <table className="w-full min-w-[48rem] text-left text-sm">
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
                <tr key={r.participantId} className="border-t border-border">
                  <td className="px-3 py-2">{r.name}</td>
                  <td className="px-3 py-2 text-muted-foreground">{r.email}</td>
                  <td className="px-3 py-2 font-mono text-xs">{r.groupCode}</td>
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
                    {r.inviteStatus === "failed" || r.inviteStatus === "sent" ? (
                      <button
                        type="button"
                        className="ml-2 text-xs underline disabled:opacity-40"
                        disabled={inviteBusy}
                        onClick={() => void resendOne(r.participantId)}
                      >
                        Resend
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="ml-2 text-xs underline disabled:opacity-40"
                        disabled={inviteBusy}
                        onClick={() => void resendOne(r.participantId)}
                      >
                        Send
                      </button>
                    )}
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
        <a href="/professor" className="inline-block text-sm underline">
          ← Back to sessions
        </a>
        {batchId ? (
          <a
            href={`/professor/groups/batch/${batchId}`}
            className="ml-4 inline-block border border-border bg-accent px-4 py-2 text-sm text-accent-foreground"
          >
            Open batch monitor →
          </a>
        ) : null}
      </div>
    );
  }

  if (step === "groups" && plan) {
    return (
      <div className="mt-8 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-serif text-2xl text-foreground">
              Review groups
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {plan.groups.length} groups · {students.length} students · drag
              to move · change character with the seat menu
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="border border-border px-3 py-2 text-sm"
              onClick={() => setStep("upload")}
            >
              ← Edit roster
            </button>
            <button
              type="button"
              className="border border-border px-3 py-2 text-sm"
              onClick={reshuffle}
            >
              Regenerate / reshuffle
            </button>
            <button
              type="button"
              disabled={pending || planErrors.length > 0}
              className="bg-accent px-4 py-2 text-sm text-accent-foreground disabled:opacity-40"
              onClick={confirm}
            >
              {pending ? "Creating…" : "Confirm & create sessions"}
            </button>
          </div>
        </div>

        {planErrors.length ? (
          <ul className="border border-border border-l-2 border-l-accent bg-surface px-4 py-3 text-sm text-red-700">
            {planErrors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        ) : null}
        {error ? <p className="text-sm text-red-700">{error}</p> : null}

        <div className="grid gap-4 md:grid-cols-2">
          {plan.groups.map((group, gi) => (
            <GroupCard
              key={group.id}
              index={gi}
              group={group}
              dragId={dragId}
              onDragStart={setDragId}
              onDrop={() => onDropToGroup(group.id)}
              onChangeSeat={(studentId, roleKey) =>
                setPlan(changeSeat(plan, studentId, roleKey))
              }
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-8">
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-foreground">Batch settings</h2>
        <label className="block text-xs text-muted-foreground">
          Batch name
          <input
            className={input}
            value={batchName}
            onChange={(e) => setBatchName(e.target.value)}
            placeholder="Spring 2026 Section A"
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-xs text-muted-foreground">
            Decisions (1–5)
            <input
              type="number"
              min={1}
              max={5}
              className={input}
              value={decisionCount}
              onChange={(e) => setDecisionCount(Number(e.target.value) || 5)}
            />
          </label>
          <label className="block text-xs text-muted-foreground">
            Min group size
            <input
              type="number"
              min={2}
              max={SEAT_ORDER.length}
              className={input}
              value={minGroupSize}
              onChange={(e) => setMinGroupSize(Number(e.target.value) || 4)}
            />
            <span className="mt-1 block text-[10px]">
              Max is {SEAT_ORDER.length} (one per seat). Short groups fill with AI.
            </span>
          </label>
          <label className="block text-xs text-muted-foreground">
            Roleplay model
            <select
              className={input}
              value={roleplayModel}
              onChange={(e) => setRoleplayModel(e.target.value)}
            >
              {MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs text-muted-foreground">
            Grader model
            <select
              className={input}
              value={graderModel}
              onChange={(e) => setGraderModel(e.target.value)}
            >
              {MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-foreground">
          Upload roster (.xlsx or .csv)
        </h2>
        <p className="text-xs text-muted-foreground">
          Columns: <code>name</code> and <code>email</code> (header row required).
        </p>
        <label
          className="file-upload"
          title="File upload — choose an Excel or CSV roster"
        >
          <span className="flex flex-col items-center gap-0.5">
            <span className="file-upload-title">File upload</span>
            <span className="file-upload-hint">
              {uploadedFileName
                ? uploadedFileName
                : "Click to choose .xlsx or .csv"}
            </span>
          </span>
          <input
            type="file"
            accept=".xlsx,.xls,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onFile(f);
              e.target.value = "";
            }}
          />
        </label>
        {parseErrors.length ? (
          <ul className="text-xs text-red-700">
            {parseErrors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        ) : null}
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
      </section>

      {students.length > 0 ? (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-medium text-foreground">
              Preview · {students.length} students
            </h2>
            <button
              type="button"
              className="bg-accent px-4 py-2 text-sm text-accent-foreground"
              onClick={() => buildPlan()}
            >
              Auto-split into groups →
            </button>
          </div>
          <ul className="divide-y divide-border border border-border">
            {students.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-center gap-2 px-3 py-2"
              >
                <input
                  className="min-w-[8rem] flex-1 border border-border bg-background px-2 py-1 text-sm"
                  value={s.name}
                  onChange={(e) =>
                    updateStudent(s.id, { name: e.target.value })
                  }
                />
                <input
                  className="min-w-[10rem] flex-[1.2] border border-border bg-background px-2 py-1 text-sm"
                  value={s.email}
                  onChange={(e) =>
                    updateStudent(s.id, { email: e.target.value })
                  }
                />
                <button
                  type="button"
                  className="text-xs text-muted-foreground underline"
                  onClick={() => removeStudent(s.id)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function GroupCard({
  index,
  group,
  dragId,
  onDragStart,
  onDrop,
  onChangeSeat,
}: {
  index: number;
  group: PlannedGroup;
  dragId: string | null;
  onDragStart: (id: string) => void;
  onDrop: () => void;
  onChangeSeat: (studentId: string, roleKey: SeatKey) => void;
}) {
  const errors = validatePlan({
    groups: [group],
    minGroupSize: 1,
  });

  return (
    <div
      className={`border border-border bg-background p-4 ${
        dragId ? "border-dashed border-accent" : ""
      }`}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        onDrop();
      }}
    >
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-serif text-lg text-foreground">
          Group {index + 1}
        </h3>
        <p className="text-xs text-muted-foreground">
          {group.members.length} human
          {group.aiSeats.length
            ? ` · AI: ${group.aiSeats.join(", ")}`
            : ""}
        </p>
      </div>
      {errors.length ? (
        <p className="mt-2 text-xs text-red-700">{errors.join(" · ")}</p>
      ) : null}
      <ul className="mt-3 space-y-2">
        {group.members.map((m) => (
          <li
            key={m.studentId}
            draggable
            onDragStart={() => onDragStart(m.studentId)}
            className="cursor-grab rounded border border-border bg-surface px-2 py-2 active:cursor-grabbing"
          >
            <div className="flex flex-wrap items-center gap-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {m.name}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {m.email}
                </p>
              </div>
              <select
                className="border border-border bg-background px-2 py-1 text-xs"
                value={m.roleKey}
                onChange={(e) =>
                  onChangeSeat(m.studentId, e.target.value as SeatKey)
                }
              >
                {SEAT_ORDER.map((seat) => (
                  <option key={seat} value={seat}>
                    {seat} — {GROUP_ROLES[seat].name}
                  </option>
                ))}
              </select>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
