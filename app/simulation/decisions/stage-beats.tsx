"use client";

import { useEffect, useRef, useState } from "react";
import type {
  CastMember,
  ScriptBeat,
  StageMood,
} from "@/lib/case/types";
import { CastAvatar } from "@/app/components/chat/cast-avatar";
import { MarkdownBody } from "@/app/components/markdown-body";
import {
  playConnect,
  playMail,
  playNews,
  playPing,
  playTick,
  startRing,
} from "./stage-sound";

type MomentBeat = Extract<ScriptBeat, { kind: "moment" }>;

const WALLPAPER: Record<StageMood, string> = {
  morning: "linear-gradient(165deg,#f2d7b4 0%,#c99f7a 48%,#4f4038 100%)",
  evening: "linear-gradient(165deg,#e6a679 0%,#8b5a5c 50%,#2b2737 100%)",
  night: "linear-gradient(165deg,#222a3a 0%,#11151d 60%,#07090d 100%)",
};

export function SettingView({
  beat,
}: {
  beat: Extract<ScriptBeat, { kind: "setting" }>;
}) {
  return (
    <div className="mx-auto max-w-xl text-center text-[#f3efe6]">
      <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-[#f3efe6]/55">
        {beat.place}
      </p>
      <p className="mt-4 font-serif text-5xl leading-none md:text-6xl">
        {beat.time}
      </p>
      <p className="mx-auto mt-8 max-w-md font-serif text-lg leading-relaxed text-[#f3efe6]/80">
        {beat.text}
      </p>
    </div>
  );
}

export function NarrationView({ text }: { text: string }) {
  return (
    <p className="mx-auto max-w-lg text-center font-serif text-xl italic leading-relaxed text-muted-foreground">
      {text}
    </p>
  );
}

function PhoneShell({
  mood,
  clock,
  day,
  ringing,
  buzzOnce,
  children,
}: {
  mood: StageMood;
  clock: string;
  day?: string;
  ringing?: boolean;
  buzzOnce?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`relative mx-auto h-[min(34rem,72dvh)] w-[min(17.5rem,80vw)] rounded-[2.6rem] border-[7px] border-[#121212] bg-[#121212] shadow-[0_30px_80px_rgba(0,0,0,0.35)] ${
        ringing ? "stage-phone-ring" : buzzOnce ? "stage-phone-buzz" : ""
      }`}
    >
      <div
        className="relative flex h-full w-full flex-col overflow-hidden rounded-[2.1rem] text-white"
        style={{ background: WALLPAPER[mood] }}
      >
        <div className="absolute left-1/2 top-2 h-5 w-20 -translate-x-1/2 rounded-full bg-black" />
        <div className="pt-12 text-center">
          {day ? (
            <p className="text-xs font-medium text-white/80">{day}</p>
          ) : null}
          <p className="mt-0.5 text-6xl font-light tracking-tight">{clock}</p>
        </div>
        <div className="flex flex-1 flex-col px-3 pb-6 pt-6">{children}</div>
      </div>
    </div>
  );
}

