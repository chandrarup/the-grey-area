"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type {
  CastMember,
  Consequence,
  SceneProp,
  ScriptBeat,
  StageMood,
} from "@/lib/case/types";
import type { RealtimeMessage, RealtimeParticipant } from "@/lib/realtime/types";
import { AnswerComposer } from "@/app/components/group/answer-composer";
import { GROUP_ROLES, HUMAN_MSG_GATE, suggestionLines, type SeatKey } from "@/lib/case/group-roles";
import { characterName } from "@/lib/group/public-roster";
import { formatSessionRemaining } from "@/lib/group-session-lifetime";
import MeetingStage from "@/app/simulation/decisions/three/meeting-stage";
import Film from "@/app/simulation/decisions/three/film";
import { consequenceFilm } from "@/app/simulation/decisions/three/film-beats";
import type { Direction } from "@/app/simulation/decisions/three/boardroom";
import type { AvatarAction } from "@/app/simulation/decisions/three/avatar";
import {
  prefetch,
  prepareVoices,
  say,
  speechBus,
  stopSpeech,
  subscribeSpeech,
} from "@/app/simulation/decisions/three/speech";
import { isMuted, setMuted, unlockAudio } from "@/app/simulation/decisions/stage-sound";
import { setVoicesEnabled, voicesEnabled } from "@/app/simulation/decisions/stage-voice";
import { PhotoButton, useStudentPhoto } from "@/app/simulation/decisions/stage-photo";
import {
  SceneScriptPlayer,
  scriptFingerprint,
} from "@/app/simulation/decisions/scene-script-player";
import type { PressureStanceChip } from "@/lib/case/types";
import type { RealtimePressureStance } from "@/lib/realtime/types";
import {
  buildAdvisorStanceSeats,
  evaluateCeoCommitGate,
  evaluateStanceReadiness,
  isScenePhase,
  type ScenePhase,
} from "@/lib/group/meeting-runtime";

export type GroupFilm = {
  decisionId: number;
  label: string;
  reasoning: string;
  consequence: Consequence;
  /** Presentation-only stance climate from the decided scene (ADR 0002). */
  stanceClimate?: "aligned" | "split" | null;
};

export type PhaseEventType =
  | "begin_film"
  | "film_watched"
  | "film_timeout"
  | "ceo_force_advance"
  | "enter_script"
  | "script_done"
  | "enter_live";

const MAX_BACKLOG = 3;

function sentences(text: string) {
  return text.split(/(?<=[.!?])\s+/).filter(Boolean);
}

function firstName(name: string) {
  return name.split(/\s+/)[0] ?? name;
}

