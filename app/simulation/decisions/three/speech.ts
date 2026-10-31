"use client";

import { getStageAudioContext, isMuted, setMuted, unlockAudio } from "../stage-sound";
import { speak as systemSpeak, stopSpeaking, voicesEnabled, voicesSupported, setVoicesEnabled } from "../stage-voice";
import { readSeatToken } from "@/lib/group/seat-token-client";
import { paceSpeechDelivery } from "./speech-pacing";

export type SpeechTimeline = {
  castId: string; start: number; duration: number;
  visemes: string[]; vtimes: number[]; vdurations: number[]; estimated: boolean;
};
type Playback = "idle" | "loading" | "blocked" | "playing" | "ended" | "error" | "muted";
export const speechBus = {
  current: null as SpeechTimeline | null,
  status: "idle" as "idle" | "loading" | "ready" | "cloud" | "unavailable",
  playback: "idle" as Playback,
  progress: 0,
  issue: null as "session" | "service" | null,
  listeners: new Set<() => void>(),
};
function emit() { speechBus.listeners.forEach((l) => l()); }
export function subscribeSpeech(listener: () => void) {
  speechBus.listeners.add(listener);
  return () => { speechBus.listeners.delete(listener); };
}
function state(playback: Playback) { speechBus.playback = playback; emit(); }
class SpeechAccessError extends Error {}
const cache = new Map<string, Promise<AudioBuffer>>();
let activeToken = 0;
let cancelPlayback: (() => void) | null = null;
let gain: GainNode | null = null;
let lastLine: { castId: string; text: string } | null = null;
let activeBuffer: AudioBuffer | null = null;
let analyser: AnalyserNode | null = null;
const meterSamples = new Float32Array(256);
export function dialogueLevel() {
  if (!analyser || speechBus.playback !== "playing") return 0;
  analyser.getFloatTimeDomainData(meterSamples);
  return Math.min(1, Math.sqrt(meterSamples.reduce((s,v) => s+v*v,0)/meterSamples.length)*4);
}

