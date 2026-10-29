"use client";

import { isMuted } from "./stage-sound";

/**
 * Character voices via the browser's speech synthesis. Voice quality depends
 * on what the OS ships; each cast member gets a distinct voice/pitch/rate.
 */

const VOICES_KEY = "stage:voices";

type Profile = { gender: "m" | "f"; slot: number; pitch: number; rate: number };

const PROFILES: Record<string, Profile> = {
  marcus: { gender: "m", slot: 0, pitch: 0.95, rate: 1.05 },
  david: { gender: "m", slot: 1, pitch: 0.85, rate: 0.97 },
  tom: { gender: "m", slot: 2, pitch: 0.75, rate: 0.93 },
  priya: { gender: "f", slot: 0, pitch: 1.1, rate: 1.02 },
  eleanor: { gender: "f", slot: 1, pitch: 0.88, rate: 0.92 },
  narrator: { gender: "f", slot: 2, pitch: 1, rate: 0.95 },
};

const MALE = [
  "Daniel",
  "Google UK English Male",
  "Microsoft Guy",
  "Alex",
  "Arthur",
  "Oliver",
  "Aaron",
  "Fred",
  "Rishi",
  "Microsoft David",
];
const FEMALE = [
  "Samantha",
  "Google UK English Female",
  "Microsoft Aria",
  "Karen",
  "Moira",
  "Serena",
  "Tessa",
  "Victoria",
  "Fiona",
  "Microsoft Zira",
];

export function voicesSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function voicesEnabled() {
  if (!voicesSupported()) return false;
  return window.localStorage.getItem(VOICES_KEY) !== "0";
}

export function setVoicesEnabled(on: boolean) {
  window.localStorage.setItem(VOICES_KEY, on ? "1" : "0");
  if (!on) stopSpeaking();
}

function pickVoice(profile: Profile): SpeechSynthesisVoice | undefined {
  const all = window.speechSynthesis
    .getVoices()
    .filter((v) => v.lang.toLowerCase().startsWith("en"));
  if (!all.length) return undefined;
  const names = profile.gender === "m" ? MALE : FEMALE;
  const matched = names
    .map((n) => all.find((v) => v.name.startsWith(n)))
    .filter(Boolean) as SpeechSynthesisVoice[];
  const unique = matched.filter(
    (v, i) => matched.findIndex((m) => m.name === v.name) === i,
  );
  if (unique.length) return unique[profile.slot % unique.length];
  return all[(profile.slot + (profile.gender === "f" ? 3 : 0)) % all.length];
}

export function speak(
  castId: string,
  text: string,
  handlers?: {
    onStart?: () => void;
    onEnd?: () => void;
    onBoundary?: (charIndex: number) => void;
  },
) {
  if (!voicesEnabled() || isMuted()) {
    handlers?.onEnd?.();
    return;
  }
  const synth = window.speechSynthesis;
  synth.cancel();
  const profile = PROFILES[castId] ?? PROFILES.narrator;
  const utter = new SpeechSynthesisUtterance(text);
  const voice = pickVoice(profile);
  if (voice) utter.voice = voice;
  utter.pitch = profile.pitch;
  utter.rate = profile.rate;
  utter.onstart = () => handlers?.onStart?.();
  utter.onboundary = (e) => handlers?.onBoundary?.(e.charIndex);
  utter.onend = () => handlers?.onEnd?.();
  utter.onerror = () => handlers?.onEnd?.();
  synth.speak(utter);
}

export function stopSpeaking() {
  if (voicesSupported()) window.speechSynthesis.cancel();
}

/** Voices load asynchronously in some browsers. */
export function primeVoices() {
  if (voicesSupported()) window.speechSynthesis.getVoices();
}
