"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { releaseRunAssessment, triggerGradeRun } from "./actions";

export function ReleaseForm({ runId }: { runId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="mt-3"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const notes = String(fd.get("notes") ?? "");
        startTransition(async () => {
          await releaseRunAssessment(runId, notes);
          router.refresh();
        });
      }}
    >
      <textarea
        name="notes"
        rows={2}
        placeholder="Optional professor notes"
        className="w-full border border-border bg-background px-3 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={pending}
        className="mt-2 bg-accent px-4 py-2 text-sm text-accent-foreground disabled:opacity-50"
      >
        {pending ? "Releasing…" : "Release to student"}
      </button>
    </form>
  );
}

export function GradeButton({ runId }: { runId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      className="border border-border px-4 py-2 text-sm hover:border-accent disabled:opacity-50"
      onClick={() =>
        startTransition(async () => {
          await triggerGradeRun(runId);
          router.refresh();
        })
      }
    >
      {pending ? "Grading…" : "Run AI grader"}
    </button>
  );
}
