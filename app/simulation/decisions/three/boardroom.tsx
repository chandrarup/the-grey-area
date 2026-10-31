"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, PerspectiveCamera, RenderTexture, RoundedBox, Text } from "@react-three/drei";
import type { StageMood } from "@/lib/case/types";
import { Avatar, Chair, type AvatarAction, type AvatarMood } from "./avatar";
import { useReducedStageMotion } from "./stage-canvas";
import { castMoodForStage } from "./avatar-motion";

export const PLAYER = new THREE.Vector3(0, 1.34, 3.05);

export type Direction = {
  speakerId: string | null; // cast id, "you", or null
  attention: "speaker" | "you";
  actions: Record<string, AvatarAction>;
};

const SEATS: { pos: [number, number, number]; rot: number }[] = [
  { pos: [0.98, 0, 0.45], rot: -Math.PI / 2 },
  { pos: [-0.98, 0, 0.45], rot: Math.PI / 2 },
  { pos: [0.98, 0, -0.85], rot: -Math.PI / 2 },
  { pos: [-0.98, 0, -0.85], rot: Math.PI / 2 },
];

const MOODS: Record<AvatarMood, AvatarMood> = { neutral: "neutral", tense: "tense", warm: "warm", guarded: "guarded" };
export const CAST_MOOD: Record<string, AvatarMood> = {
  marcus: MOODS.warm,
  david: MOODS.guarded,
  tom: MOODS.tense,
  priya: MOODS.neutral,
  eleanor: MOODS.guarded,
};

function seatMood(id: string, stageMood: StageMood): AvatarMood {
  return castMoodForStage(CAST_MOOD[id] ?? "neutral", stageMood);
}

const LIGHT: Record<StageMood, { sun: string; sunI: number; amb: number; sky: [string, string]; ceiling: number }> = {
  morning: { sun: "#fff1dc", sunI: 2.0, amb: 0.65, sky: ["#bcd3ea", "#f4e6d2"], ceiling: 0.6 },
  evening: { sun: "#ffad6b", sunI: 1.6, amb: 0.38, sky: ["#4b4a7a", "#f2a36b"], ceiling: 0.9 },
  night: { sun: "#8fa3c8", sunI: 0.25, amb: 0.18, sky: ["#05070d", "#1a2236"], ceiling: 1.4 },
};

const SCREEN = { pos: new THREE.Vector3(0, 1.62, -3.35), w: 3.0, h: 1.69 };

function gradientTexture(top: string, bottom: string) {
  const c = document.createElement("canvas");
  c.width = 4;
  c.height = 256;
  const g = c.getContext("2d")!;
  const grad = g.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, top);
  grad.addColorStop(1, bottom);
  g.fillStyle = grad;
  g.fillRect(0, 0, 4, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function City({ mood }: { mood: StageMood }) {
  const sky = useMemo(() => gradientTexture(LIGHT[mood].sky[0], LIGHT[mood].sky[1]), [mood]);
  useEffect(() => () => sky.dispose(), [sky]);
  const buildings = useMemo(() => {
    const out: { x: number; z: number; w: number; h: number; d: number }[] = [];
    let seed = 7;
    const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    for (let i = 0; i < 26; i++) {
      out.push({ x: -9 - rnd() * 14, z: -16 + i * 1.4 + rnd(), w: 1 + rnd() * 2.2, h: 4 + rnd() * 18, d: 1 + rnd() * 2 });
    }
    return out;
  }, []);
  const night = mood === "night";
  return (
    <group>
      <mesh position={[-26, 6, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[90, 40]} />
        <meshBasicMaterial map={sky} toneMapped={false} />
      </mesh>
      {buildings.map((b, i) => (
        <mesh key={i} position={[b.x, b.h / 2 - 6, b.z]}>
          <boxGeometry args={[b.w, b.h, b.d]} />
          <meshStandardMaterial
            color={night ? "#0c1220" : mood === "evening" ? "#3a3550" : "#9aa7b6"}
            emissive={night ? "#e8c27a" : "#000000"}
            emissiveIntensity={night ? 0.08 + (i % 3) * 0.05 : 0}
            roughness={0.9}
          />
        </mesh>
      ))}
    </group>
  );
}

function Laptop({ position, rotation }: { position: [number, number, number]; rotation: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh castShadow>
        <boxGeometry args={[0.32, 0.012, 0.22]} />
        <meshStandardMaterial color="#b8bcc2" metalness={0.7} roughness={0.35} />
      </mesh>
      <group position={[0, 0.006, -0.11]} rotation={[-0.32, 0, 0]}>
        <mesh position={[0, 0.105, 0]} castShadow>
          <boxGeometry args={[0.32, 0.21, 0.008]} />
          <meshStandardMaterial color="#b8bcc2" metalness={0.7} roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.105, 0.0045]}>
          <planeGeometry args={[0.29, 0.18]} />
          <meshStandardMaterial color="#1b2a44" emissive="#4a6fa8" emissiveIntensity={0.5} />
        </mesh>
      </group>
    </group>
  );
}

