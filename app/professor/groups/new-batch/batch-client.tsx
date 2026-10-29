"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
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
import type { DraftBatchPayload } from "@/lib/db/group-queries";
import {
  confirmBatchAction,
  renameGroupAction,
  saveDraftBatchAction,
} from "@/app/professor/groups/batch-actions";
import { BusyButton } from "@/app/components/busy-button";
import { withBusyBar } from "@/app/components/navigation-progress";

export function NewBatchClient({
  defaultRoleplayModel,
  defaultGraderModel,
  showModelPickers = false,
  batchId: initialBatchId = null,
  batchStatus = null,
  initialDraft = null,
}: {
  defaultRoleplayModel: string;
  defaultGraderModel: string;
  showModelPickers?: boolean;
  batchId?: string | null;
  batchStatus?: string | null;
  initialDraft?: DraftBatchPayload | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [batchId, setBatchId] = useState<string | null>(initialBatchId);
  const isReady = batchStatus === "ready";

  const [students, setStudents] = useState<RosterStudent[]>(() => {
    if (!initialDraft) return [];
    return initialDraft.plan.groups.flatMap((g) =>
      g.members.map((m) => ({
        id: m.studentId,
        name: m.name,
        email: m.email,
      })),
    );
  });
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [batchName, setBatchName] = useState(
    initialDraft?.batchName ?? "",
  );
  const [decisionCount, setDecisionCount] = useState(
    initialDraft?.decisionCount ?? 3,
  );
  const [minGroupSize, setMinGroupSize] = useState(
    initialDraft?.minGroupSize ?? 4,
  );
  const [roleplayModel, setRoleplayModel] = useState(
    initialDraft?.roleplayModel ?? defaultRoleplayModel,
  );
  const [graderModel, setGraderModel] = useState(
    initialDraft?.graderModel ?? defaultGraderModel,
  );
  const [plan, setPlan] = useState<BatchPlan | null>(() => {
    if (!initialDraft) return null;
    return {
      minGroupSize: initialDraft.plan.minGroupSize,
      groups: initialDraft.plan.groups.map((g) =>
        recomputeAiSeats({
          id: g.id,
          displayName: g.displayName,
          members: g.members.map((m) => ({
            studentId: m.studentId,
            name: m.name,
            email: m.email,
            roleKey: m.roleKey as SeatKey,
          })),
          aiSeats: g.aiSeats as SeatKey[],
        }),
      ),
    };
  });
  const [step, setStep] = useState<"upload" | "groups">(
    initialDraft?.plan.groups.length ? "groups" : "upload",
  );
  const [error, setError] = useState<string | null>(null);
  const [saveNote, setSaveNote] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const planErrors = useMemo(
    () => (plan ? validatePlan(plan) : []),
    [plan],
  );

  const persistDraft = useCallback(
    async (nextPlan: BatchPlan, opts?: { navigate?: boolean }) => {
      try {
        const { batchId: id } = await saveDraftBatchAction({
          batchId,
          batchName,
          caseSlug: "cost-of-winning",
          decisionCount,
          minGroupSize,
          roleplayModel,
          graderModel,
          plan: nextPlan,
        });
        setBatchId(id);
        setSaveNote("Draft saved");
        setTimeout(() => setSaveNote(null), 1500);
        if (opts?.navigate && id !== batchId) {
          router.replace(`/professor/groups/batch/${id}/edit`);
        }
        return id;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save draft");
        return null;
      }
    },
    [
      batchId,
      batchName,
      decisionCount,
      minGroupSize,
      roleplayModel,
      graderModel,
      router,
    ],
  );

  function scheduleSave(nextPlan: BatchPlan) {
    if (isReady) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void persistDraft(nextPlan);
    }, 600);
  }

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

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

  async function buildPlan(list: RosterStudent[] = students) {
    const groups = splitRosterIntoGroups(list, {
      minSize: minGroupSize,
      maxSize: SEAT_ORDER.length,
      shuffleFirst: true,
    }).map(recomputeAiSeats);
    const next = { groups, minGroupSize };
    setPlan(next);
    setStep("groups");
    if (!isReady) {
      const id = await persistDraft(next, { navigate: true });
      if (id && !batchId) {
        router.replace(`/professor/groups/batch/${id}/edit`);
      }
    }
  }

  function reshuffle() {
    if (!students.length || isReady) return;
    void buildPlan(students);
  }

  function onDropToGroup(groupId: string) {
    if (!plan || !dragId || isReady) return;
    const next = moveMember(plan, dragId, groupId);
    setPlan(next);
    setDragId(null);
    scheduleSave(next);
  }

  function renameInPlan(groupId: string, displayName: string) {
    if (!plan) return;
    const next: BatchPlan = {
      ...plan,
      groups: plan.groups.map((g) =>
        g.id === groupId ? { ...g, displayName } : g,
      ),
    };
    setPlan(next);
    if (isReady && batchId) {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        void renameGroupAction(groupId, displayName, batchId);
      }, 500);
    } else {
      scheduleSave(next);
    }
  }

  function confirm() {
    if (!plan || isReady) return;
    setError(null);
    startTransition(async () => {
      try {
        await withBusyBar(async () => {
          const result = await confirmBatchAction({
            batchId,
            batchName,
            caseSlug: "cost-of-winning",
            decisionCount,
            minGroupSize,
            roleplayModel,
            graderModel,
            groups: plan.groups,
          });
          router.push(`/professor/groups/batch/${result.batchId}/invites`);
          router.refresh();
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Create failed");
      }
    });
  }

  const input =
    "mt-1 w-full border border-border bg-background px-3 py-2 text-sm";

  if (step === "groups" && plan) {
    return (
      <div className="mt-8 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-serif text-2xl text-foreground">
              {isReady ? "Edit groups" : "Review groups"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {plan.groups.length} groups · {students.length} students
              {isReady
                ? " · rename inline (seats locked after create)"
                : " · drag to move · rename groups · change character with the seat menu"}
            </p>
            {saveNote ? (
              <p className="mt-1 text-xs text-muted-foreground">{saveNote}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {!isReady ? (
              <>
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
                  className="border border-border px-3 py-2 text-sm"
                  disabled={pending}
                  onClick={() => plan && void persistDraft(plan)}
                >
                  Save draft
                </button>
                <BusyButton
                  type="button"
                  pending={pending}
                  pendingLabel="Creating…"
                  disabled={planErrors.length > 0}
                  className="bg-accent px-4 py-2 text-sm text-accent-foreground disabled:opacity-40"
                  onClick={confirm}
                >
                  Confirm & create sessions
                </BusyButton>
              </>
            ) : batchId ? (
              <a
                href={`/professor/groups/batch/${batchId}/invites`}
                className="border border-border bg-accent px-4 py-2 text-sm text-accent-foreground"
              >
                Send invites →
              </a>
            ) : null}
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
          {plan.groups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              locked={isReady}
              dragId={dragId}
              onDragStart={setDragId}
              onDrop={() => onDropToGroup(group.id)}
              onChangeSeat={(studentId, roleKey) => {
                if (isReady || !plan) return;
                const next = changeSeat(plan, studentId, roleKey);
                setPlan(next);
                scheduleSave(next);
              }}
              onRename={(name) => renameInPlan(group.id, name)}
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
            disabled={isReady}
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-xs text-muted-foreground">
            Decisions (1–3)
            <input
              type="number"
              min={1}
              max={3}
              className={input}
              value={decisionCount}
              disabled={isReady}
              onChange={(e) => setDecisionCount(Math.min(3, Number(e.target.value) || 3))}
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
              disabled={isReady}
              onChange={(e) => setMinGroupSize(Number(e.target.value) || 4)}
            />
            <span className="mt-1 block text-[10px]">
              Max is {SEAT_ORDER.length} (one per seat). Short groups fill with AI.
            </span>
          </label>
          {showModelPickers ? (
            <>
              <label className="block text-xs text-muted-foreground">
                Roleplay model
                <select
                  className={input}
                  value={roleplayModel}
                  disabled={isReady}
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
                  disabled={isReady}
                  onChange={(e) => setGraderModel(e.target.value)}
                >
                  {MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </label>
            </>
          ) : null}
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
            disabled={isReady}
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
            {!isReady ? (
              <button
                type="button"
                className="bg-accent px-4 py-2 text-sm text-accent-foreground"
                onClick={() => void buildPlan()}
              >
                Auto-split into groups →
              </button>
            ) : null}
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
                  disabled={isReady}
                  onChange={(e) =>
                    updateStudent(s.id, { name: e.target.value })
                  }
                />
                <input
                  className="min-w-[10rem] flex-[1.2] border border-border bg-background px-2 py-1 text-sm"
                  value={s.email}
                  disabled={isReady}
                  onChange={(e) =>
                    updateStudent(s.id, { email: e.target.value })
                  }
                />
                {!isReady ? (
                  <button
                    type="button"
                    className="text-xs text-muted-foreground underline"
                    onClick={() => removeStudent(s.id)}
                  >
                    Remove
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function GroupCard({
  group,
  locked,
  dragId,
  onDragStart,
  onDrop,
  onChangeSeat,
  onRename,
}: {
  group: PlannedGroup;
  locked: boolean;
  dragId: string | null;
  onDragStart: (id: string) => void;
  onDrop: () => void;
  onChangeSeat: (studentId: string, roleKey: SeatKey) => void;
  onRename: (name: string) => void;
}) {
  const errors = validatePlan({
    groups: [group],
    minGroupSize: 1,
  });

  return (
    <div
      className={`border border-border bg-background p-4 ${
        dragId && !locked ? "border-dashed border-accent" : ""
      }`}
      onDragOver={(e) => {
        if (!locked) e.preventDefault();
      }}
      onDrop={(e) => {
        if (locked) return;
        e.preventDefault();
        onDrop();
      }}
    >
      <div className="flex items-baseline justify-between gap-2">
        <input
          className="min-w-0 flex-1 border-0 border-b border-transparent bg-transparent font-serif text-lg text-foreground outline-none focus:border-border"
          value={group.displayName}
          aria-label="Group name"
          onChange={(e) => onRename(e.target.value)}
        />
        <p className="shrink-0 text-xs text-muted-foreground">
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
            draggable={!locked}
            onDragStart={() => {
              if (!locked) onDragStart(m.studentId);
            }}
            className={`rounded border border-border bg-surface px-2 py-2 ${
              locked ? "" : "cursor-grab active:cursor-grabbing"
            }`}
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
                className="border border-border bg-background px-2 py-1 text-xs disabled:opacity-60"
                value={m.roleKey}
                disabled={locked}
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
