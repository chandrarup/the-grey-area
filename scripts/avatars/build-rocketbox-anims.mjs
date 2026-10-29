import fs from 'fs';
import { NodeIO } from '@gltf-transform/core';
import { mergeDocuments, prune, resample, dedup } from '@gltf-transform/functions';

const CLIPS = {
  idle: 'sit_chair_idle_neutral_01',
  waiting: 'sit_chair_idle_waiting_01',
  nervousIdle: 'sit_chair_idle_nervous_01',
  thoughtful: 'sit_chair_gestic_thoughtful',
  shrug: 'sit_chair_gestic_shrug_01',
  touchFace: 'sit_chair_idle_touch_face',
  lookAround: 'sit_chair_idle_look_around',
  talk1: 'gestic_talk_neutral_01',
  talk2: 'gestic_talk_neutral_02',
  talkRelaxed: 'gestic_talk_relaxed_01',
  talkNervous: 'gestic_talk_nervous_01',
  talkAngry: 'gestic_talk_angry_01',
  talkAssured: ['gestic_talk_self_assured_01', 'gestic_talk_self-assured_01'],
  nod: 'gestic_listen_accept_01',
  shake: 'gestic_listen_deny_01',
  listen: 'gestic_listen_neutral_01',
  phone: 'cell_phone_textmessage',
};
const LOWER = /^Bip01( (Pelvis|[LR] (Thigh|Calf|Foot|Toe0.*)|Footsteps))?$/;

const io = new NodeIO();
for (const g of ['m', 'f']) {
  const target = new (await import('@gltf-transform/core')).Document();
  target.createBuffer();
  for (const [name, src] of Object.entries(CLIPS)) {
    const files = (Array.isArray(src) ? src : [src]).map((s) => `anim_out/${g}_${s}.glb`);
    const file = files.find((f) => fs.existsSync(f));
    if (!file) {
      console.log('missing', g, name);
      continue;
    }
    const doc = await io.read(file);
    const upperOnly = !src.toString().startsWith('sit_chair');
    for (const anim of doc.getRoot().listAnimations()) {
      anim.setName(name);
      for (const ch of anim.listChannels()) {
        const node = ch.getTargetNode()?.getName() ?? '';
        const path = ch.getTargetPath();
        const keepTranslation = path === 'translation' && node === 'Bip01' && !upperOnly;
        const drop =
          (path === 'translation' && !keepTranslation) ||
          path === 'scale' ||
          node.includes('Footsteps') ||
          (upperOnly && LOWER.test(node));
        if (drop) {
          ch.getSampler()?.dispose();
          ch.dispose();
        }
      }
    }
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
