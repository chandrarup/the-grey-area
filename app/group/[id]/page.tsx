import { getSeatParticipantId } from "@/app/group/actions";
import {
  getGroupAssessment,
  getGroupMessages,
  getGroupSession,
  getParticipantByToken,
  listGroupDecisions,
  listParticipants,
  listPressureStances,
} from "@/lib/db/group-queries";
import { getCase } from "@/lib/case/registry";
import {
  GROUP_ROLES,
  type SeatKey,
} from "@/lib/case/group-roles";
import { isSessionExpired } from "@/lib/group-session-lifetime";
import { LobbyBriefingGate } from "@/app/components/group/lobby-briefing-gate";
import { groupCastForScene, toPublicRoster } from "@/lib/group/public-roster";
import { evaluateRoomStanceClimate } from "@/lib/group/meeting-runtime";
import { GroupMeetingClient } from "./meeting-client";
import { TerminalConsequence } from "./terminal-consequence";
import type { CastMember, SceneProp, ScriptBeat, StageMood } from "@/lib/case/types";

async function climateForDecidedScene(
  sessionId: string,
  sceneId: string,
  authored: Record<string, { key: string; label: string }[]> | undefined,
) {
  const rows = await listPressureStances(sessionId, sceneId);
  return evaluateRoomStanceClimate({
    authored: authored ?? {},
    records: rows.map((r) => ({
      seatId: r.roleKey,
      status: r.status === "abstain" ? "abstain" : "locked",
      chipKey: r.chipKey,
    })),
  });
}

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
  // Personas are server-only prompts; the stage needs names and locations.
  const stageCast: CastMember[] = caseConfig.cast.map((m) => ({
    id: m.id,
    name: m.name,
    role: m.role,
    location: m.location,
    persona: "",
  }));

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
          This group session ran out of time. Ask your professor to create
          a new session and send a fresh join link.
        </p>
      </div>
    );
  }

  if (session.status === "lobby") {
    const scene0 = caseConfig.scenes[caseConfig.startScene];
    const briefKey = `${session.id}:${roleKey}`;
    return (
      <div className="mx-auto max-w-3xl px-6 py-12 md:px-8">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Lobby · {session.displayName?.trim() || session.code} · your seat:{" "}
          {brief.title}
          {session.displayName?.trim() ? (
            <span className="font-mono"> · code {session.code}</span>
          ) : null}
        </p>
        <h1 className="mt-2 font-serif text-3xl text-foreground">
          Prepare as {brief.name}
        </h1>

        <LobbyBriefingGate
          storageKey={briefKey}
          pages={caseConfig.briefingPages}
        >
          <section className="border-l-2 border-accent bg-surface px-5 py-5">
            <p className="text-xs uppercase tracking-wide text-accent">
              CONFIDENTIAL — do not share. · {brief.title}
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
                        <tr
                          key={r.ifYouHear}
                          className="border-b border-border/60 align-top"
                        >
                          <td className="py-2 pr-3 text-muted-foreground">
                            {r.ifYouHear}
                          </td>
                          <td className="py-2 text-foreground">
                            {r.youCanRespond}
                          </td>
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
            cast={stageCast}
            sceneCast={[]}
            messages={[]}
            options={[]}
          />
        </LobbyBriefingGate>
      </div>
    );
  }

  const sceneIdRaw = session.currentSceneId;
  let sceneId =
    sceneIdRaw && caseConfig.scenes[sceneIdRaw]
      ? sceneIdRaw
      : caseConfig.startScene;
  let scene = caseConfig.scenes[sceneId] ?? null;

  // Repair orphaned scene ids left over from case rewrites (e.g. 5→3 scenes).
  if (
    session.status === "active" &&
    (!sceneIdRaw || !caseConfig.scenes[sceneIdRaw])
  ) {
    sceneId = caseConfig.startScene;
    scene = caseConfig.scenes[sceneId] ?? null;
    const { repairGroupSessionScene } = await import("@/lib/db/group-queries");
    await repairGroupSessionScene(session.id, sceneId).catch(() => null);
  }

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
          Released debrief · {session.displayName?.trim() || session.code}
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
    const lastDecision = decisions[decisions.length - 1];
    const lastOption = lastDecision
      ? caseConfig.scenes[lastDecision.sceneId]?.options.find(
          (o) => o.key === lastDecision.optionKey,
        )
      : undefined;
    const terminalClimate =
      lastDecision && lastOption?.consequence && lastOption.next === null
        ? await climateForDecidedScene(
            session.id,
            lastDecision.sceneId,
            caseConfig.scenes[lastDecision.sceneId]?.pressureStances,
          )
        : null;
    const terminalFilm =
      lastDecision && lastOption?.consequence && lastOption.next === null
        ? {
            decisionId: lastDecision.id,
            label: lastDecision.decision,
            reasoning: lastDecision.reasoning,
            consequence: lastOption.consequence,
            stanceClimate: terminalClimate,
          }
        : null;
    const sceneTitles = Object.fromEntries(
      Object.values(caseConfig.scenes).map((s) => [s.id, s.title]),
    );
    const needsReflection =
      !me.isAi && !(me.reflections && me.reflections.length > 0);
    return (
      <TerminalConsequence
        sessionId={session.id}
        sessionCode={session.code}
        sessionLabel={session.displayName?.trim() || session.code}
        film={terminalFilm}
        decisions={decisions.map((d) => ({
          id: d.id,
          sceneId: d.sceneId,
          decision: d.decision,
          reasoning: d.reasoning,
        }))}
        sceneTitles={sceneTitles}
        cast={stageCast}
        needsReflection={needsReflection}
        participantId={me.id}
        joinToken={me.joinToken ?? seatToken ?? ""}
        reflectionQuestions={caseConfig.reflectionQuestions}
        roleKey={roleKey}
        isCeo={roleKey === "ceo"}
        initialScenePhase={session.scenePhase ?? "open"}
        initialPhaseDeadlineAt={
          session.phaseDeadlineAt
            ? session.phaseDeadlineAt.toISOString()
            : null
        }
        initialFilmWatchedSeatIds={
          Array.isArray(session.filmWatchedSeatIds)
            ? session.filmWatchedSeatIds.filter(
                (v): v is string => typeof v === "string",
              )
            : []
        }
      />
    );
  }

  const sceneCast = scene
    ? groupCastForScene(session.caseSlug, scene.id)
    : [];
  const mood: StageMood =
    scene?.script?.find(
      (b): b is Extract<typeof b, { kind: "setting" }> => b.kind === "setting",
    )?.mood ?? "morning";

  // Consequence of the decision that led into this scene, played once per seat.
  const lastDecision = decisions[decisions.length - 1];
  const lastOption = lastDecision
    ? caseConfig.scenes[lastDecision.sceneId]?.options.find(
        (o) => o.key === lastDecision.optionKey,
      )
    : undefined;
  const filmClimate =
    lastDecision && lastOption?.consequence && lastOption.next === scene?.id
      ? await climateForDecidedScene(
          session.id,
          lastDecision.sceneId,
          caseConfig.scenes[lastDecision.sceneId]?.pressureStances,
        )
      : null;
  const film =
    lastDecision && lastOption?.consequence && lastOption.next === scene?.id
      ? {
          decisionId: lastDecision.id,
          label: lastDecision.decision,
          reasoning: lastDecision.reasoning,
          consequence: lastOption.consequence,
          stanceClimate: filmClimate,
        }
      : null;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 md:px-8">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        Meeting · {session.displayName?.trim() || session.code}
        {session.displayName?.trim() ? (
          <span className="font-mono"> · code {session.code}</span>
        ) : null}
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
                commitPrompt: scene.commitPrompt,
                mood,
                minExchanges: scene.minExchanges,
              }
            : null
        }
        cast={stageCast}
        sceneCast={sceneCast}
        messages={messages.map((m) => ({
          id: m.id,
          roleKey: m.roleKey,
          senderKind: m.senderKind,
          content: m.content,
          sceneId: m.sceneId,
        }))}
        options={scene?.options.map((o) => ({ key: o.key, label: o.label })) ?? []}
        pressureStances={scene?.pressureStances ?? {}}
        roleBriefCollapsed={{
          name: brief.name,
          title: brief.title,
          stance: brief.initialStance,
          objective: brief.centralObjective,
          opening: brief.openingStatement,
        }}
        film={film}
        script={(scene?.script ?? []) as ScriptBeat[]}
        sceneProps={(scene?.props ?? []) as SceneProp[]}
        scenePhase={session.scenePhase ?? "open"}
        phaseDeadlineAt={
          session.phaseDeadlineAt
            ? session.phaseDeadlineAt.toISOString()
            : null
        }
        stanceDeadlineAt={
          session.stanceDeadlineAt
            ? session.stanceDeadlineAt.toISOString()
            : null
        }
        filmWatchedSeatIds={
          Array.isArray(session.filmWatchedSeatIds)
            ? session.filmWatchedSeatIds
            : []
        }
        scriptDoneSeatIds={
          Array.isArray(session.scriptDoneSeatIds)
            ? session.scriptDoneSeatIds
            : []
        }
      />

      {decisions.length > 0 ? (
        <p className="mt-6 text-xs text-muted-foreground">
          Decisions made: {decisions.length}
        </p>
      ) : null}
    </div>
  );
}
