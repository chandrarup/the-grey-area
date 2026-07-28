"use client";

import { useState } from "react";
import { BusyButton } from "@/app/components/busy-button";

type Mode = "speak" | "commit";

type Option = { key: string; label: string };

export type MentionTarget = {
  roleKey: string;
  name: string;
  title?: string;
};

/**
 * Reusable answer composer: suggestion chips insert editable text (no auto-send),
 * or commit-mode option cards + reasoning.
 * Speak mode supports red @mention tags that insert into the draft.
 */
export function AnswerComposer(props: {
  mode?: Mode;
  suggestions?: string[];
  placeholder?: string;
  disabled?: boolean;
  sending?: boolean;
  onSend?: (text: string) => void | Promise<void>;
  mentionTargets?: MentionTarget[];
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
  committing?: boolean;
  commitUnlocked?: boolean;
  unlockHint?: string;
}) {
  const mode = props.mode ?? "speak";
  const [text, setText] = useState("");
  const [mentioned, setMentioned] = useState<string[]>([]);

  function mentionLabel(roleKey: string): string {
    const t = props.mentionTargets?.find((x) => x.roleKey === roleKey);
    const first = (t?.name ?? roleKey).split(/\s+/)[0] ?? roleKey;
    return `@${first}`;
  }

  function toggleMention(roleKey: string) {
    setMentioned((prev) => {
      const on = prev.includes(roleKey);
      const next = on ? prev.filter((k) => k !== roleKey) : [...prev, roleKey];
      const tag = mentionLabel(roleKey);
      setText((current) => {
        if (on) {
          return current
            .replace(new RegExp(`${tag}\\s*`, "gi"), "")
            .replace(/^\s+/, "");
        }
        if (current.toLowerCase().includes(tag.toLowerCase())) return current;
        const prefix = current.trim().length ? `${current.trim()} ` : "";
        return `${prefix}${tag} `;
      });
      return next;
    });
  }

  function send() {
    if (!text.trim() || props.sending || props.disabled) return;
    const body = text.trim();
    setText("");
    setMentioned([]);
    void props.onSend?.(body);
  }

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
                  className={`cursor-pointer border px-3 py-2 text-left text-sm transition-all hover:border-accent hover:bg-surface ${
                    props.selectedKey === o.key
                      ? "border-accent bg-surface shadow-[0_0_0_1px_color-mix(in_srgb,var(--accent)_35%,transparent)]"
                      : "border-border"
                  }`}
                  onClick={() => props.onSelectOption?.(o.key)}
                >
                  {o.label}
                </button>
              ))}
              <button
                type="button"
                className={`cursor-pointer border px-3 py-2 text-left text-sm transition-all hover:border-accent hover:bg-surface ${
                  props.selectedKey === "custom"
                    ? "border-accent bg-surface shadow-[0_0_0_1px_color-mix(in_srgb,var(--accent)_35%,transparent)]"
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
            <BusyButton
              type="button"
              pending={props.committing}
              pendingLabel="Committing…"
              disabled={props.commitDisabled}
              className="cursor-pointer bg-accent px-4 py-2 text-sm text-accent-foreground transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => void props.onCommit?.()}
            >
              Commit
            </BusyButton>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {(props.mentionTargets?.length ?? 0) > 0 ? (
        <div className="space-y-1.5">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Address
          </p>
          <div className="flex flex-wrap gap-1.5">
            {props.mentionTargets!.map((t) => {
              const on = mentioned.includes(t.roleKey);
              return (
                <button
                  key={t.roleKey}
                  type="button"
                  title={t.title ?? t.name}
                  onClick={() => toggleMention(t.roleKey)}
                  className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition-all active:scale-[0.98] ${
                    on
                      ? "border-red-600 bg-red-600/10 text-red-700 dark:text-red-400"
                      : "border-border bg-surface text-muted-foreground hover:border-red-600/50 hover:text-foreground"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      on ? "bg-red-600" : "bg-muted-foreground/40"
                    }`}
                    aria-hidden
                  />
                  @{t.name.split(/\s+/)[0]}
                </button>
              );
            })}
          </div>
          {mentioned.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {mentioned.map((roleKey) => (
                <span
                  key={roleKey}
                  className="inline-flex items-center gap-1 rounded border border-red-600/40 bg-red-600/10 px-1.5 py-0.5 text-[10px] font-medium text-red-700 dark:text-red-400"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-red-600" />
                  {mentionLabel(roleKey)}
                  <button
                    type="button"
                    className="ml-0.5 text-red-700/70 hover:text-red-700"
                    aria-label={`Remove ${mentionLabel(roleKey)}`}
                    onClick={() => toggleMention(roleKey)}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {(props.suggestions?.length ?? 0) > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {props.suggestions!.map((line) => (
            <button
              key={line.slice(0, 48)}
              type="button"
              className="max-w-full cursor-pointer truncate rounded-full border border-border bg-surface px-2.5 py-1 text-left text-[11px] text-muted-foreground transition-all hover:border-accent hover:bg-background hover:text-foreground hover:shadow-[0_0_0_1px_color-mix(in_srgb,var(--accent)_30%,transparent)] active:scale-[0.98]"
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
              send();
            }
          }}
          rows={2}
          disabled={props.disabled}
          className="min-h-[2.75rem] flex-1 resize-none rounded-2xl border border-border bg-background px-4 py-2.5 text-sm focus:border-accent focus:outline-none disabled:opacity-50"
          placeholder={props.placeholder ?? "Speak in character…"}
        />
        <BusyButton
          type="button"
          pending={props.sending}
          pendingLabel="Sending…"
          disabled={props.disabled || !text.trim()}
          className="mb-0.5 shrink-0 cursor-pointer rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          onClick={send}
        >
          Send
        </BusyButton>
      </div>
    </div>
  );
}
