"use client";

import { isMuted } from "../stage-sound";
import { speak as systemSpeak, stopSpeaking, voicesEnabled } from "../stage-voice";
import { paceSpeechDelivery, speechSpeedMultiplier } from "./speech-pacing";

/**
 * Character speech. Uses HeadTTS (Kokoro neural voices, in-browser via
 * WebGPU/WASM) for audio + Oculus viseme timings; until that model has
 * loaded, falls back to the browser's speech synthesis with estimated
 * mouth movement. Avatars read `speechBus.current` every frame.
 *
 * Fee/reveal lines get ellipsis pacing via `paceSpeechDelivery` before synth.
 */

const HEADTTS = "https://cdn.jsdelivr.net/npm/@met4citizen/headtts@1.3";

export const VOICES: Record<string, { voice: string; speed: number }> = {
  marcus: { voice: "am_michael", speed: 1.05 },
  david: { voice: "am_onyx", speed: 0.98 },
  tom: { voice: "bm_george", speed: 0.95 },
  priya: { voice: "bf_isabella", speed: 1.02 },
  eleanor: { voice: "bf_emma", speed: 0.94 },
  narrator: { voice: "af_heart", speed: 1 },
};

export type SpeechTimeline = {
  castId: string;
  start: number; // seconds, performance clock
  duration: number; // seconds
  visemes: string[];
  vtimes: number[]; // ms
  vdurations: number[]; // ms
  estimated: boolean;
};

type Clip = {
  buffer: AudioBuffer;
  visemes: string[];
  vtimes: number[];
  vdurations: number[];
};

type HeadTTSInstance = {
  connect: (settings?: unknown, onprogress?: (e: ProgressEvent) => void) => Promise<void>;
  setup: (data: Record<string, unknown>) => Promise<void>;
  synthesize: (data: { input: string }) => Promise<
    { type: string; data: { audio?: AudioBuffer | ArrayBuffer; visemes: string[]; vtimes: number[]; vdurations: number[] } }[]
  >;
};

type Listener = () => void;

export const speechBus = {
  current: null as SpeechTimeline | null,
  status: "idle" as "idle" | "loading" | "ready" | "unavailable",
  progress: 0,
  listeners: new Set<Listener>(),
};

function emit() {
  speechBus.listeners.forEach((l) => l());
}

export function subscribeSpeech(l: Listener) {
  speechBus.listeners.add(l);
  return () => speechBus.listeners.delete(l);
}

let ctx: AudioContext | null = null;
let tts: HeadTTSInstance | null = null;
let loading: Promise<void> | null = null;
const cache = new Map<string, Promise<Clip>>();
let activeSource: AudioBufferSourceNode | null = null;
let activeToken = 0;

