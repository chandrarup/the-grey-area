"use client";

import { useTransition } from "react";
import { LoadingSpinner } from "@/app/components/loading-spinner";
import { withBusyBar } from "@/app/components/navigation-progress";

/**
 * Landing CTAs — show spinner + top progress while the server action redirects.
 */
export function EnterPathButton({
  action,
  variant,
  eyebrow,
  title,
  body,
}: {
  action: () => Promise<void>;
  variant: "accent" | "outline";
  eyebrow: string;
  title: string;
  body: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      aria-busy={pending}
      onClick={() =>
        startTransition(async () => {
          await withBusyBar(async () => {
            await action();
          });
        })
      }
      className={
        variant === "accent"
          ? "group flex h-full w-full flex-col items-start border border-transparent bg-accent px-6 py-7 text-left text-accent-foreground transition-all hover:brightness-110 disabled:cursor-wait disabled:opacity-90"
          : "group flex h-full w-full flex-col items-start border border-border bg-background/80 px-6 py-7 text-left transition-all hover:border-accent hover:bg-surface disabled:cursor-wait disabled:opacity-90"
      }
    >
      {pending ? (
        <LoadingSpinner
          label="Opening…"
          size="md"
          className={
            variant === "accent"
              ? "text-accent-foreground"
              : "text-foreground"
          }
        />
      ) : (
        <>
          <span
            className={
              variant === "accent"
                ? "text-xs uppercase tracking-[0.12em] opacity-80"
                : "text-xs uppercase tracking-[0.12em] text-muted-foreground"
            }
          >
            {eyebrow}
          </span>
          <span
            className={
              variant === "accent"
                ? "mt-3 font-serif text-2xl"
                : "mt-3 font-serif text-2xl text-foreground"
            }
          >
            {title}
          </span>
          <span
            className={
              variant === "accent"
                ? "mt-2 text-sm opacity-80"
                : "mt-2 text-sm text-muted-foreground"
            }
          >
            {body}
          </span>
        </>
      )}
    </button>
  );
}
