"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import type { CastMember, StageMood, StoryArt } from "@/lib/case/types";
import { LOCAL_FIRM_INVOICE } from "@/lib/case/cost-of-winning-scripts";
import { Avatar, type AvatarAction } from "./avatar";
import { BACKDROPS, Boardroom, CAST_MOOD, backdropKey, type Shot } from "./boardroom";
import { say, stopSpeech } from "./speech";
import { InvoicePaper } from "../stage-invoice";
import { BankStatement, FileIndex, Newspaper, PhoneSilence, Redline, RegulatorLetter } from "./film-props";
import type { FilmBeat } from "./film-beats";

type Plan =
  | { kind: "title" }
  | { kind: "portrait"; castId: string; action: AvatarAction }
  | { kind: "room"; shot: Shot }
  | { kind: "doc" };

const ROOM_SHOTS: Record<string, Shot> = {
  door: { from: [0.2, 1.45, 1.6], to: [1.6, 1.6, 3.1], look: [0, 0.95, -1.2], seconds: 9 },
  board: { from: [-2.3, 1.7, 2.6], to: [-1.5, 1.5, 1.1], look: [0.2, 1.0, -1.8], seconds: 9 },
  skyline: { from: [-0.4, 1.4, 0.8], to: [-1.8, 1.45, 0.2], look: [-8, 1.8, -1.5], seconds: 9 },
  doc: { from: [0, 1.25, 2.3], to: [0, 1.2, 1.9], look: [0, 0.78, 0.4], seconds: 9 },
};

const PORTRAIT: Partial<Record<StoryArt, { castId: string; action: AvatarAction }>> = {
  distant: { castId: "marcus", action: "lookDown" },
  handshake: { castId: "marcus", action: "nod" },
  network: { castId: "marcus", action: "phone" },
  hourglass: { castId: "tom", action: "write" },
  voices: { castId: "david", action: "shake" },
};

function planFor(beat: FilmBeat): Plan {
  if (beat.kind === "setting") return { kind: "title" };
  if (beat.kind === "message") return { kind: "portrait", castId: beat.castId ?? "marcus", action: null };
  const p = PORTRAIT[beat.art];
  if (p) return { kind: "portrait", ...p };
  if (beat.art === "door" || beat.art === "board" || beat.art === "skyline") {
    return { kind: "room", shot: ROOM_SHOTS[beat.art] };
  }
  return { kind: "doc" };
}

function DocProp({ beat }: { beat: Extract<FilmBeat, { kind: "story" }> }) {
  switch (beat.art) {
    case "invoice":
      return <div className="film-prop"><InvoicePaper invoice={beat.invoice ?? LOCAL_FIRM_INVOICE} /></div>;
    case "stamp":
      return (
        <div className="film-prop">
          <InvoicePaper invoice={{ ...(beat.invoice ?? LOCAL_FIRM_INVOICE), stamp: "Approved", sticky: undefined }} />
        </div>
      );
    case "press":
      return <Newspaper text={beat.text} />;
    case "regulator":
      return <RegulatorLetter text={beat.text} />;
    case "ledger":
      return <BankStatement text={beat.text} />;
    case "phone":
      return <PhoneSilence text={beat.text} />;
    case "gap":
      return <FileIndex text={beat.text} />;
    case "pen":
      return <Redline text={beat.text} />;
    default:
      return <Newspaper text={beat.text} />;
  }
}

function PortraitCamera() {
  const { camera } = useThree();
  const start = useRef<number | null>(null);
  useFrame(() => {
    const now = performance.now() / 1000;
    if (start.current === null) start.current = now;
    const k = Math.min(1, (now - start.current) / 10);
    const e = k * k * (3 - 2 * k);
    camera.position.set(THREE.MathUtils.lerp(0.32, 0.16, e), THREE.MathUtils.lerp(1.34, 1.31, e), THREE.MathUtils.lerp(1.3, 0.92, e));
    camera.lookAt(0.02, 1.22, 0);
  });
  return null;
}

function PortraitSet({ castId, location, action }: { castId: string; location: string; action: AvatarAction }) {
  const b = BACKDROPS[backdropKey(location)];
  const gaze = useMemo(() => new THREE.Vector3(0.75, 1.28, 1.2), []);
  return (
    <>
      <PerspectiveCamera makeDefault fov={30} position={[0.3, 1.34, 1.3]} />
      <PortraitCamera />
      <color attach="background" args={[b.wall]} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[1.6, 2.4, 1.8]} intensity={1.5} castShadow />
      <pointLight position={b.lamp ? [0.9, 1.45, 0.25] : [-0.6, 2, 1]} color={b.light} intensity={b.lightI * 1.2} distance={4} />
      <pointLight position={[-1.2, 1.6, -0.2]} color="#9db8ff" intensity={1.2} distance={3} />
      <mesh position={[0, 1.2, -0.8]} receiveShadow>
        <planeGeometry args={[5, 3.4]} />
        <meshStandardMaterial color={b.wall} roughness={0.95} />
      </mesh>
      {b.lamp ? (
        <mesh position={[0.95, 1.3, -0.45]}>
          <sphereGeometry args={[0.13, 16, 16]} />
          <meshBasicMaterial color="#ffd9a0" toneMapped={false} />
        </mesh>
      ) : null}
      {b.window ? (
        <mesh position={[-0.8, 1.45, -0.7]}>
          <planeGeometry args={[1, 1.2]} />
          <meshBasicMaterial color="#e9f2fb" toneMapped={false} />
        </mesh>
      ) : null}
      <Suspense fallback={null}>
        <Avatar
          key={castId}
          id={castId}
          position={[0, 0, 0]}
          sitting
          lookAt={gaze}
          action={action}
          mood={CAST_MOOD[castId] ?? "neutral"}
          isSpeaker
        />
      </Suspense>
    </>
  );
}

