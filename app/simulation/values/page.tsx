import { requireStudentRun } from "@/lib/simulation/run";
import { enforceStageAccess } from "@/lib/simulation/progress";
import type { RunStageData } from "@/lib/db/schema";
import { ValuesForm } from "./values-form";

export default async function ValuesPage() {
  const { run } = await requireStudentRun();
  const stageData = (run.stageData ?? {}) as RunStageData;
  enforceStageAccess("values", stageData);

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Stage 3
      </p>
      <h1 className="mt-2 font-serif text-3xl leading-tight text-foreground md:text-4xl">
        Your Leadership Values
      </h1>
      <p className="mt-4 max-w-[60ch] text-sm leading-relaxed text-muted-foreground">
        Before the emergency meeting, name the principles you intend to hold.
        You will revisit them after the five decisions.
      </p>

      <ValuesForm
        runId={run.id}
        initialAnswer={stageData.valuesAnswer ?? ""}
      />
    </div>
  );
}
