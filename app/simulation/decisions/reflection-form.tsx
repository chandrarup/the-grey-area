"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveReflections } from "../actions";
import { stagePath } from "../stages";

const inputClasses =
  "mt-2 w-full border border-border bg-background px-4 py-3 text-sm text-foreground focus:border-accent focus:outline-none";

export function ReflectionForm({
  runId,
  questions,
}: {
  runId: string;
  questions: string[];
}) {
  const router = useRouter();
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
      await saveReflections(
        runId,
        answers.map((a) => a.trim()),
      );
      router.push(stagePath("debrief"));
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
      <p className="mt-4 text-sm text-muted-foreground">
        Answer these before your assessment is prepared.
      </p>
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
            />
          </div>
        ))}
        {error ? (
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="self-start bg-accent px-6 py-3 text-sm font-medium text-accent-foreground disabled:opacity-50"
        >
          {pending ? "Submitting…" : "Submit reflections"}
        </button>
      </form>
    </div>
  );
}
