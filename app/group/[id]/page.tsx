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
  type SeatKey,
} from "@/lib/case/group-roles";
import { isSessionExpired } from "@/lib/group-session-lifetime";
import { SharedBriefingPager } from "@/app/components/group/shared-briefing-pager";
import { groupCastForScene, toPublicRoster } from "@/lib/group/public-roster";
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
  const publicRoster = toPublicRoster(participants, roleKey);

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
    const scene0 = caseConfig.scenes[caseConfig.startScene];
    return (
      <div className="mx-auto max-w-3xl px-6 py-12 md:px-8">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Lobby · {session.code} · your seat: {brief.title}
        </p>
        <h1 className="mt-2 font-serif text-3xl text-foreground">
          Prepare as {brief.name}
        </h1>

        <section className="mt-10">
          <SharedBriefingPager pages={caseConfig.briefingPages} />
        </section>

        <section className="mt-12 border-l-2 border-accent bg-surface px-5 py-5">
          <p className="text-xs uppercase tracking-wide text-accent">
            CONFIDENTIAL — do not share.
          </p>
          <h2 className="mt-2 font-serif text-2xl text-foreground">
            {brief.name}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{brief.title}</p>

          <div className="mt-6 space-y-4">
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
                Central objective
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

          {brief.rebuttals.length > 0 ? (
            <div className="mt-6">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                If you hear… / You can respond…
              </p>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="py-2 pr-3 font-medium">If you hear</th>
                      <th className="py-2 font-medium">You can respond</th>
                    </tr>
                  </thead>
                  <tbody>
                    {brief.rebuttals.map((r) => (
                      <tr key={r.ifYouHear} className="border-b border-border/60 align-top">
                        <td className="py-2 pr-3 text-muted-foreground">
                          {r.ifYouHear}
                        </td>
                        <td className="py-2 text-foreground">{r.youCanRespond}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {brief.openingStatement ? (
            <div className="mt-6 border border-border bg-background px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Opening statement
              </p>
              <p className="mt-2 text-sm italic leading-relaxed text-foreground">
                {brief.openingStatement}
              </p>
            </div>
          ) : null}

          <p className="mt-6 text-sm text-foreground">
            <span className="font-medium">Success looks like:</span>{" "}
            {brief.successCondition}
          </p>

          {brief.privateNote ? (
            <p className="mt-6 border-l-2 border-accent pl-3 text-sm italic text-muted-foreground">
              Private note: {brief.privateNote}
            </p>
          ) : null}

          {roleKey === "ceo" && scene0 ? (
            <div className="mt-8">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Decision options (CEO only)
              </p>
              <ul className="mt-3 space-y-2">
                {scene0.options.map((o) => (
                  <li
                    key={o.key}
                    className="border border-border bg-background px-3 py-2 text-sm"
                  >
                    {o.label}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>

        <section className="mt-10">
          <h2 className="text-sm font-medium text-foreground">
            Who else is in the meeting
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Names and titles only — no other role briefs.
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            {publicRoster.map((p) => (
              <li key={p.id}>
                <span className="text-foreground">{p.name}</span>
                <span className="text-muted-foreground"> — {p.title}</span>
                {p.isAi ? (
                  <span className="text-muted-foreground"> (AI)</span>
                ) : null}
                {p.isYou ? (
                  <span className="text-muted-foreground"> (you)</span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>

        <GroupMeetingClient
          mode="lobby"
          sessionId={session.id}
          sessionCode={session.code}
          roleKey={roleKey}
          participantId={me.id}
          joinToken={me.joinToken ?? seatToken ?? ""}
          isReady={Boolean(me.isReady)}
          isCeo={roleKey === "ceo"}
          status={session.status}
          decisionsMade={session.decisionsMade}
          decisionCount={session.decisionCount}
          scene={null}
          cast={caseConfig.cast}
          sceneCast={[]}
          messages={[]}
          options={[]}
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
      evidence?: string[];
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
          <p className="mt-8 font-serif text-xl leading-relaxed text-foreground md:text-2xl">
            {a.epilogue}
          </p>
        ) : null}
        {a.summary ? (
          <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
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
        {a.evidence?.length ? (
          <section className="mt-8">
            <h2 className="text-sm font-medium text-foreground">Evidence</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              {a.evidence.map((item, i) => (
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
          Meeting concluded
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          The debrief will appear when your professor releases it.
        </p>
      </div>
    );
  }

  const sceneCast = scene
    ? groupCastForScene(session.caseSlug, scene.id)
    : [];

  return (
    <div className="mx-auto max-w-3xl px-6 py-12 md:px-8">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        Meeting · {session.code}
      </p>

      <GroupMeetingClient
        mode="meeting"
        sessionId={session.id}
        sessionCode={session.code}
        roleKey={roleKey}
        participantId={me.id}
        joinToken={me.joinToken ?? seatToken ?? ""}
        isReady={Boolean(me.isReady)}
        isCeo={roleKey === "ceo"}
        status={session.status}
        decisionsMade={session.decisionsMade}
        decisionCount={session.decisionCount}
        scene={
          scene
            ? {
                id: scene.id,
                title: scene.title,
                timeLabel: scene.timeLabel,
                brief: scene.brief,
                minExchanges: scene.minExchanges,
              }
            : null
        }
        cast={caseConfig.cast}
        sceneCast={sceneCast}
        messages={messages.map((m) => ({
          id: m.id,
          roleKey: m.roleKey,
          senderKind: m.senderKind,
          content: m.content,
          sceneId: m.sceneId,
        }))}
        options={scene?.options.map((o) => ({ key: o.key, label: o.label })) ?? []}
        roleBriefCollapsed={{
          name: brief.name,
          title: brief.title,
          stance: brief.initialStance,
          objective: brief.centralObjective,
          opening: brief.openingStatement,
        }}
      />

      {decisions.length > 0 ? (
        <p className="mt-6 text-xs text-muted-foreground">
          Decisions made: {decisions.length}
        </p>
      ) : null}
    </div>
  );
}
