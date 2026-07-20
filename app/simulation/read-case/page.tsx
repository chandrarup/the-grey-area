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
        Read the Case
      </h1>
      <p className="mt-4 max-w-[60ch] text-sm leading-relaxed text-muted-foreground">
        This briefing packet is everything you need before you take the chair.
        Read each page carefully — later scenes assume you know it.
      </p>

      <div className="mt-10">
        <BriefingPager pages={caseConfig.briefingPages} runId={run.id} />
      </div>
    </div>
  );
}