export default function Film({
  beats,
  pos,
  castById,
  mood,
  isLast,
  finalLabel,
  onAdvance,
}: {
  beats: FilmBeat[];
  pos: number;
  castById: Map<string, CastMember>;
  mood: StageMood;
  isLast: boolean;
  finalLabel: string;
  onAdvance: () => void;
}) {
  const beat = beats[pos];
  const plan = beat ? planFor(beat) : { kind: "title" as const };
  const advanceRef = useRef(onAdvance);
  useEffect(() => {
    advanceRef.current = onAdvance;
  }, [onAdvance]);

  useEffect(() => {
    if (!beat) return;
    let cancelled = false;
    let timer = 0;
    const line =
      beat.kind === "setting"
        ? beat.time
        : beat.kind === "message"
          ? beat.text
          : beat.text;
    const voice = beat.kind === "message" ? (beat.castId ?? "narrator") : "narrator";
    const startDelay = window.setTimeout(() => {
      void say(voice, line).then(() => {
        if (!cancelled && !isLast) timer = window.setTimeout(() => advanceRef.current(), 900);
      });
    }, beat.kind === "setting" ? 600 : 350);
    return () => {
      cancelled = true;
      window.clearTimeout(startDelay);
      window.clearTimeout(timer);
      stopSpeech();
    };
  }, [beat, isLast]);

  if (!beat) return null;
  const portraitId = plan.kind === "portrait" ? plan.castId : null;
  const portraitMember = portraitId ? castById.get(portraitId) : undefined;

  return (
    <div className="fixed inset-0 z-20 overflow-hidden bg-black text-white">
      {plan.kind !== "title" ? (
        <div
          className={`absolute inset-0 transition-[filter] duration-700 ${
            plan.kind === "doc" ? "blur-[6px] brightness-[0.45]" : ""
          }`}
        >
          <Canvas shadows dpr={[1, 1.75]}>
            <Suspense fallback={null}>
              {plan.kind === "portrait" ? (
                <PortraitSet
                  key={`p-${pos}`}
                  castId={plan.castId}
                  location={portraitMember?.location ?? ""}
                  action={plan.action}
                />
              ) : (
                <Boardroom
                  key={`r-${pos}`}
                  present={[]}
                  remote={[]}
                  mood={mood}
                  direction={{ speakerId: null, attention: "you", actions: {} }}
                  shot={plan.kind === "room" ? plan.shot : ROOM_SHOTS.doc}
                  showScreen={false}
                />
              )}
            </Suspense>
          </Canvas>
        </div>
      ) : null}

      {plan.kind === "doc" && beat.kind === "story" ? (
        <div key={`d-${pos}`} className="absolute inset-0 flex items-center justify-center pb-16">
          <DocProp beat={beat} />
        </div>
      ) : null}

      {beat.kind === "setting" ? (
        <div key={`t-${pos}`} className="film-title absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-[11px] uppercase tracking-[0.3em] text-white/45">{beat.place}</p>
          <p className="mt-4 font-serif text-6xl md:text-7xl">{beat.time}</p>
          {beat.text ? <p className="mt-6 max-w-lg text-center font-serif text-lg text-white/70">{beat.text}</p> : null}
        </div>
      ) : null}

      {/* Letterbox */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[11vh] bg-black" />
      <div className="absolute inset-x-0 bottom-0 flex h-[15vh] flex-col items-center justify-center gap-3 bg-black px-6">
        {beat.kind !== "setting" ? (
          <p key={`c-${pos}`} className="film-caption max-w-3xl text-center font-serif text-xl leading-snug text-white/90 md:text-2xl">
            {beat.kind === "message" ? (
              <>
                <span className="text-[#8ec5ff]">{beat.from}</span> {beat.text}
              </>
            ) : (
              beat.text
            )}
          </p>
        ) : null}
        {isLast ? (
          <button
            type="button"
            onClick={onAdvance}
            className="rounded-full bg-white px-6 py-2 text-sm font-medium text-black"
          >
            {finalLabel}
          </button>
        ) : (
          <button type="button" onClick={onAdvance} className="text-[11px] uppercase tracking-widest text-white/40 hover:text-white">
            Skip ›
          </button>
        )}
      </div>
    </div>
  );
}