export default function GroupStage(props: {
  sessionId: string;
  roleKey: string;
  isCeo: boolean;
  scene: {
    id: string;
    title: string;
    timeLabel?: string;
    brief?: string;
    commitPrompt?: string;
    mood: StageMood;
  };
  decisionsMade: number;
  decisionCount: number;
  cast: CastMember[];
  sceneCast: { id: string; name: string; title: string }[];
  participants: RealtimeParticipant[];
  messages: RealtimeMessage[];
  thinkingRoleKeys: string[];
  msRemaining: number | null;
  sending: boolean;
  onSend: (text: string) => void | Promise<void>;
  options: { key: string; label: string }[];
  reasoning: string;
  onReasoningChange: (v: string) => void;
  optionKey: string | null;
  onSelectOption: (key: string | null) => void;
  customText: string;
  onCustomTextChange: (v: string) => void;
  committing: boolean;
  onCommit: () => void | Promise<void>;
  error: string | null;
  missingToken: boolean;
  roleBrief?: {
    name: string;
    title: string;
    stance: string;
    objective: string;
    opening?: string | null;
  };
  film: GroupFilm | null;
  /** Same authored script as solo (ADR 0004). */
  script: ScriptBeat[];
  sceneProps?: SceneProp[];
  /** Server-owned hard-synced phase (ADR 0001). */
  scenePhase: ScenePhase;
  phaseDeadlineAt: string | null;
  stanceDeadlineAt: string | null;
  filmWatchedSeatIds: string[];
  scriptDoneSeatIds: string[];
  /** Authored chips per advisor seat. */
  pressureStances: Record<string, PressureStanceChip[]>;
  /** Locked / abstain rows for the current scene. */
  stances: RealtimePressureStance[];
  onLockStance: (chipKey: string, note?: string) => void | Promise<void>;
  onPhaseEvent: (type: PhaseEventType) => void | Promise<void>;
}) {
  const { messages, roleKey, isCeo, scene } = props;
  const [stanceNote, setStanceNote] = useState("");
  const [stanceBusy, setStanceBusy] = useState(false);
  const castById = useMemo(
    () => new Map(props.cast.map((m) => [m.id, m])),
    [props.cast],
  );
  /** Beat resume only — not phase authority. */
  const scriptKey = `group-script:${props.sessionId}:${scene.id}:${scriptFingerprint(props.script)}`;
  const phase: ScenePhase = isScenePhase(props.scenePhase)
    ? props.scenePhase
    : props.film
      ? "decided"
      : "open";
  const filmBeats = useMemo(
    () =>
      props.film
        ? consequenceFilm(
            props.film.consequence,
            props.cast,
            props.film.stanceClimate ?? null,
          )
        : [],
    [props.film, props.cast],
  );
  const [filmPos, setFilmPos] = useState(0);
  const [spokenUpTo, setSpokenUpTo] = useState<number | null>(null);
  const [liveAt, setLiveAt] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const [scriptWaiting, setScriptWaiting] = useState(false);
  const phaseEventBusy = useRef(false);
  const [chatOpen, setChatOpen] = useState(true);
  const [briefOpen, setBriefOpen] = useState(false);
  const [deciding, setDeciding] = useState(false);
  const [muted, setMutedState] = useState(isMuted);
  const [voicesOn, setVoicesOn] = useState(voicesEnabled);
  const [captionAt, setCaptionAt] = useState({ id: 0, idx: 0 });
  const photo = useStudentPhoto();
  const threadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void prepareVoices();
  }, []);

  useEffect(() => {
    if (phase !== "live") return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [phase]);

  const voiceState = useSyncExternalStore(
    subscribeSpeech,
    () => `${speechBus.status}:${speechBus.progress}`,
    () => "idle:0",
  );
  const [voicePhase, voiceProgress] = voiceState.split(":");
  const voiceStatus =
    voicePhase === "loading"
      ? `Preparing voices ${voiceProgress}%`
      : voicePhase === "unavailable"
        ? "Using browser voices"
        : null;

  const seatName = (key: string) => {
    const raw = props.participants
      .find((p) => p.roleKey === key)
      ?.displayName?.trim();
    return raw && !/^you\b/i.test(raw) && !raw.startsWith("You —") ? raw : null;
  };
  const ceoName = seatName("ceo") ?? "The CEO";
  const speakerName = (key: string) => {
    if (key === roleKey) return "You";
    if (key === "ceo") return `${ceoName} · CEO`;
    return castById.get(key)?.name ?? characterName(key);
  };

  // Lines are spoken one at a time, in arrival order; a long backlog skips to the latest few.
  const pending =
    spokenUpTo === null
      ? []
      : messages.filter(
          (m) => m.id > spokenUpTo && m.senderKind !== "narrator" && m.roleKey !== "narrator",
        );
  const current = pending.length
    ? pending[Math.max(0, pending.length - MAX_BACKLOG)]
    : null;
  const currentId = current?.id ?? null;
  const currentRole = current?.roleKey ?? null;
  const currentText = current?.content ?? "";

  useEffect(() => {
    if (currentId === null || currentRole === null) return;
    let cancelled = false;
    let timer = 0;
    const done = () => {
      if (!cancelled) setSpokenUpTo((v) => Math.max(v ?? 0, currentId));
    };
    if (currentRole === "ceo") {
      timer = window.setTimeout(done, Math.max(1800, currentText.length * 55));
    } else {
      void say(currentRole, currentText).then((completed) => {
        if (!completed) return;
        timer = window.setTimeout(done, 450);
      });
    }
    let startedAt = 0;
    const chunks = sentences(currentText);
    const poll = window.setInterval(() => {
      if (!startedAt) startedAt = performance.now() / 1000;
      const t = speechBus.current;
      const ratio =
        t && t.castId === currentRole
          ? (performance.now() / 1000 - t.start) / t.duration
          : (performance.now() / 1000 - startedAt) / Math.max(1.8, currentText.length * 0.055);
      let at = ratio * currentText.length;
      let idx = 0;
      for (let i = 0; i < chunks.length; i++) {
        if (at < chunks[i].length) {
          idx = i;
          break;
        }
        at -= chunks[i].length;
        idx = Math.min(i + 1, chunks.length - 1);
      }
      setCaptionAt((prev) =>
        prev.id === currentId && prev.idx >= idx ? prev : { id: currentId, idx },
      );
    }, 150);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.clearInterval(poll);
      stopSpeech();
    };
  }, [currentId, currentRole, currentText]);

  const upcoming = pending
    .filter((m) => m.id !== currentId && m.roleKey !== "ceo")
    .slice(0, 2);
  const upcomingKey = upcoming.map((m) => m.id).join(",");
  useEffect(() => {
    for (const m of upcoming) prefetch(m.roleKey, m.content);
    // Keyed by message ids; message objects are re-created on every poll.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upcomingKey]);

  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, chatOpen, props.thinkingRoleKeys.length]);

  const emitPhase = useCallback(
    async (type: PhaseEventType) => {
      if (phaseEventBusy.current) return;
      phaseEventBusy.current = true;
      try {
        await props.onPhaseEvent(type);
      } finally {
        phaseEventBusy.current = false;
      }
    },
    [props],
  );

  const armLive = useCallback(() => {
    unlockAudio();
    const real = messages.filter((m) => m.id > 0);
    setSpokenUpTo(real.length ? real[real.length - 1]!.id - 1 : 0);
    setLiveAt(Date.now());
    setNow(Date.now());
    setScriptWaiting(false);
  }, [messages]);

  // Converge local live chrome when the server enters live.
  useEffect(() => {
    if (phase === "live" && liveAt === null) armLive();
  }, [phase, liveAt, armLive]);

  // Reset film position when the room enters film together.
  useEffect(() => {
    if (phase === "film") setFilmPos(0);
  }, [phase, props.film?.decisionId]);

  useEffect(() => {
    if (phase !== "script") setScriptWaiting(false);
  }, [phase]);

  // Empty film beats still need a hard-sync mark so the room can leave film.
  useEffect(() => {
    if (phase !== "film") return;
    if (filmBeats.length > 0) return;
    if (props.filmWatchedSeatIds.includes(roleKey)) return;
    void emitPhase("film_watched");
  }, [phase, filmBeats.length, props.filmWatchedSeatIds, roleKey, emitPhase]);

  // Client-side film deadline: ask server to advance when the window ends.
  useEffect(() => {
    if (phase !== "film" || !props.phaseDeadlineAt) return;
    const ms = new Date(props.phaseDeadlineAt).getTime() - Date.now();
    if (ms <= 0) {
      void emitPhase("film_timeout");
      return;
    }
    const id = window.setTimeout(() => void emitPhase("film_timeout"), ms + 50);
    return () => window.clearTimeout(id);
  }, [phase, props.phaseDeadlineAt, emitPhase]);

  function joinMeeting() {
    unlockAudio();
    if (props.script.length === 0) {
      void emitPhase("enter_live");
      return;
    }
    void emitPhase("enter_script");
  }

  const finishScript = useCallback(() => {
    stopSpeech();
    setScriptWaiting(true);
    void emitPhase("script_done");
  }, [emitPhase]);

  function finishFilm() {
    stopSpeech();
    void emitPhase("film_watched");
  }

  const myBrief = GROUP_ROLES[roleKey as SeatKey];
  const decisionNo = Math.min(props.decisionsMade + 1, props.decisionCount);

  if (phase === "decided" && props.film) {
    return (
      <Card>
        <p className="text-[11px] uppercase tracking-[0.3em] text-white/45">
          Decision {props.decisionsMade} of {props.decisionCount}
        </p>
        <p className="mt-6 text-sm text-white/60">
          {isCeo ? "You decided" : `${ceoName} decided`}
        </p>
        <p className="mt-3 max-w-2xl text-center font-serif text-3xl leading-snug md:text-4xl">
          {props.film.label}
        </p>
        {props.film.reasoning ? (
          <p className="mt-6 max-w-xl text-center font-serif text-base italic leading-relaxed text-white/60">
            “{props.film.reasoning}”
          </p>
        ) : null}
        {props.film.stanceClimate ? (
          <p className="mt-4 text-[11px] uppercase tracking-[0.25em] text-white/40">
            {props.film.stanceClimate === "aligned"
              ? "Advisors held one line"
              : "Advisors were already divided"}
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => {
            unlockAudio();
            void emitPhase("begin_film");
          }}
          className="mt-10 rounded-full bg-white px-6 py-2 text-sm font-medium text-black"
        >
          See what happened
        </button>
      </Card>
    );
  }

  if (phase === "film") {
    if (!filmBeats.length) {
      return (
        <Card>
          <p className="mt-6 text-center font-serif text-xl text-white/70">
            Waiting for the room…
          </p>
          {isCeo ? (
            <button
              type="button"
              onClick={() => void emitPhase("ceo_force_advance")}
              className="mt-10 rounded-full border border-white/30 px-5 py-2 text-sm text-white/80"
            >
              Advance everyone
            </button>
          ) : null}
        </Card>
      );
    }
    const watched = props.filmWatchedSeatIds.includes(roleKey);
    return (
      <div onPointerDown={unlockAudio}>
        <Film
          beats={filmBeats}
          pos={filmPos}
          castById={castById}
          mood={scene.mood}
          isLast={filmPos >= filmBeats.length - 1}
          finalLabel={watched ? "Waiting for the room…" : "Back to the meeting"}
          onAdvance={() => {
            if (filmPos >= filmBeats.length - 1) {
              if (!watched) finishFilm();
              return;
            }
            setFilmPos((p) => p + 1);
          }}
        />
        {isCeo ? (
          <div className="pointer-events-none fixed inset-x-0 bottom-6 z-20 flex justify-center">
            <button
              type="button"
              className="pointer-events-auto rounded-full border border-white/30 bg-black/60 px-4 py-2 text-xs text-white/80 backdrop-blur hover:bg-black/80"
              onClick={() => void emitPhase("ceo_force_advance")}
            >
              Advance everyone
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  if (phase === "script") {
    if (scriptWaiting || props.scriptDoneSeatIds.includes(roleKey)) {
      return (
        <Card>
          <p className="text-[11px] uppercase tracking-[0.3em] text-white/45">
            Decision {decisionNo} of {props.decisionCount}
          </p>
          <p className="mt-6 max-w-md text-center font-serif text-2xl text-white/80">
            Waiting for the rest of the room…
          </p>
          {isCeo ? (
            <button
              type="button"
              onClick={() => void emitPhase("ceo_force_advance")}
              className="mt-10 rounded-full border border-white/30 px-5 py-2 text-sm text-white/80"
            >
              Advance everyone
            </button>
          ) : null}
        </Card>
      );
    }
    return (
      <SceneScriptPlayer
        script={props.script}
        cast={props.cast}
        sceneCastIds={props.sceneCast.map((s) => s.id)}
        sceneProps={props.sceneProps}
        title={scene.title}
        heading={`Decision ${decisionNo} of ${props.decisionCount}`}
        storageKey={scriptKey}
        canRespondToMoments={isCeo}
        showPhoto={isCeo}
        youLabel={isCeo ? "You · CEO" : `${ceoName} · CEO`}
        youPlaceholder={isCeo ? "You" : firstName(ceoName)}
        onComplete={finishScript}
      />
    );
  }

  if (phase !== "live") {
    return (
      <Card>
        <p className="text-[11px] uppercase tracking-[0.3em] text-white/45">
          Decision {decisionNo} of {props.decisionCount}
          {scene.timeLabel ? ` · ${scene.timeLabel}` : ""}
        </p>
        <p className="mt-5 text-center font-serif text-6xl md:text-7xl">{scene.title}</p>
        {scene.brief ? (
          <p className="mt-6 max-w-2xl text-center font-serif text-lg leading-relaxed text-white/70">
            {scene.brief}
          </p>
        ) : null}
        <p className="mt-8 text-sm text-white/55">
          {isCeo ? (
            <>
              You are <span className="text-white">the CEO</span> — you make the call.
            </>
          ) : (
            <>
              You are{" "}
              <span className="text-white">{myBrief?.name ?? characterName(roleKey)}</span>
              {myBrief?.title ? ` — ${myBrief.title}` : ""}
            </>
          )}
        </p>
        <p className="mt-4 max-w-md text-center text-sm text-white/45">
          The same scene as the solo case — then open discussion at the table.
        </p>
        <button
          type="button"
          onClick={joinMeeting}
          className="mt-8 rounded-full bg-white px-6 py-2 text-sm font-medium text-black"
        >
          {props.script.length ? "Begin the scene" : "Join the meeting"}
        </button>
        {isCeo ? (
          <button
            type="button"
            onClick={() =>
              void emitPhase(
                props.script.length ? "ceo_force_advance" : "enter_live",
              )
            }
            className="mt-4 text-xs text-white/50 underline-offset-2 hover:text-white/80 hover:underline"
          >
            Advance everyone
          </button>
        ) : null}
        {voiceStatus ? (
          <p className="mt-4 text-[11px] text-white/40">{voiceStatus}</p>
        ) : null}
      </Card>
    );
  }

  const sceneCastIds = new Set(props.sceneCast.map((s) => s.id));
  const sceneMembers = props.cast.filter((m) => sceneCastIds.has(m.id));
  const present = sceneMembers
    .filter((m) => /hq/i.test(m.location ?? ""))
    .map((m) => m.id);
  const remote = sceneMembers
    .filter((m) => !/hq/i.test(m.location ?? ""))
    .map((m) => ({ id: m.id, location: m.location ?? "" }));

  const actions: Record<string, AvatarAction> = {};
  for (const key of props.thinkingRoleKeys) actions[key] = "lookDown";
  const direction: Direction = {
    speakerId: currentRole === "ceo" ? "you" : currentRole,
    attention: "speaker",
    actions,
  };

  const chunks = sentences(currentText);
  const caption =
    current && currentRole
      ? {
          name: speakerName(currentRole),
          text:
            chunks[Math.min(captionAt.id === currentId ? captionAt.idx : 0, chunks.length - 1)] ??
            currentText,
          isYou: currentRole === roleKey,
        }
      : null;

  const humanCount = messages.filter((m) => m.senderKind === "human").length;
  const advisorSeatIds = Object.keys(props.pressureStances);
  const rosterReady = props.participants.length > 0;
  const advisorSeats = advisorSeatIds.map((seatId) => {
    const p = props.participants.find((x) => x.roleKey === seatId);
    const kind: "human" | "bot" =
      p && !p.isAi && p.joined ? "human" : "bot";
    return { seatId, kind };
  });
  const readinessSeats = buildAdvisorStanceSeats({
    advisorSeats,
    records: props.stances.map((s) => ({
      seatId: s.roleKey,
      status: s.status === "abstain" ? "abstain" : "locked",
    })),
  });
  const stanceReady = evaluateStanceReadiness({ advisors: readinessSeats });
  const stancesReadyForUi =
    rosterReady && stanceReady.allHumanAdvisorsReady;
  const commitGate = evaluateCeoCommitGate({
    humanMessageCount: humanCount,
    allHumanAdvisorsReady: stancesReadyForUi,
  });
  const commitUnlocked = commitGate.canCommit;
  const myStance = props.stances.find((s) => s.roleKey === roleKey);
  const myChips = props.pressureStances[roleKey] ?? [];
  const showStancePicker =
    !isCeo &&
    props.scenePhase === "live" &&
    myChips.length > 0 &&
    !myStance;
  const stanceSecondsLeft = props.stanceDeadlineAt
    ? Math.max(
        0,
        Math.ceil((new Date(props.stanceDeadlineAt).getTime() - now) / 1000),
      )
    : null;
  const seconds = liveAt ? Math.max(0, Math.floor((now - liveAt) / 1000)) : 0;
  const typing = props.thinkingRoleKeys.filter((k) => k !== roleKey);

  async function lockChip(chipKey: string) {
    if (stanceBusy) return;
    setStanceBusy(true);
    try {
      await props.onLockStance(chipKey, stanceNote.trim() || undefined);
    } finally {
      setStanceBusy(false);
    }
  }

  const controls = (
    <>
      {props.msRemaining != null && props.msRemaining > 0 ? (
        <span className="tabular-nums text-white/45">
          {formatSessionRemaining(props.msRemaining)}
        </span>
      ) : null}
      <button type="button" onClick={() => setBriefOpen((o) => !o)} className="hover:text-white">
        {briefOpen ? "Hide brief" : "My brief"}
      </button>
      <button type="button" onClick={() => setChatOpen((o) => !o)} className="hover:text-white">
        {chatOpen ? "Hide chat" : `Chat (${messages.length})`}
      </button>
      <button
        type="button"
        onClick={() => {
          const next = !muted;
          setMuted(next);
          setMutedState(next);
          if (next) stopSpeech();
          unlockAudio();
        }}
        className="hover:text-white"
      >
        {muted ? "Sound off" : "Sound on"}
      </button>
      <button
        type="button"
        onClick={() => {
          const next = !voicesOn;
          setVoicesEnabled(next);
          setVoicesOn(next);
        }}
        className="hover:text-white"
      >
        {voicesOn ? "Voices on" : "Voices off"}
      </button>
      {isCeo ? <PhotoButton photo={photo} /> : null}
    </>
  );

  let overlay: React.ReactNode = null;
  if (deciding && isCeo) {
    const unlockParts: string[] = [];
    if (!commitGate.messagesReady) {
      unlockParts.push(
        `${humanCount}/${HUMAN_MSG_GATE} contributions from people at the table`,
      );
    }
    if (!commitGate.stancesReady) {
      const pending = stanceReady.pendingHumanSeatIds
        .map((id) => firstName(characterName(id)))
        .join(", ");
      unlockParts.push(
        pending
          ? `waiting on stance from ${pending}`
          : "waiting on advisor stances",
      );
    }
    overlay = (
      <div className="dark max-h-full w-full max-w-2xl overflow-y-auto rounded-xl bg-background/95 px-6 py-6 text-foreground shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              Decision {decisionNo} of {props.decisionCount}
            </p>
            <p className="mt-2 font-serif text-xl">
              {scene.commitPrompt ?? "What do you decide?"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDeciding(false)}
            className="text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            Back to the room
          </button>
        </div>
        {advisorSeatIds.length > 0 ? (
          <div className="mb-5 border-b border-border pb-4">
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              Pressure stances
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              {advisorSeatIds.map((seatId) => {
                const row = props.stances.find((s) => s.roleKey === seatId);
                const name = characterName(seatId);
                if (!row) {
                  return (
                    <li key={seatId} className="text-muted-foreground">
                      <span className="font-medium text-foreground">{name}</span>
                      {" · pending"}
                    </li>
                  );
                }
                if (row.status === "abstain") {
                  return (
                    <li key={seatId}>
                      <span className="font-medium">{name}</span>
                      {" · Abstain"}
                    </li>
                  );
                }
                return (
                  <li key={seatId}>
                    <span className="font-medium">{name}</span>
                    {" · "}
                    {row.chipLabel ?? row.chipKey ?? "Locked"}
                    {row.note ? (
                      <span className="block pl-0 text-muted-foreground">
                        {row.note}
                      </span>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
        <AnswerComposer
          mode="commit"
          options={props.options}
          reasoning={props.reasoning}
          onReasoningChange={props.onReasoningChange}
          selectedKey={props.optionKey}
          onSelectOption={props.onSelectOption}
          customText={props.customText}
          onCustomTextChange={props.onCustomTextChange}
          commitUnlocked={commitUnlocked}
          unlockHint={
            unlockParts.length
              ? `You can decide once: ${unlockParts.join("; ")}.`
              : undefined
          }
          commitDisabled={
            props.committing ||
            !props.optionKey ||
            props.reasoning.trim().length < 20 ||
            (props.optionKey === "custom" && !props.customText.trim())
          }
          committing={props.committing}
          onCommit={props.onCommit}
        />
        {props.error ? (
          <p className="mt-3 text-sm text-muted-foreground">{props.error}</p>
        ) : null}
      </div>
    );
  } else if (showStancePicker) {
    overlay = (
      <div className="dark max-h-full w-full max-w-lg overflow-y-auto rounded-xl bg-background/95 px-6 py-6 text-foreground shadow-2xl">
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          Pressure stance
        </p>
        <p className="mt-2 font-serif text-xl">Lock your position for this decision</p>
        <p className="mt-2 text-sm text-muted-foreground">
          This pressures the room — it is not a vote. The CEO alone makes the call.
          {stanceSecondsLeft != null ? (
            <>
              {" "}
              <span className="tabular-nums">
                {Math.floor(stanceSecondsLeft / 60)}:
                {String(stanceSecondsLeft % 60).padStart(2, "0")}
              </span>{" "}
              until Abstain.
            </>
          ) : null}
        </p>
        <div className="mt-4 flex flex-col gap-2">
          {myChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              disabled={stanceBusy}
              onClick={() => void lockChip(chip.key)}
              className="rounded-lg border border-border px-4 py-3 text-left text-sm hover:bg-muted disabled:opacity-50"
            >
              {chip.label}
            </button>
          ))}
        </div>
        <label className="mt-4 block text-xs text-muted-foreground">
          Optional note
          <textarea
            value={stanceNote}
            onChange={(e) => setStanceNote(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            placeholder="Add a short note for the CEO (optional)"
          />
        </label>
        {props.error ? (
          <p className="mt-3 text-sm text-muted-foreground">{props.error}</p>
        ) : null}
      </div>
    );
  } else if (briefOpen) {
    overlay = (
      <div className="dark max-h-full w-full max-w-2xl overflow-y-auto rounded-xl bg-background/95 px-6 py-6 text-sm leading-relaxed text-foreground shadow-2xl">
        {scene.brief ? (
          <>
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              Scene brief
            </p>
            <p className="mt-2">{scene.brief}</p>
          </>
        ) : null}
        {props.roleBrief ? (
          <div className="mt-5 border-l-2 border-accent pl-4">
            <p className="text-[11px] uppercase tracking-[0.2em] text-accent">
              Confidential · {props.roleBrief.title}
            </p>
            <p className="mt-2 font-medium">{props.roleBrief.name}</p>
            <p className="mt-2 text-muted-foreground">{props.roleBrief.stance}</p>
            <p className="mt-2">{props.roleBrief.objective}</p>
            {props.roleBrief.opening ? (
              <p className="mt-2 italic text-muted-foreground">{props.roleBrief.opening}</p>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  }

  const footer =
    deciding || showStancePicker ? null : isCeo ? (
      <button
        type="button"
        onClick={() => {
          setBriefOpen(false);
          setDeciding(true);
        }}
        className="rounded-full bg-white px-6 py-2 text-sm font-medium text-black shadow-xl"
      >
        Make the call
        <span className="ml-2 text-xs text-black/50">
          {humanCount}/{HUMAN_MSG_GATE}
          {commitGate.stancesReady ? "" : " · stances"}
        </span>
      </button>
    ) : myStance ? (
      <span className="rounded-full bg-black/55 px-4 py-2 text-xs text-white/70 backdrop-blur-md">
        Stance locked
        {myStance.status === "abstain"
          ? " · Abstain"
          : myStance.chipLabel
            ? ` · ${myStance.chipLabel}`
            : ""}
        {" · "}
        {firstName(ceoName)} makes the call
      </span>
    ) : (
      <span className="rounded-full bg-black/55 px-4 py-2 text-xs text-white/70 backdrop-blur-md">
        {firstName(ceoName)} makes the call · {humanCount}/{HUMAN_MSG_GATE}{" "}
        contributions so far
      </span>
    );

  return (
    <div onPointerDown={unlockAudio}>
      <MeetingStage
        title={scene.title}
        heading={`Decision ${decisionNo} of ${props.decisionCount}`}
        seconds={seconds}
        present={present}
        remote={remote}
        mood={scene.mood}
        direction={direction}
        photo={isCeo ? photo : null}
        youLabel={isCeo ? "You · CEO" : `${ceoName} · CEO`}
        youPlaceholder={isCeo ? "You" : firstName(ceoName)}
        caption={caption}
        toast={null}
        overlay={overlay}
        footer={footer}
        controls={controls}
        voiceStatus={voiceStatus}
      />
      {chatOpen ? (
        <aside className="dark fixed bottom-0 right-0 top-12 z-30 flex w-full max-w-[20rem] flex-col border-l border-white/10 bg-black/60 text-white backdrop-blur-md">
          <div className="flex items-center justify-between px-4 py-3 text-[11px] uppercase tracking-[0.18em] text-white/50">
            <span>Meeting chat</span>
            <button
              type="button"
              onClick={() => setChatOpen(false)}
              className="normal-case tracking-normal hover:text-white"
            >
              Hide
            </button>
          </div>
          <div ref={threadRef} className="flex-1 space-y-3 overflow-y-auto px-4 pb-3">
            {messages.map((m) => {
              if (m.senderKind === "narrator" || m.roleKey === "narrator") {
                return (
                  <p key={m.id} className="text-center text-[11px] italic text-white/45">
                    {m.content}
                  </p>
                );
              }
              const mine = m.roleKey === roleKey;
              const human = m.roleKey !== "ceo" ? seatName(m.roleKey) : null;
              return (
                <div key={m.id} className={mine ? "text-right" : ""}>
                  <p className="text-[11px] text-white/45">
                    {speakerName(m.roleKey)}
                    {!mine && human && m.senderKind === "human" ? ` · ${human}` : ""}
                    {m.senderKind === "ai" ? " · AI" : ""}
                  </p>
                  <p
                    className={`mt-0.5 inline-block max-w-full whitespace-pre-wrap rounded-lg px-3 py-2 text-left text-[13px] leading-snug ${
                      mine ? "bg-[#f2c38b]/20" : m.id === currentId ? "bg-white/20" : "bg-white/10"
                    }`}
                  >
                    {m.content}
                  </p>
                </div>
              );
            })}
            {typing.length ? (
              <p className="text-[11px] italic text-white/45">
                {typing.map((k) => firstName(speakerName(k))).join(", ")}{" "}
                {typing.length > 1 ? "are" : "is"} typing…
              </p>
            ) : null}
          </div>
          <div className="border-t border-white/10 px-3 py-3">
            <AnswerComposer
              key={`speak-${roleKey}`}
              suggestions={suggestionLines(
                roleKey,
                props.options.map((o) => o.label),
              )}
              sending={props.sending}
              onSend={props.onSend}
              mentionTargets={props.sceneCast
                .filter((s) => s.id !== roleKey)
                .map((s) => ({ roleKey: s.id, name: s.name, title: s.title }))}
              placeholder={
                isCeo
                  ? "Speak to the room… (@ to address someone)"
                  : `Speak as ${myBrief?.name ?? "yourself"}… (@ to address someone)`
              }
            />
            <p className="mt-2 text-[11px] text-white/40">
              {props.missingToken
                ? "Missing seat token — reopen your join link so messages send as this role."
                : props.error ?? "Everyone hears what you type in your character’s voice. Empty seats are filled by the same AI cast as solo."}
            </p>
          </div>
        </aside>
      ) : null}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-20 flex flex-col items-center justify-center overflow-y-auto bg-black px-6 py-16 text-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[11vh] bg-black" />
      <div className="film-title flex flex-col items-center">{children}</div>
    </div>
  );
}
