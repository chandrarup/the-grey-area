import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {readFileSync} from 'node:fs';
import {clipLayerFor,boneFilterFor} from './avatar-motion';
import {poseSeatedArms} from './seated-arms';
import {prepare} from './avatar';
import {normalizeClip} from './rig';
async function load(path:string){
 const src=readFileSync(path); const size=src.readUInt32LE(12);const j=JSON.parse(src.subarray(20,20+size).toString());
 delete j.images;delete j.textures;j.materials=(j.materials??[]).map((m:{name:string})=>({name:m.name}));

 let b=Buffer.from(JSON.stringify(j));b=Buffer.concat([b,Buffer.alloc((4-b.length%4)%4,32)]);
 const tail=src.subarray(20+size);const out=Buffer.alloc(20+b.length+tail.length);out.writeUInt32LE(0x46546c67,0);out.writeUInt32LE(2,4);out.writeUInt32LE(out.length,8);out.writeUInt32LE(b.length,12);out.writeUInt32LE(0x4e4f534a,16);b.copy(out,20);tail.copy(out,20+b.length);
 return new GLTFLoader().parseAsync(out.buffer.slice(out.byteOffset,out.byteOffset+out.byteLength),'');
}
test('cast arm envelopes stay above the table through sampled gestures', async()=>{
 let collisions=0;
 for(const id of ['marcus','david','tom','priya','eleanor']){
  const model=await load(`public/avatars/${id}.glb`);const anim=await load(`public/avatars/anims_${['priya','eleanor'].includes(id)?'f':'m'}.glb`);
  const p=prepare(model.scene,1.76,true,true,id);const root=Object.values(p.bones).find(b=>b.name==='Bip01')!;
  if(id==='priya') p.root.traverse((obj) => {
    const mesh=obj as THREE.SkinnedMesh;
    if(!mesh.isSkinnedMesh || !(mesh.material as THREE.Material).name.includes('head'))return;
    const cover=mesh.geometry.getAttribute('clothingCoverage');
    assert.ok(cover,'high-neck coverage must be present');
    const covered=Array.from(cover.array).reduce((a,b)=>a+b,0);
    assert.ok(covered>0 && covered<cover.count*.2,'cover the neckline, preserve the face');
  });
  const mix=new THREE.AnimationMixer(p.root); const idle=mix.clipAction((root ? normalizeClip(anim.animations.find(a=>a.name==='idle')!,root,p.root) : anim.animations.find(a=>a.name==='idle')!));idle.play();idle.time=.4;mix.update(0);
  p.root.position.y += .6-p.bones.Pelvis.getWorldPosition(new THREE.Vector3()).y;p.root.updateMatrixWorld(true);
  for(const name of ['talk1','talkNervous','talkAssured','phone']) {
   const original=anim.animations.find(a=>a.name===name);if(!original)continue;
   const layer=clipLayerFor(name);const filter=boneFilterFor(layer)!;
   let clip=new THREE.AnimationClip(name,original.duration,original.tracks.filter(t=>filter.test(t.name.split('.')[0]) && t.name.endsWith('.quaternion')).map(t=>t.clone()));
   if(layer.additive)clip=THREE.AnimationUtils.makeClipAdditive(clip);
   const overlay=mix.clipAction(clip).setEffectiveWeight(layer.weight).play();
   let hits=0;
   for(let n=0;n<120;n++) {
    idle.time=.4;overlay.time=n/120*clip.duration;mix.update(0);p.root.updateMatrixWorld(true);
    const seat = new THREE.Group(); seat.add(p.root); poseSeatedArms(seat,p.bones,n/30,1);
    for(const side of ['L','R']) {
     const pts=['Forearm','Hand','Finger2'].map(k=>p.bones[side+k]?.getWorldPosition(new THREE.Vector3())).filter(Boolean) as THREE.Vector3[];
     for(let i=0;i<pts.length-1;i++)for(let k=0;k<=10;k++){const v=pts[i].clone().lerp(pts[i+1],k/10);if(v.z>.24 && v.y>.65 && v.y<.80)hits++;}
    }
   }
   collisions+=hits;overlay.stop();
  }
 }
 assert.equal(collisions,0,'forearms and fingers must not enter the tabletop');
});
