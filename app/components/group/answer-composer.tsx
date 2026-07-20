"use client";

import { useState } from "react";

type Mode = "speak" | "commit";

type Option = { key: string; label: string };

/**
 * Reusable answer composer: suggestion chips insert editable text (no auto-send),
 * or commit-mode option cards + reasoning.
 */
export function AnswerComposer(props: {
  mode?: Mode;
  suggestions?: string[];
  placeholder?: string;
  disabled?: boolean;
  sending?: boolean;
  onSend?: (text: string) => void | Promise<void>;
  /** Commit mode */
  options?: Option[];
  reasoning?: string;
  onReasoningChange?: (v: string) => void;
  selectedKey?: string | null;
  onSelectOption?: (key: string | null) => void;
  customText?: string;
  onCustomTextChange?: (v: string) => void;
  onCommit?: () => void | Promise<void>;
  commitDisabled?: boolean;
  commitUnlocked?: boolean;
  unlockHint?: string;
}) {
  const mode = props.mode ?? "speak";
  const [text, setText] = useState("");

  if (mode === "commit") {
    return (
      <div className="space-y-4">
        {!props.commitUnlocked ? (
          <p className="text-sm italic text-muted-foreground">
            {props.unlockHint ?? "Commit unlocks after enough discussion."}
          </p>
        ) : (
          <>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              CEO decision
            </p>
            <div className="flex flex-col gap-2">
              {(props.options ?? []).map((o) => (
                <button
                  key={o.key}
                  type="button"
                  className={`border px-3 py-2 text-left text-sm ${
                    props.selectedKey === o.key
                      ? "border-accent bg-surface"
                      : "border-border"
                  }`}
                  onClick={() => props.onSelectOption?.(o.key)}
                >
                  {o.label}
                </button>
              ))}
              <button
                type="button"
                className={`border px-3 py-2 text-left text-sm ${
                  props.selectedKey === "custom"
                    ? "border-accent bg-surface"
                    : "border-border"
                }`}
                onClick={() => props.onSelectOption?.("custom")}
              >
                Something else — in your own words
              </button>
            </div>
            {props.selectedKey === "custom" ? (
              <textarea
                value={props.customText ?? ""}
                onChange={(e) => props.onCustomTextChange?.(e.target.value)}
                rows={2}
                className="w-full border border-border bg-background px-3 py-2 text-sm"
                placeholder="Describe your decision…"
              />
            ) : null}
            <textarea
              value={props.reasoning ?? ""}
              onChange={(e) => props.onReasoningChange?.(e.target.value)}
              rows={3}
              className="w-full border border-border bg-background px-3 py-2 text-sm"
              placeholder="Reasoning (required, 20+ characters)"
            />
            <button
              type="button"
              disabled={props.commitDisabled}
              className="bg-accent px-4 py-2 text-sm text-accent-foreground disabled:opacity-50"
              onClick={() => void props.onCommit?.()}
            >
              Commit
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {(props.suggestions?.length ?? 0) > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {props.suggestions!.map((line) => (
            <button
              key={line.slice(0, 48)}
              type="button"
              className="max-w-full truncate rounded-full border border-border bg-surface px-2.5 py-1 text-left text-[11px] text-muted-foreground hover:border-accent hover:text-foreground"
              title={line}
              onClick={() => setText(line)}
            >
              {line.length > 72 ? `${line.slice(0, 72)}…` : line}
            </button>
          ))}
        </div>
      ) : null}
      <div className="flex items-end gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (!text.trim() || props.sending || props.disabled) return;
              const body = text.trim();
              setText("");
              void props.onSend?.(body);
            }
          }}
          rows={2}
          disabled={props.disabled}
          className="min-h-[2.75rem] flex-1 resize-none rounded-2xl border border-border bg-background px-4 py-2.5 text-sm focus:border-accent focus:outline-none disabled:opacity-50"
          placeholder={props.placeholder ?? "Speak in character…"}
        />
        <button
          type="button"
          disabled={props.sending || props.disabled || !text.trim()}
          className="mb-0.5 shrink-0 rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground disabled:opacity-40"
          onClick={() => {
            if (!text.trim()) return;
            const body = text.trim();
            setText("");
            void props.onSend?.(body);
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
