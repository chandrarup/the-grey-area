"use client";

import { useState } from "react";

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
  }[];
  sessionCode: string;
}) {
  const [copied, setCopied] = useState<string | null>(null);

  function absoluteJoinUrl(token: string) {
    if (typeof window === "undefined") return `/group/open?token=${token}`;
    return `${window.location.origin}/group/open?token=${token}`;
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

      <ul className="divide-y divide-border border border-border">
        {seats.map((seat) => {
          const url = absoluteJoinUrl(seat.token);
          return (
            <li
              key={seat.roleKey}
              className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-medium text-foreground">
                  {seat.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {seat.displayName
                    ? `${seat.displayName}${seat.isReady ? " · ready" : " · joined"}`
                    : "Not joined yet"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="border border-border px-3 py-1.5 text-xs"
                  onClick={() => void copy(seat.roleKey, url)}
                >
                  {copied === seat.roleKey ? "Copied link" : "Copy join link"}
                </button>
                <a
                  href={`/group/open?token=${seat.token}`}
                  target="_blank"
                  rel="noreferrer"
                  className="border border-border bg-surface px-3 py-1.5 text-xs"
                >
                  Open window
                </a>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
