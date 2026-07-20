"use client";

import type { CastMember } from "@/lib/case/types";
import { CastAvatar } from "./cast-avatar";

export function MessageBubble({
  side,
  castId,
  name,
  role,
  text,
  animate,
}: {
  side: "left" | "right";
  castId: string;
  name: string;
  role?: string;
  text: string;
  animate?: boolean;
}) {
  const isRight = side === "right";

  return (
    <div
      className={`flex max-w-[min(100%,28rem)] items-end gap-2.5 ${
        isRight ? "ml-auto flex-row-reverse" : ""
      } ${animate ? "chat-bubble-in" : ""}`}
    >
      <CastAvatar castId={castId} name={name} size="sm" />
      <div
        className={`min-w-0 rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
          isRight
            ? "rounded-br-md bg-accent text-accent-foreground"
            : "rounded-bl-md bg-surface text-foreground"
        }`}
      >
        {!isRight ? (
          <p className="mb-1 text-[11px] font-medium text-muted-foreground">
            {name}
            {role ? (
              <span className="font-normal opacity-80"> · {shortRole(role)}</span>
            ) : null}
          </p>
        ) : (
          <p className="mb-1 text-[11px] font-medium text-accent-foreground/70">
            You
            {castId === "ceo" ? " · CEO" : ""}
          </p>
        )}
        <p className="whitespace-pre-wrap">{text}</p>
      </div>
    </div>
  );
}

function shortRole(role: string) {
  if (role.length <= 36) return role;
  return role.slice(0, 34).trimEnd() + "…";
}

export function memberLabel(
  castById: Map<string, CastMember>,
  castId: string,
) {
  const m = castById.get(castId);
  return {
    name: m?.name ?? castId,
    role: m?.role,
  };
}
