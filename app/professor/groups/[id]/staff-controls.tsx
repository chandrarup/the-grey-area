"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  gradeGroupAction,
  releaseGroupAction,
  saveGroupAssessmentAction,
  saveProfessorNotesAction,
  startMeetingAction,
} from "@/app/group/actions";

type AssessmentShape = {
  epilogue: string;
  summary: string;
  what_went_well: string[];
  what_to_improve: string[];
  better_decisions: string[];
  evidence: string[];
};

const emptyAssessment = (): AssessmentShape => ({
  epilogue: "",
  summary: "",
  what_went_well: ["", "", ""],
  what_to_improve: ["", "", ""],
  better_decisions: ["", "", ""],
  evidence: [],
});

function asAssessment(raw: unknown): AssessmentShape {
  if (!raw || typeof raw !== "object") return emptyAssessment();
  const a = raw as Partial<AssessmentShape>;
  return {
    epilogue: a.epilogue ?? "",
    summary: a.summary ?? "",
    what_went_well: pad3(a.what_went_well),
    what_to_improve: pad3(a.what_to_improve),
    better_decisions: pad3(a.better_decisions),
    evidence: Array.isArray(a.evidence) ? a.evidence.map(String) : [],
  };
}

function pad3(arr: string[] | undefined): [string, string, string] {
  const a = Array.isArray(arr) ? [...arr] : [];
  while (a.length < 3) a.push("");
  return [a[0] ?? "", a[1] ?? "", a[2] ?? ""];
}

export function SessionStaffControls(props: {
  sessionId: string;
  status: string;
  hasAssessment: boolean;
  assessmentStatus?: string | null;
  assessment?: unknown;
  professorNotes?: string | null;
  humanSeatsOpened: number;
  humanSeatsTotal: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState(props.professorNotes ?? "");
  const [draft, setDraft] = useState<AssessmentShape>(() =>
    asAssessment(props.assessment),
  );

  useEffect(() => {
    setDraft(asAssessment(props.assessment));
    setNotes(props.professorNotes ?? "");
  }, [props.assessment, props.professorNotes]);

  return (
    <section className="mt-10 space-y-6">
      <h2 className="text-sm font-medium text-foreground">Staff controls</h2>
      <p className="text-sm text-muted-foreground">
        Human seats joined: {props.humanSeatsOpened}/{props.humanSeatsTotal}
      </p>

      <div className="border border-border p-4">
        <label className="block text-sm">
          <span className="text-xs uppercase text-muted-foreground">
            Professor feedback
          </span>
          <textarea
            className="mt-1 w-full border border-border bg-background px-3 py-2"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Visible to the group only after you release the debrief."
          />
        </label>
        <button
          type="button"
          disabled={pending}
          className="mt-3 border border-border px-3 py-1.5 text-xs disabled:opacity-50"
          onClick={() =>
            startTransition(async () => {
              try {
                await saveProfessorNotesAction(props.sessionId, notes);
                router.refresh();
              } catch (err) {
                setError(
                  err instanceof Error ? err.message : "Could not save notes",
                );
              }
            })
          }
        >
          Save feedback
        </button>
      </div>

      {props.status === "lobby" ? (
        <button
          type="button"
          disabled={pending}
          className="border border-border px-4 py-2 text-sm"
          onClick={() =>
            startTransition(async () => {
              try {
                await startMeetingAction(props.sessionId, true);
                router.refresh();
              } catch (err) {
                setError(
                  err instanceof Error ? err.message : "Force start failed",
                );
              }
            })
          }
        >
          Force start meeting
        </button>
      ) : null}

      {(props.status === "committed" ||
        props.status === "graded" ||
        props.status === "released") && (
        <div className="space-y-4 border border-border p-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending}
              className="border border-border px-4 py-2 text-sm"
              onClick={() =>
                startTransition(async () => {
                  try {
                    await gradeGroupAction(props.sessionId);
                    router.refresh();
                  } catch (err) {
                    setError(
                      err instanceof Error ? err.message : "Grade failed",
                    );
                  }
                })
              }
            >
              {props.hasAssessment ? "Re-run AI grade" : "Generate AI grade"}
            </button>
            <button
              type="button"
              disabled={pending || !props.hasAssessment}
              className="border border-border px-4 py-2 text-sm disabled:opacity-50"
              onClick={() =>
                startTransition(async () => {
                  try {
                    await saveGroupAssessmentAction(
                      props.sessionId,
                      draft,
                      notes,
                    );
                    router.refresh();
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Save failed");
                  }
                })
              }
            >
              Save edits
            </button>
            <button
              type="button"
              disabled={pending || !props.hasAssessment}
              className="bg-accent px-4 py-2 text-sm text-accent-foreground disabled:opacity-50"
              onClick={() =>
                startTransition(async () => {
                  try {
                    await saveGroupAssessmentAction(
                      props.sessionId,
                      draft,
                      notes,
                    );
                    await releaseGroupAction(props.sessionId, notes);
                    router.refresh();
                  } catch (err) {
                    setError(
                      err instanceof Error ? err.message : "Release failed",
                    );
                  }
                })
              }
            >
              Release to group
            </button>
          </div>

          {props.hasAssessment ? (
            <div className="space-y-3 text-sm">
              <label className="block">
                <span className="text-xs uppercase text-muted-foreground">
                  Epilogue
                </span>
                <textarea
                  className="mt-1 w-full border border-border bg-background px-3 py-2"
                  rows={3}
                  value={draft.epilogue}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, epilogue: e.target.value }))
                  }
                />
              </label>
              <label className="block">
                <span className="text-xs uppercase text-muted-foreground">
                  Summary
                </span>
                <textarea
                  className="mt-1 w-full border border-border bg-background px-3 py-2"
                  rows={3}
                  value={draft.summary}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, summary: e.target.value }))
                  }
                />
              </label>
              {(
                [
                  "what_went_well",
                  "what_to_improve",
                  "better_decisions",
                ] as const
              ).map((key) => (
                <div key={key}>
                  <p className="text-xs uppercase text-muted-foreground">
                    {key.replace(/_/g, " ")}
                  </p>
                  {draft[key].map((line, i) => (
                    <input
                      key={i}
                      className="mt-1 w-full border border-border bg-background px-3 py-2"
                      value={line}
                      onChange={(e) => {
                        const next = [...draft[key]] as [
                          string,
                          string,
                          string,
                        ];
                        next[i] = e.target.value;
                        setDraft((d) => ({ ...d, [key]: next }));
                      }}
                    />
                  ))}
                </div>
              ))}
              <p className="text-xs text-muted-foreground">
                Assessment status: {props.assessmentStatus ?? "—"}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Generate an AI grade after the meeting ends, then edit and release.
            </p>
          )}
        </div>
      )}

      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </section>
  );
}