function Cup({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <cylinderGeometry args={[0.04, 0.034, 0.11, 20]} />
        <meshStandardMaterial color="#f2efe8" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.056, 0]}>
        <cylinderGeometry args={[0.036, 0.036, 0.004, 20]} />
        <meshStandardMaterial color="#3b2416" roughness={0.3} />
      </mesh>
    </group>
  );
}

export const BACKDROPS: Record<string, { wall: string; light: string; lightI: number; lamp?: boolean; window?: boolean }> = {
  ardania: { wall: "#1c2233", light: "#ffb36b", lightI: 6, lamp: true },
  regional: { wall: "#cbb894", light: "#fff2da", lightI: 3, window: true },
  board: { wall: "#5a3d2e", light: "#ffe2b8", lightI: 4 },
  default: { wall: "#3b3f46", light: "#ffffff", lightI: 3 },
};

export function backdropKey(location: string) {
  if (/ardania/i.test(location)) return "ardania";
  if (/regional/i.test(location)) return "regional";
  if (/board/i.test(location)) return "board";
  return "default";
}

function RemoteTile({
  id,
  location,
  position,
  size,
  speaking,
  listening,
  action,
  dim,
  stageMood,
}: {
  id: string;
  location: string;
  position: [number, number, number];
  size: [number, number];
  speaking: boolean;
  listening: boolean;
  action: AvatarAction;
  dim: boolean;
  stageMood: StageMood;
}) {
  const b = BACKDROPS[backdropKey(location)];
  const camPos = useMemo(() => new THREE.Vector3(0, 1.3, 1.05), []);
  return (
    <group position={position}>
      <mesh position={[0, 0, -0.004]}>
        <planeGeometry args={[size[0] + 0.03, size[1] + 0.03]} />
        <meshBasicMaterial color={speaking ? "#d6ae70" : "#172127"} toneMapped={false} />
      </mesh>
      <mesh>
        <planeGeometry args={size} />
        <meshBasicMaterial toneMapped={false} color={dim ? "#888" : "#fff"}>
          <RenderTexture attach="map" anisotropy={8} width={640} height={360}>
            <PerspectiveCamera makeDefault manual aspect={size[0] / size[1]} position={camPos.toArray()} fov={34} onUpdate={(c) => c.lookAt(0, 1.16, 0)} />
            <color attach="background" args={[b.wall]} />
            <ambientLight intensity={0.5} />
            <directionalLight position={[1.5, 2.5, 2]} intensity={1.2} />
            <pointLight position={b.lamp ? [0.9, 1.4, 0.2] : [0, 2.2, 1]} color={b.light} intensity={b.lightI} distance={4} />
            {b.window ? (
              <mesh position={[-0.7, 1.4, -0.6]}>
                <planeGeometry args={[0.9, 1.1]} />
                <meshBasicMaterial color="#e9f2fb" toneMapped={false} />
              </mesh>
            ) : null}
            {b.lamp ? (
              <mesh position={[0.85, 1.25, -0.4]}>
                <sphereGeometry args={[0.12, 16, 16]} />
                <meshBasicMaterial color="#ffd9a0" toneMapped={false} />
              </mesh>
            ) : null}
            <mesh position={[0, 1.2, -0.75]}>
              <planeGeometry args={[4, 3]} />
              <meshStandardMaterial color={b.wall} roughness={0.95} />
            </mesh>
            <Suspense fallback={null}>
              <Avatar
                id={id}
                position={[0, 0, 0]}
                sitting
                lookAt={camPos}
                action={action}
                mood={seatMood(id, stageMood)}
                isSpeaker={speaking}
                listening={listening}
              />
            </Suspense>
          </RenderTexture>
        </meshBasicMaterial>
      </mesh>
      <Text position={[-size[0] / 2 + 0.05, -size[1] / 2 + 0.05, 0.002]} fontSize={0.045} anchorX="left" anchorY="bottom" color="white" outlineWidth={0.004} outlineColor="black">
        {location.split("·")[0].trim()}
      </Text>
    </group>
  );
}

