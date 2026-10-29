"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useRouter } from "next/navigation";
import type {
  CastMember,
  Consequence,
  Scene,
  SceneProp,
  ScriptBeat,
  StageMood,
} from "@/lib/case/types";
import type { SceneTurn } from "@/lib/engine/scene-director";
import {
  acknowledgeProps,
  commitSceneDecision,
  persistCharacterMessages,
  persistStudentMessage,
} from "../actions";
import { stagePath } from "../stages";
import { BusyButton } from "@/app/components/busy-button";
import { withBusyBar } from "@/app/components/navigation-progress";
import { MomentView } from "./stage-beats";
import {
  isMuted,
  playChat,
  setMuted,
  startRoomTone,
  unlockAudio,
} from "./stage-sound";
import { setVoicesEnabled, voicesEnabled } from "./stage-voice";
import dynamic from "next/dynamic";
import {
  prefetch,
  prepareVoices,
  say,
  speechBus,
  stopSpeech,
  subscribeSpeech,
} from "./three/speech";
import type { Direction } from "./three/boardroom";
import type { AvatarAction } from "./three/avatar";
import { PhotoButton, useStudentPhoto } from "./stage-photo";
import { consequenceFilm } from "./three/film-beats";
import {
  BeatView,
  captionChunks,
  sceneScript,
  scriptFingerprint,
  stageContextAt,
  type PlayBeat,
} from "./scene-script-player";

const MeetingStage = dynamic(() => import("./three/meeting-stage"), {
  ssr: false,
});
const Film = dynamic(() => import("./three/film"), { ssr: false });

type DbMessage = {
  id: number;
  sender: string;
  castId: string | null;
  content: string;
};

type Props = {
  runId: string;
  caseSlug: string;
  caseTitle: string;
  cast: CastMember[];
  scene: Scene;
  integrity: string;
  depth: number;
  maxDepth: number;
  priorDecisions: { sceneId: string; choice: string; reasoning: string }[];
  initialMessages: DbMessage[];
  needsProps: boolean;
  props: SceneProp[];
};

type Saved = { queue: PlayBeat[]; pos: number; persistedUpTo: number };

const noopSubscribe = () => () => {};

type StageContext = { mood: StageMood; clock: string; day?: string };

const STAGE_BG: Record<StageMood, string> = {
  morning:
    "radial-gradient(ellipse at 75% -10%, rgba(255,210,150,0.35), transparent 55%), #efeae2",
  evening:
    "radial-gradient(ellipse at 15% -5%, rgba(226,140,95,0.28), transparent 60%), #e6ddd1",
  night:
    "radial-gradient(ellipse at 50% -20%, rgba(80,110,165,0.22), transparent 60%), #0e1117",
};

function consequenceBeats(
  consequence: Consequence,
  cast: CastMember[],
): PlayBeat[] {
  return consequenceFilm(consequence, cast);
}

function toHistory(beats: PlayBeat[]): SceneTurn[] {
  const turns: SceneTurn[] = [];
  for (const beat of beats) {
    if (beat.kind === "you") {
      turns.push({ speaker: "student", text: beat.text });
    } else if (beat.kind === "line" || beat.kind === "chat") {
      const last = turns[turns.length - 1];
      const msg = { cast_id: beat.castId, text: beat.text };
      if (last?.speaker === "director") last.messages.push(msg);
      else turns.push({ speaker: "director", messages: [msg] });
    }
  }
  return turns;
}

