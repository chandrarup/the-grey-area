"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { ArrowLeft, ArrowClockwise, House } from "@phosphor-icons/react";

/**
 * Global nav: back, refresh, home — available on every page via the header.
 */
export function NavControls() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        title="Back"
        aria-label="Back"
        className="inline-flex h-8 items-center gap-1.5 border border-border px-2.5 text-xs text-muted-foreground transition-colors hover:border-accent hover:text-foreground"
        onClick={() => {
          if (typeof window !== "undefined" && window.history.length > 1) {
            router.back();
          } else {
            router.push("/");
          }
        }}
      >
        <ArrowLeft size={14} weight="bold" />
        <span className="hidden sm:inline">Back</span>
      </button>
      <button
        type="button"
        title="Refresh"
        aria-label="Refresh"
        disabled={pending}
        className="inline-flex h-8 items-center gap-1.5 border border-border px-2.5 text-xs text-muted-foreground transition-colors hover:border-accent hover:text-foreground disabled:opacity-50"
        onClick={() =>
          startTransition(() => {
            router.refresh();
          })
        }
      >
        <ArrowClockwise
          size={14}
          weight="bold"
          className={pending ? "animate-spin" : undefined}
        />
        <span className="hidden sm:inline">Refresh</span>
      </button>
      <button
        type="button"
        title="Home"
        aria-label="Home"
        className="inline-flex h-8 items-center gap-1.5 border border-border px-2.5 text-xs text-muted-foreground transition-colors hover:border-accent hover:text-foreground"
        onClick={() => router.push("/")}
      >
        <House size={14} weight="bold" />
        <span className="hidden sm:inline">Home</span>
      </button>
    </div>
  );
}
