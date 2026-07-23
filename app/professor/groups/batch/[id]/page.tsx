import Link from "next/link";
import { notFound } from "next/navigation";
import { getProfessorActor } from "@/lib/mode";
import {
  getBatchBoardSnapshot,
  getBatchCohortRollup,
  getGroupBatch,
  readCachedCohortInsights,
} from "@/lib/db/group-queries";
import { getCase } from "@/lib/case/registry";
import { BatchBoardClient } from "./batch-board";
import { CohortInsightsPanel } from "./cohort-insights";

export default async function ProfessorBatchMonitorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await getProfessorActor();
  const { id } = await params;
  const batch = await getGroupBatch(id);
  if (!batch) notFound();

  const caseConfig = getCase(batch.caseSlug);
  const rows = await getBatchBoardSnapshot(id);
  const rollup = await getBatchCohortRollup(id);
  const insights = readCachedCohortInsights(batch);

  return (
    <div className="mx-auto max-w-5xl px-6 py-12 md:px-8">
      <Link href="/professor" className="text-sm underline">
        ← Sessions
      </Link>
      <p className="mt-6 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Batch monitor
      </p>
      <h1 className="mt-2 font-serif text-3xl text-foreground">{batch.name}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {caseConfig.title} · {batch.decisionCount} decisions ·{" "}
        {rows.length} groups
      </p>

      <div className="mt-10">
        <BatchBoardClient batchId={batch.id} initialRows={rows} />
      </div>

      <CohortInsightsPanel
        batchId={batch.id}
        initialRollup={rollup}
        initialInsights={insights}
      />
    </div>
  );
}