export function dialogueVolume() {
  if (typeof window === "undefined") return 1;
  const stored = window.localStorage.getItem("stage:dialogue-volume");
  const n = stored === null ? 1 : Number(stored);
  return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 1;
}
export function setDialogueVolume(value: number) {
  const n = Math.max(0, Math.min(1, value));
  window.localStorage.setItem("stage:dialogue-volume", String(n));
  if (gain) gain.gain.value = n;
  emit();
}
/** Warm actual dialogue, not a disposable probe or a second downloadable voice model. */
export function prepareVoices() { return Promise.resolve(); }
export function awaitVoicesSettled() { return Promise.resolve(); }
async function synth(castId: string, text: string): Promise<AudioBuffer> {
  const key = `${castId}|${text}`;
  const found = cache.get(key);
  if (found) return found;
  const job = (async () => {
    const sessionId = typeof window !== "undefined" ? window.location?.pathname.match(/^\/group\/([^/]+)/)?.[1] : undefined;
    const seat = sessionId ? readSeatToken(sessionId) : null;
    const headers: Record<string,string> = { "Content-Type": "application/json" };
    if (seat) headers["x-seat-token"] = seat;
    const res = await fetch("/api/speech", {
      method: "POST", headers,
      body: JSON.stringify({ castId, text }), signal: AbortSignal.timeout(15000),
    });
    if (res.status === 401 || res.status === 403) throw new SpeechAccessError("Session expired");
    if (!res.ok) throw new Error(`Speech request failed (${res.status})`);
    const ac = getStageAudioContext();
    if (!ac) throw new Error("Web Audio unavailable");
    const buffer = await ac.decodeAudioData(await res.arrayBuffer());
    if (!buffer.length || !Number.isFinite(buffer.duration)) throw new Error("Empty speech audio");
    return buffer;
  })();
  if (cache.size >= 32) cache.delete(cache.keys().next().value!);
  cache.set(key, job);
  void job.catch(() => cache.delete(key));
  return job;
}
export function prefetch(castId: string, text: string) {
  if (!isMuted() && voicesEnabled()) void synth(castId, paceSpeechDelivery(text)).catch(() => {});
}
export function stopSpeech() {
  activeToken++;
  cancelPlayback?.(); cancelPlayback = null;
  stopSpeaking();
  speechBus.current = null; activeBuffer = null;
  gain = null;
  state("idle");
}
/** Called synchronously by a user click. Resumes the SAME context used by dialogue. */
export function enableDialogue() {
  setMuted(false); setVoicesEnabled(true); unlockAudio(); emit();
}
export function replayDialogue() {
  enableDialogue();
  if (["blocked", "loading", "playing"].includes(speechBus.playback)) return; // resume the waiting line, don't restart its caller
  if (lastLine) void say(lastLine.castId, lastLine.text);
  else void say("narrator", "Audio check. You should hear this voice clearly. Adjust the dialogue volume if needed.");
}
async function waitUntilRunning(ac: AudioContext, token: number) {
  if (ac.state === "running") return;
  state("blocked");
  await new Promise<void>((resolve) => {
    const finish = () => { ac.removeEventListener("statechange", changed); resolve(); };
    const changed = () => { if (ac.state === "running" || token !== activeToken) finish(); };
    cancelPlayback = finish;
    ac.addEventListener("statechange", changed);
    changed();
  });
}
function timeline(castId: string, duration: number) {
  speechBus.current = { castId, start: performance.now()/1000, duration,
    visemes: [], vtimes: [], vdurations: [], estimated: true };
  state("playing");
}
export async function say(castId: string, text: string): Promise<boolean> {
  stopSpeech();
  const token = activeToken;
  lastLine = { castId, text };
  const paced = paceSpeechDelivery(text);
  if (isMuted() || !voicesEnabled()) {
    state("muted");
    await new Promise<void>((resolve) => {
      const timer = window.setTimeout(resolve, Math.max(1800, text.length * 55));
      cancelPlayback = () => { window.clearTimeout(timer); resolve(); };
    });
    return token === activeToken;
  }
  speechBus.issue = null;
  state("loading");
  try {
    const buffer = await synth(castId, paced);
    if (token !== activeToken) return false;
    const ac = getStageAudioContext()!;
    await waitUntilRunning(ac, token);
    if (token !== activeToken) return false;
    const src = ac.createBufferSource();
    src.buffer = buffer;
    const lineGain = ac.createGain(); lineGain.gain.value = dialogueVolume();
    gain = lineGain;
    const lineAnalyser = ac.createAnalyser?.() ?? null;
    analyser = lineAnalyser;
    src.connect(lineGain);
    if (lineAnalyser) { lineAnalyser.fftSize=256; lineGain.connect(lineAnalyser); lineAnalyser.connect(ac.destination); }
    else lineGain.connect(ac.destination);
    speechBus.status = "cloud"; speechBus.progress = 100;
    activeBuffer = buffer;
    await new Promise<void>((resolve) => {
      src.onended = () => resolve();
      cancelPlayback = () => { try { src.stop(); } catch {} resolve(); };
      timeline(castId, buffer.duration);
      src.start();
    }).finally(() => {
      src.disconnect();
      lineGain.disconnect();
      lineAnalyser?.disconnect();
      if (analyser === lineAnalyser) analyser = null;
    });
  } catch (error) {
    if (token !== activeToken) return false;
    speechBus.status = "unavailable";
    if (error instanceof SpeechAccessError) {
      speechBus.issue = "session";
      state("error");
      await new Promise<void>((resolve) => { cancelPlayback = resolve; });
      return false;
    }
    speechBus.issue = "service";
    if (voicesSupported()) {
      let started = false;
      await new Promise<void>((resolve) => {
        const timer = window.setTimeout(resolve, Math.max(6000, text.length * 95));
        const finish = () => { window.clearTimeout(timer); resolve(); };
        cancelPlayback = finish;
        systemSpeak(castId, paced, { onStart: () => { started = true; timeline(castId, Math.max(1.2,text.length*.062)); }, onEnd: finish });
      });
      if (!started && token === activeToken) { state("error"); await new Promise<void>((resolve) => { cancelPlayback = resolve; }); return false; }
    } else {
      state("error");
      // Leave the line on screen until the learner retries or explicitly continues.
      await new Promise<void>((resolve) => { cancelPlayback = resolve; });
    }
  }
  if (token === activeToken) {
    speechBus.current = null; activeBuffer = null; cancelPlayback = null; gain = null;
    state("ended");
    return true;
  }
  return false;
}
/** Mouth movement follows the audio envelope, including its real pauses. */
export function visemeWeightsNow(castId: string, out: Record<string, number>) {
  for (const key in out) out[key] = 0;
  const line = speechBus.current;
  if (!line || line.castId !== castId || speechBus.playback !== "playing") return false;
  const elapsed = performance.now()/1000-line.start;
  if (elapsed < 0 || elapsed > line.duration) return false;
  let level = .2;
  if (activeBuffer) {
    const samples = activeBuffer.getChannelData(0);
    const start = Math.floor(elapsed * activeBuffer.sampleRate);
    let sum=0, count=0;
    for(let i=start;i<Math.min(samples.length,start+480);i+=8){sum+=samples[i]*samples[i];count++;}
    level = Math.min(.8, Math.sqrt(sum/Math.max(1,count))*4);
  }
  out.viseme_aa = level;
  out.viseme_O = level*.25;
  return true;
}
