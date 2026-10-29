"use client";

import { useState, useTransition } from "react";
import { BusyButton } from "@/app/components/busy-button";
import { withBusyBar } from "@/app/components/navigation-progress";

const inputClasses =
  "mt-2 w-full border border-border bg-background px-4 py-3 text-sm text-foreground focus:border-accent focus:outline-none";

export function ReflectionForm({
  questions,
  onSubmit,
  subtitle = "Answer these before your assessment is prepared.",
}: {
  questions: string[];
  onSubmit: (answers: string[]) => Promise<void>;
  subtitle?: string;
}) {
  const [answers, setAnswers] = useState<string[]>(() =>
    questions.map(() => ""),
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (answers.some((a) => a.trim().length < 10)) {
      setError("Please answer each question (at least a short sentence).");
      return;
    }
    setError(null);
    startTransition(async () => {
      await withBusyBar(async () => {
        await onSubmit(answers.map((a) => a.trim()));
      });
    });
  }

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Reflection
      </p>
      <h1 className="mt-2 font-serif text-3xl text-foreground">
        Look back on the path
      </h1>
      <p className="mt-4 text-sm text-muted-foreground">{subtitle}</p>
      <form onSubmit={handleSubmit} className="mt-10 flex flex-col gap-8">
        {questions.map((q, i) => (
          <div key={i}>
            <label className="text-sm font-medium text-foreground">{q}</label>
            <textarea
              value={answers[i]}
              onChange={(e) => {
                const next = [...answers];
                next[i] = e.target.value;
                setAnswers(next);
              }}
              rows={3}
              className={inputClasses}
              disabled={pending}
            />
          </div>
        ))}
        {error ? (
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        ) : null}
        <BusyButton
          type="submit"
          pending={pending}
          pendingLabel="Submitting…"
          className="self-start bg-accent px-6 py-3 text-sm font-medium text-accent-foreground disabled:opacity-50"
        >
          Submit reflections
        </BusyButton>
      </form>
    </div>
  );
}
