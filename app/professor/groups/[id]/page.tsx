import Link from "next/link";
import { getProfessorActor } from "@/lib/mode";
import {
  getGroupAssessment,
  getGroupMessages,
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
import { StaffLiveTranscript } from "./live-transcript";
import { GroupPathTaken } from "./path-taken";
import { AssessmentInsights } from "./assessment-insights";

export default async function ProfessorGroupDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ batch?: string }>;
}) {
  await getProfessorActor();
  const { id } = await params;
  const { batch: batchId } = await searchParams;
  const session = await getGroupSession(id);
  if (!session) {
    return <p className="p-8">Session not found.</p>;
  }
  const participants = await listParticipants(id);
  const decisions = await listGroupDecisions(id);
  const assessment = await getGroupAssessment(id);
  const messages = await getGroupMessages(id);

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

  const backHref = batchId
    ? `/professor/groups/batch/${batchId}`
    : session.batchId
      ? `/professor/groups/batch/${session.batchId}`
      : "/professor";
  const backLabel =
    batchId || session.batchId ? "← Batch board" : "← Sessions";

  return (
    <div className="mx-auto max-w-3xl px-6 py-12 md:px-8">
      <Link href={backHref} className="text-sm underline">
        {backLabel}
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

      {(session.status === "lobby" ||
        session.status === "active" ||
        session.status === "committed" ||
        session.status === "graded" ||
        session.status === "released") && (
        <StaffLiveTranscript
          sessionId={session.id}
          caseSlug={session.caseSlug}
          initialMessages={messages.map((m) => ({
            id: m.id,
            roleKey: m.roleKey,
            senderKind: m.senderKind,
            content: m.content,
            sceneId: m.sceneId,
          }))}
        />
      )}

      <GroupPathTaken caseSlug={session.caseSlug} decisions={decisions} />

      {assessment?.assessment ? (
        <AssessmentInsights assessment={assessment.assessment} />
      ) : null}

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

      <DeleteSessionButton sessionId={session.id} code={session.code} />
    </div>
  );
}
