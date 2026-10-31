import Link from "next/link";
import { requireInstructorArea, isDevIdentityEnabled } from "@/lib/auth/role-guard";
import {
  listBatchesForProfessor,
  listGroupSessions,
} from "@/lib/db/group-queries";
import { getProfessorActor } from "@/lib/mode";
import { getModelPrefs } from "@/lib/model-prefs";
import {
  formatSessionRemaining,
  isSessionExpired,
  sessionMsRemaining,
} from "@/lib/group-session-lifetime";
import { CreateSessionForm } from "./groups/create-form";
import { ProfessorSessionList } from "./groups/session-list";

/**
 * Instructor home — create sessions and open batches.
 */
export default async function ProfessorPage() {
  await requireInstructorArea();
  const profile = await getProfessorActor();
  const sessions = await listGroupSessions(profile);
  const batches = await listBatchesForProfessor(profile.role === "admin" ? undefined : profile.id);
  const prefs = await getModelPrefs();
  const showAdvanced = isDevIdentityEnabled();

  const rows = sessions.map((s) => {
    const expired = isSessionExpired(s);
    const remaining = sessionMsRemaining(s);
    return {
      id: s.id,
      code: s.code,
      displayName: s.displayName,
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
      <h1 className="font-serif text-3xl text-foreground">Sessions</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Create a live meeting, assign seats, and share join links. Lobbies
        expire after 30 minutes; once the CEO starts, the meeting has 45
        minutes.
      </p>

      <p className="mt-8">
        <Link
          href="/professor/groups/new-batch"
          className="inline-block bg-accent px-4 py-2.5 text-sm text-accent-foreground"
        >
          Create groups from roster
        </Link>
      </p>

      <CreateSessionForm
        defaultRoleplayModel={prefs.roleplayModel}
        defaultGraderModel={prefs.graderModel}
        showModelPickers={showAdvanced}
      />

      {batches.length > 0 ? (
        <section className="mt-12">
          <h2 className="text-sm font-medium text-foreground">Batches</h2>
          <ul className="mt-4 divide-y divide-border border border-border">
            {batches.map((b) => (
              <li key={b.id} className="px-4 py-3 text-sm">
                <Link
                  href={
                    b.status === "draft"
                      ? `/professor/groups/batch/${b.id}/edit`
                      : `/professor/groups/batch/${b.id}`
                  }
                  className="font-medium text-foreground underline-offset-2 hover:underline"
                >
                  {b.name}
                </Link>
                <span className="ml-2 text-muted-foreground">
                  {b.status === "draft" ? "draft · " : ""}
                  {b.decisionCount} decisions
                </span>
                {b.status === "ready" ? (
                  <Link
                    href={`/professor/groups/batch/${b.id}/edit`}
                    className="ml-2 text-xs text-muted-foreground underline"
                  >
                    Edit groups
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <h2 className="mt-12 text-sm font-medium text-foreground">
        Your sessions
      </h2>
      <div className="mt-4 border border-border">
        <ProfessorSessionList sessions={rows} />
      </div>
    </div>
  );
}
