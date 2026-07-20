"use client";

import { CastAvatar } from "./cast-avatar";

export function ThinkingIndicator({
  name,
  castId,
}: {
  name: string;
  castId: string;
}) {
  return (
    <div className="flex items-end gap-2.5 chat-bubble-in">
      <CastAvatar castId={castId} name={name} size="sm" />
      <div className="rounded-2xl rounded-bl-md bg-surface px-4 py-3 shadow-sm">
        <p className="mb-1.5 text-[11px] font-medium text-muted-foreground">
          {name.split(" ")[0]} is thinking
        </p>
        <div className="flex items-center gap-1.5" aria-label="Typing">
          <span className="chat-dot" />
          <span className="chat-dot [animation-delay:150ms]" />
          <span className="chat-dot [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}
