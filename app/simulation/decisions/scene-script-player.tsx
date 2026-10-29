"use client";

/**
 * Shared authored-script beat player used by solo and group.
 * Plays the same ScriptBeat pipeline; callers own what happens after the script
 * (solo → decision commit; group → live human/bot discussion).
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type {
  CastMember,
  Scene,
  SceneProp,
  ScriptBeat,
  StageMood,
} from "@/lib/case/types";
import {
  CallView,
  DocumentView,
  LineView,
  MessageView,
  MomentView,
  NarrationView,
  SettingView,
} from "./stage-beats";
import {
  isMuted,
  playChat,
  setMuted,
  startRoomTone,
  unlockAudio,
} from "./stage-sound";
import { setVoicesEnabled, voicesEnabled } from "./stage-voice";
import { DeskScene } from "./stage-desk";
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
import { StoryArtwork } from "./stage-story";
import { InvoicePaper } from "./stage-invoice";

const MeetingStage = dynamic(() => import("./three/meeting-stage"), {
  ssr: false,
});

export type PlayBeat = ScriptBeat | { kind: "you"; text: string };

type StageContext = { mood: StageMood; clock: string; day?: string };

const STAGE_BG: Record<StageMood, string> = {
  morning:
    "radial-gradient(ellipse at 75% -10%, rgba(255,210,150,0.35), transparent 55%), #efeae2",
  evening:
    "radial-gradient(ellipse at 15% -5%, rgba(226,140,95,0.28), transparent 60%), #e6ddd1",
  night:
    "radial-gradient(ellipse at 50% -20%, rgba(80,110,165,0.22), transparent 60%), #0e1117",
};

const noopSubscribe = () => () => {};

function clockOf(label: string): string | null {
  const m = label.match(/(\d{1,2}:\d{2})\s*[ap]\.?m/i);
  return m ? m[1] : null;
}

export function sceneScript(scene: Pick<Scene, "script" | "timeLabel" | "title" | "brief" | "opening">): PlayBeat[] {
  if (scene.script?.length) return scene.script;
  return [
    { kind: "setting", time: scene.timeLabel, place: scene.title, text: scene.brief },
    { kind: "line", castId: scene.opening.castId, text: scene.opening.text },
  ];
}

export function stageContextAt(
  beats: PlayBeat[],
  upTo: number,
  base: StageContext,
): StageContext {
  const ctx = { ...base };
  for (let i = 0; i <= upTo && i < beats.length; i++) {
    const b = beats[i];
    if (b.kind === "setting") {
      if (b.mood) ctx.mood = b.mood;
      ctx.clock = clockOf(b.time) ?? ctx.clock;
      if (b.time.includes("·")) ctx.day = b.time.split("·")[0].trim();
    } else if (b.kind === "call") {
      ctx.clock = clockOf(b.connected) ?? ctx.clock;
    }
  }
  return ctx;
}

/** Changes whenever the authored script changes, so stale saved progress is ignored. */
export function scriptFingerprint(beats: PlayBeat[]) {
  const json = JSON.stringify(beats);
  let h = 0;
  for (let i = 0; i < json.length; i++) h = (h * 31 + json.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

export function captionChunks(text: string): { start: number; text: string }[] {
  const pieces: string[] = [];
  for (const sentence of text.split(/(?<=[.!?])\s+/)) {
    if (sentence.length <= 90) {
      pieces.push(sentence);
      continue;
    }
    let rest = sentence;
    while (rest.length > 90) {
      const window = rest.slice(0, 90);
      const cut = Math.max(
        window.lastIndexOf(", "),
        window.lastIndexOf(" — "),
        window.lastIndexOf("; "),
      );
      const at = cut > 30 ? cut + 1 : window.lastIndexOf(" ");
      pieces.push(rest.slice(0, at).trim());
      rest = rest.slice(at).trim();
    }
    if (rest) pieces.push(rest);
  }
  let cursor = 0;
  return pieces.map((piece) => {
    const start = Math.max(0, text.indexOf(piece, cursor));
    cursor = start + piece.length;
    return { start, text: piece };
  });
}

export function BeatView({
  beat,
  stage,
  onAcceptCall,
  castById,
  props,
  busy,
  error,
  onRespond,
  onSilence,
  onFreeText,
}: {
  beat: PlayBeat;
  stage: StageContext;
  onAcceptCall: () => void;
  castById: Map<string, CastMember>;
  props: SceneProp[];
  busy: boolean;
  error: string | null;
  onRespond: (key: string) => void;
  onSilence: () => void;
  onFreeText: (text: string) => void;
}) {
  switch (beat.kind) {
    case "setting":
      return <SettingView beat={beat} />;
    case "narration":
      return <NarrationView text={beat.text} />;
    case "story":
      return (
        <div className="mx-auto max-w-xl text-center">
          <div className="mx-auto h-48 w-80 text-accent">
            <StoryArtwork art={beat.art} />
          </div>
          <p className="mt-6 font-serif text-2xl leading-snug text-foreground">
            {beat.text}
          </p>
        </div>
      );
    case "message":
      return (
        <MessageView
          beat={beat}
          mood={stage.mood}
          clock={stage.clock}
          day={stage.day}
        />
      );
    case "call":
      return (
        <CallView
          beat={beat}
          mood={stage.mood}
          clock={stage.clock}
          day={stage.day}
          onAccept={onAcceptCall}
        />
      );
    case "document":
      return <DocumentView beat={beat} />;
    case "invoice":
      return (
        <div className="px-8">
          <InvoicePaper invoice={beat.invoice} />
        </div>
      );
    case "desk":
      return (
        <DeskScene
          text={beat.text}
          props={props}
          mood={stage.mood}
          tablet={beat.tablet}
        />
      );
    case "chat":
      return (
        <LineView speaker={castById.get(beat.castId)} text={beat.text} isYou={false} />
      );
    case "line":
      return (
        <LineView speaker={castById.get(beat.castId)} text={beat.text} isYou={false} />
      );
    case "you":
      return (
        <div>
          <LineView text={beat.text} isYou />
          {error ? (
            <p className="mt-4 text-right text-sm text-red-700 dark:text-red-400">
              {error}
            </p>
          ) : null}
        </div>
      );
    case "moment":
      return (
        <MomentView
          beat={beat}
          busy={busy}
          error={error}
          onRespond={onRespond}
          onSilence={onSilence}
          onFreeText={onFreeText}
        />
      );
  }
}

type Saved = { queue: PlayBeat[]; pos: number };

export function SceneScriptPlayer(props: {
  script: PlayBeat[];
  cast: CastMember[];
  sceneCastIds: string[];
  sceneProps?: SceneProp[];
  title: string;
  heading: string;
  storageKey: string;
  /** When false (non-CEO group seats), moments advance via the silence path. */
  canRespondToMoments?: boolean;
  youLabel?: string;
  youPlaceholder?: string;
  showPhoto?: boolean;
  onComplete: () => void;
}) {
  const {
    script,
    cast,
    sceneCastIds,
    sceneProps = [],
    title,
    heading,
    storageKey,
    canRespondToMoments = true,
    youLabel,
    youPlaceholder,
    showPhoto = false,
    onComplete,
  } = props;

  const castById = useMemo(() => new Map(cast.map((m) => [m.id, m])), [cast]);
  const sceneMembers = useMemo(
    () =>
      sceneCastIds
        .map((id) => castById.get(id))
        .filter(Boolean) as CastMember[],
    [sceneCastIds, castById],
  );

  const mounted = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

  const [initial] = useState<Saved>(() => {
    const fresh: Saved = { queue: script, pos: 0 };
    if (typeof window === "undefined") return fresh;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) return JSON.parse(raw) as Saved;
    } catch {
      /* ignore */
    }
    return fresh;
  });

  const [queue, setQueue] = useState<PlayBeat[]>(initial.queue);
  const [pos, setPos] = useState(initial.pos);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [muted, setMutedState] = useState(() => isMuted());
  const [voicesOn, setVoicesOn] = useState(() => voicesEnabled());
  const [captionAt, setCaptionAt] = useState({ pos: -1, idx: 0 });
  const [callStartedAt, setCallStartedAt] = useState<number | null>(() => {
    const callAt = initial.queue.findIndex((b) => b.kind === "call");
    return callAt !== -1 && initial.pos > callAt ? Date.now() : null;
  });
  const [now, setNow] = useState(() => Date.now());
  const photo = useStudentPhoto();
  const completedRef = useRef(false);

  const baseContext: StageContext = {
    mood:
      script.find(
        (b): b is Extract<PlayBeat, { kind: "setting" }> =>
          b.kind === "setting" && Boolean(b.mood),
      )?.mood ?? "morning",
    clock: "9:41",
  };

  useEffect(() => {
    void prepareVoices();
  }, []);

  useEffect(() => {
    const saved: Saved = { queue, pos };
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(saved));
    } catch {
      /* private mode */
    }
  }, [queue, pos, storageKey]);

  const beat: PlayBeat | undefined = queue[pos];
  const done = pos >= queue.length;

  useEffect(() => {
    if (!done || completedRef.current) return;
    completedRef.current = true;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify({ queue, pos: queue.length }));
    } catch {
      /* ignore */
    }
    onComplete();
  }, [done, onComplete, queue, storageKey]);

  const advance = useCallback(() => {
    if (busy) return;
    setPos((p) => p + 1);
  }, [busy]);

  function insertAfterCurrent(beats: PlayBeat[]) {
    const next = [...queue.slice(0, pos + 1), ...beats, ...queue.slice(pos + 1)];
    setQueue(next);
    return next;
  }

  function handleRespond(key: string) {
    if (beat?.kind !== "moment") return;
    const response = beat.responses.find((r) => r.key === key);
    if (!response) return;
    insertAfterCurrent([{ kind: "you", text: response.say }, ...response.reaction]);
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

  function handleFreeText(text: string) {
    if (beat?.kind !== "moment") return;
    setBusy(true);
    setError(null);
    insertAfterCurrent([{ kind: "you", text }]);
    setPos(pos + 1);
    setBusy(false);
  }

  const canContinue =
    mounted &&
    !done &&
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

  const stage = stageContextAt(queue, Math.min(pos, queue.length - 1), baseContext);
  const callIndex = queue.findIndex((b) => b.kind === "call");
  const callLive = mounted && callIndex !== -1 && pos > callIndex && !done;

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

  const advanceRef = useRef(advance);
  useEffect(() => {
    advanceRef.current = advance;
  }, [advance]);

  useEffect(() => {
    if (!mounted || !beat || done) return;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, beat, pos, callLive, done]);

  const toggles = mounted ? (
    <>
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
      {showPhoto ? <PhotoButton photo={photo} /> : null}
    </>
  ) : null;

  if (done) return null;

  const momentOverlay =
    beat?.kind === "moment" ? (
      canRespondToMoments ? (
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
      ) : (
        <div className="dark w-full max-w-2xl rounded-xl bg-background/95 px-6 py-6 text-center text-foreground shadow-2xl">
          <p className="font-serif text-2xl leading-snug">{beat.prompt}</p>
          <p className="mt-4 text-sm text-muted-foreground">
            The CEO answers this beat. Continue when you are ready to follow the room.
          </p>
          <button
            type="button"
            onClick={handleSilence}
            className="mt-6 rounded-full bg-accent px-6 py-2 text-sm font-medium text-accent-foreground"
          >
            Continue
          </button>
        </div>
      )
    ) : null;

  if (callLive) {
    let overlay: React.ReactNode = momentOverlay;
    if (
      !overlay &&
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
        beat?.kind === "moment" || beat?.kind === "you" ? "you" : "speaker",
      actions,
    };
    const present = sceneMembers
      .filter((m) => /hq/i.test(m.location ?? ""))
      .map((m) => m.id);
    const remote = sceneMembers
      .filter((m) => !/hq/i.test(m.location ?? ""))
      .map((m) => ({ id: m.id, location: m.location ?? "" }));

    return (
      <div onPointerDown={unlockAudio}>
        <MeetingStage
          title={title}
          heading={heading}
          seconds={callSeconds}
          present={present}
          remote={remote}
          mood={stage.mood}
          direction={direction}
          photo={showPhoto ? photo : null}
          youLabel={youLabel}
          youPlaceholder={youPlaceholder}
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
                Skip ›
              </button>
            ) : busy ? (
              <span className="rounded-full bg-black/60 px-4 py-2 text-xs text-white/70">
                They’re responding…
              </span>
            ) : null
          }
        />
      </div>
    );
  }

  const shot = mounted && beat?.kind === "setting";
  const night = mounted && stage.mood === "night";
  const dark = shot;

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
          {heading} · {title}
        </p>
        {toggles}
      </div>

      <main className="flex flex-1 flex-col items-center justify-center px-5 py-10 sm:px-8">
        {!mounted || !beat ? null : (
          <div key={pos} className="chat-bubble-in w-full">
            {beat.kind === "moment" && !canRespondToMoments ? (
              momentOverlay
            ) : (
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
            )}
          </div>
        )}
      </main>

      <div className="flex h-24 items-start justify-center">
        {canContinue ? (
          <button
            type="button"
            onClick={advance}
            disabled={busy}
            className={`px-8 py-3 text-sm font-medium disabled:opacity-50 ${
              dark
                ? "text-[#f3efe6]/80 hover:text-[#f3efe6]"
                : "text-foreground hover:text-accent"
            }`}
          >
            {beat?.kind === "desk" ? "Take the call" : "Continue"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
