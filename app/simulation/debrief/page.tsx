import { LearningDebrief } from "@/app/components/learning-debrief";
import Link from "next/link";
import { requireStudentRun } from "@/lib/simulation/run";
import { getAssessmentForStudent, getDecisions } from "@/lib/db/queries";
import type { AssessmentPayload } from "@/lib/engine/grader";
import { enforceStageAccess } from "@/lib/simulation/progress";
import type { RunStageData } from "@/lib/db/schema";

export default async function DebriefPage() {
  const { profile, run, caseConfig } = await requireStudentRun();
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
            : "Finish all three decisions and reflections first."}
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
  const decisions = await getDecisions(profile, run.id);
  return <LearningDebrief caseConfig={caseConfig} decisions={decisions} notes={assessmentRow.professorNotes}
    feedback={{ letter: assessment.coaching_letter, strengths: assessment.coaching_feedback?.strengths,
      growth: assessment.coaching_feedback?.growth_areas, practices: assessment.coaching_feedback?.next_practice ? [assessment.coaching_feedback.next_practice] : [],
      scores: assessment.readiness_scores }} />;
}
