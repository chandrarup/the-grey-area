"use client";

import { useState } from "react";
import Link from "next/link";
import type { CaseConfig, Decision, DecisionOption } from "@/lib/cases/types";
import type { SceneTurn } from "@/lib/engine/scene-director";
import { recordDecision } from "@/lib/engine/session";
import { stagePath } from "../stages";

type Props = {
  meta: CaseConfig["meta"];
  cast: CaseConfig["cast"];
  decision: Decision;
};

const inputClasses =
  "mt-2 w-full border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none";

const primaryButtonClasses =
  "inline-block bg-accent px-6 py-3 text-sm font-medium text-accent-foreground transition-transform hover:opacity-90 active:scale-[0.98] disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

function TranscriptTurn({
  turn,
  castById,
}: {
  turn: SceneTurn;
  castById: Map<string, CaseConfig["cast"][number]>;
}) {
  if (turn.speaker === "student") {
    return (
      <div className="flex flex-col items-end gap-1 text-right">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">You, as CEO</p>
        <p className="max-w-[42ch] text-sm leading-relaxed text-foreground">{turn.text}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {turn.messages.map((message, index) => {
        const member = castById.get(message.cast_id);
        return (
          <div key={index} className="border-l-2 border-border pl-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {member?.name ?? message.cast_id}
              {member?.role ? ` · ${member.role}` : ""}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-foreground">{message.text}</p>
          </div>
        );
      })}
    </div>
  );
}

export function DecisionChat({ meta, cast, decision }: Props) {
  const castById = new Map(cast.map((member) => [member.id, member]));

  const [transcript, setTranscript] = useState<SceneTurn[]>(() => [
    {
      speaker: "director",
      messages: decision.opening_pressure.map((line) => ({ cast_id: line.cast_id, text: line.line })),
    },
  ]);
  const [turnCount, setTurnCount] = useState(0);
  const [input, setInput] = useState("");
  const [reasoning, setReasoning] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPushbackNotice, setShowPushbackNotice] = useState(false);
  const [committed, setCommitted] = useState<{ label: string } | null>(null);

  async function callDirector(studentMessage: string, attemptedEarlyCommit: boolean) {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decisionId: decision.id,
          history: transcript,
          turnCount,
          studentMessage,
          attemptedEarlyCommit,
        }),
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.message ?? "The scene director could not respond.");
      }
      setTranscript((prev) => [
        ...prev,
        { speaker: "student", text: studentMessage },
        { speaker: "director", messages: body.messages },
      ]);
      setTurnCount((count) => count + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSend() {
    if (!input.trim() || isLoading) return;
    const message = input.trim();
    setInput("");
    await callDirector(message, false);
  }

  async function handleChoose(option: DecisionOption) {
    if (isLoading || committed) return;
    if (!reasoning.trim()) {
      setError("Add a line of reasoning before committing to a choice.");
      return;
    }
    setError(null);

    if (turnCount === 0) {
      setShowPushbackNotice(true);
      await callDirector(
        `I'm ready to decide: "${option.label}." My reasoning: ${reasoning.trim()}`,
        true,
      );
      return;
    }

    recordDecision({
      decision_id: decision.id,
      choice_label: option.label,
      is_compromise: option.is_compromise,
      reasoning: reasoning.trim(),
    });
    setCommitted({ label: option.label });
  }

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{meta.title}</p>
      <h1 className="mt-2 font-serif text-3xl leading-tight text-foreground md:text-4xl">{decision.title}</h1>

      <div className="mt-6 border-l-2 border-accent bg-surface px-6 py-5">
        <p className="text-sm leading-relaxed text-muted-foreground">{decision.scenario_setup}</p>
      </div>

      <div className="mt-10 flex flex-col gap-8">
        {transcript.map((turn, index) => (
          <TranscriptTurn key={index} turn={turn} castById={castById} />
        ))}
      </div>

      {isLoading && <p className="mt-6 text-sm text-muted-foreground">The room is responding...</p>}

      {!committed && (
        <>
          <div className="mt-10 border-t border-border pt-8">
            <label htmlFor="student-message" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Your response
            </label>
            <textarea
              id="student-message"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              rows={3}
              placeholder="Say what you, as CEO, want to say to the room."
              className={inputClasses}
            />
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-transform hover:border-accent hover:bg-surface active:scale-[0.98] disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                Respond
              </button>
            </div>
          </div>

          <div className="mt-10 border-t border-border pt-8">
            <label htmlFor="reasoning" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Your reasoning
            </label>
            <textarea
              id="reasoning"
              value={reasoning}
              onChange={(event) => setReasoning(event.target.value)}
              rows={2}
              placeholder="Why are you making this call?"
              className={inputClasses}
            />

            {error && <p className="mt-3 text-sm text-red-700 dark:text-red-400">{error}</p>}

            <div className="mt-5 flex flex-col gap-2">
              {decision.options.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => handleChoose(option)}
                  disabled={isLoading}
                  className="border border-border px-4 py-3 text-left text-sm text-foreground transition-colors hover:border-accent hover:bg-surface disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  {option.label}
                </button>
              ))}
            </div>

            {showPushbackNotice && !committed && (
              <p className="mt-4 text-sm italic text-muted-foreground">
                Your executives have more to say. Choose again once you have heard them out.
              </p>
            )}
          </div>
        </>
      )}

      {committed && (
        <div className="mt-10 border-l-2 border-accent bg-surface px-6 py-5">
          <p className="text-sm font-medium text-foreground">Decision recorded</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">You chose: {committed.label}</p>
          <div className="mt-6">
            <Link href={stagePath("debrief")} className={primaryButtonClasses}>
              Continue
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
