"use client";

import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Boardroom, type Direction, type Shot } from "@/app/simulation/decisions/three/boardroom";

const SHOTS: Record<string, Shot> = {
  tom: { from: [0.2, 1.3, 1.5], to: [0.2, 1.3, 1.5], look: [-0.98, 0.9, 0.45], seconds: 1 },
  davidClose: { from: [0.1, 1.25, 1.2], to: [0.1, 1.25, 1.2], look: [0.98, 1.0, 0.45], seconds: 1 },
  davidSide: { from: [0.98, 1.1, 1.9], to: [0.98, 1.1, 1.9], look: [0.98, 0.75, 0.45], seconds: 1 },
  tomSide: { from: [-0.98, 1.2, 2.0], to: [-0.98, 1.2, 2.0], look: [-0.98, 0.8, 0.45], seconds: 1 },
};
import { prepareVoices, say } from "@/app/simulation/decisions/three/speech";

const LINE = "We have the best technical proposal in the field, but this award will not be decided on engineering alone.";

export default function Lab() {
  const [shot, setShot] = useState<string | null>(null);
  const [dir, setDir] = useState<Direction>({ speakerId: null, attention: "you", actions: {} });
  const talk = async (id: string) => {
    prepareVoices();
    setDir({ speakerId: id, attention: "speaker", actions: {} });
    await say(id, LINE);
    setDir({ speakerId: null, attention: "you", actions: {} });
  };
  return (
    <div style={{ height: "100vh", background: "#111" }}>
      <div style={{ position: "absolute", zIndex: 10, top: 8, left: 8, display: "flex", gap: 6 }}>
        {["marcus", "david", "tom", "priya", "eleanor"].map((id) => (
          <button key={id} id={`say-${id}`} style={{ background: "#fff", padding: 4 }} onClick={() => void talk(id)}>
            {id}
          </button>
        ))}
        {[null, "tom", "tomSide", "davidClose", "davidSide"].map((k) => (
          <button key={String(k)} id={`shot-${k}`} style={{ background: "#9cf", padding: 4 }} onClick={() => setShot(k)}>
            {k ?? "seat"}
          </button>
        ))}
        {(["nod", "shake", "phone"] as const).map((a) => (
          <button key={a} id={`act-${a}`} style={{ background: "#ddd", padding: 4 }} onClick={() => setDir({ speakerId: null, attention: "you", actions: { david: a, tom: a } })}>{a}</button>
        ))}
      </div>
      <Canvas shadows dpr={[1, 2]}>
        <Boardroom
          present={["david", "tom"]}
          remote={[
            { id: "marcus", location: "Ardania · 3:12 AM" },
            { id: "priya", location: "Regional site · 1:45 PM" },
            { id: "eleanor", location: "Board office · 8:30 AM" },
          ]}
          mood="morning"
          direction={dir}
          shot={shot ? SHOTS[shot] : null}
        />
      </Canvas>
    </div>
  );
}
