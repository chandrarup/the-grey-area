import { requireStudentRun } from "@/lib/simulation/run";
import { enforceStageAccess } from "@/lib/simulation/progress";
import type { RunStageData } from "@/lib/db/schema";
import { BriefingPager } from "./briefing-pager";

export default async function ReadCasePage() {
  const { caseConfig, run } = await requireStudentRun();
  const stageData = (run.stageData ?? {}) as RunStageData;
  enforceStageAccess("read-case", stageData);

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Stage 2
      </p>
      <h1 className="mt-2 font-serif text-3xl leading-tight text-foreground md:text-4xl">
        Before the call
      </h1>
      <p className="mt-4 max-w-[60ch] text-sm leading-relaxed text-muted-foreground">
        Four short briefings put you inside the opportunity, the pressure, and the unanswered questions. Then the story begins.
      </p>

      <div className="mt-10">
        <BriefingPager pages={caseConfig.briefingPages} runId={run.id} />
      </div>
    </div>
  );
}
