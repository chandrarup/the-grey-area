"use client";
import {
  Component,
  Suspense,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Canvas } from "@react-three/fiber";
import { useProgress } from "@react-three/drei";
import * as THREE from "three";
import { DialogueControls } from "./dialogue-controls";

function LoadingRoom() {
  const [loading, setLoading] = useState({ active: true, progress: 0 });
  useEffect(() => {
    // The loader may start inside a React render. Poll its store from an effect
    // rather than updating a second React root synchronously from that render.
    const id = window.setInterval(() => {
      const { active, progress } = useProgress.getState();
      setLoading((last) =>
        last.active === active && last.progress === progress
          ? last
          : { active, progress },
      );
    }, 150);
    return () => window.clearInterval(id);
  }, []);
  if (!loading.active) return null;
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <div
        role="status"
        className="w-60 rounded-lg border border-white/10 bg-[#141d23]/95 p-5 text-center text-white"
      >
        <p className="font-serif text-xl">Preparing the room</p>
        <p className="mt-2 text-xs text-white/50">
          Loading the scene · {Math.round(loading.progress)}%
        </p>
      </div>
    </div>
  );
}

class SceneBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <div
          role="status"
          className="absolute inset-0 flex items-center justify-center bg-[#141d23] p-8 text-center text-white/70"
        >
          <p className="max-w-sm text-sm leading-7">
            The 3D room could not load. You can continue using the captions and
            decision controls.
          </p>
        </div>
      );
    return this.props.children;
  }
}
export function useReducedStageMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return reduced;
}
/** Shared renderer for solo, group, consequence films and visual QA. */
export function StageCanvas({ children }: { children: ReactNode }) {
  return (
    <div className="relative h-full w-full">
      <SceneBoundary>
        <Canvas
          shadows={{ type: THREE.PCFShadowMap }}
          dpr={[1, 1.5]}
          gl={{
            antialias: true,
            powerPreference: "high-performance",
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.05,
          }}
          fallback={
            <div className="p-8 text-center text-sm text-white/60">
              3D is unavailable on this device. Continue with the captions and
              controls.
            </div>
          }
        >
          <Suspense fallback={null}>{children}</Suspense>
        </Canvas>
      </SceneBoundary>
      <LoadingRoom />
      <DialogueControls />
    </div>
  );
}
