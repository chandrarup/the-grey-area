"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import { applyPose, collectBones, createRigFrame, normalizeClip, restore, rotateWorld, snapshot, type Bones } from "./rig";
import { visemeWeightsNow } from "./speech";
import { poseSeatedArms } from "./seated-arms";
import { applyCoveredWardrobe } from "./wardrobe";
import {
  boneFilterFor,
  clipLayerFor,
  clipsForIntent,
  resolveAvatarIntent,
  talkClipsForMood,
  type AvatarAction,
  type AvatarIntent,
  type AvatarMood,
} from "./avatar-motion";

export type { AvatarAction, AvatarIntent, AvatarMood } from "./avatar-motion";

const VISEME_KEYS = [
  "viseme_sil", "viseme_PP", "viseme_FF", "viseme_TH", "viseme_DD", "viseme_kk", "viseme_CH",
  "viseme_SS", "viseme_nn", "viseme_RR", "viseme_aa", "viseme_E", "viseme_I", "viseme_O", "viseme_U",
];

const MOOD_SHAPES: Record<AvatarMood, Record<string, number>> = {
  neutral: {},
  tense: { browDownLeft: 0.3, browDownRight: 0.3, mouthPressLeft: 0.25, mouthPressRight: 0.25 },
  warm: { mouthSmileLeft: 0.22, mouthSmileRight: 0.22, cheekSquintLeft: 0.1, cheekSquintRight: 0.1 },
  guarded: { browInnerUp: 0.15, mouthRollLower: 0.15, eyeSquintLeft: 0.12, eyeSquintRight: 0.12 },
};

const GENDER: Record<string, "m" | "f"> = { marcus: "m", david: "m", tom: "m", priya: "f", eleanor: "f" };

const TALK: Record<string, string[]> = {
  marcus: ["talkAssured", "talkRelaxed"],
  david: ["talk1", "talk2"],
  tom: ["talk2", "talkNervous"],
  priya: ["talkRelaxed", "talk1"],
  eleanor: ["talkAssured", "talk2"],
};
/*
 * Standing Rocketbox talk/listen/nod clips tip a seated body if played whole.
 * clipLayerFor + settle() keep only arms/head additives; pelvis stays on the chair.
 * Visual QA: /stage-lab seat + side shots while cycling idle / listen / speak.
 *
 * Idle policy: hold a single seated frame (timeScale 0) — looping idle/waiting
 * variants read as zombie fidget in a boardroom.
 */
function layeredClip(clip: THREE.AnimationClip, bones: RegExp, additive: boolean) {
  const tracks = clip.tracks
    .filter((t) => bones.test(t.name.split(".")[0]) && t.name.endsWith(".quaternion"))
    .map((t) => {
      const c = t.clone();
      c.times = c.times.slice();
      c.values = c.values.slice();
      return c;
    });
  const out = new THREE.AnimationClip(clip.name, clip.duration, tracks);
  return additive ? THREE.AnimationUtils.makeClipAdditive(out) : out;
}

type Prepared = {
  root: THREE.Group;
  bones: Bones;
  rest: Record<string, THREE.Quaternion>;
  meshes: THREE.SkinnedMesh[];
  headHeight: number;
};

/** Rocketbox opacity layers (hair / dress hems) shipped with baseColor alpha 0. */
function fixOpacityMaterials(root: THREE.Object3D) {
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.material = Array.isArray(mesh.material) ? mesh.material.map(m => m.clone()) : mesh.material.clone();
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const mat of mats) {
      if (!mat) continue;
      const std = mat as THREE.MeshStandardMaterial;
      const name = (std.name || "").toLowerCase();
      if (!/opacity|hair|lash|dress|skirt/.test(name) && !(std.alphaTest > 0)) continue;
      std.opacity = 1;
      if ("color" in std && std.color) {
        /* keep rgb; ensure alpha path is opaque enough for MASK */
      }
      std.transparent = std.alphaTest > 0 ? false : std.transparent;
      if (std.alphaTest > 0) std.alphaTest = Math.min(std.alphaTest, 0.35);
      std.depthWrite = true;
      std.side = THREE.DoubleSide;
      std.needsUpdate = true;
    }
  });
}

