import Link from "next/link";
import { getProfessorActor } from "@/lib/mode";
import {
  listBatchesForProfessor,
  listGroupSessions,
} from "@/lib/db/group-queries";
import { getModelPrefs } from "@/lib/model-prefs";
import {
  formatSessionRemaining,
  isSessionExpired,
  sessionMsRemaining,
} from "@/lib/group-session-lifetime";
import { CreateSessionForm } from "./groups/create-form";
import { ProfessorSessionList } from "./groups/session-list";

/**
 * Professor home — create groups and share join links. Mode toggle only (no auth).
 */
export default async function ProfessorPage() {
  const profile = await getProfessorActor();
  const sessions = await listGroupSessions(profile);
  const batches = await listBatchesForProfessor(profile.id);
  const prefs = await getModelPrefs();

  const rows = sessions.map((s) => {
    const expired = isSessionExpired(s);
    const remaining = sessionMsRemaining(s);
    return {
      id: s.id,
      code: s.code,
      status: s.status,
      decisionsMade: s.decisionsMade,
      decisionCount: s.decisionCount,
      roleplayModel: s.roleplayModel,
      expired,
      remainingLabel:
        expired
          ? "Expired"
          : s.status === "lobby" || s.status === "active"
            ? formatSessionRemaining(remaining)
            : null,
      batchId: s.batchId,
    };
  });

  return (
    <div className="mx-auto max-w-3xl px-6 py-12 md:px-8">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Professor
      </p>
      <h1 className="mt-2 font-serif text-3xl text-foreground">
        Group sessions
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Create a session, assign Human or AI seats, then share each join link
        with a student. Each session expires after <strong>30 minutes</strong> in
        the lobby or meeting. CEO always commits the final decision.
      </p>

      <p className="mt-6">
        <Link
          href="/professor/groups/new-batch"
          className="inline-block border border-border bg-accent px-4 py-2.5 text-sm text-accent-foreground transition-all hover:brightness-110"
        >
          Create groups from roster →
        </Link>
      </p>

      <CreateSessionForm
        defaultRoleplayModel={prefs.roleplayModel}
        defaultGraderModel={prefs.graderModel}
      />

      {batches.length > 0 ? (
        <section className="mt-12">
          <h2 className="text-sm font-medium text-foreground">Your batches</h2>
          <ul className="mt-4 divide-y divide-border border border-border">
            {batches.map((b) => (
              <li key={b.id} className="px-4 py-3 text-sm">
                <Link
                  href={`/professor/groups/batch/${b.id}`}
                  className="font-medium text-foreground underline-offset-2 hover:underline"
                >
                  {b.name}
                </Link>
                <span className="ml-2 text-muted-foreground">
                  {b.caseSlug} · {b.decisionCount} decisions
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <h2 className="mt-12 text-sm font-medium text-foreground">Your sessions</h2>
      <div className="mt-4 border border-border">
        <ProfessorSessionList sessions={rows} />
      </div>

      <p className="mt-10 text-xs text-muted-foreground">
        <Link href="/" className="underline underline-offset-2">
          ← Admin home
        </Link>
        {" · "}
        <Link href="/settings" className="underline underline-offset-2">
          Settings
        </Link>
        {" · "}
        <Link href="/professor/runs" className="underline underline-offset-2">
          Solo student runs
        </Link>
      </p>
    </div>
  );
}
