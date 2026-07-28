"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { LoadingSpinner } from "@/app/components/loading-spinner";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  pending?: boolean;
  pendingLabel?: string;
  children: ReactNode;
};

/**
 * Button that swaps to a spinner + label while work is in flight.
 * Always keep pending=true for the full server round-trip.
 */
export function BusyButton({
  pending = false,
  pendingLabel = "Working…",
  children,
  disabled,
  className = "",
  type = "button",
  ...rest
}: Props) {
  return (
    <button
      type={type}
      disabled={disabled || pending}
      aria-busy={pending}
      className={`${className} ${pending ? "cursor-wait opacity-90" : ""}`}
      {...rest}
    >
      {pending ? <LoadingSpinner label={pendingLabel} /> : children}
    </button>
  );
}
