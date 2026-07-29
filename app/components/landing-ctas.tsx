"use client";

import { useTransition } from "react";
import { enterAsInstructor, enterAsStudent } from "@/app/actions/enter";
import { LoadingSpinner } from "@/app/components/loading-spinner";
import { withBusyBar } from "@/app/components/navigation-progress";

export function LandingCtas() {
  const [pending, startTransition] = useTransition();

  return (
    <div className="mt-2 flex flex-wrap gap-3.5">
      <button
        type="button"
        disabled={pending}
        aria-busy={pending}
        onClick={() =>
          startTransition(async () => {
            await withBusyBar(async () => {
              await enterAsStudent();
            });
          })
        }
        className="inline-flex items-center gap-2.5 border border-accent bg-accent px-7 py-3.5 text-[15px] font-semibold text-accent-foreground transition-all hover:brightness-110 active:translate-y-px disabled:cursor-wait disabled:opacity-90"
      >
        {pending ? (
          <LoadingSpinner label="Opening…" className="text-accent-foreground" />
        ) : (
          "Enter as student"
        )}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await withBusyBar(async () => {
              await enterAsInstructor();
            });
          })
        }
        className="border border-border-strong bg-transparent px-7 py-3.5 text-[15px] font-medium text-foreground transition-all hover:border-muted-foreground hover:bg-surface-raised active:translate-y-px disabled:cursor-wait disabled:opacity-90"
      >
        I&apos;m an instructor
      </button>
    </div>
  );
}
