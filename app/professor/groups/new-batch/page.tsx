import Link from "next/link";
import { getProfessorActor } from "@/lib/mode";
import { getModelPrefs } from "@/lib/model-prefs";
import { NewBatchClient } from "./batch-client";

export default async function NewBatchPage() {
  await getProfessorActor();
  const prefs = await getModelPrefs();

  return (
    <div className="mx-auto max-w-5xl px-6 py-12 md:px-8">
      <Link href="/professor" className="text-sm underline">
        ← Sessions
      </Link>
      <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Professor
      </p>
      <h1 className="mt-2 font-serif text-3xl text-foreground">
        Create groups from roster
      </h1>
      <p className="mt-3 max-w-[60ch] text-sm text-muted-foreground">
        Upload a class roster, auto-split into balanced groups of up to five
        seats, assign characters, then create all sessions in one batch with
        unique join links.
      </p>
      <NewBatchClient
        defaultRoleplayModel={prefs.roleplayModel}
        defaultGraderModel={prefs.graderModel}
      />
    </div>
  );
}
