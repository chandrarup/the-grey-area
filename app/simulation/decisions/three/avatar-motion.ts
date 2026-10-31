/**
 * Seated Rocketbox motion policy: which professional intent is active, and
 * which bones a clip may drive so standing mocap never tips a seated body.
 */

import type { StageMood } from "@/lib/case/types";

export type AvatarAction = "write" | "lean" | "phone" | "nod" | "shake" | "lookDown" | null;

/** Face / talk-pressure mood (blendshapes + talkNervous / talkAssured). */
export type AvatarMood = "neutral" | "tense" | "warm" | "guarded";

/** Boardroom behaviour intents — only the acts a meeting needs. */
export type AvatarIntent =
  | "idle"
  | "listen"
  | "speak"
  | "nod"
  | "shake"
  | "phone"
  | "write"
  | "lean"
  | "lookDown";

export type AvatarMotionInput = {
  /** This seat is the current speaker (or "you" is speaking and this is N/A). */
  isSpeaker: boolean;
  /** Lip-sync / TTS is active for this cast id. */
  speaking: boolean;
  /** Someone else holds the floor; this seat should attend. */
  listening: boolean;
  /** Narration-driven beat action, if any. */
  action: AvatarAction;
};

/**
 * Resolve a single professional intent. Explicit beat actions win; otherwise
 * speak (audio only) > listen > idle. Holding the floor without audio stays
 * still — looping talk while silent reads as undead fidget.
 */
export function resolveAvatarIntent(input: AvatarMotionInput): AvatarIntent {
  const { action, speaking, listening } = input;
  if (action === "nod") return "nod";
  if (action === "shake") return "shake";
  if (action === "phone") return "phone";
  if (action === "write") return "write";
  if (action === "lean") return "lean";
  if (action === "lookDown") return "lookDown";
  if (speaking) return "speak";
  if (listening) return "listen";
  return "idle";
}

/** Clip names shipped for the seated boardroom (Rocketbox only). */
export const PROFESSIONAL_CLIPS = [
  "idle",
  "waiting",
  "thoughtful",
  "talk1",
  "talk2",
  "talkRelaxed",
  "talkNervous",
  "talkAssured",
  "listen",
  "nod",
  "shake",
  "phone",
] as const;

export type ProfessionalClip = (typeof PROFESSIONAL_CLIPS)[number];

export type ClipBoneClass = "seated-full" | "arms" | "head" | "arms-pose";

export type ClipLayer = {
  bones: ClipBoneClass;
  /** Mixer weight; never above 1 for seated safety. */
  weight: number;
  additive: boolean;
};

const ARMS: ClipLayer = { bones: "arms", weight: 0.28, additive: true };
const HEAD: ClipLayer = { bones: "head", weight: 0.45, additive: true };
const ARMS_POSE: ClipLayer = { bones: "arms-pose", weight: 1, additive: false };
const SEATED: ClipLayer = { bones: "seated-full", weight: 1, additive: false };

/**
 * How a named clip may drive the seated rig. Standing talk/listen/nod sources
 * are arms- or head-only additives; only sit_chair idle variants keep pelvis.
 */
export function clipLayerFor(name: string): ClipLayer {
  if (/^talk/.test(name)) return ARMS;
  if (name === "listen") return HEAD;
  if (name === "nod" || name === "shake") return HEAD;
  if (name === "phone") return ARMS_POSE;
  return SEATED;
}

/** Bone-name filter matching `clipLayerFor` — used when preparing mixer clips. */
export function boneFilterFor(layer: ClipLayer): RegExp | null {
  if (layer.bones === "arms" || layer.bones === "arms-pose") {
    return /(Clavicle|UpperArm|Forearm|Hand|Finger)/;
  }
  if (layer.bones === "head") return /(Neck|Head)/;
  return null; // seated-full: keep normalized clip as authored (sit_chair)
}

/**
 * Intent → overlay clips. Idle and listen intentionally return none — calm
 * stillness + lookAt reads better than looping listen/idle mocap.
 */
export function clipsForIntent(intent: AvatarIntent, talkPool: string[]): string[] {
  switch (intent) {
    case "speak":
      return talkPool;
    case "nod":
      return ["nod"];
    case "shake":
      return ["shake"];
    case "phone":
      return ["phone"];
    case "listen":
    case "idle":
    case "write":
    case "lean":
    case "lookDown":
      return [];
  }
}

/**
 * Prefer talkNervous / talkAssured from face mood so speak overlays match
 * boardroom pressure (night / tense → nervous; warm → assured).
 */
export function talkClipsForMood(
  mood: AvatarMood,
  basePool: readonly string[],
): string[] {
  const pool = [...basePool];
  const prefer =
    mood === "tense" || mood === "guarded"
      ? "talkNervous"
      : mood === "warm"
        ? "talkAssured"
        : pool.includes("talkRelaxed")
          ? "talkRelaxed"
          : null;
  if (!prefer) return pool;
  return [prefer, ...pool.filter((c) => c !== prefer)];
}

/** Escalate cast face mood with scene lighting pressure (night/evening). */
export function castMoodForStage(
  base: AvatarMood,
  stageMood: StageMood,
): AvatarMood {
  if (stageMood === "night") {
    if (base === "warm") return "guarded";
    if (base === "neutral") return "tense";
    return base;
  }
  if (stageMood === "evening") {
    if (base === "warm") return "neutral";
    if (base === "neutral") return "guarded";
    return base;
  }
  return base;
}
