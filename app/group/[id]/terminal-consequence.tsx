"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { CastMember, Consequence } from "@/lib/case/types";
import {
  isScenePhase,
  type ScenePhase,
} from "@/lib/group/meeting-runtime";
import { consequenceFilm } from "@/app/simulation/decisions/three/film-beats";
import { unlockAudio } from "@/app/simulation/decisions/stage-sound";
import { seatHeaders } from "@/lib/group/seat-token-client";
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

type PhaseEventType =
  | "begin_film"
  | "film_watched"
  | "film_timeout"
  | "ceo_force_advance";

/**
 * After Decision 3, play the lived consequence film through the same
 * server-owned hard-sync path as mid-arc films (ADR 0001), then reflections
 * / await-release. localStorage is not phase authority.
 */
export function TerminalConsequence({
  sessionId,
  sessionCode,
  sessionLabel,
  film,
  decisions,
  sceneTitles,
  cast,
  needsReflection = false,
  participantId,
  joinToken = "",
  reflectionQuestions = [],
  roleKey,
  isCeo = false,
  initialScenePhase = "open",
  initialPhaseDeadlineAt = null,
  initialFilmWatchedSeatIds = [],
}: {
  sessionId: string;
  sessionCode: string;
  sessionLabel: string;
  film: TerminalFilm | null;
  decisions: DecisionRow[];
  sceneTitles: Record<string, string>;
  cast: CastMember[];
  needsReflection?: boolean;
  participantId?: string;
  joinToken?: string;
  reflectionQuestions?: string[];
  roleKey: string;
  isCeo?: boolean;
  initialScenePhase?: string;
  initialPhaseDeadlineAt?: string | null;
  initialFilmWatchedSeatIds?: string[];
}) {
  const [scenePhase, setScenePhase] = useState<ScenePhase>(() =>
    isScenePhase(initialScenePhase) ? initialScenePhase : film ? "decided" : "open",
  );
  const [phaseDeadlineAt, setPhaseDeadlineAt] = useState<string | null>(
    initialPhaseDeadlineAt,
  );
  const [filmWatchedSeatIds, setFilmWatchedSeatIds] = useState<string[]>(
    initialFilmWatchedSeatIds,
  );
  const [filmPos, setFilmPos] = useState(0);
  const phaseBusy = useRef(false);

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

  const applyPhasePayload = useCallback(
    (data: {
      scenePhase?: string;
      phaseDeadlineAt?: string | null;
      filmWatchedSeatIds?: string[];
    }) => {
      if (data.scenePhase && isScenePhase(data.scenePhase)) {
        setScenePhase(data.scenePhase);
      }
      if (data.phaseDeadlineAt !== undefined) {
        setPhaseDeadlineAt(data.phaseDeadlineAt);
      }
      if (Array.isArray(data.filmWatchedSeatIds)) {
        setFilmWatchedSeatIds(data.filmWatchedSeatIds);
      }
    },
    [],
  );

  const emitPhase = useCallback(
    async (type: PhaseEventType) => {
      if (phaseBusy.current) return;
      phaseBusy.current = true;
      try {
        if (!joinToken) return;
        const res = await fetch(`/api/group/${sessionCode}/phase`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...seatHeaders(joinToken),
          },
          body: JSON.stringify({ type }),
        });
        if (!res.ok) return;
        const data = (await res.json()) as {
          scenePhase?: string;
          phaseDeadlineAt?: string | null;
          filmWatchedSeatIds?: string[];
        };
        applyPhasePayload(data);
      } finally {
        phaseBusy.current = false;
      }
    },
    [sessionCode, joinToken, applyPhasePayload],
  );

  // Poll so seats converge on film watched / timeout / CEO force.
  useEffect(() => {
    if (!film) return;
    if (scenePhase !== "decided" && scenePhase !== "film") return;
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await fetch(`/api/group/${sessionId}/state?after=999999999`);
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as {
          scenePhase?: string;
          phaseDeadlineAt?: string | null;
          filmWatchedSeatIds?: string[];
        };
        if (!cancelled) applyPhasePayload(data);
      } catch {
        /* network blip */
      }
    };
    void tick();
    const id = window.setInterval(() => void tick(), 2000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [film, sessionId, scenePhase, applyPhasePayload]);

  useEffect(() => {
    if (scenePhase === "film") setFilmPos(0);
  }, [scenePhase, film?.decisionId]);

  // Empty film beats still need a hard-sync mark so the room can leave film.
  useEffect(() => {
    if (!film || scenePhase !== "film") return;
    if (filmBeats.length > 0) return;
    if (filmWatchedSeatIds.includes(roleKey)) return;
    void emitPhase("film_watched");
  }, [
    film,
    scenePhase,
    filmBeats.length,
    filmWatchedSeatIds,
    roleKey,
    emitPhase,
  ]);

  useEffect(() => {
    if (scenePhase !== "film" || !phaseDeadlineAt) return;
    const ms = new Date(phaseDeadlineAt).getTime() - Date.now();
    if (ms <= 0) {
      void emitPhase("film_timeout");
      return;
    }
    const id = window.setTimeout(() => void emitPhase("film_timeout"), ms + 50);
    return () => window.clearTimeout(id);
  }, [scenePhase, phaseDeadlineAt, emitPhase]);

  const filmDone =
    !film || (scenePhase !== "decided" && scenePhase !== "film");

  if (!filmDone && film && scenePhase === "decided") {
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
            void emitPhase("begin_film");
          }}
          className="mt-10 rounded-full bg-white px-6 py-2 text-sm font-medium text-black"
        >
          See what happened
        </button>
      </div>
    );
  }

  if (!filmDone && film && scenePhase === "film") {
    if (!filmBeats.length) {
      return (
        <div className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-[#0c0c0c] px-6 text-white">
          <p className="mt-6 text-center font-serif text-xl text-white/70">
            Waiting for the room…
          </p>
          {isCeo ? (
            <button
              type="button"
              onClick={() => void emitPhase("ceo_force_advance")}
              className="mt-10 rounded-full border border-white/30 px-5 py-2 text-sm text-white/80"
            >
              Advance everyone
            </button>
          ) : null}
        </div>
      );
    }
    const watched = filmWatchedSeatIds.includes(roleKey);
    return (
      <div onPointerDown={unlockAudio}>
        <Film
          beats={filmBeats}
          pos={filmPos}
          castById={castById}
          mood="night"
          isLast={filmPos >= filmBeats.length - 1}
          finalLabel={watched ? "Waiting for the room…" : "Continue"}
          onAdvance={() => {
            if (filmPos >= filmBeats.length - 1) {
              if (!watched) void emitPhase("film_watched");
              return;
            }
            setFilmPos((p) => p + 1);
          }}
        />
        {isCeo ? (
          <div className="pointer-events-none fixed inset-x-0 bottom-6 z-20 flex justify-center">
            <button
              type="button"
              className="pointer-events-auto rounded-full border border-white/30 bg-black/60 px-4 py-2 text-xs text-white/80 backdrop-blur hover:bg-black/80"
              onClick={() => void emitPhase("ceo_force_advance")}
            >
              Advance everyone
            </button>
          </div>
        ) : null}
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
