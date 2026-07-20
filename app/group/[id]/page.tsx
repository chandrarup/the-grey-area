import { getSeatParticipantId } from "@/app/group/actions";
import {
  getGroupAssessment,
  getGroupMessages,
  getGroupSession,
  getParticipantByToken,
  listGroupDecisions,
  listParticipants,
} from "@/lib/db/group-queries";
import { getCase } from "@/lib/case/registry";
import {
  GROUP_ROLES,
  SHARED_CASE_CONTEXT,
  seatDisplayName,
  type SeatKey,
} from "@/lib/case/group-roles";
import { isSessionExpired } from "@/lib/group-session-lifetime";
import { MarkdownBody } from "@/app/components/markdown-body";
import { GroupMeetingClient } from "./meeting-client";

export default async function GroupSessionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { id } = await params;
  const { t: seatToken } = await searchParams;
  const session = await getGroupSession(id);
  if (!session) {
    return <p className="p-8">Session not found.</p>;
  }

  const participants = await listParticipants(id);

  let me = null;
  if (seatToken) {
    const byToken = await getParticipantByToken(seatToken);
    if (byToken && byToken.sessionId === id) {
      me = participants.find((p) => p.id === byToken.id) ?? byToken;
    }
  }
  if (!me) {
    const seatParticipantId = await getSeatParticipantId();
    me = participants.find((p) => p.id === seatParticipantId) ?? null;
  }

  const caseConfig = getCase(session.caseSlug);
  const roleKey = (me?.roleKey ?? "ceo") as SeatKey;
  const brief = GROUP_ROLES[roleKey];
  const messages = await getGroupMessages(id);
  const decisions = await listGroupDecisions(id);
  const assessment = await getGroupAssessment(id);

  if (!me) {
    return (
      <div className="mx-auto max-w-lg px-6 py-16">
        <h1 className="font-serif text-2xl text-foreground">
          Open a seat first
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          From the professor session page, copy your join link for this role.
        </p>
      </div>
    );
  }

  if (session.status === "expired" || isSessionExpired(session)) {
    return (
      <div className="mx-auto max-w-lg px-6 py-16">
        <h1 className="font-serif text-2xl text-foreground">Session expired</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          This group session ended after 30 minutes. Ask your professor to create
          a new session and send a fresh join link.
        </p>
      </div>
    );
  }

  if (session.status === "lobby") {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12 md:px-8">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Lobby · {session.code} · your seat: {brief.title}
        </p>
        <h1 className="mt-2 font-serif text-3xl text-foreground">
          Prepare as {brief.name}
        </h1>
        <p className="mt-3 max-w-[60ch] text-sm text-muted-foreground">
          You are not playing every role. Stay in character as{" "}
          <span className="text-foreground">{brief.title}</span>. The CEO alone
          commits the final decision — your job is to make that decision sharper.
        </p>

        {/* Role-first card */}
        <section className="mt-10 border-l-2 border-accent bg-surface px-5 py-5">
          <p className="text-xs uppercase tracking-wide text-accent">
            {brief.confidential
              ? "Your confidential brief — only you see this"
              : "Your briefing"}
          </p>
          <h2 className="mt-2 font-serif text-2xl text-foreground">
            {brief.name}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{brief.title}</p>

          <div className="mt-6 space-y-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                What you must do
              </p>
              <p className="mt-1 text-sm leading-relaxed text-foreground">
                {brief.yourJob}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {roleKey === "ceo"
                  ? "How to use your team"
                  : "How you help the CEO decide"}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-foreground">
                {brief.howYouHelpCeo}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Your stance
              </p>
              <p className="mt-1 text-sm leading-relaxed text-foreground">
                {brief.initialStance}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Objective in this meeting
              </p>
              <p className="mt-1 text-sm leading-relaxed text-foreground">
                {brief.centralObjective}
              </p>
            </div>
          </div>

          <dl className="mt-6 grid gap-3 sm:grid-cols-2">
            {Object.entries(brief.atAGlance).map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                  {k}
                </dt>
                <dd className="mt-1 text-sm text-foreground">{v}</dd>
              </div>
            ))}
          </dl>

          {brief.openingStatement ? (
            <div className="mt-6 border border-border bg-background px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Suggested opening (in character)
              </p>
              <p className="mt-2 text-sm italic leading-relaxed text-foreground">
                {brief.openingStatement}
              </p>
            </div>
          ) : null}

          {brief.privateNote ? (
            <p className="mt-6 border-l-2 border-accent pl-3 text-sm italic text-muted-foreground">
              Private note: {brief.privateNote}
            </p>
          ) : null}

          {brief.rebuttals.length > 0 ? (
            <div className="mt-6">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                If you hear… you can respond
              </p>
              <ul className="mt-3 space-y-3">
                {brief.rebuttals.map((r) => (
                  <li key={r.ifYouHear} className="text-sm">
                    <p className="text-muted-foreground">
                      “{r.ifYouHear}”
                    </p>
                    <p className="mt-1 text-foreground">{r.youCanRespond}</p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <p className="mt-6 text-sm text-foreground">
            <span className="font-medium">Success looks like:</span>{" "}
            {brief.successCondition}
          </p>
        </section>

        {/* Shared third-person context */}
        <section className="mt-12">
          <h2 className="text-sm font-medium text-foreground">
            {SHARED_CASE_CONTEXT.title}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {SHARED_CASE_CONTEXT.lead}
          </p>
          <div className="mt-6 space-y-6">
            {SHARED_CASE_CONTEXT.sections.map((section) => (
              <article key={section.title}>
                <h3 className="font-serif text-xl text-foreground">
                  {section.title}
                </h3>
                <div className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  <MarkdownBody source={section.body} />
                </div>
              </article>
            ))}
          </div>
        </section>

        <GroupMeetingClient
          mode="lobby"
          sessionId={session.id}
          roleKey={roleKey}
          participantId={me.id}
          isReady={Boolean(me.isReady)}
          isCeo={roleKey === "ceo"}
          status={session.status}
          scene={null}
          cast={caseConfig.cast}
          messages={[]}
          options={[]}
          roleMission={
            roleKey === "ceo"
              ? brief.yourJob
              : `${brief.yourJob} ${brief.howYouHelpCeo}`
          }
        />
      </div>
    );
  }

  const sceneId = session.currentSceneId;
  const scene = sceneId ? caseConfig.scenes[sceneId] : null;

  if (
    session.status === "released" &&
    assessment?.status === "released" &&
    assessment.assessment
  ) {
    const a = assessment.assessment as {
      epilogue?: string;
      summary?: string;
      what_went_well?: string[];
      what_to_improve?: string[];
      better_decisions?: string[];
    };
    return (
      <div className="mx-auto max-w-3xl px-6 py-12 md:px-8">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Released debrief · {session.code}
        </p>
        <h1 className="mt-2 font-serif text-3xl text-foreground">
          Group debrief
        </h1>
        {a.epilogue ? (
          <p className="mt-6 text-sm leading-relaxed text-foreground">
            {a.epilogue}
          </p>
        ) : null}
        {a.summary ? (
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            {a.summary}
          </p>
        ) : null}
        {a.what_went_well?.length ? (
          <section className="mt-10">
            <h2 className="text-sm font-medium text-foreground">
              What went well
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              {a.what_went_well.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </section>
        ) : null}
        {a.what_to_improve?.length ? (
          <section className="mt-8">
            <h2 className="text-sm font-medium text-foreground">
              What to improve
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              {a.what_to_improve.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </section>
        ) : null}
        {a.better_decisions?.length ? (
          <section className="mt-8">
            <h2 className="text-sm font-medium text-foreground">
              Better decisions next time
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              {a.better_decisions.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </section>
        ) : null}
        {assessment.professorNotes ? (
          <p className="mt-10 border-l-2 border-accent pl-4 text-sm italic text-muted-foreground">
            {assessment.professorNotes}
          </p>
        ) : null}
      </div>
    );
  }

  if (session.status === "committed" || session.status === "graded") {
    return (
      <div className="mx-auto max-w-lg px-6 py-16">
        <h1 className="font-serif text-2xl text-foreground">
          Meeting complete
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          The professor is reviewing the group debrief. You will see it here
          once it is released.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12 md:px-8">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        Meeting · {session.code} · you are {brief.title}
      </p>
      {scene ? (
        <>
          <h1 className="mt-2 font-serif text-3xl text-foreground">
            {scene.title}
          </h1>
          <div className="mt-4 border-l-2 border-accent bg-surface px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-accent">
              Playing as {seatDisplayName(roleKey)}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-foreground">
              {brief.yourJob}
            </p>
            {roleKey !== "ceo" ? (
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {brief.howYouHelpCeo}
              </p>
            ) : (
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {scene.brief}
              </p>
            )}
          </div>
        </>
      ) : (
        <h1 className="mt-2 font-serif text-3xl text-foreground">
          Session complete
        </h1>
      )}

      <GroupMeetingClient
        mode="meeting"
        sessionId={session.id}
        roleKey={roleKey}
        participantId={me.id}
        isReady={Boolean(me.isReady)}
        isCeo={roleKey === "ceo"}
        status={session.status}
        scene={
          scene
            ? {
                id: scene.id,
                title: scene.title,
                minExchanges: scene.minExchanges,
              }
            : null
        }
        cast={caseConfig.cast}
        messages={messages.map((m) => ({
          id: m.id,
          roleKey: m.roleKey,
          senderKind: m.senderKind,
          content: m.content,
          sceneId: m.sceneId,
        }))}
        options={scene?.options.map((o) => ({ key: o.key, label: o.label })) ?? []}
        roleMission={brief.yourJob}
      />

      {decisions.length > 0 ? (
        <p className="mt-6 text-xs text-muted-foreground">
          Decisions made: {decisions.length}
        </p>
      ) : null}
    </div>
  );
}
