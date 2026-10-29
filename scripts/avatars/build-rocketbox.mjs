/**
 * Converts a Microsoft Rocketbox avatar (MIT) into the web GLB used by the
 * solo player: textures resized/embedded, visemes + ARKit shapes named,
 * other blendshapes dropped. Run from a scratch directory that contains:
 *   src/<Avatar>/Export/<Avatar>_facial.fbx and src/<Avatar>/Textures/*.tga
 *   out/<Avatar>.glb  (from: FBX2glTF --binary --blend-shape-normals --input ... --output out/<Avatar>)
 * Needs: npm i @gltf-transform/core @gltf-transform/extensions @gltf-transform/functions fbx-parser
 *        Python with Pillow (set PYTHON=/path/to/python if not on PATH).
 * Usage: node build-rocketbox.mjs Business_Male_01 final/marcus.glb
 * Cast mapping: marcus=Business_Male_01, david=Business_Male_05, tom=Business_Male_07,
 *               priya=Business_Female_04, eleanor=Business_Female_02
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFileSync } from 'child_process';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { prune, dedup, quantize } from '@gltf-transform/functions';
import { parseBinary } from 'fbx-parser';

const [, , charDir, outPath] = process.argv;
const fbxPath = `src/${charDir}/Export/${charDir}_facial.fbx`;
const texDir = `src/${charDir}/Textures`;

// 1. Morph target names, in FBX channel order.
const fbx = parseBinary(fs.readFileSync(fbxPath));
const objects = fbx.find((n) => n.name === 'Objects');
const rawNames = objects.nodes
  .filter((n) => n.name === 'Deformer' && n.props[2] === 'BlendShapeChannel')
  .map((n) => String(n.props[1]).split('\u0000')[0].replace(/^SubDeformer::blendShape\d+\./, ''));

const VISEMES = ['sil', 'PP', 'FF', 'TH', 'DD', 'kk', 'CH', 'SS', 'nn', 'RR', 'aa', 'E', 'I', 'O', 'U'];
function rename(n) {
  let m = n.match(/^AA_VI_(\d\d)_/);
  if (m) return `viseme_${VISEMES[Number(m[1])]}`;
  m = n.match(/^AK_\d\d_(\w+)$/);
  if (m) return m[1][0].toLowerCase() + m[1].slice(1);
  return null;
}
const keep = rawNames.map(rename);

// 2. Textures: TGA -> resized JPG/PNG via Pillow.
function convert(tga, alpha) {
  const out = path.join(os.tmpdir(), `rb_${Math.random().toString(36).slice(2)}.${alpha ? 'png' : 'jpg'}`);
  execFileSync(process.env.PYTHON ?? 'python3', ['-c', `
from PIL import Image
im = Image.open(${JSON.stringify(tga)})
im = im.convert('RGBA' if ${alpha ? 'True' : 'False'} else 'RGB').resize((1024, 1024), Image.LANCZOS)
im.save(${JSON.stringify(out)}, ${alpha ? "'PNG', optimize=True" : "'JPEG', quality=86"})
`]);
  const buf = fs.readFileSync(out);
  fs.unlinkSync(out);
  return buf;
}

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(`out/${charDir}.glb`);
const root = doc.getRoot();

for (const t of root.listTextures()) t.dispose();
for (const mat of root.listMaterials()) {
  const name = mat.getName(); // e.g. m005_body, f015_glasses
  const isAlpha = /opacity|glasses/.test(name);
  const colorFile = fs.existsSync(`${texDir}/${name}_color.tga`)
    ? `${texDir}/${name}_color.tga`
    : `${texDir}/${name}_opacity_color.tga`;
  if (fs.existsSync(colorFile)) {
    const tex = doc
      .createTexture(`${name}_color`)
      .setImage(convert(colorFile, isAlpha))
      .setMimeType(isAlpha ? 'image/png' : 'image/jpeg');
    mat.setBaseColorTexture(tex);
  }
  const normalFile = `${texDir}/${name}_normal.tga`;
  if (fs.existsSync(normalFile) && !isAlpha) {
    const tex = doc.createTexture(`${name}_normal`).setImage(convert(normalFile, false)).setMimeType('image/jpeg');
    mat.setNormalTexture(tex);
  } else {
    mat.setNormalTexture(null);
  }
  mat.setMetallicFactor(0).setRoughnessFactor(name.includes('head') ? 0.55 : 0.75);
  if (isAlpha) {
    mat.setAlphaMode(name.includes('glasses') ? 'BLEND' : 'MASK').setAlphaCutoff(0.4).setDoubleSided(true);
  }
}

// 3. Keep only visemes + ARKit shapes, named.
for (const mesh of root.listMeshes()) {
  const weights = mesh.getWeights();
  const names = [];
  const newWeights = [];
  for (const prim of mesh.listPrimitives()) {
    const targets = prim.listTargets();
    targets.forEach((t, i) => {
      if (!keep[i]) prim.removeTarget(t);
      else t.setName(keep[i]);
    });
  }
  keep.forEach((n, i) => {
    if (n) {
      names.push(n);
      newWeights.push(weights[i] ?? 0);
    }
  });
  mesh.setWeights(newWeights);
  mesh.setExtras({ ...(mesh.getExtras() || {}), targetNames: names });
}

for (const a of root.listAnimations()) a.dispose();

await doc.transform(prune(), dedup(), quantize({ quantizePosition: 14, quantizeNormal: 10 }));
await io.write(outPath, doc);
console.log(outPath, fs.statSync(outPath).size, 'targets kept', keep.filter(Boolean).length, 'of', rawNames.length);
