import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { createRigFrame, rotateWorld } from "./rig";

function frozenRig() {
  const root = new THREE.Group();
  const head = new THREE.Bone();
  head.name = "Head";
  root.add(head);
  const mixer = new THREE.AnimationMixer(root);
  const clip = new THREE.AnimationClip("idle", 1, [
    new THREE.QuaternionKeyframeTrack(
      "Head.quaternion",
      [0, 1],
      [0, 0, 0, 1, 0, 0, 0, 1],
    ),
  ]);
  const action = mixer.clipAction(clip).play();
  action.timeScale = 0;
  return { head, mixer };
}

test("a held seated animation does not accumulate procedural head turns over 600 frames", () => {
  const { head, mixer } = frozenRig();
  const frame = createRigFrame({ Head: head }, mixer);
  const up = new THREE.Vector3(0, 1, 0);
  const expected = new THREE.Quaternion().setFromAxisAngle(up, 0.12);
  for (let i = 0; i < 600; i++) {
    frame(1 / 60);
    rotateWorld(head, up, 0.12);
    assert.ok(
      head.quaternion.angleTo(expected) < 1e-6,
      `gaze accumulated at frame ${i}`,
    );
  }
  frame(1 / 60);
  assert.ok(
    head.quaternion.angleTo(new THREE.Quaternion()) < 1e-6,
    "removing gaze restores the seated pose",
  );
});

test("a changing animation remains live underneath procedural motion", () => {
  const { head, mixer } = frozenRig();
  mixer.stopAllAction();
  const target = new THREE.Quaternion().setFromAxisAngle(
    new THREE.Vector3(1, 0, 0),
    0.4,
  );
  mixer
    .clipAction(
      new THREE.AnimationClip("nod", 1, [
        new THREE.QuaternionKeyframeTrack(
          "Head.quaternion",
          [0, 1],
          [0, 0, 0, 1, ...target.toArray()],
        ),
      ]),
    )
    .play();
  const frame = createRigFrame({ Head: head }, mixer);
  for (let i = 1; i <= 30; i++) {
    frame(1 / 60);
    const expected = new THREE.Quaternion().slerp(target, i / 60);
    assert.ok(head.quaternion.angleTo(expected) < 1e-6);
    rotateWorld(head, new THREE.Vector3(0, 1, 0), 0.1);
  }
});
