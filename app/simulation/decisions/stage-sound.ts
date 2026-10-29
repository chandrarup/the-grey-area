"use client";

/**
 * Synthesised stage audio (Web Audio, no asset files). Browsers only allow
 * audio after a user gesture, so `unlockAudio` must run inside a click.
 */

const MUTE_KEY = "stage:muted";
let ctx: AudioContext | null = null;

export function isMuted() {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(MUTE_KEY) === "1";
}

export function setMuted(muted: boolean) {
  window.localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
}

export function unlockAudio() {
  if (typeof window === "undefined") return;
  if (!ctx) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume();
}

function live(): AudioContext | null {
  if (!ctx || ctx.state !== "running" || isMuted()) return null;
  return ctx;
}

function tone(
  ac: AudioContext,
  freqs: number[],
  start: number,
  duration: number,
  peak: number,
  type: OscillatorType = "sine",
) {
  const gain = ac.createGain();
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(peak, start + 0.015);
  gain.gain.setValueAtTime(peak, start + Math.max(0.02, duration - 0.06));
  gain.gain.linearRampToValueAtTime(0, start + duration);
  gain.connect(ac.destination);
  for (const f of freqs) {
    const osc = ac.createOscillator();
    osc.type = type;
    osc.frequency.value = f;
    osc.connect(gain);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  }
}

export function vibrate(pattern: number | number[]) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      /* unsupported */
    }
  }
}

/** Phone ringtone (double ring every 3s). Returns a stop function. */
export function startRing(): () => void {
  const cycle = () => {
    vibrate([400, 200, 400]);
    const ac = live();
    if (!ac) return;
    const t = ac.currentTime + 0.02;
    tone(ac, [440, 480], t, 0.4, 0.07);
    tone(ac, [440, 480], t + 0.6, 0.4, 0.07);
  };
  cycle();
  const id = window.setInterval(cycle, 3000);
  return () => {
    window.clearInterval(id);
    vibrate(0);
  };
}

export function playPing() {
  vibrate([60, 60, 60]);
  const ac = live();
  if (!ac) return;
  const t = ac.currentTime + 0.01;
  tone(ac, [1046.5], t, 0.12, 0.06);
  tone(ac, [1568], t + 0.11, 0.22, 0.05);
}

export function playChat() {
  const ac = live();
  if (!ac) return;
  const t = ac.currentTime + 0.01;
  tone(ac, [880], t, 0.07, 0.04, "triangle");
  tone(ac, [1174.7], t + 0.06, 0.1, 0.035, "triangle");
}

export function playWhoosh() {
  const ac = live();
  if (!ac) return;
  const t = ac.currentTime + 0.01;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(90, t);
  osc.frequency.exponentialRampToValueAtTime(420, t + 1.2);
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.05, t + 0.5);
  gain.gain.linearRampToValueAtTime(0, t + 1.4);
  osc.connect(gain).connect(ac.destination);
  osc.start(t);
  osc.stop(t + 1.5);
}

export function playMail() {
  const ac = live();
  if (!ac) return;
  const t = ac.currentTime + 0.01;
  tone(ac, [659.3], t, 0.18, 0.045, "triangle");
  tone(ac, [987.8], t + 0.14, 0.3, 0.04, "triangle");
}

export function playNews() {
  vibrate(200);
  const ac = live();
  if (!ac) return;
  const t = ac.currentTime + 0.01;
  tone(ac, [196, 293.7], t, 0.5, 0.05, "triangle");
  tone(ac, [246.9, 370], t + 0.25, 0.7, 0.04, "triangle");
}

export function playConnect() {
  const ac = live();
  if (!ac) return;
  const t = ac.currentTime + 0.01;
  tone(ac, [523.3], t, 0.09, 0.05);
  tone(ac, [659.3], t + 0.09, 0.09, 0.05);
  tone(ac, [784], t + 0.18, 0.16, 0.05);
}

export function playTick() {
  const ac = live();
  if (!ac) return;
  tone(ac, [1800], ac.currentTime + 0.01, 0.03, 0.03, "square");
}

/** Faint room tone for live calls. Returns a stop function. */
export function startRoomTone(): () => void {
  const ac = live();
  if (!ac) return () => {};
  const length = ac.sampleRate * 2;
  const buffer = ac.createBuffer(1, length, ac.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < length; i++) {
    last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
    data[i] = last * 3.5;
  }
  const src = ac.createBufferSource();
  src.buffer = buffer;
  src.loop = true;
  const filter = ac.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 500;
  const gain = ac.createGain();
  gain.gain.setValueAtTime(0, ac.currentTime);
  gain.gain.linearRampToValueAtTime(0.035, ac.currentTime + 1.2);
  src.connect(filter).connect(gain).connect(ac.destination);
  src.start();
  return () => {
    const now = ac.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.4);
    src.stop(now + 0.45);
  };
}
