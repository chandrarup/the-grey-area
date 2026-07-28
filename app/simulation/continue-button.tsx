"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { advanceStage } from "./actions";
import { stagePath } from "./stages";
import { BusyButton } from "@/app/components/busy-button";
import { withBusyBar } from "@/app/components/navigation-progress";

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
    <BusyButton
      type="button"
      pending={pending}
      pendingLabel="Continuing…"
      className="inline-block bg-accent px-6 py-3 text-sm font-medium text-accent-foreground transition-transform hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
      onClick={() =>
        startTransition(async () => {
          await withBusyBar(async () => {
            await advanceStage(runId, fromSlug);
            router.push(stagePath(toSlug));
          });
        })
      }
    >
      {label}
    </BusyButton>
  );
}