export function prepare(
  source: THREE.Object3D,
  height: number,
  sitting: boolean,
  animated: boolean,
  castId?: string,
): Prepared {
  const model = cloneSkinned(source) as THREE.Group;
  fixOpacityMaterials(model);
  if (castId === "priya") applyCoveredWardrobe(model);
  const meshes: THREE.SkinnedMesh[] = [];
  model.traverse((o) => {
    const m = o as THREE.SkinnedMesh;
    if (m.isSkinnedMesh) {
      m.frustumCulled = false;
      m.castShadow = true;
      m.receiveShadow = true;
      if (m.morphTargetDictionary) meshes.push(m);
    }
  });
  const bones = collectBones(model);

  // Normalise: face +Z, feet on y=0, target height.
  const wrapper = new THREE.Group();
  wrapper.add(model);
  model.updateWorldMatrix(true, true);
  const head = bones.Head;
  const footY = Math.min(
    bones.LToe0?.getWorldPosition(new THREE.Vector3()).y ?? Infinity,
    bones.RToe0?.getWorldPosition(new THREE.Vector3()).y ?? Infinity,
    bones.LFoot?.getWorldPosition(new THREE.Vector3()).y ?? Infinity,
  );
  const headY = head?.getWorldPosition(new THREE.Vector3()).y ?? 1;
  const boneHeight = Math.abs(headY - (Number.isFinite(footY) ? footY : 0)) * 1.12;
  model.scale.multiplyScalar(height / Math.max(1e-4, boneHeight));
  model.updateWorldMatrix(true, true);

  const eyeL = bones.LEye;
  const eyeR = bones.REye;
  if (head && eyeL && eyeR) {
    const h = head.getWorldPosition(new THREE.Vector3());
    const e = eyeL.getWorldPosition(new THREE.Vector3()).add(eyeR.getWorldPosition(new THREE.Vector3())).multiplyScalar(0.5);
    const fwd = e.sub(h);
    fwd.y = 0;
    if (fwd.lengthSq() > 1e-8) model.rotation.y = -Math.atan2(fwd.x, fwd.z);
  }
  model.updateWorldMatrix(true, true);
  const ground = Math.min(
    bones.LToe0?.getWorldPosition(new THREE.Vector3()).y ?? Infinity,
    bones.RToe0?.getWorldPosition(new THREE.Vector3()).y ?? Infinity,
    bones.LFoot?.getWorldPosition(new THREE.Vector3()).y ?? Infinity,
  );
  if (Number.isFinite(ground)) model.position.y -= ground - 0.02;
  model.updateWorldMatrix(true, true);

  if (!animated) applyPose(wrapper, bones, new THREE.Vector3(0, 0, 1), sitting);

  if (!animated && sitting && bones.Pelvis) {
    const pelvisY = bones.Pelvis.getWorldPosition(new THREE.Vector3()).y;
    // Female Rocketbox dresses sit slightly lower; nudge Priya up/back off the seat.
    const dressLift = castId === "priya" ? 0.04 : 0;
    const dressBack = castId === "priya" ? 0.04 : 0;
    model.position.y -= pelvisY - 0.52 - dressLift;
    model.position.z -= 0.08 + dressBack;
  }
  model.updateWorldMatrix(true, true);
  const headHeight = head ? head.getWorldPosition(new THREE.Vector3()).y : height * 0.92;

  return { root: wrapper, bones, rest: snapshot(bones), meshes, headHeight };
}

/** Hip-joint height above the floor when seated on a 0.5 m seat. */
const SEATED_PELVIS_Y = 0.6;

/** Office chair; seat centred on the origin, backrest behind (-Z). */
export function Chair({
  position,
  rotation = 0,
  innerRef,
}: {
  position?: [number, number, number];
  rotation?: number;
  innerRef?: React.Ref<THREE.Group>;
}) {
  return (
    <group ref={innerRef} position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.46, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.5, 0.08, 0.5]} />
        <meshStandardMaterial color="#1d1d1f" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.84, -0.26]} castShadow>
        <boxGeometry args={[0.48, 0.66, 0.06]} />
        <meshStandardMaterial color="#1d1d1f" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.44]} />
        <meshStandardMaterial color="#888" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  );
}

function setMorph(meshes: THREE.SkinnedMesh[], name: string, value: number) {
  for (const m of meshes) {
    const i = m.morphTargetDictionary?.[name];
    if (i !== undefined && m.morphTargetInfluences) m.morphTargetInfluences[i] = value;
  }
}

