import Link from "next/link";
import { getProfessorActor } from "@/lib/mode";
import {
  getGroupAssessment,
  getGroupSession,
  listGroupDecisions,
  listParticipants,
} from "@/lib/db/group-queries";
import { GROUP_ROLES, type SeatKey } from "@/lib/case/group-roles";
import {
  formatSessionRemaining,
  isSessionExpired,
  sessionExpiresAt,
  sessionMsRemaining,
} from "@/lib/group-session-lifetime";
import { SessionStaffControls } from "./staff-controls";
import { ShareSeatLinks } from "./share-links";
import { DeleteSessionButton } from "./delete-session-button";
import { ProfessorLiveLobby } from "./live-lobby";

export default async function ProfessorGroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await getProfessorActor();
  const { id } = await params;
  const session = await getGroupSession(id);
  if (!session) {
    return <p className="p-8">Session not found.</p>;
  }
  const participants = await listParticipants(id);
  const decisions = await listGroupDecisions(id);
  const assessment = await getGroupAssessment(id);

  const humanSeats = participants
    .filter((p) => !p.isAi && p.joinToken)
    .map((p) => ({
      roleKey: p.roleKey,
      title: GROUP_ROLES[p.roleKey as SeatKey]?.title ?? p.roleKey,
      token: p.joinToken!,
      displayName: p.displayName,
      isReady: p.isReady,
    }));

  const opened = humanSeats.filter((s) => Boolean(s.displayName)).length;
  const expired = isSessionExpired(session);
  const remaining = sessionMsRemaining(session);
  const expiryLabel =
    session.status === "lobby" || session.status === "active"
      ? formatSessionRemaining(remaining)
      : expired
        ? "Expired"
        : null;

  return (
    <div className="mx-auto max-w-3xl px-6 py-12 md:px-8">
      <Link href="/professor" className="text-sm underline">
        ← Sessions
      </Link>
      <h1 className="mt-4 font-serif text-3xl text-foreground">
        Session {session.code}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Status: {session.status} · Decisions {session.decisionsMade}/
        {session.decisionCount} · Roleplay {session.roleplayModel} · Grader{" "}
        {session.graderModel}
        {expiryLabel ? ` · ${expiryLabel}` : ""}
      </p>
      {expired ? (
        <p className="mt-3 border border-border bg-surface px-4 py-3 text-sm text-muted-foreground">
          This session passed the 30-minute window. Students cannot join or
          play. Delete it and create a new session if needed.
        </p>
      ) : session.status === "lobby" || session.status === "active" ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Expires at {sessionExpiresAt(session).toLocaleTimeString()} (30 min
          from creation).
        </p>
      ) : null}

      <section className="mt-10">
        <h2 className="text-sm font-medium text-foreground">
          Share join links
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Paste these to participants. Format:{" "}
          <code className="text-xs">/?join=…</code>
        </p>
        <ShareSeatLinks seats={humanSeats} sessionCode={session.code} />
      </section>

      <ProfessorLiveLobby sessionId={session.id} status={session.status} />

      <SessionStaffControls
        sessionId={session.id}
        status={session.status}
        hasAssessment={Boolean(assessment)}
        assessmentStatus={assessment?.status}
        assessment={assessment?.assessment}
        professorNotes={assessment?.professorNotes}
        humanSeatsOpened={opened}
        humanSeatsTotal={humanSeats.length}
      />

      {decisions.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-sm font-medium text-foreground">Decisions</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {decisions.map((d) => (
              <li key={d.id} className="border border-border px-3 py-2">
                <p className="font-medium text-foreground">{d.decision}</p>
                <p className="mt-1 text-muted-foreground">{d.reasoning}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <DeleteSessionButton sessionId={session.id} code={session.code} />
    </div>
  );
}
