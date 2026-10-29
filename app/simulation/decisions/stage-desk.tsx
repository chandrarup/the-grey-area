"use client";

import { useState } from "react";
import type { DeskTablet, SceneProp, StageMood } from "@/lib/case/types";
import { MarkdownBody } from "@/app/components/markdown-body";

const LIGHT: Record<StageMood, string> = {
  morning:
    "repeating-linear-gradient(115deg, rgba(255,236,200,0.20) 0 46px, transparent 46px 78px)",
  evening:
    "repeating-linear-gradient(115deg, rgba(255,170,110,0.16) 0 46px, transparent 46px 78px)",
  night:
    "radial-gradient(circle at 22% 30%, rgba(255,210,140,0.30), transparent 38%)",
};

const PAPER_SPOTS = [
  { left: "24%", top: "22%", rotate: -7 },
  { left: "41%", top: "14%", rotate: 4 },
  { left: "33%", top: "47%", rotate: -2 },
  { left: "51%", top: "42%", rotate: 8 },
];

export function DeskScene({
  text,
  props,
  mood,
  tablet,
}: {
  text: string;
  props: SceneProp[];
  mood: StageMood;
  /** Case-authored calendar chrome; omitted → blank tablet face. */
  tablet?: DeskTablet | null;
}) {
  const [open, setOpen] = useState<SceneProp | null>(null);
  const [read, setRead] = useState<Set<string>>(() => new Set());

  return (
    <div className="mx-auto w-full max-w-5xl">
      <p className="mx-auto mb-5 max-w-md text-center font-serif text-lg italic leading-relaxed text-muted-foreground">
        {text}
      </p>

      <div className="[perspective:1600px]">
        <div
          className="desk-surface relative mx-auto h-[min(62dvh,34rem)] w-full overflow-hidden rounded-2xl shadow-[0_40px_90px_rgba(0,0,0,0.35)] [transform:rotateX(14deg)] [transform-origin:50%_100%]"
          style={{
            background:
              "repeating-linear-gradient(92deg, rgba(0,0,0,0.05) 0 2px, transparent 2px 17px), repeating-linear-gradient(88deg, rgba(255,255,255,0.03) 0 1px, transparent 1px 9px), linear-gradient(180deg, #7b5235 0%, #5d3c26 55%, #4a2f1d 100%)",
          }}
        >
          <div
            className="pointer-events-none absolute inset-0 mix-blend-soft-light"
            style={{ background: LIGHT[mood] }}
          />

          {/* iPad, lying flat */}
          <div className="absolute right-[5%] top-[7%] w-[27%] min-w-[11.5rem] rotate-[-4deg]">
            <div className="aspect-[4/3] rounded-[1.1rem] bg-gradient-to-br from-[#2a2c30] to-[#121315] p-[6px] shadow-[0_14px_30px_rgba(0,0,0,0.45)] ring-1 ring-black/40">
              <div className="relative h-full w-full overflow-hidden rounded-[0.8rem] bg-gradient-to-br from-[#e9e4dc] to-[#cfc6b8]">
                <div className="flex items-center justify-between px-2.5 pt-1.5 text-[7px] font-semibold text-[#1d1d1f]">
                  <span>{tablet?.clock ?? "—"}</span>
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-3 rounded-[2px] border border-[#1d1d1f]">
                      <span className="block h-full w-2/3 bg-[#1d1d1f]" />
                    </span>
                  </span>
                </div>
                {tablet ? (
                  <>
                    <div className="mx-2 mt-1.5 rounded-md bg-white/90 px-2 py-1.5 shadow-sm">
                      <p className="text-[6px] font-semibold uppercase tracking-wider text-[#8a8a90]">
                        {tablet.calendarLabel ?? "Calendar · Today"}
                      </p>
                      <p className="mt-0.5 text-[8px] font-semibold text-[#1d1d1f]">
                        {tablet.event}
                      </p>
                      {tablet.alert ? (
                        <p className="text-[7px] text-[#c0392b]">{tablet.alert}</p>
                      ) : null}
                    </div>
                    {tablet.stats && tablet.stats.length > 0 ? (
                      <div className="mx-2 mt-1.5 grid grid-cols-2 gap-1.5">
                        {tablet.stats.map((stat) => (
                          <div
                            key={stat.label}
                            className="rounded-md bg-white/90 px-2 py-1.5 shadow-sm"
                          >
                            <p className="text-[6px] uppercase tracking-wider text-[#8a8a90]">
                              {stat.label}
                            </p>
                            <p className="text-[11px] font-semibold text-[#1d1d1f]">
                              {stat.value}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </>
                ) : null}
                <div className="absolute bottom-1 left-1/2 h-[3px] w-10 -translate-x-1/2 rounded-full bg-[#1d1d1f]/60" />
              </div>
            </div>
          </div>

          {/* Mug */}
          <div className="absolute bottom-[12%] left-[7%]">
            <div className="relative h-16 w-16 rounded-full bg-[#ece7df] shadow-[0_10px_20px_rgba(0,0,0,0.35)] ring-4 ring-[#d9d2c6]">
              <div className="absolute inset-2 rounded-full bg-gradient-to-br from-[#4a2c18] to-[#2a170b]" />
              <div className="absolute -right-3 top-5 h-6 w-4 rounded-r-full border-4 border-l-0 border-[#d9d2c6]" />
              <span className="desk-steam absolute -top-6 left-5 h-6 w-1 rounded-full bg-white/30" />
              <span className="desk-steam absolute -top-8 left-8 h-7 w-1 rounded-full bg-white/25 [animation-delay:0.8s]" />
            </div>
          </div>

          {/* Phone face down */}
          <div className="absolute bottom-[10%] right-[16%] h-28 w-14 rotate-[12deg] rounded-[1.1rem] bg-[#141414] shadow-[0_12px_24px_rgba(0,0,0,0.45)]">
            <div className="absolute left-2 top-2 h-6 w-6 rounded-lg bg-[#222] ring-1 ring-white/5" />
          </div>

          {/* Pen */}
          <div className="absolute bottom-[26%] right-[34%] h-1.5 w-28 rotate-[-28deg] rounded-full bg-gradient-to-r from-[#111] via-[#2c2c2c] to-[#c9a227] shadow-md" />

          {/* Papers */}
          {props.map((p, i) => {
            const spot = PAPER_SPOTS[i % PAPER_SPOTS.length];
            const isRead = read.has(p.key);
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => {
                  setOpen(p);
                  setRead((prev) => new Set(prev).add(p.key));
                }}
                className="desk-paper group absolute w-[19%] min-w-[8.5rem] text-left"
                style={{
                  left: spot.left,
                  top: spot.top,
                  ["--r" as string]: `${spot.rotate}deg`,
                  animationDelay: `${0.25 + i * 0.28}s`,
                }}
              >
                <div className="relative aspect-[3/4] bg-[#fbf9f4] px-3 py-3 shadow-[0_8px_18px_rgba(0,0,0,0.35)] transition-transform duration-300 group-hover:-translate-y-2 group-hover:shadow-[0_18px_32px_rgba(0,0,0,0.4)]">
                  <span className="absolute -top-2 left-4 h-5 w-2.5 rounded-sm border-2 border-[#9aa0a6] bg-transparent" />
                  <p className="text-[8px] uppercase tracking-[0.14em] text-[#6b6b6b]">
                    {p.subtitle}
                  </p>
                  <p className="mt-1.5 font-serif text-[13px] leading-tight text-[#1b1b1b]">
                    {p.title}
                  </p>
                  <div className="mt-3 space-y-1.5">
                    {[90, 75, 85, 60, 80, 50].map((w, j) => (
                      <div
                        key={j}
                        className="h-[3px] rounded bg-[#1b1b1b]/12"
                        style={{ width: `${w}%` }}
                      />
                    ))}
                  </div>
                  {p.hot ? (
                    <span className="absolute bottom-4 right-2 rotate-[-14deg] border-2 border-[#b3261e] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-[#b3261e]/85">
                      Flagged
                    </span>
                  ) : null}
                  {isRead ? (
                    <span className="absolute right-2 top-2 text-[9px] uppercase tracking-wide text-[#2f7d4f]">
                      Read
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        {read.size} of {props.length} read · click a paper to pick it up
      </p>

      {open ? (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 px-4 backdrop-blur-[2px]"
          onClick={() => setOpen(null)}
        >
          <div
            className="desk-lift max-h-[85dvh] w-full max-w-xl overflow-y-auto bg-[#fbf9f4] px-8 py-8 text-[#1b1b1b] shadow-[0_40px_100px_rgba(0,0,0,0.5)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <p className="text-[10px] uppercase tracking-[0.18em] text-[#6b6b6b]">
                {open.subtitle}
              </p>
              <button
                type="button"
                onClick={() => setOpen(null)}
                className="text-xs text-[#6b6b6b] hover:text-[#1b1b1b]"
              >
                Put it down
              </button>
            </div>
            <h2 className="mt-2 font-serif text-2xl">{open.title}</h2>
            <div className="mt-5 text-sm [&_*]:!text-[#1b1b1b]">
              <MarkdownBody source={open.body} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
