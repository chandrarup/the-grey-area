"use client";

import { useState } from "react";

function appBaseUrl() {
  if (typeof window !== "undefined") {
    return (
      process.env.NEXT_PUBLIC_APP_BASE_URL?.replace(/\/$/, "") ||
      window.location.origin
    );
  }
  return process.env.NEXT_PUBLIC_APP_BASE_URL?.replace(/\/$/, "") || "";
}

export function ShareSeatLinks({
  seats,
  sessionCode,
}: {
  seats: {
    roleKey: string;
    title: string;
    token: string;
    displayName: string | null;
    isReady: boolean;
    isAi?: boolean;
  }[];
  sessionCode: string;
}) {
  const [copied, setCopied] = useState<string | null>(null);

  function absoluteJoinUrl(token: string) {
    const base = appBaseUrl();
    return `${base}/?join=${encodeURIComponent(token)}`;
  }

  async function copy(label: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied("failed");
    }
  }

  return (
    <div className="mt-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Session code</span>
        <code className="border border-border bg-surface px-2 py-1 text-sm">
          {sessionCode}
        </code>
        <button
          type="button"
          className="text-xs underline"
          onClick={() => void copy("code", sessionCode)}
        >
          {copied === "code" ? "Copied" : "Copy"}
        </button>
      </div>

      <p className="text-xs text-muted-foreground">
        Each seat has a <span className="font-medium text-foreground">different</span>{" "}
        token. Use two browsers (or one normal + one private window) so cookies
        don&apos;t collide.
      </p>

      <ul className="space-y-3">
        {seats.map((seat) => {
          const url = absoluteJoinUrl(seat.token);
          const tokenTail = seat.token.slice(-8);
          return (
            <li
              key={seat.roleKey}
              className="border border-border bg-background px-3 py-3"
            >
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="rounded bg-surface px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-foreground">
                  {seat.roleKey}
                </span>
                <p className="text-sm font-medium text-foreground">
                  {seat.title}
                </p>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {seat.displayName
                  ? `${seat.displayName}${seat.isReady ? " · ready" : " · joined"}`
                  : "Not joined yet"}
              </p>

              <p className="mt-3 text-[10px] uppercase tracking-wide text-muted-foreground">
                Unique seat token
              </p>
              <p className="mt-1 font-mono text-xs text-foreground">
                …{tokenTail}
              </p>

              <p className="mt-3 break-all font-mono text-[11px] leading-relaxed text-muted-foreground">
                <span className="text-muted-foreground/70">
                  {appBaseUrl()}/?join=
                </span>
                <span className="bg-accent/15 text-foreground">{seat.token}</span>
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="border border-border px-3 py-1.5 text-xs"
                  onClick={() => void copy(seat.roleKey, url)}
                >
                  {copied === seat.roleKey
                    ? "Copied"
                    : `Copy ${seat.roleKey} link`}
                </button>
                <a
                  href={`/group/join?token=${encodeURIComponent(seat.token)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="border border-border bg-surface px-3 py-1.5 text-xs"
                >
                  Open {seat.roleKey} in new tab
                </a>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
