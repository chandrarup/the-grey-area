"use client";
import { useSyncExternalStore, useEffect, useState } from "react";
import { dialogueLevel, dialogueVolume, replayDialogue, setDialogueVolume, speechBus, subscribeSpeech } from "./speech";
const LABELS = { idle: "Audio check", loading: "Preparing voice…", blocked: "Enable audio to hear this line", playing: "Dialogue playing", ended: "Replay last line", error: "Voice unavailable · retry", muted: "Dialogue muted" };
export function DialogueControls() {
  const playback = useSyncExternalStore(subscribeSpeech, () => speechBus.playback, () => "idle" as const);
  const issue = useSyncExternalStore(subscribeSpeech, () => speechBus.issue, () => null);
  const source = useSyncExternalStore(subscribeSpeech, () => speechBus.status, () => "idle" as const);
  const volume = useSyncExternalStore(subscribeSpeech, dialogueVolume, () => 1);
  const [level,setLevel] = useState(0);
  useEffect(() => { const id = window.setInterval(() => setLevel(dialogueLevel()), 120); return () => window.clearInterval(id); }, []);
  return <div className="absolute bottom-4 right-4 z-40 max-w-[calc(100vw-2rem)] rounded-lg border border-white/15 bg-[#101a21]/95 px-3 py-2 text-white shadow-lg">
    {issue === "session" ? <p className="mb-2 max-w-56 text-xs leading-5">Your session ended. Reopen your invitation, or <a href="/login" className="underline">sign in again</a>.</p> : null}
    <button type="button" onClick={replayDialogue} className="text-xs text-[#efd6af]" aria-label={playback === "blocked" ? "Enable dialogue audio" : "Replay or test dialogue audio"}>{LABELS[playback]}{playback === "playing" && source === "unavailable" ? " · device voice" : ""}</button>
    <meter aria-label="Audio output level" min="0" max="1" value={level} className="ml-2 h-2 w-12" />
    <label className="mt-1 flex items-center gap-2 text-[10px] text-white/60">Voice volume<input aria-label="Dialogue volume" type="range" min="0" max="1" step="0.05" value={volume} onChange={(e) => setDialogueVolume(Number(e.target.value))} className="w-20 accent-[#d6ae70]" /></label>
  </div>;
}
