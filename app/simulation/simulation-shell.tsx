"use client";

import { usePathname } from "next/navigation";
import { STAGES } from "./stages";
import { StepRail } from "./step-rail";
import { ResetSoloButton } from "@/app/components/reset-solo-button";

export function SimulationShell({
  children,
  showReset,
}: {
  children: React.ReactNode;
  showReset: boolean;
}) {
  const pathname = usePathname();
  const currentSlug = pathname.split("/").filter(Boolean).pop() ?? "";

  return (
    <div className="mx-auto flex max-w-5xl gap-16 px-6 py-12 md:px-8 md:py-16">
      <aside className="hidden w-56 shrink-0 pt-1 md:block">
        <StepRail stages={STAGES} currentSlug={currentSlug} />
        {showReset ? (
          <div className="mt-10">
            <ResetSoloButton label="Start over" />
          </div>
        ) : null}
      </aside>
      <div className="min-w-0 flex-1">
        <div className="mb-8 md:hidden">
          <StepRail stages={STAGES} currentSlug={currentSlug} />
        </div>
        <div
          className={`mx-auto ${
            currentSlug === "decisions" ? "max-w-2xl" : "max-w-xl"
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
