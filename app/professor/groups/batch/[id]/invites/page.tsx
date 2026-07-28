import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getProfessorActor } from "@/lib/mode";
import {
  getGroupBatch,
  listBatchRoster,
} from "@/lib/db/group-queries";
import { getInvitePreflight } from "@/lib/email/send-batch-invites";
import { BatchFlowNav } from "@/app/professor/groups/batch-flow-nav";
import { BatchInvitesClient } from "@/app/professor/groups/batch-invites-client";

export default async function BatchInvitesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await getProfessorActor();
  const { id } = await params;
  const batch = await getGroupBatch(id);
  if (!batch) notFound();

  if (batch.status === "draft") {
    redirect(`/professor/groups/batch/${id}/edit`);
  }

  const roster = await listBatchRoster(id);
  const preflight = getInvitePreflight();

  return (
    <div className="mx-auto max-w-5xl px-6 py-12 md:px-8">
      <Link href="/professor" className="text-sm underline">
        ← Sessions
      </Link>
      <BatchFlowNav
        batchId={batch.id}
        current="invites"
        batchStatus={batch.status}
      />
      <h1 className="mt-4 font-serif text-3xl text-foreground">{batch.name}</h1>
      <BatchInvitesClient
        batchId={batch.id}
        initialRoster={roster}
        initialPreflight={preflight}
      />
    </div>
  );
}
