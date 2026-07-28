"use client";

import { useEffect, useState } from "react";

function envBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_BASE_URL?.replace(/\/$/, "") || "";
}

/** Prefer localhost when developing; otherwise env or current origin. */
function resolveClientBaseUrl(): string {
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") {
    return window.location.origin;
  }
  return envBaseUrl() || window.location.origin;
}

export function ShareSeatLinks({
  seats,
  sessionCode,
  groupDisplayName,
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
  groupDisplayName?: string | null;
}) {
  const [copied, setCopied] = useState<string | null>(null);
  // Same on server + first client paint to avoid hydration mismatch.
  const [baseUrl, setBaseUrl] = useState(envBaseUrl);

  useEffect(() => {
    setBaseUrl(resolveClientBaseUrl());
  }, []);

  function absoluteJoinUrl(token: string) {
    const base = baseUrl || (typeof window !== "undefined" ? window.location.origin : "");
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
        {groupDisplayName?.trim() ? (
          <>
            <span className="text-sm font-medium text-foreground">
              {groupDisplayName.trim()}
            </span>
            <span className="text-xs text-muted-foreground">· join code</span>
          </>
        ) : (
          <span className="text-sm text-muted-foreground">Join code</span>
        )}
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
        Each seat has a{" "}
        <span className="font-medium text-foreground">different</span> token.
        Use two browsers (or one normal + one private window) so cookies
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
                <span className="text-muted-foreground/70">/?join=</span>
                <span className="bg-accent/15 text-foreground">{seat.token}</span>
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="cursor-pointer border border-border px-3 py-1.5 text-xs transition-all hover:border-accent hover:bg-surface hover:text-foreground"
                  onClick={() => void copy(seat.roleKey, url)}
                >
                  {copied === seat.roleKey
                    ? "Copied"
                    : `Copy ${seat.roleKey} link`}
                </button>
                <a
                  href={`/group/open?token=${encodeURIComponent(seat.token)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="cursor-pointer border border-border bg-surface px-3 py-1.5 text-xs transition-all hover:border-accent hover:bg-background hover:shadow-[0_0_0_1px_color-mix(in_srgb,var(--accent)_30%,transparent)]"
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
