"use client";

import { useEffect, useState } from "react";

/** Static bid deadline offset — demo stakes panel for landing (42d from mount). */
const INITIAL_SECONDS = 42 * 24 * 3600 + 6 * 3600 + 12 * 60 + 8;

function formatCountdown(totalSeconds: number): string {
  const s = Math.max(0, totalSeconds);
  const d = Math.floor(s / 86400);
  const h = String(Math.floor((s % 86400) / 3600)).padStart(2, "0");
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const sec = String(s % 60).padStart(2, "0");
  return `${d}d ${h}:${m}:${sec}`;
}

export function LandingStakesPanel() {
  const [seconds, setSeconds] = useState(INITIAL_SECONDS);

  useEffect(() => {
    const id = setInterval(() => {
      setSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex w-full max-w-[20.5rem] flex-col gap-5">
      <div className="flex items-baseline gap-2.5">
        <span className="font-serif text-[clamp(4.5rem,10vw,5.75rem)] font-medium leading-[0.88] tracking-tight text-foreground">
          8.4
        </span>
        <span className="font-serif text-4xl font-medium text-accent">bn</span>
      </div>
      <div className="h-px w-full bg-border" />
      <div className="flex flex-col gap-1.5 font-mono text-[11.5px] tracking-wide text-muted-foreground">
        <p className="m-0">GLOBAL INFRASTRUCTURE SOLUTIONS</p>
        <p className="m-0">ARDANIA CORRIDOR · SEALED BID</p>
        <p className="m-0 text-foreground">
          CLOSES IN{" "}
          <span className="text-accent tabular-nums">
            {formatCountdown(seconds)}
          </span>
        </p>
      </div>
    </div>
  );
}