function YouTile({
  position,
  size,
  photo,
  speaking,
  label,
  placeholder,
}: {
  position: [number, number, number];
  size: [number, number];
  photo?: string | null;
  speaking: boolean;
  label: string;
  placeholder: string;
}) {
  const tex = useMemo(() => {
    if (!photo) return null;
    const t = new THREE.TextureLoader().load(photo);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [photo]);
  useEffect(() => () => tex?.dispose(), [tex]);
  return (
    <group position={position}>
      <mesh position={[0, 0, -0.004]}>
        <planeGeometry args={[size[0] + 0.03, size[1] + 0.03]} />
        <meshBasicMaterial color={speaking ? "#d6ae70" : "#172127"} toneMapped={false} />
      </mesh>
      <mesh>
        <planeGeometry args={size} />
        {tex ? (
          <meshBasicMaterial map={tex} toneMapped={false} />
        ) : (
          <meshBasicMaterial color="#2a2620" toneMapped={false} />
        )}
      </mesh>
      {!tex ? (
        <Text position={[0, 0.02, 0.003]} fontSize={0.16} color="#d6b48a">
          {placeholder}
        </Text>
      ) : null}
      <Text position={[-size[0] / 2 + 0.05, -size[1] / 2 + 0.05, 0.002]} fontSize={0.045} anchorX="left" anchorY="bottom" color="white" outlineWidth={0.004} outlineColor="black">
        {label}
      </Text>
    </group>
  );
}

function tileLayout(count: number) {
  const cols = count <= 1 ? 1 : count <= 4 ? 2 : 3;
  const rows = Math.ceil(count / cols);
  const gap = 0.05;
  const w = (SCREEN.w - gap * (cols + 1)) / cols;
  const h = Math.min((SCREEN.h - gap * (rows + 1)) / rows, w * 0.5625);
  return Array.from({ length: count }, (_, i) => {
    const c = i % cols;
    const r = Math.floor(i / cols);
    const x = -SCREEN.w / 2 + gap + w / 2 + c * (w + gap);
    const y = SCREEN.h / 2 - gap - h / 2 - r * (h + gap);
    return { pos: [x, y, 0.02] as [number, number, number], size: [w, h] as [number, number] };
  });
}

export type Shot = { from: [number, number, number]; to: [number, number, number]; look: [number, number, number]; seconds: number };

function CameraRig({
  focus,
  shot,
  locked,
}: {
  focus: THREE.Vector3;
  shot?: Shot | null;
  /** Speaker-locked: no micro-jitter / pointer sway that fights the cut. */
  locked?: boolean;
}) {
  const { camera } = useThree();
  const reducedMotion = useReducedStageMotion();
  const look = useRef(new THREE.Vector3(0, 1.15, -2));
  const shotStart = useRef({ shot: null as Shot | null | undefined, t: 0 });
  useFrame((_, dt) => {
    const t = performance.now() / 1000;
    if (shot) {
      if (shotStart.current.shot !== shot) shotStart.current = { shot, t };
      const k = Math.min(1, (t - shotStart.current.t) / shot.seconds);
      const e = reducedMotion ? 1 : k * k * (3 - 2 * k);
      camera.position.set(
        THREE.MathUtils.lerp(shot.from[0], shot.to[0], e),
        THREE.MathUtils.lerp(shot.from[1], shot.to[1], e),
        THREE.MathUtils.lerp(shot.from[2], shot.to[2], e),
      );
      camera.lookAt(shot.look[0], shot.look[1], shot.look[2]);
      return;
    }
    // The viewer is seated. Pointer-following and idle bob made the room
    // swim while reading; only the director moves attention to a speaker.
    camera.position.copy(PLAYER);
    const target = focus;
    const damp = locked ? 3.4 : 2.2;
    if (reducedMotion) look.current.copy(target);
    look.current.x = THREE.MathUtils.damp(look.current.x, target.x, damp, dt);
    look.current.y = THREE.MathUtils.damp(look.current.y, target.y, damp, dt);
    look.current.z = THREE.MathUtils.damp(look.current.z, target.z, damp, dt);
    camera.lookAt(look.current);
  });
  return null;
}

export function Boardroom({
  present,
  remote,
  mood,
  direction,
  photo,
  shot,
  showScreen = true,
  youLabel = "You · CEO",
  youPlaceholder = "You",
}: {
  present: string[];
  remote: { id: string; location: string }[];
  mood: StageMood;
  direction: Direction;
  photo?: string | null;
  shot?: Shot | null;
  showScreen?: boolean;
  youLabel?: string;
  youPlaceholder?: string;
}) {
  const light = LIGHT[mood];
  const { size } = useThree();
  // Keep both nearby seats in view on tall windows as well as wide screens.
  const aspect = size.width / size.height;
  const fov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(48) / 2) * Math.max(1, 1.45 / aspect)));

  const seated = present.slice(0, SEATS.length).map((id, i) => ({ id, ...SEATS[i] }));
  const tiles = tileLayout(remote.length + 1);

  const headOf = (id: string): THREE.Vector3 | null => {
    const s = seated.find((p) => p.id === id);
    if (s) return new THREE.Vector3(s.pos[0] * 0.92, 1.22, s.pos[2]);
    const r = remote.findIndex((p) => p.id === id);
    if (r >= 0) {
      const tp = tiles[r].pos;
      return new THREE.Vector3(SCREEN.pos.x + tp[0], SCREEN.pos.y + tp[1], SCREEN.pos.z);
    }
    return null;
  };

  const speaker = direction.speakerId;
  const speakerHead = speaker && speaker !== "you" ? headOf(speaker) : null;
  const speakerLocked =
    Boolean(speakerHead) &&
    (direction.attention === "speaker" || Boolean(direction.actions[speaker ?? ""]));
  const focus =
    speakerLocked && speakerHead
      ? speakerHead.clone()
      : speaker === "you"
        ? new THREE.Vector3(SCREEN.pos.x, SCREEN.pos.y - 0.1, SCREEN.pos.z)
        : new THREE.Vector3(0, 1.30, -2);

  return (
    <>
      <fog attach="fog" args={[mood === "night" ? "#06080d" : "#dfe6ee", 30, 95]} />
      <PerspectiveCamera makeDefault fov={Math.min(85, fov)} position={PLAYER.toArray()} near={0.05} far={120} />
      <CameraRig focus={focus} shot={shot} locked={speakerLocked || speaker === "you"} />

      <ambientLight intensity={light.amb} />
      <directionalLight
        position={[-6, 5, 1]}
        color={light.sun}
        intensity={light.sunI}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
      />
      {[-1.6, 0, 1.6].map((z) => (
        <pointLight key={z} position={[0, 2.75, z]} intensity={light.ceiling} distance={5} color="#fff3e2" />
      ))}
      <Environment resolution={128}>
        <Lightformer form="rect" intensity={mood === "night" ? 0.4 : 2} position={[-5, 2, 0]} scale={[10, 3, 1]} rotation-y={Math.PI / 2} color={light.sun} />
        <Lightformer form="rect" intensity={0.8} position={[0, 4, 0]} scale={[6, 6, 1]} rotation-x={Math.PI / 2} />
      </Environment>

      <City mood={mood} />

      {/* Room shell */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[12, 9]} />
        <meshStandardMaterial color="#333b3e" roughness={0.95} />
      </mesh>
      <mesh position={[0, 3, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, 9]} />
        <meshStandardMaterial color="#303c40" roughness={0.95} />
      </mesh>
      {/* Window wall (left) */}
      {[-3, -1.5, 0, 1.5, 3].map((z) => (
        <mesh key={z} position={[-3.2, 1.5, z]}>
          <boxGeometry args={[0.06, 3, 0.06]} />
          <meshStandardMaterial color="#2b2b2b" metalness={0.6} roughness={0.4} />
        </mesh>
      ))}
      <mesh position={[-3.2, 1.5, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[9, 3]} />
        <meshStandardMaterial color="#b8c8d8" transparent opacity={0.08} roughness={0.05} />
      </mesh>
      <mesh position={[-3.18, 0.35, 0]} receiveShadow>
        <boxGeometry args={[0.12, 0.7, 9]} />
        <meshStandardMaterial color="#cfc9c0" roughness={0.8} />
      </mesh>
      <mesh position={[-3.18, 2.88, 0]}>
        <boxGeometry args={[0.12, 0.24, 9]} />
        <meshStandardMaterial color="#e9e6e1" roughness={0.9} />
      </mesh>
      {/* Wood panel wall (right) */}
      <mesh position={[3.2, 1.5, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[9, 3]} />
        <meshStandardMaterial color="#49392e" roughness={0.72} />
      </mesh>
      {/* Screen wall (far) */}
      <mesh position={[0, 1.5, -3.45]} receiveShadow>
        <planeGeometry args={[6.4, 3]} />
        <meshStandardMaterial color="#28363b" roughness={0.88} />
      </mesh>
      <mesh position={[SCREEN.pos.x, SCREEN.pos.y, SCREEN.pos.z - 0.03]}>
        <boxGeometry args={[SCREEN.w + 0.08, SCREEN.h + 0.08, 0.05]} />
        <meshStandardMaterial color="#0b0b0c" roughness={0.3} metalness={0.4} />
      </mesh>
      <group position={SCREEN.pos.toArray()} visible={showScreen}>
        {remote.map((r, i) => (
          <RemoteTile
            key={r.id}
            id={r.id}
            location={r.location}
            position={tiles[i].pos}
            size={tiles[i].size}
            speaking={speaker === r.id}
            listening={Boolean(direction.speakerId) && direction.attention === "speaker" && speaker !== r.id}
            action={direction.actions[r.id] ?? null}
            dim={false}
            stageMood={mood}
          />
        ))}
        <YouTile position={tiles[remote.length].pos} size={tiles[remote.length].size} photo={photo}
          speaking={speaker === "you"}
          label={youLabel}
          placeholder={youPlaceholder}
        />
      </group>

      {/* Credenza and plant */}
      <mesh position={[2.85, 0.42, -1.6]} castShadow receiveShadow>
        <boxGeometry args={[0.5, 0.84, 2.2]} />
        <meshStandardMaterial color="#2c2520" roughness={0.6} />
      </mesh>
      <mesh position={[2.85, 0.98, -0.85]} castShadow>
        <cylinderGeometry args={[0.13, 0.1, 0.28, 20]} />
        <meshStandardMaterial color="#d9d3ca" roughness={0.8} />
      </mesh>
      {[0, 1.1, 2.2, 3.3, 4.4].map((a) => (
        <mesh key={a} position={[2.85 + Math.cos(a) * 0.12, 1.32, -0.85 + Math.sin(a) * 0.12]} rotation={[Math.cos(a) * 0.5, 0, Math.sin(a) * 0.5]} castShadow>
          <coneGeometry args={[0.1, 0.6, 6]} />
          <meshStandardMaterial color="#3f6b45" roughness={0.8} />
        </mesh>
      ))}

      {/* Quiet architectural detail: wall battens, ceiling lights, table rug. */}
      {Array.from({ length: 17 }, (_, i) => (
        <mesh key={`slat-${i}`} position={[3.17, 1.5, -3.5 + i * 0.42]}>
          <boxGeometry args={[0.055, 3, 0.035]} />
          <meshStandardMaterial color="#211e1b" roughness={0.85} />
        </mesh>
      ))}
      {[-0.65, 0.65].map((x) => (
        <mesh key={`ceiling-${x}`} position={[x, 2.97, -0.1]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.035, 4.7]} />
          <meshBasicMaterial color="#ffe4bc" toneMapped={false} />
        </mesh>
      ))}
      <mesh position={[0, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[3.7, 6.4]} />
        <meshStandardMaterial color="#252c2e" roughness={1} />
      </mesh>

      {/* Table */}
      <RoundedBox args={[1.4, 0.065, 4.8]} radius={0.03} smoothness={4} position={[0, 0.72, -0.1]} castShadow receiveShadow>
        <meshStandardMaterial color="#59402d" roughness={0.36} metalness={0.08} />
      </RoundedBox>
      <mesh position={[0, 0.36, -0.1]}>
        <boxGeometry args={[0.5, 0.7, 3.6]} />
        <meshStandardMaterial color="#2a211a" roughness={0.6} />
      </mesh>

      {/* Your place */}
      <Laptop position={[0.5, 0.75, 2.25]} rotation={-0.35} />
      <Cup position={[-0.45, 0.8, 2.1]} />
      <mesh position={[-0.05, 0.748, 2.05]} rotation={[-Math.PI / 2, 0, 0.1]}>
        <planeGeometry args={[0.21, 0.29]} />
        <meshStandardMaterial color="#f7f4ee" roughness={0.9} />
      </mesh>

      {/* Seats and people */}
      {SEATS.slice(seated.length).map((s, i) => (
        <Chair key={i} position={[s.pos[0], 0, s.pos[2] - 0.05]} rotation={s.rot} />
      ))}
      {seated.map((p) => (
        <group key={p.id}>
          <Laptop position={[p.pos[0] * 0.28, 0.75, p.pos[2]]} rotation={p.rot + Math.PI} />
          <Cup position={[p.pos[0] * 0.2, 0.8, p.pos[2] - 0.42]} />
        </group>
      ))}
      <Suspense fallback={null}>
        {seated.map((p) => {
          const lookTarget =
            direction.attention === "you" || !speakerHead || speaker === p.id
              ? PLAYER
              : speakerHead;
          const floorHeld =
            Boolean(direction.speakerId) && direction.attention === "speaker";
          return (
            <Avatar
              key={p.id}
              id={p.id}
              position={p.pos}
              rotationY={p.rot}
              sitting
              lookAt={lookTarget}
              action={direction.actions[p.id] ?? null}
              mood={seatMood(p.id, mood)}
              chair
              isSpeaker={speaker === p.id}
              listening={floorHeld && speaker !== p.id}
            />
          );
        })}
      </Suspense>
    </>
  );
}
