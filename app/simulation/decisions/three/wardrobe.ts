import * as THREE from "three";
/** An opaque high-neck base layer and full-length navy coverage on Priya's existing
 * skinned body. Coverage travels with the SAME skin weights: no floating clothing mesh.
 * Head and hands retain their original materials. This edits shader/geometry data, not the asset texture.
 */
export function applyCoveredWardrobe(root: THREE.Object3D) {
  root.updateMatrixWorld(true);
  root.traverse((obj) => {
    const mesh = obj as THREE.SkinnedMesh;
    if (!mesh.isSkinnedMesh) return;
    const source=mesh.material as THREE.MeshStandardMaterial;
    if (!/body|head/.test(source?.name ?? "")) return;
    const geometry=mesh.geometry.clone();
    const positions=geometry.getAttribute("position"), joints=geometry.getAttribute("skinIndex"), weights=geometry.getAttribute("skinWeight");
    if(!positions || !joints || !weights) return;
    const neck=mesh.skeleton.bones.find(b=>/Neck$/.test(b.name));
    const pelvis=mesh.skeleton.bones.find(b=>/Pelvis$/.test(b.name));
    if(!neck || !pelvis) return;
    const neckPos=mesh.worldToLocal(neck.getWorldPosition(new THREE.Vector3()));
    const hipPos=mesh.worldToLocal(pelvis.getWorldPosition(new THREE.Vector3()));
    const up=neckPos.clone().sub(hipPos).normalize();
    const neckHeight=neckPos.clone().sub(hipPos).dot(up);
    mesh.skeleton.update();
    const coverage=new Float32Array(positions.count);
    for(let i=0;i<positions.count;i++) {
      const pos=mesh.getVertexPosition(i,new THREE.Vector3());
      const height=pos.sub(hipPos).dot(up);
      let handWeight=0;
      for(let k=0;k<4;k++) {
        const joint=mesh.skeleton.bones[joints.getComponent(i,k)];
        if(joint && /Hand|Finger/.test(joint.name)) handWeight+=weights.getComponent(i,k);
      }
      coverage[i]=height < neckHeight*.985 && handWeight < .25 ? 1 : 0;
    }
    geometry.setAttribute("clothingCoverage",new THREE.BufferAttribute(coverage,1));
    mesh.geometry=geometry;
    const material=source.clone();
    material.opacity=1; material.transparent=false; material.alphaTest=0; material.side=THREE.DoubleSide;
    material.roughness=.85;
    material.onBeforeCompile=(shader)=>{
      shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nattribute float clothingCoverage;\nvarying float vClothingCoverage;').replace('#include <begin_vertex>','#include <begin_vertex>\nvClothingCoverage = clothingCoverage;');
      shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying float vClothingCoverage;').replace('#include <map_fragment>','#include <map_fragment>\ndiffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.025, 0.042, 0.065), smoothstep(0.25, 0.7, vClothingCoverage));');
    };
    material.customProgramCacheKey=()=>"covered-navy-wardrobe-v1";
    mesh.material=material;
  });
}
