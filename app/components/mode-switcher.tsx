"use client";

import { useTransition } from "react";
import { setAppMode } from "@/app/actions/mode";
import type { AppMode } from "@/lib/mode";

const MODES: { id: AppMode; label: string }[] = [
  { id: "admin", label: "Admin" },
  { id: "professor", label: "Professor" },
  { id: "student", label: "Student" },
];

export function ModeSwitcher({ current }: { current: AppMode }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-1 rounded border border-border p-0.5">
      {MODES.map((mode) => {
        const active = current === mode.id;
        return (
          <button
            key={mode.id}
            type="button"
            disabled={pending || active}
            onClick={() => startTransition(() => setAppMode(mode.id))}
            className={`px-2.5 py-1 text-xs font-medium transition-colors ${
              active
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground"
            } disabled:opacity-60`}
          >
            {mode.label}
          </button>
        );
      })}
    </div>
  );
}
