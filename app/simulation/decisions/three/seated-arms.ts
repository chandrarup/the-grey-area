import * as THREE from "three";
import { aimBone, type Bones } from "./rig";

/** Two-bone IK in world space. The wrist target stays above the shared table surface. */
function reach(upper: THREE.Bone, fore: THREE.Bone, hand: THREE.Bone, target: THREE.Vector3, pole: THREE.Vector3) {
  const shoulder = upper.getWorldPosition(new THREE.Vector3());
  const elbow = fore.getWorldPosition(new THREE.Vector3());
  const wrist = hand.getWorldPosition(new THREE.Vector3());
  const a = shoulder.distanceTo(elbow), b = elbow.distanceTo(wrist);
  const direction = target.clone().sub(shoulder);
  const distance = THREE.MathUtils.clamp(direction.length(), Math.abs(a-b)+.001, a+b-.001);
  direction.normalize();
  const along = (a*a-b*b+distance*distance)/(2*distance);
  const bend = pole.clone().addScaledVector(direction,-pole.dot(direction)).normalize();
  const wantedElbow = shoulder.clone().addScaledVector(direction,along).addScaledVector(bend,Math.sqrt(Math.max(0,a*a-along*along)));
  aimBone(upper,fore,wantedElbow.sub(shoulder));
  aimBone(fore,hand,target.clone().sub(fore.getWorldPosition(new THREE.Vector3())));
}

/** Local +Z faces the table. Hands rest at 83 cm, above its 75.25 cm surface.
 * Apply after animation, torso settling and gaze. No imported arm clip can bypass this envelope.
 */
export function poseSeatedArms(root: THREE.Object3D, bones: Bones, time: number, speaking: number, writing = false) {
  root.updateWorldMatrix(true,true);
  const rotation = root.getWorldQuaternion(new THREE.Quaternion());
  for (const side of ["L","R"] as const) {
    const upper=bones[`${side}UpperArm`], fore=bones[`${side}Forearm`], hand=bones[`${side}Hand`];
    if (!upper || !fore || !hand) continue;
    const sign=side === "L" ? 1 : -1;
    const gesture = speaking * Math.max(0,Math.sin(time*1.4+(side === "L" ? 1.8 : 0)));
    const x=sign*(.19+gesture*.02);
    const target=root.localToWorld(new THREE.Vector3(x,.83+gesture*.065,.38+(writing ? .008*Math.sin(time*2) : 0)));
    const pole=new THREE.Vector3(sign*.3,-1,-.15).applyQuaternion(rotation);
    reach(upper,fore,hand,target,pole);
    const finger=bones[`${side}Finger2`] ?? bones[`${side}Finger1`];
    if(finger) aimBone(hand,finger,new THREE.Vector3(-sign*.15,-.04,1).applyQuaternion(rotation));
  }
}