export function MessageView({
  beat,
  mood,
  clock,
  day,
}: {
  beat: Extract<ScriptBeat, { kind: "message" }>;
  mood: StageMood;
  clock: string;
  day?: string;
}) {
  useEffect(() => {
    if (beat.channel === "text") playPing();
    else if (beat.channel === "news") playNews();
    else playMail();
  }, [beat.channel]);

  if (beat.channel === "email") {
    return (
      <div className="stage-slide-in mx-auto w-full max-w-xl overflow-hidden rounded-lg border border-border bg-background shadow-[0_24px_70px_rgba(28,27,25,0.22)]">
        <div className="flex items-center gap-1.5 border-b border-border bg-surface px-3 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#e0645c]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#e3b341]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#5fb35a]" />
          <span className="ml-3 text-[11px] text-muted-foreground">
            Inbox — 1 new
          </span>
        </div>
        <div className="border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            {beat.castId ? (
              <CastAvatar castId={beat.castId} name={beat.from} size="md" />
            ) : null}
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{beat.from}</p>
              <p className="text-xs text-muted-foreground">to me · just now</p>
            </div>
          </div>
          {beat.subject ? (
            <p className="mt-4 text-lg font-medium text-foreground">
              {beat.subject}
            </p>
          ) : null}
        </div>
        <p className="whitespace-pre-wrap px-6 py-6 text-[15px] leading-relaxed text-foreground">
          {beat.text}
        </p>
      </div>
    );
  }

  const isNews = beat.channel === "news";
  return (
    <PhoneShell mood={mood} clock={clock} day={day} buzzOnce>
      <div className="stage-notification rounded-2xl bg-white/80 px-3.5 py-3 text-[#1b1b1b] shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-2">
          {isNews ? (
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#b3261e] text-[9px] font-bold text-white">
              N
            </span>
          ) : beat.castId ? (
            <CastAvatar castId={beat.castId} name={beat.from} size="sm" />
          ) : null}
          <p className="min-w-0 flex-1 truncate text-[12px] font-semibold uppercase tracking-wide text-[#1b1b1b]/70">
            {isNews ? `${beat.from} · Breaking` : "Messages"}
          </p>
          <span className="text-[11px] text-[#1b1b1b]/55">now</span>
        </div>
        {!isNews ? (
          <p className="mt-1.5 text-[13px] font-semibold">{beat.from}</p>
        ) : null}
        <p
          className={`mt-0.5 leading-snug ${
            isNews ? "mt-2 text-[15px] font-semibold" : "text-[13px]"
          }`}
        >
          {beat.text}
        </p>
        {beat.meta ? (
          <p className="mt-1 text-[11px] text-[#1b1b1b]/55">{beat.meta}</p>
        ) : null}
      </div>
    </PhoneShell>
  );
}

export function CallView({
  beat,
  mood,
  clock,
  day,
  onAccept,
}: {
  beat: Extract<ScriptBeat, { kind: "call" }>;
  mood: StageMood;
  clock: string;
  day?: string;
  onAccept: () => void;
}) {
  const [declined, setDeclined] = useState(0);

  useEffect(() => startRing(), [declined]);

  return (
    <PhoneShell mood={mood} clock={clock} day={day} ringing>
      <div className="flex flex-1 flex-col items-center">
        <p className="text-xs uppercase tracking-[0.2em] text-white/70">
          {declined ? "Calling again…" : "Incoming call"}
        </p>
        <div className="relative mt-6">
          <span className="stage-ring-pulse absolute inset-0 rounded-full" />
          <span className="relative block scale-[1.6] rounded-full ring-2 ring-white/30">
            {beat.castId ? (
              <CastAvatar castId={beat.castId} name={beat.from} size="lg" />
            ) : null}
          </span>
        </div>
        <p className="mt-9 text-2xl font-medium">{beat.from}</p>
        <p className="mt-1 px-4 text-center text-xs text-white/70">
          {beat.detail}
        </p>
        <div className="mt-auto flex w-full items-end justify-around pb-2">
          <button
            type="button"
            onClick={() => setDeclined((d) => d + 1)}
            className="flex flex-col items-center gap-1.5"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#e5484d] text-white">
              <PhoneIcon down />
            </span>
            <span className="text-[11px] text-white/80">Decline</span>
          </button>
          <button
            type="button"
            onClick={() => {
              playConnect();
              onAccept();
            }}
            className="flex flex-col items-center gap-1.5"
          >
            <span className="stage-accept flex h-14 w-14 items-center justify-center rounded-full bg-[#30a46c] text-white">
              <PhoneIcon />
            </span>
            <span className="text-[11px] text-white/80">Accept</span>
          </button>
        </div>
      </div>
    </PhoneShell>
  );
}

