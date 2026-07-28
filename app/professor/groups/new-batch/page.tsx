import Link from "next/link";
import { getProfessorActor } from "@/lib/mode";
import { getModelPrefs } from "@/lib/model-prefs";
import { isDevIdentityEnabled } from "@/lib/auth/role-guard";
import { NewBatchClient } from "./batch-client";
import { BatchFlowNav } from "@/app/professor/groups/batch-flow-nav";

export default async function NewBatchPage() {
  await getProfessorActor();
  const prefs = await getModelPrefs();

  return (
    <div className="mx-auto max-w-5xl px-6 py-12 md:px-8">
      <Link href="/professor" className="text-sm underline">
        ← Sessions
      </Link>
      <BatchFlowNav batchId={null} current="create" />
      <h1 className="mt-4 font-serif text-3xl text-foreground">
        Create groups from roster
      </h1>
      <p className="mt-3 max-w-[60ch] text-sm text-muted-foreground">
        Upload a class roster, split into balanced groups with memorable names,
        then create sessions and send invites. Your draft is saved when you
        split so you can leave and return.
      </p>
      <NewBatchClient
        defaultRoleplayModel={prefs.roleplayModel}
        defaultGraderModel={prefs.graderModel}
        showModelPickers={isDevIdentityEnabled()}
      />
    </div>
  );
}
