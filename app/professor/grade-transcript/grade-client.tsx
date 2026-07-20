"use client";

import { useState, useTransition } from "react";
import { gradeTranscriptAction } from "./actions";
import type { AssessmentPayload } from "@/lib/engine/grader";

export function GradeTranscriptClient() {
  const [transcript, setTranscript] = useState("");
  const [result, setResult] = useState<AssessmentPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="mx-auto max-w-2xl px-6 py-12 md:px-8">
      <a href="/professor" className="text-sm underline">
        ← Dashboard
      </a>
      <h1 className="mt-4 font-serif text-3xl text-foreground">
        Grade a transcript
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Paste a playground or exported transcript. Uses the same 10-dimension
        rubric as solo runs.
      </p>
      <textarea
        className="mt-8 w-full border border-border bg-background px-3 py-2 text-sm"
        rows={12}
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
        placeholder="Paste transcript…"
      />
      {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
      <button
        type="button"
        disabled={pending || transcript.trim().length < 40}
        className="mt-4 bg-accent px-4 py-2 text-sm text-accent-foreground disabled:opacity-50"
        onClick={() =>
          startTransition(async () => {
            setError(null);
            try {
              const assessment = await gradeTranscriptAction(transcript);
              setResult(assessment);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Grading failed");
            }
          })
        }
      >
        {pending ? "Grading…" : "Grade"}
      </button>

      {result ? (
        <pre className="mt-8 overflow-x-auto border border-border p-4 text-xs text-muted-foreground">
          {JSON.stringify(result, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}
