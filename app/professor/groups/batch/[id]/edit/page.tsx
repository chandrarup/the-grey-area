import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getProfessorActor } from "@/lib/mode";
import { getModelPrefs } from "@/lib/model-prefs";
import { isDevIdentityEnabled } from "@/lib/auth/role-guard";
import {
  getGroupBatch,
  planFromBatchSessions,
} from "@/lib/db/group-queries";
import { NewBatchClient } from "@/app/professor/groups/new-batch/batch-client";
import { BatchFlowNav } from "@/app/professor/groups/batch-flow-nav";

export default async function BatchEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await getProfessorActor();
  const { id } = await params;
  const batch = await getGroupBatch(id);
  if (!batch) notFound();

  const draft = await planFromBatchSessions(id);
  if (!draft) notFound();

  // Draft with empty plan → send back to create
  if (batch.status === "draft" && draft.plan.groups.length === 0) {
    redirect("/professor/groups/new-batch");
  }

  const prefs = await getModelPrefs();

  return (
    <div className="mx-auto max-w-5xl px-6 py-12 md:px-8">
      <Link href="/professor" className="text-sm underline">
        ← Sessions
      </Link>
      <BatchFlowNav
        batchId={batch.id}
        current="edit"
        batchStatus={batch.status}
      />
      <h1 className="mt-4 font-serif text-3xl text-foreground">
        {batch.status === "draft" ? "Edit groups" : "Groups"}
      </h1>
      <p className="mt-3 max-w-[60ch] text-sm text-muted-foreground">
        {batch.name}
        {batch.status === "draft"
          ? " — draft is saved on this batch so you can leave and return."
          : " — rename groups here; seats are locked after sessions were created."}
      </p>
      <NewBatchClient
        defaultRoleplayModel={prefs.roleplayModel}
        defaultGraderModel={prefs.graderModel}
        showModelPickers={isDevIdentityEnabled()}
        batchId={batch.id}
        batchStatus={batch.status}
        initialDraft={draft}
      />
    </div>
  );
}
