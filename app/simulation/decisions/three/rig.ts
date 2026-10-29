import * as THREE from "three";

/**
 * Rocketbox (3ds Max Biped) rig helpers. Bone axes differ per bone, so every
 * pose and motion is expressed in world terms and converted to local space.
 */

export type Bones = Record<string, THREE.Bone>;

export function collectBones(root: THREE.Object3D): Bones {
  const bones: Bones = {};
  root.traverse((o) => {
    if ((o as THREE.Bone).isBone) bones[o.name.replace(/^Bip01/, "").replace(/[\s_]+/g, "")] = o as THREE.Bone;
  });
  return bones;
}

const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _q1 = new THREE.Quaternion();
const _q2 = new THREE.Quaternion();

/** Rotate a bone so the direction to `child` points along `dirWorld`. */
export function aimBone(bone: THREE.Bone, child: THREE.Object3D, dirWorld: THREE.Vector3) {
  bone.updateWorldMatrix(true, true);
  const from = bone.getWorldPosition(_v1);
  const to = child.getWorldPosition(_v2);
  const current = to.sub(from).normalize();
  const delta = _q1.setFromUnitVectors(current, dirWorld.clone().normalize());
  const world = bone.getWorldQuaternion(_q2).premultiply(delta);
  const parentWorld = new THREE.Quaternion();
  bone.parent?.getWorldQuaternion(parentWorld);
  bone.quaternion.copy(parentWorld.invert().multiply(world));
  bone.updateWorldMatrix(false, true);
}

/** Rotate a bone by `angle` about a world-space axis (applied on top of its current pose). */
export function rotateWorld(bone: THREE.Bone, axisWorld: THREE.Vector3, angle: number) {
  const worldQ = new THREE.Quaternion();
  bone.getWorldQuaternion(worldQ);
  const localAxis = axisWorld.clone().applyQuaternion(worldQ.clone().invert()).normalize();
  bone.quaternion.multiply(_q1.setFromAxisAngle(localAxis, angle));
}

/** Snapshot of every bone's local quaternion — the base the animation adds to. */
export function snapshot(bones: Bones) {
  const rest: Record<string, THREE.Quaternion> = {};
  for (const [k, b] of Object.entries(bones)) rest[k] = b.quaternion.clone();
  return rest;
}

export function restore(bones: Bones, rest: Record<string, THREE.Quaternion>) {
  for (const [k, q] of Object.entries(rest)) bones[k]?.quaternion.copy(q);
}

/**
 * Re-aim a mocap clip so its root faces the same way and sits over the same
 * spot as the bind pose (clips were captured facing slightly different
 * directions). Keeps the clip's root height so seated clips sit.
 */
export function normalizeClip(clip: THREE.AnimationClip, root: THREE.Bone, wrapper: THREE.Object3D) {
  const out = clip.clone();
  const name = root.name;
  const qTrack = out.tracks.find((t) => t.name === `${name}.quaternion`);
  const pTrack = out.tracks.find((t) => t.name === `${name}.position`);
  if (!qTrack) return out;
  // Clip.clone() shares keyframe arrays with the cached source clip.
  qTrack.values = qTrack.values.slice();
  if (pTrack) pTrack.values = pTrack.values.slice();

  wrapper.updateWorldMatrix(true, true);
  const wrapperInv = new THREE.Quaternion();
  wrapper.getWorldQuaternion(wrapperInv).invert();
  const parentQ = new THREE.Quaternion();
  root.parent?.getWorldQuaternion(parentQ);
  parentQ.premultiply(wrapperInv); // parent orientation in wrapper space
  const parentInv = parentQ.clone().invert();
  const up = new THREE.Vector3(0, 1, 0).applyQuaternion(parentInv).normalize();
  const fB = new THREE.Vector3(0, 0, 1).applyQuaternion(parentInv);
  fB.sub(up.clone().multiplyScalar(fB.dot(up))).normalize();
  const a = fB.clone().applyQuaternion(root.quaternion.clone().invert());

  const v = qTrack.values;
  const q0 = new THREE.Quaternion(v[0], v[1], v[2], v[3]);
  const f0 = a.clone().applyQuaternion(q0);
  f0.sub(up.clone().multiplyScalar(f0.dot(up))).normalize();
  const angle = Math.atan2(new THREE.Vector3().crossVectors(f0, fB).dot(up), f0.dot(fB));
  const c = new THREE.Quaternion().setFromAxisAngle(up, angle);

  const q = new THREE.Quaternion();
  for (let i = 0; i < v.length; i += 4) {
    q.set(v[i], v[i + 1], v[i + 2], v[i + 3]).premultiply(c);
    v[i] = q.x;
    v[i + 1] = q.y;
    v[i + 2] = q.z;
    v[i + 3] = q.w;
  }
  if (pTrack) {
    const pv = pTrack.values;
    const p = new THREE.Vector3();
    const first = new THREE.Vector3(pv[0], pv[1], pv[2]).applyQuaternion(c);
    const d = first.sub(root.position);
    d.sub(up.clone().multiplyScalar(d.dot(up)));
    for (let i = 0; i < pv.length; i += 3) {
      p.set(pv[i], pv[i + 1], pv[i + 2]).applyQuaternion(c).sub(d);
      pv[i] = p.x;
      pv[i + 1] = p.y;
      pv[i + 2] = p.z;
    }
  }
  return out;
}

/**
 * Pose out of T-pose. `forward` is the character's facing direction in world
 * space; `sitting` bends hips and knees and rests the forearms forward.
 */
export function applyPose(
  root: THREE.Object3D,
  bones: Bones,
  forward: THREE.Vector3,
  sitting: boolean,
) {
  root.updateWorldMatrix(true, true);
  const down = new THREE.Vector3(0, -1, 0);
  const side = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), forward).normalize(); // character's left

  const arm = (s: "L" | "R") => {
    const sign = s === "L" ? 1 : -1;
    const upper = bones[`${s}UpperArm`];
    const fore = bones[`${s}Forearm`];
    const hand = bones[`${s}Hand`];
    if (!upper || !fore || !hand) return;
    // Upper arm hangs down, slightly forward and out.
    aimBone(upper, fore, down.clone().addScaledVector(forward, sitting ? 0.35 : 0.08).addScaledVector(side, sign * 0.12));
    // Forearm: forward onto the table when sitting, slight bend standing.
    aimBone(
      fore,
      hand,
      sitting
        ? forward.clone().addScaledVector(down, 0.25).addScaledVector(side, -sign * 0.25)
        : down.clone().addScaledVector(forward, 0.25),
    );
    const finger = bones[`${s}Finger2`] ?? bones[`${s}Finger1`];
    if (finger) aimBone(hand, finger, sitting ? forward.clone().addScaledVector(down, 0.35).addScaledVector(side, -sign * 0.2) : down.clone().addScaledVector(forward, 0.15));
  };
  arm("L");
  arm("R");

  if (sitting) {
    for (const s of ["L", "R"] as const) {
      const thigh = bones[`${s}Thigh`];
      const calf = bones[`${s}Calf`];
      const foot = bones[`${s}Foot`];
      if (thigh && calf) aimBone(thigh, calf, forward.clone().addScaledVector(down, 0.12));
      if (calf && foot) aimBone(calf, foot, down.clone().addScaledVector(forward, 0.12));
    }
  }
  root.updateWorldMatrix(true, true);
}
