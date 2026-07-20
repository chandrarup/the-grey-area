"use client";

import { usePathname } from "next/navigation";
import { STAGES } from "./stages";
import { StepRail } from "./step-rail";
import { ResetSoloButton } from "@/app/components/reset-solo-button";
import { NavControls } from "@/app/components/nav-controls";

export default function SimulationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const currentSlug = pathname.split("/").filter(Boolean).pop() ?? "";

  return (
    <div className="mx-auto flex max-w-5xl gap-16 px-6 py-16 md:px-8 md:py-20">
      <aside className="w-64 shrink-0 pt-1">
        <div className="mb-8 sm:hidden">
          <NavControls />
        </div>
        <StepRail stages={STAGES} currentSlug={currentSlug} />
        <div className="mt-10 flex flex-col gap-3">
          <ResetSoloButton label="Start over" />
        </div>
      </aside>
      <div className="min-w-0 flex-1">
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
