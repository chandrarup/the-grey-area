"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveValuesAnswer } from "../actions";
import { stagePath } from "../stages";

const inputClasses =
  "mt-2 w-full border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none";

export function ValuesForm({
  runId,
  initialAnswer,
}: {
  runId: string;
  initialAnswer: string;
}) {
  const router = useRouter();
  const [answer, setAnswer] = useState(initialAnswer);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (answer.trim().length < 20) {
      setError("Write at least a short paragraph (20+ characters).");
      return;
    }
    setError(null);
    startTransition(async () => {
      await saveValuesAnswer(runId, answer.trim());
      router.push(stagePath("decisions"));
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-10">
      <label
        htmlFor="values"
        className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
      >
        What will guide you when growth, loyalty, and integrity collide?
      </label>
      <textarea
        id="values"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        rows={6}
        className={inputClasses}
        placeholder="Name the stakeholders and standards you refuse to abandon…"
      />
      {error ? (
        <p className="mt-3 text-sm text-red-700 dark:text-red-400">{error}</p>
      ) : null}
      <div className="mt-6">
        <button
          type="submit"
          disabled={pending}
          className="bg-accent px-6 py-3 text-sm font-medium text-accent-foreground transition-transform hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
        >
          {pending ? "Saving…" : "Enter the simulation"}
        </button>
      </div>
    </form>
  );
}
