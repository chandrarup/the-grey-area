"use client";

import { type ReactNode } from "react";
import { StageCanvas } from "./stage-canvas";
import type { StageMood } from "@/lib/case/types";
import { Boardroom, type Direction } from "./boardroom";

function formatClock(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** First-person boardroom with DOM overlays for captions, prompts and controls. */
export default function MeetingStage({
  title,
  heading,
  seconds,
  present,
  remote,
  mood,
  direction,
  photo,
  caption,
  toast,
  note,
  overlay,
  footer,
  controls,
  voiceStatus,
  youLabel,
  youPlaceholder,
}: {
  title: string;
  heading: string;
  seconds: number;
  present: string[];
  remote: { id: string; location: string }[];
  mood: StageMood;
  direction: Direction;
  photo?: string | null;
  caption: { name: string; text: string; isYou?: boolean } | null;
  toast: { name: string; text: string } | null;
  note?: string | null;
  overlay?: ReactNode;
  footer?: ReactNode;
  controls?: ReactNode;
  voiceStatus?: string | null;
  youLabel?: string;
  youPlaceholder?: string;
}) {
  return (
    <div className="fixed inset-0 z-20 bg-black text-white">
      <StageCanvas>
        <Boardroom
          present={present}
          remote={remote}
          mood={mood}
          direction={direction}
          photo={photo}
          youLabel={youLabel}
          youPlaceholder={youPlaceholder}
        />
      </StageCanvas>

      {/* Cinematic vignette */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.55)_100%)]" />

      {/* Top bar */}
      <div className="absolute inset-x-0 top-0 flex flex-wrap items-center gap-x-4 gap-y-2 bg-gradient-to-b from-[#0d171e]/95 via-[#0d171e]/65 to-transparent px-5 py-3 pr-36 text-[11px]">
        <span className="flex items-center gap-1.5 rounded bg-black/40 px-2 py-0.5">
          <span className="h-2 w-2 rounded-full bg-[#d6ae70]" />
          Meeting · {formatClock(seconds)}
        </span>
        <span className="text-white/80">{title}</span>
        <span className="text-white/45">{heading}</span>
        <div className="flex flex-wrap items-center gap-3 text-white/60">
          {voiceStatus ? (
            <span className="text-white/45">{voiceStatus}</span>
          ) : null}
          {controls}
        </div>
      </div>

      {note ? (
        <div className="pointer-events-none absolute inset-x-0 top-20 flex justify-center px-6">
          <p className="max-w-xl rounded-full bg-black/45 px-5 py-2 text-center font-serif text-lg italic text-white/90 backdrop-blur-sm">
            {note}
          </p>
        </div>
      ) : null}

      {toast ? (
        <div className="call-toast absolute right-5 top-16 w-72 rounded-xl bg-black/65 px-4 py-3 shadow-2xl ring-1 ring-white/10 backdrop-blur-md">
          <p className="text-[11px] text-white/55">{toast.name} · message</p>
          <p className="mt-1 text-[13px] leading-snug">{toast.text}</p>
        </div>
      ) : null}

      {caption ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-36 md:bottom-28 flex justify-center px-6">
          <p className="max-w-3xl rounded-lg border border-white/10 bg-[#101a21]/90 px-6 py-4 text-center text-base leading-relaxed shadow-2xl md:text-xl">
            <span
              className={caption.isYou ? "text-[#e7c898]" : "text-[#e7c898]"}
            >
              {caption.name}
            </span>{" "}
            {caption.text}
          </p>
        </div>
      ) : null}

      {overlay ? (
        <div className="absolute inset-x-0 bottom-0 z-10 flex max-h-[75dvh] overflow-y-auto justify-center bg-gradient-to-t from-black/80 via-black/50 to-transparent px-4 pb-24 pt-12">
          {overlay}
        </div>
      ) : null}

      <div className="absolute inset-x-0 bottom-5 z-20 flex justify-center">
        {footer}
      </div>
    </div>
  );
}
