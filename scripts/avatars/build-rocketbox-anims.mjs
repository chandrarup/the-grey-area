/**
 * Pack Rocketbox mocap into public/avatars/anims_{m,f}.glb for the seated boardroom.
 *
 * Only professional meeting clips are exported. Standing talk/listen/nod/phone
 * sources keep arms or head channels only (no pelvis/spine), so they never tip
 * a sit_chair idle. Re-run from the scratch tree that has anim_out/*.glb:
 *   node scripts/avatars/build-rocketbox-anims.mjs
 */
import fs from 'fs';
import { NodeIO } from '@gltf-transform/core';
import { mergeDocuments, prune, resample, dedup } from '@gltf-transform/functions';

/** Meeting-only set — fidget / angry / shrug stay out of the runtime GLB. */
const CLIPS = {
  idle: 'sit_chair_idle_neutral_01',
  waiting: 'sit_chair_idle_waiting_01',
  thoughtful: 'sit_chair_gestic_thoughtful',
  talk1: 'gestic_talk_neutral_01',
  talk2: 'gestic_talk_neutral_02',
  talkRelaxed: 'gestic_talk_relaxed_01',
  talkNervous: 'gestic_talk_nervous_01',
  talkAssured: ['gestic_talk_self_assured_01', 'gestic_talk_self-assured_01'],
  listen: 'gestic_listen_neutral_01',
  nod: 'gestic_listen_accept_01',
  shake: 'gestic_listen_deny_01',
  phone: 'cell_phone_textmessage',
};

/** Prefer a seated Rocketbox source when present; else fall back to standing. */
const SEATED_ALIASES = {
  talk1: ['sit_chair_gestic_talk_01', 'sit_chair_gestic_talk_neutral_01'],
  talk2: ['sit_chair_gestic_talk_02'],
  talkRelaxed: ['sit_chair_gestic_talk_relaxed_01'],
  talkNervous: ['sit_chair_gestic_talk_nervous_01'],
  talkAssured: ['sit_chair_gestic_talk_self_assured_01'],
  listen: ['sit_chair_gestic_listen_01', 'sit_chair_idle_listen_01'],
  nod: ['sit_chair_gestic_listen_accept_01'],
  shake: ['sit_chair_gestic_listen_deny_01'],
};

const LOWER = /^Bip01( (Pelvis|[LR] (Thigh|Calf|Foot|Toe0.*)|Footsteps))?$/;
const SPINE = /^Bip01( Spine| Spine1| Spine2)?$/;
const HEAD = /^Bip01( Neck| Head)$/;
const ARMS = /Clavicle|UpperArm|Forearm|Hand|Finger/;

/** @typedef {'seated-full' | 'arms' | 'head' | 'arms-pose'} BoneClass */
/** @type {Record<string, BoneClass>} */
const BONE_CLASS = {
  idle: 'seated-full',
  waiting: 'seated-full',
  thoughtful: 'seated-full',
  talk1: 'arms',
  talk2: 'arms',
  talkRelaxed: 'arms',
  talkNervous: 'arms',
  talkAssured: 'arms',
  listen: 'head',
  nod: 'head',
  shake: 'head',
  phone: 'arms-pose',
};

function resolveFile(g, name, src) {
  const seated = SEATED_ALIASES[name] ?? [];
  const candidates = [...seated, ...(Array.isArray(src) ? src : [src])].map(
    (s) => `anim_out/${g}_${s}.glb`,
  );
  return candidates.find((f) => fs.existsSync(f)) ?? null;
}

function keepChannel(node, path, boneClass) {
  if (path === 'scale' || node.includes('Footsteps')) return false;
  if (boneClass === 'seated-full') {
    if (path === 'translation') return node === 'Bip01';
    return path === 'rotation';
  }
  // Standing talk/listen/nod/phone: arms or head only — never pelvis/spine.
  if (path !== 'rotation') return false;
  if (LOWER.test(node) || SPINE.test(node)) return false;
  if (boneClass === 'head') return HEAD.test(node);
  if (boneClass === 'arms' || boneClass === 'arms-pose') return ARMS.test(node);
  return false;
}

const io = new NodeIO();
for (const g of ['m', 'f']) {
  const target = new (await import('@gltf-transform/core')).Document();
  target.createBuffer();
  for (const [name, src] of Object.entries(CLIPS)) {
    const file = resolveFile(g, name, src);
    if (!file) {
      console.log('missing', g, name);
      continue;
    }
    const seatedSource = /sit_chair/.test(file);
    const boneClass = seatedSource && BONE_CLASS[name] !== 'seated-full' && /talk|listen|nod|shake/.test(name)
      ? 'seated-full'
      : BONE_CLASS[name];
    const doc = await io.read(file);
    for (const anim of doc.getRoot().listAnimations()) {
      anim.setName(name);
      for (const ch of anim.listChannels()) {
        const node = ch.getTargetNode()?.getName() ?? '';
        const path = ch.getTargetPath();
        if (!keepChannel(node, path, boneClass)) {
          ch.getSampler()?.dispose();
          ch.dispose();
        }
      }
    }
    console.log(g, name, seatedSource ? 'seated' : 'standing→' + boneClass, file);
    mergeDocuments(target, doc);
  }
  // One shared skeleton: retarget every channel to the first scene's nodes by name, drop the rest.
  const root = target.getRoot();
  const [mainScene, ...extraScenes] = root.listScenes();
  const byName = new Map();
  mainScene.traverse((n) => { if (!byName.has(n.getName())) byName.set(n.getName(), n); });
  for (const anim of root.listAnimations()) {
    for (const ch of anim.listChannels()) {
      const n = byName.get(ch.getTargetNode()?.getName());
      if (n) ch.setTargetNode(n);
      else { ch.getSampler()?.dispose(); ch.dispose(); }
    }
  }
  for (const sc of extraScenes) {
    for (const child of sc.listChildren()) child.traverse((n) => n.dispose());
    sc.dispose();
  }
  for (const b of target.getRoot().listBuffers().slice(1)) {
    for (const a of target.getRoot().listAccessors()) a.setBuffer(target.getRoot().listBuffers()[0]);
    b.dispose();
  }
  await target.transform(resample({ tolerance: 2e-4 }), dedup(), prune({ keepLeaves: false }));
  const out = `final/anims_${g}.glb`;
  await io.write(out, target);
  console.log(out, fs.statSync(out).size, target.getRoot().listAnimations().map((a) => a.getName()).join(','));
}
