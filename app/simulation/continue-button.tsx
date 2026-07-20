"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { advanceStage } from "./actions";
import { stagePath } from "./stages";

export function ContinueButton({
  runId,
  fromSlug,
  toSlug,
  label,
}: {
  runId: string;
  fromSlug: string;
  toSlug: string;
  label: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      className="inline-block bg-accent px-6 py-3 text-sm font-medium text-accent-foreground transition-transform hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
      onClick={() =>
        startTransition(async () => {
          await advanceStage(runId, fromSlug);
          router.push(stagePath(toSlug));
        })
      }
    >
      {pending ? "…" : label}
    </button>
  );
}