function PhoneIcon({ down }: { down?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-6 w-6 ${down ? "rotate-[135deg]" : ""}`}
      fill="currentColor"
      aria-hidden
    >
      <path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z" />
    </svg>
  );
}

export function DocumentView({
  beat,
}: {
  beat: Extract<ScriptBeat, { kind: "document" }>;
}) {
  return (
    <div className="stage-slide-in mx-auto w-full max-w-lg -rotate-[0.4deg] border border-border bg-background px-7 py-7 shadow-[0_22px_60px_rgba(28,27,25,0.16)]">
      {beat.subtitle ? (
        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {beat.subtitle}
        </p>
      ) : null}
      <h2 className="mt-2 font-serif text-2xl text-foreground">{beat.title}</h2>
      <div className="mt-5 text-sm">
        <MarkdownBody source={beat.body} />
      </div>
    </div>
  );
}

export function LineView({
  speaker,
  text,
  isYou,
}: {
  speaker?: CastMember;
  text: string;
  isYou: boolean;
}) {
  return (
    <div
      className={`mx-auto w-full max-w-2xl ${isYou ? "text-right" : "text-left"}`}
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {isYou ? "You" : speaker?.name}
        {!isYou && speaker?.role ? (
          <span className="font-normal normal-case tracking-normal">
            {" "}
            · {speaker.role}
          </span>
        ) : null}
      </p>
      <p
        className={`mt-3 font-serif text-2xl leading-snug md:text-[1.7rem] ${
          isYou ? "text-accent" : "text-foreground"
        }`}
      >
        {isYou ? text : `“${text}”`}
      </p>
    </div>
  );
}

export function MomentView({
  beat,
  busy,
  error,
  onRespond,
  onSilence,
  onFreeText,
}: {
  beat: MomentBeat;
  busy: boolean;
  error: string | null;
  onRespond: (key: string) => void;
  onSilence: () => void;
  onFreeText: (text: string) => void;
}) {
  const total = beat.seconds ?? 0;
  const [left, setLeft] = useState(total);
  const [writing, setWriting] = useState(false);
  const [draft, setDraft] = useState("");
  const firedRef = useRef(false);

  useEffect(() => {
    if (!total || writing || busy) return;
    if (left <= 0) {
      if (!firedRef.current) {
        firedRef.current = true;
        onSilence();
      }
      return;
    }
    if (left <= 5) playTick();
    const t = window.setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [left, total, writing, busy, onSilence]);

  const urgent = total > 0 && !writing && left <= 5;

  return (
    <div className="mx-auto w-full max-w-2xl">
      <p className="text-center font-serif text-2xl leading-snug text-foreground">
        {beat.prompt}
      </p>

      {total ? (
        <div className="mx-auto mt-5 h-[3px] w-48 overflow-hidden rounded-full bg-border">
          <div
            className={`h-full transition-[width] duration-1000 ease-linear ${
              urgent ? "bg-[#e5484d]" : "bg-accent"
            }`}
            style={{
              width: `${writing ? 100 : Math.max(0, (left / total) * 100)}%`,
            }}
          />
        </div>
      ) : null}

      {!writing ? (
        <div className="mt-8 flex flex-col gap-2.5">
          {beat.responses.map((r) => (
            <button
              key={r.key}
              type="button"
              disabled={busy}
              onClick={() => onRespond(r.key)}
              className="border border-border bg-background px-5 py-3.5 text-left font-serif text-lg leading-snug text-foreground transition-colors hover:border-accent disabled:opacity-50"
            >
              “{r.say}”
            </button>
          ))}
          <button
            type="button"
            disabled={busy}
            onClick={() => setWriting(true)}
            className="px-5 py-3 text-left text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline disabled:opacity-50"
          >
            Say something else…
          </button>
        </div>
      ) : (
        <div className="mt-8">
          <textarea
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && draft.trim()) {
                e.preventDefault();
                onFreeText(draft.trim());
              }
            }}
            rows={3}
            disabled={busy}
            placeholder="Say it the way you'd say it in the room…"
            className="w-full resize-none border border-border bg-background px-4 py-3 font-serif text-lg text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
          />
          <div className="mt-3 flex items-center justify-between">
            <button
              type="button"
              disabled={busy}
              onClick={() => setWriting(false)}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← Back
            </button>
            <button
              type="button"
              disabled={busy || !draft.trim()}
              onClick={() => onFreeText(draft.trim())}
              className="bg-accent px-6 py-2.5 text-sm font-medium text-accent-foreground disabled:opacity-40"
            >
              {busy ? "They’re responding…" : "Say it"}
            </button>
          </div>
        </div>
      )}

      {error ? (
        <p className="mt-4 text-center text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