export function Avatar({
  id,
  position,
  rotationY = 0,
  sitting = true,
  height = 1.76,
  lookAt,
  action = null,
  mood = "neutral",
  chair = false,
  listening = false,
  isSpeaker = false,
}: {
  id: string;
  position: [number, number, number];
  rotationY?: number;
  sitting?: boolean;
  height?: number;
  lookAt?: THREE.Vector3 | null;
  action?: AvatarAction;
  mood?: AvatarMood;
  /** Render a chair that stays under the hips. */
  chair?: boolean;
  /** Another seat holds the floor — prefer listen over idle fidget. */
  listening?: boolean;
  /** This seat is the directed speaker (solo + group boardroom share this path). */
  isSpeaker?: boolean;
}) {
  const { scene } = useGLTF(`/avatars/${id}.glb`);
  const { animations } = useGLTF(`/avatars/anims_${GENDER[id] ?? "m"}.glb`);
  const animated = sitting && animations.length > 0;
  const prepared = useMemo(
    () => prepare(scene, height, sitting, animated, id),
    [scene, height, sitting, animated, id],
  );
  const rig = useMemo(() => {
    const mixer = new THREE.AnimationMixer(prepared.root);
    const root = Object.values(prepared.bones).find((b) => b.name === "Bip01");
    const clips = new Map(
      animations.map((a) => {
        const layer = clipLayerFor(a.name);
        const bones = boneFilterFor(layer);
        if (bones) return [a.name, layeredClip(a, bones, layer.additive)] as const;
        return [a.name, root ? normalizeClip(a, root, prepared.root) : a] as const;
      }),
    );
    const act = (name: string) => {
      const clip = clips.get(name);
      return clip ? mixer.clipAction(clip) : null;
    };
    return { mixer, act, frame: createRigFrame(prepared.bones, mixer) };
  }, [prepared, animations]);
  const group = useRef<THREE.Group>(null);
  const chairRef = useRef<THREE.Group>(null);
  const liftRef = useRef<THREE.Group>(null);
  const seed = useMemo(() => [...id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 997, 7) / 97, [id]);
  const state = useRef({
    yaw: 0,
    pitch: 0,
    blinkAt: 1 + (seed % 3),
    blink: 0,
    visemes: Object.fromEntries(VISEME_KEYS.map((k) => [k, 0])) as Record<string, number>,
    target: Object.fromEntries(VISEME_KEYS.map((k) => [k, 0])) as Record<string, number>,
    actionT: 0,
    lastAction: null as AvatarAction,
    lastIntent: "idle" as AvatarIntent,
    speakT: 0,
    seed,
    base: null as THREE.AnimationAction | null,
    overlay: null as THREE.AnimationAction | null,
    talkIdx: 0,
    lift: 0,
    seat: null as THREE.Vector3 | null,
    leanFix: 0,
    eyeYaw: 0,
    eyePitch: 0,
    saccadeAt: 2.5,
    saccade: new THREE.Vector2(),
  });

  useEffect(() => {
    if (!animated) return;
    const idle = rig.act("idle");
    if (!idle) return;
    // Hold one calm seated frame — do not loop idle mocap.
    idle.time = Math.min(0.35 + seed * 0.08, Math.max(0.1, idle.getClip().duration * 0.15));
    idle.setLoop(THREE.LoopOnce, 1);
    idle.clampWhenFinished = true;
    idle.timeScale = 0;
    idle.enabled = true;
    idle.setEffectiveWeight(1);
    idle.play();
    state.current.base = idle;
    return () => {
      rig.mixer.stopAllAction();
    };
  }, [animated, rig, seed]);

  const tmp = useMemo(
    () => ({
      q: new THREE.Quaternion(),
      up: new THREE.Vector3(),
      side: new THREE.Vector3(),
      fwd: new THREE.Vector3(),
      local: new THREE.Vector3(),
      headPos: new THREE.Vector3(),
      a: new THREE.Vector3(),
      b: new THREE.Vector3(),
    }),
    [],
  );

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    const { bones, rest, meshes } = prepared;
    const s = state.current;
    const t = performance.now() / 1000 + s.seed;
    if (!animated) restore(bones, rest);

    g.getWorldQuaternion(tmp.q);
    tmp.up.set(0, 1, 0).applyQuaternion(tmp.q);
    tmp.side.set(1, 0, 0).applyQuaternion(tmp.q);
    tmp.fwd.set(0, 0, 1).applyQuaternion(tmp.q);

    // Runs after the mixer: the seated clips hunch forward and drift on the
    // seat, so straighten the torso and keep hips (and chair) where they belong.
    function settle(step: number) {
      const pelvis = bones.Pelvis;
      if (!pelvis || !g) return;
      if (bones.Neck) {
        pelvis.getWorldPosition(tmp.a);
        bones.Neck.getWorldPosition(tmp.b).sub(tmp.a);
        const lean = Math.asin(
          THREE.MathUtils.clamp(tmp.b.dot(tmp.fwd) / Math.max(1e-4, tmp.b.length()), -1, 1),
        );
        s.leanFix = THREE.MathUtils.damp(s.leanFix, THREE.MathUtils.clamp(lean - 0.08, -0.1, 0.4), 3, step);
        if (bones.Spine) rotateWorld(bones.Spine, tmp.side, -s.leanFix * 0.45);
        if (bones.Spine1) rotateWorld(bones.Spine1, tmp.side, -s.leanFix * 0.35);
        if (bones.Spine2) rotateWorld(bones.Spine2, tmp.side, -s.leanFix * 0.2);
      }
      pelvis.getWorldPosition(tmp.a);
      g.worldToLocal(tmp.a);
      s.lift += (SEATED_PELVIS_Y - tmp.a.y) * (1 - Math.exp(-3 * step));
      if (liftRef.current) liftRef.current.position.y = s.lift;
      const seatZ = tmp.a.z - 0.05;
      if (!s.seat) s.seat = new THREE.Vector3(tmp.a.x, 0, seatZ);
      s.seat.x = THREE.MathUtils.damp(s.seat.x, tmp.a.x, 1.5, step);
      s.seat.z = THREE.MathUtils.damp(s.seat.z, seatZ, 1.5, step);
      chairRef.current?.position.copy(s.seat);
    }

    const speaking = visemeWeightsNow(id, s.target);
    s.speakT = THREE.MathUtils.damp(s.speakT, speaking ? 1 : 0, 6, dt);

    if (action !== s.lastAction) {
      s.lastAction = action;
      s.actionT = 0;
    }
    s.actionT += dt;
    const actionIn = Math.min(1, s.actionT / 0.6);

    if (animated) {
      const intent = resolveAvatarIntent({
        isSpeaker,
        speaking,
        listening,
        action,
      });
      const intentChanged = intent !== s.lastIntent;
      s.lastIntent = intent;

      // Keep a frozen seated idle pose as the base — never cycle waiting/thoughtful.
      const idleBase = rig.act("idle");
      if (idleBase) {
        idleBase.timeScale = 0;
        idleBase.enabled = true;
        idleBase.setEffectiveWeight(1);
        if (s.base !== idleBase) {
          s.base?.fadeOut(0.4);
          idleBase.play();
          s.base = idleBase;
        }
      }

      // Overlay only for speak / one-shot reactions — not looping listen fidget.
      const wantOverlay =
        intent === "nod" || intent === "shake";
      if (intentChanged) {
        s.overlay?.fadeOut(0.35);
        s.overlay = null;
      }
      if (wantOverlay && !s.overlay) {
        const talkPool = talkClipsForMood(mood, TALK[id] ?? ["talk1"]);
        const pool = clipsForIntent(intent, talkPool);
        const clipName = pool[0];
        const overlay = clipName ? rig.act(clipName) : null;
        if (overlay) {
          const layer = clipLayerFor(clipName);
          overlay.reset();
          overlay.timeScale = 1;
          overlay.setLoop(THREE.LoopOnce, 1);
          overlay.clampWhenFinished = true;
          overlay.setEffectiveWeight(layer.weight).fadeIn(0.35).play();
          s.overlay = overlay;
        }
      } else if (!wantOverlay && s.overlay) {
        s.overlay.fadeOut(0.6);
        s.overlay = null;
      }

      rig.frame(Math.min(dt, 0.05));
      settle(dt);
    } else {
      // Very light breath only when no seated clips — keep it nearly still.
      const breath = Math.sin(t * 0.9) * 0.004;
      if (bones.Spine1) rotateWorld(bones.Spine1, tmp.side, breath);
    }

    // Lean in.
    if (action === "lean" && bones.Spine) rotateWorld(bones.Spine, tmp.side, 0.055 * actionIn);

    // Gaze: hold still unless attending to a lookAt target (no idle sway).
    let yawTarget = 0;
    let pitchTarget = 0;
    if (lookAt && bones.Head) {
      bones.Head.getWorldPosition(tmp.headPos);
      tmp.local.copy(lookAt).sub(tmp.headPos).applyQuaternion(tmp.q.clone().invert());
      yawTarget = THREE.MathUtils.clamp(Math.atan2(tmp.local.x, tmp.local.z) * 0.75, -0.7, 0.7);
      pitchTarget = THREE.MathUtils.clamp(
        Math.atan2(tmp.local.y, Math.hypot(tmp.local.x, tmp.local.z)) * 0.6,
        -0.25,
        0.2,
      );
    }
    if (action === "write" || action === "lookDown" || action === "phone") {
      pitchTarget = -0.35;
      yawTarget *= 0.2;
    }
    // Slow, eased head turns read as attention; fast ones read as twitching.
    s.yaw = THREE.MathUtils.damp(s.yaw, yawTarget, 1.8, dt);
    s.pitch = THREE.MathUtils.damp(s.pitch, pitchTarget, 1.8, dt);
    let nod = 0;
    let shake = 0;
    if (action === "nod" && !animated) nod = Math.sin(s.actionT * 7) * 0.08 * Math.max(0, 1 - s.actionT / 2.2);
    if (action === "shake" && !animated) shake = Math.sin(s.actionT * 8) * 0.1 * Math.max(0, 1 - s.actionT / 2);
    const talkNod = s.speakT * (Math.sin(t * 1.4) * 0.012);
    if (bones.Neck) {
      rotateWorld(bones.Neck, tmp.up, s.yaw * 0.4);
      rotateWorld(bones.Neck, tmp.side, -s.pitch * 0.35);
    }
    if (bones.Head) {
      rotateWorld(bones.Head, tmp.up, s.yaw * 0.6 + shake);
      rotateWorld(bones.Head, tmp.side, -(s.pitch * 0.65) - nod - talkNod);
    }

    // Sparse, tiny saccades — frequent eye jitter reads as nervous/undead.
    s.saccadeAt -= dt;
    if (s.saccadeAt <= 0) {
      s.saccade.set((Math.random() - 0.5) * 0.02, (Math.random() - 0.5) * 0.012);
      s.saccadeAt = 2.8 + Math.random() * 3.5;
    }
    s.eyeYaw = THREE.MathUtils.damp(
      s.eyeYaw,
      THREE.MathUtils.clamp(yawTarget - s.yaw, -0.3, 0.3) + s.saccade.x,
      10,
      dt,
    );
    s.eyePitch = THREE.MathUtils.damp(
      s.eyePitch,
      THREE.MathUtils.clamp(pitchTarget - s.pitch, -0.2, 0.2) + s.saccade.y,
      10,
      dt,
    );
    for (const key of ["LEye", "REye"] as const) {
      const eye = bones[key];
      if (!eye || !rest[key]) continue;
      eye.quaternion.copy(rest[key]);
      rotateWorld(eye, tmp.up, s.eyeYaw);
      rotateWorld(eye, tmp.side, -s.eyePitch);
    }

    // Keep forearms and fingers above the tabletop in every shot.
    if (sitting) poseSeatedArms(g, bones, t, s.speakT, action === "write");

    // Face: blink, mood, visemes.
    s.blinkAt -= dt;
    if (s.blinkAt <= 0) {
      s.blink = 1;
      s.blinkAt = 2 + ((t * 7.3) % 4);
    }
    s.blink = Math.max(0, s.blink - dt * 7);
    const blinkW = s.blink > 0.5 ? (1 - s.blink) * 2 : s.blink * 2;
    setMorph(meshes, "eyeBlinkLeft", blinkW);
    setMorph(meshes, "eyeBlinkRight", blinkW);

    const moodShapes = MOOD_SHAPES[mood];
    for (const [k, v] of Object.entries(moodShapes)) setMorph(meshes, k, v * (1 - s.speakT * 0.5));
    setMorph(meshes, "browInnerUp", (moodShapes.browInnerUp ?? 0) + s.speakT * (0.15 + Math.max(0, Math.sin(t * 1.3)) * 0.2));

    for (const k of VISEME_KEYS) {
      s.visemes[k] = THREE.MathUtils.damp(s.visemes[k], s.target[k] ?? 0, 18, dt);
      setMorph(meshes, k, s.visemes[k]);
    }
    setMorph(meshes, "jawOpen", (s.visemes.viseme_aa + s.visemes.viseme_O * 0.6 + s.visemes.viseme_E * 0.3) * 0.25);
  });

  return (
    <group ref={group} position={position} rotation={[0, rotationY, 0]}>
      <group ref={liftRef}>
        <primitive object={prepared.root} />
      </group>
      {chair ? <Chair innerRef={chairRef} /> : null}
    </group>
  );
}

export function preloadAvatars(ids: string[]) {
  for (const id of ids) useGLTF.preload(`/avatars/${id}.glb`);
}