function audioCtx() {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** Start loading the neural voice model in the background. Safe to call repeatedly. */
export function prepareVoices() {
  if (loading || typeof window === "undefined") return loading;
  if (!("gpu" in navigator) && !("WebAssembly" in window)) {
    speechBus.status = "unavailable";
    emit();
    return null;
  }
  speechBus.status = "loading";
  emit();
  loading = (async () => {
    try {
      const importer = new Function("u", "return import(u)") as (u: string) => Promise<{ HeadTTS: new (o: unknown) => HeadTTSInstance }>;
      const { HeadTTS } = await importer(`${HEADTTS}/+esm`);
      tts = new HeadTTS({
        endpoints: ["webgpu", "wasm"],
        languages: ["en-us"],
        voices: Array.from(new Set(Object.values(VOICES).map((v) => v.voice))),
        dtypeWebgpu: "fp16",
        dtypeWasm: "q8",
        workerModule: `${HEADTTS}/modules/worker-tts.mjs`,
        dictionaryURL: `${HEADTTS}/dictionaries/`,
        audioCtx: audioCtx(),
      });
      await tts.connect(null, (e: ProgressEvent) => {
        if (e.lengthComputable && e.total) {
          speechBus.progress = Math.round((e.loaded / e.total) * 100);
          emit();
        }
      });
      speechBus.status = "ready";
      speechBus.progress = 100;
    } catch (err) {
      console.warn("Neural voices unavailable, using browser voices.", err);
      speechBus.status = "unavailable";
      tts = null;
    }
    emit();
  })();
  return loading;
}

function synth(castId: string, text: string): Promise<Clip> {
  const paced = paceSpeechDelivery(text);
  const v = VOICES[castId] ?? VOICES.narrator;
  const speed = v.speed * speechSpeedMultiplier(paced);
  const key = `${v.voice}|${speed.toFixed(3)}|${paced}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const job = (async () => {
    if (!tts) throw new Error("tts not ready");
    void tts.setup({
      voice: v.voice,
      language: "en-us",
      speed,
      audioEncoding: "wav",
    });
    const messages = await tts.synthesize({ input: paced });
    const ac = audioCtx();
    const parts: Clip[] = [];
    for (const m of messages) {
      if (m.type !== "audio" || !m.data.audio) continue;
      const audio = m.data.audio;
      const buffer = audio instanceof AudioBuffer ? audio : await ac.decodeAudioData(audio.slice(0));
      parts.push({ buffer, visemes: m.data.visemes, vtimes: m.data.vtimes, vdurations: m.data.vdurations });
    }
    if (!parts.length) throw new Error("no audio");
    if (parts.length === 1) return parts[0];
    // Concatenate sentence chunks and shift their viseme times.
    const total = parts.reduce((n, p) => n + p.buffer.length, 0);
    const out = ac.createBuffer(1, total, parts[0].buffer.sampleRate);
    const data = out.getChannelData(0);
    const merged: Clip = { buffer: out, visemes: [], vtimes: [], vdurations: [] };
    let offset = 0;
    for (const p of parts) {
      data.set(p.buffer.getChannelData(0), offset);
      const ms = (offset / p.buffer.sampleRate) * 1000;
      merged.visemes.push(...p.visemes);
      merged.vtimes.push(...p.vtimes.map((t) => t + ms));
      merged.vdurations.push(...p.vdurations);
      offset += p.buffer.length;
    }
    return merged;
  })();
  cache.set(key, job);
  job.catch(() => cache.delete(key));
  return job;
}

/** Warm the cache for a line that is about to be spoken. */
export function prefetch(castId: string, text: string) {
  if (speechBus.status === "ready") void synth(castId, text).catch(() => {});
}

export function stopSpeech() {
  activeToken++;
  try {
    activeSource?.stop();
  } catch {
    /* already stopped */
  }
  activeSource = null;
  stopSpeaking();
  speechBus.current = null;
}

/** Speak a line in the character's voice. Resolves when it ends (or is stopped). */
export async function say(castId: string, text: string): Promise<void> {
  stopSpeech();
  const token = activeToken;
  const silent = isMuted() || !voicesEnabled();
  const paced = paceSpeechDelivery(text);

  if (!silent && speechBus.status === "ready") {
    try {
      const clip = await synth(castId, paced);
      if (token !== activeToken) return;
      const ac = audioCtx();
      const src = ac.createBufferSource();
      src.buffer = clip.buffer;
      src.connect(ac.destination);
      const lead = 0.05;
      src.start(ac.currentTime + lead);
      activeSource = src;
      speechBus.current = {
        castId,
        start: performance.now() / 1000 + lead,
        duration: clip.buffer.duration,
        visemes: clip.visemes,
        vtimes: clip.vtimes,
        vdurations: clip.vdurations,
        estimated: false,
      };
      await new Promise<void>((resolve) => {
        src.onended = () => resolve();
      });
      if (token === activeToken) speechBus.current = null;
      return;
    } catch {
      /* fall through to browser voice */
    }
  }

  const duration = Math.max(1.2, paced.length * 0.062);
  speechBus.current = {
    castId,
    start: performance.now() / 1000,
    duration,
    visemes: [],
    vtimes: [],
    vdurations: [],
    estimated: true,
  };
  await new Promise<void>((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      resolve();
    };
    if (silent) {
      window.setTimeout(finish, duration * 1000);
    } else {
      systemSpeak(castId, paced, { onEnd: finish });
      window.setTimeout(finish, duration * 1000 + 4000);
    }
  });
  if (token === activeToken) speechBus.current = null;
}

/** Viseme weights for `castId` right now. */
export function visemeWeightsNow(castId: string, out: Record<string, number>) {
  for (const k in out) out[k] = 0;
  const t = speechBus.current;
  if (!t || t.castId !== castId) return false;
  const now = performance.now() / 1000;
  const ms = (now - t.start) * 1000;
  if (ms < 0 || ms > t.duration * 1000 + 150) return false;
  if (t.estimated) {
    const open = 0.5 + 0.5 * Math.sin(ms / 85) * Math.sin(ms / 223 + 1.3);
    out.viseme_aa = Math.max(0, open) * 0.7;
    out.viseme_O = Math.max(0, Math.sin(ms / 140)) * 0.25;
    return true;
  }
  for (let i = 0; i < t.visemes.length; i++) {
    const s = t.vtimes[i];
    const d = t.vdurations[i];
    const ramp = Math.min(60, d * 0.6);
    if (ms < s - ramp || ms > s + d + ramp) continue;
    let w = 1;
    if (ms < s) w = 1 - (s - ms) / ramp;
    else if (ms > s + d) w = 1 - (ms - s - d) / ramp;
    const key = `viseme_${t.visemes[i]}`;
    out[key] = Math.max(out[key] ?? 0, Math.min(1, w));
  }
  return true;
}
