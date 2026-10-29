"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import { applyPose, collectBones, normalizeClip, restore, rotateWorld, snapshot, type Bones } from "./rig";
import { visemeWeightsNow } from "./speech";

export type AvatarAction = "write" | "lean" | "phone" | "nod" | "shake" | "lookDown" | null;
export type AvatarMood = "neutral" | "tense" | "warm" | "guarded";

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
const IDLE_VARIANTS: Record<string, string[]> = {
  default: ["waiting", "thoughtful"],
};

/*
 * Talk and listen clips were captured standing. Played as full poses they pull
 * the torso out of the seated idle (the body tips back through the chair), so
 * they are reduced to small additive deltas on the bones listed here.
 */
const ARMS = /(Clavicle|UpperArm|Forearm|Hand|Finger)/;
const LAYERED: { match: RegExp; bones: RegExp; weight: number; additive: boolean }[] = [
  { match: /^talk/, bones: ARMS, weight: 0.4, additive: true },
  { match: /^(nod|shake)$/, bones: /(Neck|Head)/, weight: 0.7, additive: true },
  { match: /^phone$/, bones: ARMS, weight: 1, additive: false },
];

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

function prepare(source: THREE.Object3D, height: number, sitting: boolean, animated: boolean): Prepared {
  const model = cloneSkinned(source) as THREE.Group;
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
    model.position.y -= pelvisY - 0.52;
    model.position.z -= 0.08;
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
}) {
  const { scene } = useGLTF(`/avatars/${id}.glb`);
  const { animations } = useGLTF(`/avatars/anims_${GENDER[id] ?? "m"}.glb`);
  const animated = sitting && animations.length > 0;
  const prepared = useMemo(() => prepare(scene, height, sitting, animated), [scene, height, sitting, animated]);
  const rig = useMemo(() => {
    const mixer = new THREE.AnimationMixer(prepared.root);
    const root = Object.values(prepared.bones).find((b) => b.name === "Bip01");
    const clips = new Map(
      animations.map((a) => {
        const layer = LAYERED.find((l) => l.match.test(a.name));
        if (layer) return [a.name, layeredClip(a, layer.bones, layer.additive)] as const;
        return [a.name, root ? normalizeClip(a, root, prepared.root) : a] as const;
      }),
    );
    const act = (name: string) => {
      const clip = clips.get(name);
      return clip ? mixer.clipAction(clip) : null;
    };
    return { mixer, act };
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
    speakT: 0,
    seed,
    base: null as THREE.AnimationAction | null,
    variantAt: 15 + (seed % 10),
    talk: null as THREE.AnimationAction | null,
    talkIdx: 0,
    reaction: null as THREE.AnimationAction | null,
    lift: 0,
    seat: null as THREE.Vector3 | null,
    leanFix: 0,
    eyeYaw: 0,
    eyePitch: 0,
    saccadeAt: 0.5,
    saccade: new THREE.Vector2(),
  });

  useEffect(() => {
    if (!animated) return;
    const idle = rig.act("idle");
    if (!idle) return;
    idle.time = (seed * 3.7) % (idle.getClip().duration || 1);
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
      // Idle variations on the base layer.
      s.variantAt -= dt;
      if (s.variantAt <= 0 && s.speakT < 0.1 && s.base) {
        const pool = IDLE_VARIANTS[id] ?? IDLE_VARIANTS.default;
        const next = rig.act(pool[Math.floor((t * 13.1) % pool.length)]) ?? rig.act("idle");
        const idle = rig.act("idle");
        if (next && idle) {
          const target = s.base === idle ? next : idle;
          target.reset().setLoop(THREE.LoopRepeat, Infinity).fadeIn(1.6).play();
          s.base.fadeOut(1.6);
          s.base = target;
          s.variantAt = target === idle ? 20 + ((t * 7) % 14) : Math.min(8, target.getClip().duration - 1.6);
        }
      }
      // Talking gestures: small additive arm movement over the seated pose.
      const idleBase = rig.act("idle");
      if (speaking && s.base && idleBase && s.base !== idleBase) {
        idleBase.reset().setLoop(THREE.LoopRepeat, Infinity).fadeIn(0.8).play();
        s.base.fadeOut(0.8);
        s.base = idleBase;
        s.variantAt = 20 + ((t * 7) % 14);
      }
      if (speaking && !s.talk) {
        const names = TALK[id] ?? ["talk1"];
        const talk = rig.act(names[s.talkIdx++ % names.length]);
        if (talk) {
          talk.reset();
          talk.time = (t * 2.3) % Math.max(1, talk.getClip().duration - 4);
          talk.setEffectiveWeight(LAYERED[0].weight).fadeIn(0.9).play();
          s.talk = talk;
        }
      } else if (!speaking && s.talk && s.speakT < 0.4) {
        s.talk.fadeOut(1.2);
        s.talk = null;
      }
      // Reactions.
      if (s.actionT === dt) {
        s.reaction?.fadeOut(0.4);
        s.reaction = null;
        const clipName = action === "nod" ? "nod" : action === "shake" ? "shake" : action === "phone" ? "phone" : null;
        const r = clipName ? rig.act(clipName) : null;
        if (r) {
          r.reset().setLoop(action === "phone" ? THREE.LoopRepeat : THREE.LoopOnce, Infinity);
          r.clampWhenFinished = false;
          r.setEffectiveWeight(LAYERED.find((l) => l.match.test(clipName ?? ""))?.weight ?? 1)
            .fadeIn(0.5)
            .play();
          s.reaction = r;
        }
      }
      rig.mixer.update(dt);
      settle(dt);
    } else {
      // Breathing.
      const breath = Math.sin(t * 1.7) * 0.012;
      if (bones.Spine1) rotateWorld(bones.Spine1, tmp.side, breath);
      if (bones.Spine2) rotateWorld(bones.Spine2, tmp.side, breath * 0.6);
    }

    // Lean in.
    if (action === "lean" && bones.Spine) rotateWorld(bones.Spine, tmp.side, 0.16 * actionIn);

    // Gaze: yaw/pitch toward lookAt, in the avatar's own frame.
    let yawTarget = Math.sin(t * 0.23) * 0.03;
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
    const talkNod = (animated ? 0.25 : 1) * s.speakT * (Math.sin(t * 1.7) * 0.025 + Math.sin(t * 3.9) * 0.008);
    if (bones.Neck) {
      rotateWorld(bones.Neck, tmp.up, s.yaw * 0.4);
      rotateWorld(bones.Neck, tmp.side, -s.pitch * 0.35);
    }
    if (bones.Head) {
      rotateWorld(bones.Head, tmp.up, s.yaw * 0.6 + shake);
      rotateWorld(bones.Head, tmp.side, -(s.pitch * 0.65) - nod - talkNod);
    }

    // Eyes lead the head to a new target and make small saccades; a fixed stare reads as lifeless.
    s.saccadeAt -= dt;
    if (s.saccadeAt <= 0) {
      s.saccade.set(Math.sin(t * 12.9) * 0.05, Math.sin(t * 7.3) * 0.025);
      s.saccadeAt = 0.7 + ((t * 3.1) % 2.4);
    }
    s.eyeYaw = THREE.MathUtils.damp(s.eyeYaw, THREE.MathUtils.clamp(yawTarget - s.yaw, -0.3, 0.3) + s.saccade.x, 22, dt);
    s.eyePitch = THREE.MathUtils.damp(s.eyePitch, THREE.MathUtils.clamp(pitchTarget - s.pitch, -0.2, 0.2) + s.saccade.y, 22, dt);
    for (const key of ["LEye", "REye"] as const) {
      const eye = bones[key];
      if (!eye || !rest[key]) continue;
      eye.quaternion.copy(rest[key]);
      rotateWorld(eye, tmp.up, s.eyeYaw);
      rotateWorld(eye, tmp.side, -s.eyePitch);
    }

    // Arms: talking gesture, writing, phone.
    const R = { upper: bones.RUpperArm, fore: bones.RForearm, hand: bones.RHand };
    const L = { upper: bones.LUpperArm, fore: bones.LForearm };
    if (!animated && s.speakT > 0.01) {
      const k = s.speakT;
      if (R.fore) rotateWorld(R.fore, tmp.side, -(0.18 + Math.sin(t * 2.6) * 0.12) * k);
      if (R.upper) rotateWorld(R.upper, tmp.fwd, Math.sin(t * 1.9) * 0.05 * k);
      if (L.fore) rotateWorld(L.fore, tmp.side, -(0.08 + Math.sin(t * 2.1 + 1) * 0.07) * k);
    }
    if (action === "write") {
      if (R.upper) rotateWorld(R.upper, tmp.side, 0.12 * actionIn);
      if (R.hand) rotateWorld(R.hand, tmp.up, Math.sin(t * 9) * 0.25 * actionIn);
      if (R.fore) rotateWorld(R.fore, tmp.up, Math.sin(t * 4.5) * 0.06 * actionIn);
    }
    if (action === "phone" && !animated) {
      if (R.fore) rotateWorld(R.fore, tmp.side, -0.75 * actionIn);
      if (R.hand) rotateWorld(R.hand, tmp.side, -0.5 * actionIn);
    }

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
