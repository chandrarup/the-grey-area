"use client";

/**
 * Visual QA for seated Rocketbox motion (ticket 02).
 * Use seat / side shots while cycling intents: idle should stay planted;
 * speak = small arm additives; listen = calm head attend; nod/shake/phone overlays.
 * Solo MeetingStage and group MeetingStage both render through Boardroom → Avatar.
 */
import { useState } from "react";
import { StageCanvas } from "@/app/simulation/decisions/three/stage-canvas";
import Link from "next/link";
import { Boardroom, type Direction, type Shot } from "@/app/simulation/decisions/three/boardroom";

const SHOTS: Record<string, Shot> = {
  tom: { from: [0.2, 1.3, 1.5], to: [0.2, 1.3, 1.5], look: [-0.98, 0.9, 0.45], seconds: 1 },
  davidClose: { from: [0.1, 1.25, 1.2], to: [0.1, 1.25, 1.2], look: [0.98, 1.0, 0.45], seconds: 1 },
  davidSide: { from: [0.98, 1.1, 1.9], to: [0.98, 1.1, 1.9], look: [0.98, 0.75, 0.45], seconds: 1 },
  tomSide: { from: [-0.98, 1.2, 2.0], to: [-0.98, 1.2, 2.0], look: [-0.98, 0.8, 0.45], seconds: 1 },
};
import { prepareVoices, say, enableDialogue } from "@/app/simulation/decisions/three/speech";
import type { AvatarAction } from "@/app/simulation/decisions/three/avatar";

const LINE = "We have the best technical proposal in the field, but this award will not be decided on engineering alone.";

export default function Lab() {
  const [roomCast, setRoomCast] = useState("david");
  const [shot, setShot] = useState<string | null>(null);
  const [dir, setDir] = useState<Direction>({ speakerId: null, attention: "you", actions: {} });
  const talk = async (id: string) => {
    enableDialogue();
    prepareVoices();
    // speak intent via isSpeaker + TTS visemes
    setDir({ speakerId: id, attention: "speaker", actions: {} });
    await say(id, LINE);
    setDir({ speakerId: null, attention: "you", actions: {} });
  };
  const listenDemo = (speaker: string) => {
    // Others get listening=true; speaker gets isSpeaker without forcing a line.
    setDir({ speakerId: speaker, attention: "speaker", actions: {} });
  };
  const act = (action: AvatarAction) => {
    setDir({ speakerId: null, attention: "you", actions: { david: action, tom: action } });
  };
  return (
    <div style={{ height: "100vh", background: "#111", color: "#171e24" }}>
      <div style={{ position: "absolute", zIndex: 10, top: 8, left: 8, display: "flex", flexWrap: "wrap", gap: 6, maxWidth: "90vw" }}>
        <Link href="/professor/simulations" style={{ background: "#f0e6d5", padding: 4 }}>← Simulations</Link>
        <Link href="/stage-lab/debrief" style={{ background: "#f0e6d5", padding: 4 }}>Debrief preview</Link>
        <button onClick={() => { setRoomCast(roomCast === "priya" ? "david" : "priya"); setShot("davidClose"); }} style={{ background: "#f0e6d5", padding: 4 }}>Inspect Priya / David</button>
        {["marcus", "david", "tom", "priya", "eleanor"].map((id) => (
          <button key={id} id={`say-${id}`} style={{ background: "#fff", padding: 4 }} onClick={() => void talk(id)}>
            speak:{id}
          </button>
        ))}
        <button id="intent-idle" style={{ background: "#cfc", padding: 4 }} onClick={() => setDir({ speakerId: null, attention: "you", actions: {} })}>
          idle
        </button>
        <button id="intent-listen" style={{ background: "#ccf", padding: 4 }} onClick={() => listenDemo("david")}>
          listen (→david)
        </button>
        {[null, "tom", "tomSide", "davidClose", "davidSide"].map((k) => (
          <button key={String(k)} id={`shot-${k}`} style={{ background: "#9cf", padding: 4 }} onClick={() => setShot(k)}>
            {k ?? "seat"}
          </button>
        ))}
        {(["nod", "shake", "phone"] as const).map((a) => (
          <button key={a} id={`act-${a}`} style={{ background: "#ddd", padding: 4 }} onClick={() => act(a)}>
            {a}
          </button>
        ))}
      </div>
      <StageCanvas>
        <Boardroom
          present={[roomCast, "tom"]}
          remote={[
            { id: "marcus", location: "Ardania · 3:12 AM" },
            { id: roomCast === "priya" ? "david" : "priya", location: "Regional site · 1:45 PM" },
            { id: "eleanor", location: "Board office · 8:30 AM" },
          ]}
          mood="morning"
          direction={dir}
          shot={shot ? SHOTS[shot] : null}
        />
      </StageCanvas>
    </div>
  );
}
