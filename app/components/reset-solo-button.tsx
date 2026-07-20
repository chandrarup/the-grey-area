"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  resetSoloRunAction,
  resetSoloRunAsStaff,
} from "@/app/simulation/actions";

export function ResetSoloButton({
  runId,
  asStaff = false,
  label = "Reset solo run",
}: {
  runId?: string;
  asStaff?: boolean;
  label?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      className="border border-border px-4 py-2 text-sm text-foreground hover:border-accent disabled:opacity-50"
      onClick={() => {
        if (
          !confirm(
            "Reset wipes all decisions, messages, and grades for this solo attempt. Continue?",
          )
        ) {
          return;
        }
        startTransition(async () => {
          if (asStaff && runId) {
            await resetSoloRunAsStaff(runId);
          } else {
            await resetSoloRunAction(runId);
          }
          router.push("/simulation/leadership-team");
          router.refresh();
        });
      }}
    >
      {pending ? "Resetting…" : label}
    </button>
  );
}
