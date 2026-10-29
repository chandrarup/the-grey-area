"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { CastMember, Consequence } from "@/lib/case/types";
import { consequenceFilm } from "@/app/simulation/decisions/three/film-beats";
import { unlockAudio } from "@/app/simulation/decisions/stage-sound";
import { AwaitRelease } from "./await-release";
import { GroupReflectionForm } from "./reflection-form";

const Film = dynamic(() => import("@/app/simulation/decisions/three/film"), {
  ssr: false,
});

export type TerminalFilm = {
  decisionId: number;
  label: string;
  reasoning: string | null;
  consequence: Consequence;
  /** Presentation-only; same CEO branch either way (ADR 0002). */
  stanceClimate?: "aligned" | "split" | null;
};

type DecisionRow = {
  id: number;
  sceneId: string;
  decision: string;
  reasoning: string | null;
};

/**
 * After Decision 3, play the lived consequence film once per seat, then
 * reflections (if needed) / concluded await-release — not a cold jump off the film.
 */
export function TerminalConsequence({
  sessionId,
  sessionLabel,
  film,
  decisions,
  sceneTitles,
  cast,
  needsReflection = false,
  participantId,
  joinToken = "",
  reflectionQuestions = [],
}: {
  sessionId: string;
  sessionLabel: string;
  film: TerminalFilm | null;
  decisions: DecisionRow[];
  sceneTitles: Record<string, string>;
  cast: CastMember[];
  needsReflection?: boolean;
  participantId?: string;
  joinToken?: string;
  reflectionQuestions?: string[];
}) {
  const filmKey = film
    ? `group-film:${sessionId}:${film.decisionId}`
    : null;
  const [phase, setPhase] = useState<"decided" | "film" | "done">(() => {
    if (!film || !filmKey) return "done";
    try {
      return localStorage.getItem(filmKey) ? "done" : "decided";
    } catch {
      return "decided";
    }
  });
  const [filmPos, setFilmPos] = useState(0);
  const castById = useMemo(
    () => new Map(cast.map((m) => [m.id, m])),
    [cast],
  );
  const filmBeats = useMemo(
    () =>
      film
        ? consequenceFilm(film.consequence, cast, film.stanceClimate ?? null)
        : [],
    [film, cast],
  );

  function finishFilm() {
    if (filmKey) {
      try {
        localStorage.setItem(filmKey, "1");
      } catch {
        /* private mode */
      }
    }
    setPhase("done");
  }

  if (phase === "decided" && film) {
    return (
      <div className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-[#0c0c0c] px-6 text-white">
        <p className="text-[11px] uppercase tracking-[0.3em] text-white/45">
          Decision {decisions.length} of {decisions.length}
        </p>
        <p className="mt-6 text-sm text-white/60">The CEO decided</p>
        <p className="mt-3 max-w-2xl text-center font-serif text-3xl leading-snug md:text-4xl">
          {film.label}
        </p>
        {film.reasoning ? (
          <p className="mt-6 max-w-xl text-center font-serif text-base italic leading-relaxed text-white/60">
            “{film.reasoning}”
          </p>
        ) : null}
        {film.stanceClimate ? (
          <p className="mt-4 text-[11px] uppercase tracking-[0.25em] text-white/40">
            {film.stanceClimate === "aligned"
              ? "Advisors held one line"
              : "Advisors were already divided"}
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => {
            unlockAudio();
            setFilmPos(0);
            setPhase("film");
          }}
          className="mt-10 rounded-full bg-white px-6 py-2 text-sm font-medium text-black"
        >
          See what happened
        </button>
      </div>
    );
  }

  if (phase === "film" && film && filmBeats.length) {
    return (
      <div onPointerDown={unlockAudio}>
        <Film
          beats={filmBeats}
          pos={filmPos}
          castById={castById}
          mood="night"
          isLast={filmPos >= filmBeats.length - 1}
          finalLabel="Continue"
          onAdvance={() =>
            filmPos >= filmBeats.length - 1
              ? finishFilm()
              : setFilmPos((p) => p + 1)
          }
        />
      </div>
    );
  }

  if (needsReflection && participantId) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 md:px-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          Meeting concluded · {sessionLabel}
        </p>
        <div className="mt-8">
          <GroupReflectionForm
            sessionId={sessionId}
            participantId={participantId}
            joinToken={joinToken}
            questions={reflectionQuestions}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16 md:px-8">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
        Meeting concluded · {sessionLabel}
      </p>
      <h1 className="mt-3 font-serif text-3xl text-foreground">
        The decisions are on the record
      </h1>
      <ol className="mt-10 space-y-6">
        {decisions.map((d, i) => (
          <li key={d.id} className="border-l-2 border-border pl-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Decision {i + 1} · {sceneTitles[d.sceneId] ?? d.sceneId}
            </p>
            <p className="mt-1 font-serif text-lg text-foreground">{d.decision}</p>
            {d.reasoning ? (
              <p className="mt-1 text-sm italic text-muted-foreground">
                “{d.reasoning}”
              </p>
            ) : null}
          </li>
        ))}
      </ol>
      <p className="mt-10 text-sm text-muted-foreground">
        Your reflections are submitted. Your group debrief appears here when
        your professor releases it. This page updates on its own.
      </p>
      <AwaitRelease sessionId={sessionId} />
    </div>
  );
}
