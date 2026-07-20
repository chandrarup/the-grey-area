import Link from "next/link";
import { requireStudentRun } from "@/lib/simulation/run";
import { getAssessmentForStudent } from "@/lib/db/queries";
import type { AssessmentPayload } from "@/lib/engine/grader";
import { overallReadiness } from "@/lib/engine/grader";
import { enforceStageAccess } from "@/lib/simulation/progress";
import type { RunStageData } from "@/lib/db/schema";

export default async function DebriefPage() {
  const { profile, run } = await requireStudentRun();
  const stageData = (run.stageData ?? {}) as RunStageData;
  enforceStageAccess("debrief", stageData);
  const assessmentRow = await getAssessmentForStudent(profile, run.id);

  if (!assessmentRow || assessmentRow.status !== "released") {
    return (
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Debrief
        </p>
        <h1 className="mt-2 font-serif text-3xl text-foreground">
          Feedback not released yet
        </h1>
        <p className="mt-4 max-w-[60ch] text-sm text-muted-foreground">
          {run.status === "submitted" || assessmentRow
            ? "Your run is complete. Your professor will release the assessment when ready."
            : "Finish all five decisions and reflections first."}
        </p>
        <Link
          href="/simulation/decisions"
          className="mt-8 inline-block border border-border px-5 py-2.5 text-sm text-foreground hover:border-accent"
        >
          Back to decisions
        </Link>
      </div>
    );
  }

  const assessment = assessmentRow.assessment as AssessmentPayload;
  const score = overallReadiness(assessment);

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Debrief
      </p>
      <h1 className="mt-2 font-serif text-3xl text-foreground">
        Your assessment
      </h1>
      <p className="mt-4 text-sm text-muted-foreground">
        Overall readiness: <span className="text-foreground">{score}/10</span>
      </p>

      <section className="mt-10 border-l-2 border-accent bg-surface px-6 py-5">
        <h2 className="text-sm font-medium text-foreground">Coaching letter</h2>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
          {assessment.coaching_letter}
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-2xl text-foreground">Scores</h2>
        <ul className="mt-4 divide-y divide-border border border-border">
          {assessment.readiness_scores.map((s) => (
            <li key={s.key} className="px-4 py-3">
              <div className="flex justify-between gap-4">
                <p className="text-sm font-medium text-foreground">{s.label}</p>
                <p className="text-sm text-muted-foreground">{s.score}/10</p>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{s.rationale}</p>
            </li>
          ))}
        </ul>
      </section>

      {assessmentRow.professorNotes ? (
        <section className="mt-10">
          <h2 className="font-serif text-2xl text-foreground">
            Professor notes
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            {assessmentRow.professorNotes}
          </p>
        </section>
      ) : null}
    </div>
  );
}