export function DecisionWorkspace(props: Props) {
  const {
    runId,
    caseSlug,
    cast,
    scene,
    depth,
    maxDepth,
    initialMessages,
    needsProps,
    props: sceneProps,
  } = props;

  const router = useRouter();
  const storageKey = `stage:v3:${runId}:${scene.id}:${scriptFingerprint(sceneScript(scene))}`;
  const castById = useMemo(() => new Map(cast.map((m) => [m.id, m])), [cast]);
  const sceneCast = useMemo(
    () =>
      scene.cast
        .map((id) => castById.get(id))
        .filter(Boolean) as CastMember[],
    [scene.cast, castById],
  );

  const mounted = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  const [initial] = useState<Saved>(() => {
    const script = sceneScript(scene);
    const fresh: Saved = { queue: script, pos: 0, persistedUpTo: 0 };
    if (typeof window === "undefined") return fresh;
    const raw = window.localStorage.getItem(storageKey);
    if (raw) {
      try {
        return JSON.parse(raw) as Saved;
      } catch {
        window.localStorage.removeItem(storageKey);
      }
    }
    if (initialMessages.some((m) => m.sender === "student")) {
      return { queue: script, pos: script.length, persistedUpTo: script.length };
    }
    return fresh;
  });
  const [queue, setQueue] = useState<PlayBeat[]>(initial.queue);
  const [pos, setPos] = useState(initial.pos);
  const [persistedUpTo, setPersistedUpTo] = useState(initial.persistedUpTo);
  const [phase, setPhase] = useState<"scene" | "after">("scene");
  const [terminal, setTerminal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [reasoning, setReasoning] = useState(scene.commitPrefill ?? "");
  const [showTranscript, setShowTranscript] = useState(false);
  const [muted, setMutedState] = useState(() => isMuted());
  const [voicesOn, setVoicesOn] = useState(() => voicesEnabled());
  const [captionAt, setCaptionAt] = useState({ pos: -1, idx: 0 });
  const [callStartedAt, setCallStartedAt] = useState<number | null>(() => {
    const callAt = initial.queue.findIndex((b) => b.kind === "call");
    return callAt !== -1 && initial.pos > callAt ? Date.now() : null;
  });
  const [now, setNow] = useState(() => Date.now());
  const persistChain = useRef<Promise<void>>(Promise.resolve());
  const [afterContext, setAfterContext] = useState<StageContext | null>(null);
  const baseContext: StageContext = {
    mood:
      sceneScript(scene).find(
        (b): b is Extract<PlayBeat, { kind: "setting" }> =>
          b.kind === "setting" && Boolean(b.mood),
      )?.mood ?? "morning",
    clock: "9:41",
  };

  useEffect(() => {
    if (phase !== "scene") return;
    const saved: Saved = { queue, pos, persistedUpTo };
    window.localStorage.setItem(storageKey, JSON.stringify(saved));
  }, [phase, queue, pos, persistedUpTo, storageKey]);

  const persistRange = useCallback(
    (beats: PlayBeat[], from: number, to: number) => {
      if (to <= from) return persistChain.current;
      const slice = beats.slice(from, to);
      setPersistedUpTo(to);
      persistChain.current = persistChain.current.then(async () => {
        let group: { cast_id: string; text: string }[] = [];
        const flushGroup = async () => {
          if (group.length) {
            await persistCharacterMessages(runId, scene.id, group);
            group = [];
          }
        };
        for (const beat of slice) {
          if (beat.kind === "line" || beat.kind === "chat") {
            group.push({ cast_id: beat.castId, text: beat.text });
          } else if (beat.kind === "you") {
            await flushGroup();
            await persistStudentMessage(runId, scene.id, beat.text);
          }
        }
        await flushGroup();
      });
      return persistChain.current;
    },
    [runId, scene.id],
  );

  const atDecision = phase === "scene" && pos >= queue.length;
  const beat: PlayBeat | undefined = queue[pos];

  const advance = useCallback(() => {
    if (busy) return;
    if (beat?.kind === "desk" && needsProps) {
      void acknowledgeProps(runId).catch(() => {});
    }
    if (phase === "after" && pos >= queue.length - 1) {
      if (terminal) router.push(stagePath("decisions"));
      router.refresh();
      return;
    }
    setPos((p) => p + 1);
  }, [busy, beat, needsProps, runId, phase, pos, queue.length, terminal, router]);

  function insertAfterCurrent(beats: PlayBeat[]) {
    const next = [...queue.slice(0, pos + 1), ...beats, ...queue.slice(pos + 1)];
    setQueue(next);
    return next;
  }

  function handleRespond(key: string) {
    if (beat?.kind !== "moment") return;
    const response = beat.responses.find((r) => r.key === key);
    if (!response) return;
    const next = insertAfterCurrent([
      { kind: "you", text: response.say },
      ...response.reaction,
    ]);
    void persistRange(next, persistedUpTo, pos + 2).catch(() => {});
    setPos(pos + 1);
  }

  const handleSilence = useCallback(() => {
    if (beat?.kind !== "moment") return;
    const silence = beat.silence ?? [];
    setQueue((q) => [
      ...q.slice(0, pos + 1),
      { kind: "narration", text: "You say nothing. The silence stretches." },
      ...silence,
      ...q.slice(pos + 1),
    ]);
    setPos((p) => p + 1);
  }, [beat, pos]);

  async function handleFreeText(text: string) {
    if (beat?.kind !== "moment") return;
    setBusy(true);
    setError(null);
    const withYou = insertAfterCurrent([{ kind: "you", text }]);
    const youIndex = pos + 1;
    const priorTurns = withYou
      .slice(0, youIndex)
      .filter((b) => b.kind === "you").length;
    setPos(youIndex);
    try {
      await persistRange(withYou, persistedUpTo, youIndex + 1);
      const response = await fetch("/api/decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          runId,
          caseSlug,
          sceneId: scene.id,
          history: toHistory(withYou.slice(0, youIndex)),
          turnCount: priorTurns,
          studentMessage: text,
          attemptedEarlyCommit: false,
        }),
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.message ?? "The room didn't respond.");
      }
      const lines: PlayBeat[] = (
        body.messages as { cast_id: string; text: string }[]
      ).map((m) => ({ kind: "line", castId: m.cast_id, text: m.text }));
      setQueue((q) => [
        ...q.slice(0, youIndex + 1),
        ...lines,
        ...q.slice(youIndex + 1),
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function handleCommit() {
    if (!selectedKey || busy) return;
    if (reasoning.trim().length < 20) {
      setError("Say why — at least a sentence or two.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await persistRange(queue, persistedUpTo, queue.length);
      await withBusyBar(async () => {
        const result = await commitSceneDecision({
          runId,
          caseSlug,
          sceneId: scene.id,
          optionKey: selectedKey,
          reasoning: reasoning.trim(),
        });
        window.localStorage.removeItem(storageKey);
        setTerminal(result.isTerminal);
        const after: PlayBeat[] = result.consequence
          ? consequenceBeats(result.consequence, cast)
          : [
              {
                kind: "setting",
                time: "On the record",
                place: "Your final call",
                text: "The decision is made and filed. What happens next is no longer yours to decide.",
              },
            ];
        setAfterContext(stageContextAt(queue, queue.length - 1, baseContext));
        setQueue(after);
        setPos(0);
        setPhase("after");
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "The decision didn't save.");
    } finally {
      setBusy(false);
    }
  }

  const canContinue =
    mounted &&
    !atDecision &&
    beat !== undefined &&
    beat.kind !== "moment" &&
    beat.kind !== "call";

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && ["TEXTAREA", "INPUT"].includes(target.tagName)) return;
      if ((e.key === " " || e.key === "Enter") && canContinue && !busy) {
        e.preventDefault();
        advance();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [canContinue, busy, advance]);

  const stage =
    phase === "scene"
      ? stageContextAt(queue, pos, baseContext)
      : (afterContext ?? baseContext);

  const callIndex =
    phase === "scene" ? queue.findIndex((b) => b.kind === "call") : -1;
  const callLive = mounted && phase === "scene" && callIndex !== -1 && pos > callIndex;

  useEffect(() => {
    if (!callLive) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [callLive]);

  useEffect(() => {
    if (!callLive || muted) return;
    return startRoomTone();
  }, [callLive, muted]);

  const callSeconds = Math.max(
    0,
    Math.floor((now - (callStartedAt ?? now)) / 1000),
  );

  useEffect(() => {
    void prepareVoices();
  }, []);

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

  const photo = useStudentPhoto();
  const advanceRef = useRef(advance);
  useEffect(() => {
    advanceRef.current = advance;
  }, [advance]);

  useEffect(() => {
    if (!mounted || phase !== "scene" || !beat) return;
    let cancelled = false;
    const timers: number[] = [];
    const later = (fn: () => void, ms: number) =>
      timers.push(window.setTimeout(() => !cancelled && fn(), ms));

    for (const next of queue.slice(pos + 1, pos + 4)) {
      if (next.kind === "line" || next.kind === "chat") prefetch(next.castId, next.text);
    }

    const chunks =
      beat.kind === "line" || beat.kind === "you" ? captionChunks(beat.text) : [];
    const startedAt = performance.now() / 1000;
    if (chunks.length > 1) {
      const id = window.setInterval(() => {
        const t = speechBus.current;
        const text = beat.kind === "line" || beat.kind === "you" ? beat.text : "";
        let ratio: number;
        if (beat.kind === "line" && t && t.castId === beat.castId) {
          ratio = (performance.now() / 1000 - t.start) / t.duration;
        } else {
          ratio = (performance.now() / 1000 - startedAt) / Math.max(1.2, text.length * 0.062);
        }
        const at = ratio * text.length;
        let idx = 0;
        chunks.forEach((c, i) => {
          if (c.start <= at) idx = i;
        });
        setCaptionAt((prev) => (prev.pos === pos && prev.idx >= idx ? prev : { pos, idx }));
      }, 120);
      timers.push(id as unknown as number);
    }

    if (beat.kind === "line" || beat.kind === "chat") {
      if (beat.kind === "chat") playChat();
      void say(beat.castId, beat.text).then(() => {
        if (callLive) later(() => advanceRef.current(), 650);
      });
    } else if (beat.kind === "you" && callLive && !busy) {
      later(() => advanceRef.current(), Math.max(1600, beat.text.length * 55));
    } else if (beat.kind === "narration" && callLive) {
      later(() => advanceRef.current(), 2800);
    }
    return () => {
      cancelled = true;
      timers.forEach((t) => {
        window.clearTimeout(t);
        window.clearInterval(t);
      });
      stopSpeech();
    };
    // Re-run per beat; `queue` and `busy` changes for the same beat are handled inside.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, phase, beat, pos, callLive]);

  const shot = mounted && beat?.kind === "setting" && !atDecision;
  const night = mounted && stage.mood === "night";
  const played = queue.slice(0, Math.min(pos + 1, queue.length));
  const dark = shot;

  const continueLabel = busy
    ? "They’re responding…"
    : beat?.kind === "desk"
      ? "Take the call"
      : phase === "after" && pos >= queue.length - 1
        ? terminal
          ? "Finish"
          : "Go to the next decision"
        : "Continue";

  const toggles = mounted ? (
    <>
      {phase === "scene" ? (
        <button
          type="button"
          onClick={() => setShowTranscript(true)}
          className="underline-offset-4 hover:underline"
        >
          What’s been said
        </button>
      ) : null}
      <button
        type="button"
        onClick={() => {
          const next = !muted;
          setMuted(next);
          setMutedState(next);
          if (next) stopSpeech();
          unlockAudio();
        }}
        className="underline-offset-4 hover:underline"
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
        className="underline-offset-4 hover:underline"
      >
        {voicesOn ? "Voices on" : "Voices off"}
      </button>
      <PhotoButton photo={photo} />
    </>
  ) : null;

  const transcript = showTranscript ? (
    <TranscriptDrawer
      beats={played}
      castById={castById}
      onClose={() => setShowTranscript(false)}
    />
  ) : null;

  if (mounted && phase === "after") {
    return (
      <div onPointerDown={unlockAudio}>
        <Film
          beats={
            queue.filter(
              (b) =>
                b.kind === "setting" ||
                b.kind === "message" ||
                b.kind === "story",
            ) as Extract<
              ScriptBeat,
              { kind: "setting" } | { kind: "message" } | { kind: "story" }
            >[]
          }
          pos={pos}
          castById={castById}
          mood={stage.mood}
          isLast={pos >= queue.length - 1}
          finalLabel={terminal ? "Finish" : "Go to the next decision"}
          onAdvance={advance}
        />
      </div>
    );
  }

  if (callLive) {
    let overlay: React.ReactNode = null;
    if (atDecision) {
      overlay = (
        <div className="dark max-h-full w-full max-w-2xl overflow-y-auto rounded-xl bg-background/95 px-6 py-6 text-foreground shadow-2xl">
          <DecisionView
            scene={scene}
            selectedKey={selectedKey}
            onSelect={setSelectedKey}
            reasoning={reasoning}
            onReasoning={setReasoning}
            busy={busy}
            error={error}
            onCommit={handleCommit}
          />
        </div>
      );
    } else if (beat?.kind === "moment") {
      overlay = (
        <div className="dark w-full max-w-2xl rounded-xl bg-background/95 px-6 py-6 text-foreground shadow-2xl">
          <MomentView
            key={pos}
            beat={beat}
            busy={busy}
            error={error}
            onRespond={handleRespond}
            onSilence={handleSilence}
            onFreeText={handleFreeText}
          />
        </div>
      );
    } else if (
      beat &&
      beat.kind !== "line" &&
      beat.kind !== "you" &&
      beat.kind !== "chat" &&
      beat.kind !== "narration"
    ) {
      overlay = (
        <div className="w-full">
          <BeatView
            beat={beat}
            stage={stage}
            onAcceptCall={() => setPos((p) => p + 1)}
            castById={castById}
            props={sceneProps}
            busy={busy}
            error={error}
            onRespond={handleRespond}
            onSilence={handleSilence}
            onFreeText={handleFreeText}
          />
        </div>
      );
    }

    const captionIdx = captionAt.pos === pos ? captionAt.idx : 0;
    const chunkOf = (text: string) => {
      const chunks = captionChunks(text);
      return chunks[Math.min(captionIdx, chunks.length - 1)]?.text ?? text;
    };
    const caption =
      beat?.kind === "line"
        ? {
            name: castById.get(beat.castId)?.name ?? beat.castId,
            text: chunkOf(beat.text),
          }
        : beat?.kind === "you"
          ? { name: "You", text: chunkOf(beat.text), isYou: true }
          : null;

    const actions: Record<string, AvatarAction> = {};
    if (beat?.kind === "narration" && beat.act) actions[beat.act.castId] = beat.act.action;
    if (beat?.kind === "chat") actions[beat.castId] = "lookDown";
    const direction: Direction = {
      speakerId:
        beat?.kind === "line" ? beat.castId : beat?.kind === "you" ? "you" : null,
      attention:
        atDecision || beat?.kind === "moment" || beat?.kind === "you"
          ? "you"
          : "speaker",
      actions,
    };
    const present = sceneCast.filter((m) => /hq/i.test(m.location ?? "")).map((m) => m.id);
    const remote = sceneCast
      .filter((m) => !/hq/i.test(m.location ?? ""))
      .map((m) => ({ id: m.id, location: m.location ?? "" }));

    return (
      <div onPointerDown={unlockAudio}>
        <MeetingStage
          title={scene.title}
          heading={`Decision ${depth} of ${maxDepth}`}
          seconds={callSeconds}
          present={present}
          remote={remote}
          mood={stage.mood}
          direction={direction}
          photo={photo}
          caption={caption}
          toast={
            beat?.kind === "chat"
              ? { name: castById.get(beat.castId)?.name ?? beat.castId, text: beat.text }
              : null
          }
          note={beat?.kind === "narration" ? beat.text : null}
          overlay={overlay}
          controls={toggles}
          voiceStatus={voiceStatus}
          footer={
            canContinue && beat?.kind !== "narration" ? (
              <button
                type="button"
                onClick={advance}
                disabled={busy}
                className="rounded-full bg-white/15 px-6 py-2 text-xs font-medium text-white ring-1 ring-white/25 backdrop-blur-md hover:bg-white/25 disabled:opacity-60"
              >
                {busy ? "They’re responding…" : "Skip ›"}
              </button>
            ) : busy ? (
              <span className="rounded-full bg-black/60 px-4 py-2 text-xs text-white/70">
                They’re responding…
              </span>
            ) : null
          }
        />
        {transcript}
      </div>
    );
  }

  return (
    <div
      onPointerDown={unlockAudio}
      className={`flex min-h-[100dvh] flex-col transition-[background] duration-700 ${
        night && !shot ? "dark text-foreground" : ""
      }`}
      style={{
        background: !mounted
          ? undefined
          : shot
            ? "#161513"
            : STAGE_BG[stage.mood],
      }}
    >
      <div
        className={`flex items-center gap-4 px-5 pt-4 pr-36 text-[11px] sm:px-8 sm:pr-40 ${
          dark ? "text-[#f3efe6]/50" : "text-muted-foreground"
        }`}
      >
        <p className="uppercase tracking-[0.18em]">
          Decision {depth} of {maxDepth} · {scene.title}
        </p>
        {toggles}
      </div>

      <main className="flex flex-1 flex-col items-center justify-center px-5 py-10 sm:px-8">
        {!mounted ? null : atDecision ? (
          <DecisionView
            scene={scene}
            selectedKey={selectedKey}
            onSelect={setSelectedKey}
            reasoning={reasoning}
            onReasoning={setReasoning}
            busy={busy}
            error={error}
            onCommit={handleCommit}
          />
        ) : beat ? (
          <div key={`${phase}-${pos}`} className="chat-bubble-in w-full">
            <BeatView
              beat={beat}
              stage={stage}
              onAcceptCall={() => {
                setCallStartedAt(Date.now());
                setNow(Date.now());
                setPos((p) => p + 1);
              }}
              castById={castById}
              props={sceneProps}
              busy={busy}
              error={error}
              onRespond={handleRespond}
              onSilence={handleSilence}
              onFreeText={handleFreeText}
            />
          </div>
        ) : null}
      </main>

      <div className="flex h-24 items-start justify-center">
        {canContinue ? (
          <button
            type="button"
            onClick={advance}
            disabled={busy}
            className={`px-8 py-3 text-sm font-medium disabled:opacity-50 ${
              dark
                ? "border border-[#f3efe6]/30 text-[#f3efe6] hover:bg-[#f3efe6]/10"
                : "bg-accent text-accent-foreground"
            }`}
          >
            {continueLabel}
          </button>
        ) : null}
      </div>

      {transcript}
    </div>
  );
}

function DecisionView({
  scene,
  selectedKey,
  onSelect,
  reasoning,
  onReasoning,
  busy,
  error,
  onCommit,
}: {
  scene: Scene;
  selectedKey: string | null;
  onSelect: (key: string) => void;
  reasoning: string;
  onReasoning: (value: string) => void;
  busy: boolean;
  error: string | null;
  onCommit: () => void;
}) {
  return (
    <div className="chat-bubble-in mx-auto w-full max-w-2xl">
      <p className="text-center font-serif text-3xl text-foreground">
        It’s your call.
      </p>
      <p className="mx-auto mt-3 max-w-lg text-center text-sm leading-relaxed text-muted-foreground">
        {scene.commitPrompt}
      </p>
      <div className="mt-8 flex flex-col gap-2.5">
        {scene.options.map((option) => {
          const selected = option.key === selectedKey;
          return (
            <button
              key={option.key}
              type="button"
              disabled={busy}
              onClick={() => onSelect(option.key)}
              className={`border px-5 py-3.5 text-left text-[15px] leading-snug transition-colors ${
                selected
                  ? "border-accent bg-background text-foreground"
                  : "border-border bg-background/60 text-foreground hover:border-accent"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      {selectedKey ? (
        <div className="mt-6">
          <label
            htmlFor="reasoning"
            className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground"
          >
            What you tell the room
          </label>
          <textarea
            id="reasoning"
            value={reasoning}
            onChange={(e) => onReasoning(e.target.value)}
            rows={4}
            disabled={busy}
            placeholder="Your reasoning — principles, risks, who this lands on…"
            className="mt-2 w-full resize-none border border-border bg-background px-4 py-3 text-[15px] leading-relaxed text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
          />
          {error ? (
            <p className="mt-2 text-sm text-red-700 dark:text-red-400">{error}</p>
          ) : null}
          <div className="mt-4 flex items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              Once you say it, it’s on the record. There is no undo.
            </p>
            <BusyButton
              type="button"
              pending={busy}
              pendingLabel="Committing…"
              onClick={onCommit}
              className="shrink-0 bg-accent px-6 py-3 text-sm font-medium text-accent-foreground"
            >
              Make the call
            </BusyButton>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TranscriptDrawer({
  beats,
  castById,
  onClose,
}: {
  beats: PlayBeat[];
  castById: Map<string, CastMember>;
  onClose: () => void;
}) {
  const lines = beats.filter(
    (b) =>
      b.kind === "line" ||
      b.kind === "chat" ||
      b.kind === "you" ||
      b.kind === "message",
  );
  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/30" onClick={onClose}>
      <aside
        className="h-full w-full max-w-md overflow-y-auto bg-background px-6 py-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            What’s been said
          </p>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Close
          </button>
        </div>
        <div className="mt-6 space-y-4">
          {lines.map((b, i) => {
            const who =
              b.kind === "you"
                ? "You"
                : b.kind === "line" || b.kind === "chat"
                  ? `${castById.get(b.castId)?.name ?? b.castId}${b.kind === "chat" ? " · chat" : ""}`
                  : b.from;
            return (
              <div key={i}>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {who}
                  {b.kind === "message" ? ` · ${b.channel}` : ""}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-foreground">
                  {b.text}
                </p>
              </div>
            );
          })}
        </div>
      </aside>
    </div>
  );
}
