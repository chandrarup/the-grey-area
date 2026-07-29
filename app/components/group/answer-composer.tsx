"use client";

import { useMemo, useRef, useState } from "react";
import { BusyButton } from "@/app/components/busy-button";

type Mode = "speak" | "commit";

type Option = { key: string; label: string };

export type MentionTarget = {
  roleKey: string;
  name: string;
  title?: string;
};

function firstName(name: string) {
  return name.split(/\s+/)[0] ?? name;
}

/**
 * Reusable answer composer: suggestion chips insert editable text (no auto-send),
 * or commit-mode option cards + reasoning.
 * Speak mode supports inline @mention typeahead in the textarea.
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionStart, setMentionStart] = useState<number | null>(null);
  const [mentionFilter, setMentionFilter] = useState("");
  const [mentionIndex, setMentionIndex] = useState(0);

  const filteredMentions = useMemo(() => {
    if (!mentionOpen || !props.mentionTargets?.length) return [];
    const q = mentionFilter.toLowerCase();
    return props.mentionTargets.filter((t) => {
      const first = firstName(t.name).toLowerCase();
      const full = t.name.toLowerCase();
      return !q || first.startsWith(q) || full.includes(q);
    });
  }, [mentionFilter, mentionOpen, props.mentionTargets]);

  function syncMentionState(value: string, cursor: number) {
    const before = value.slice(0, cursor);
    const match = before.match(/@([\w]*)$/);
    if (match && (props.mentionTargets?.length ?? 0) > 0) {
      setMentionOpen(true);
      setMentionStart(cursor - match[0].length);
      setMentionFilter(match[1] ?? "");
      setMentionIndex(0);
      return;
    }
    setMentionOpen(false);
    setMentionStart(null);
    setMentionFilter("");
  }

  function insertMention(target: MentionTarget) {
    if (mentionStart === null) return;
    const el = textareaRef.current;
    const cursor = el?.selectionStart ?? text.length;
    const tag = `@${firstName(target.name)}`;
    const before = text.slice(0, mentionStart);
    const after = text.slice(cursor);
    const spacer = after.startsWith(" ") || after.length === 0 ? "" : " ";
    const next = `${before}${tag}${spacer}${after}`;
    setText(next);
    setMentionOpen(false);
    setMentionStart(null);
    setMentionFilter("");
    requestAnimationFrame(() => {
      if (!el) return;
      const pos = before.length + tag.length + spacer.length;
      el.focus();
      el.setSelectionRange(pos, pos);
    });
  }

  function send() {
    if (!text.trim() || props.sending || props.disabled) return;
    const body = text.trim();
    setText("");
    setMentionOpen(false);
    setMentionStart(null);
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
              className="cursor-pointer border border-accent bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
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
      {(props.suggestions?.length ?? 0) > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {props.suggestions!.map((line) => (
            <button
              key={line.slice(0, 48)}
              type="button"
              className="max-w-full cursor-pointer truncate rounded-[2px] border border-dashed border-border-strong bg-transparent px-2.5 py-1 text-left text-[12.5px] text-muted-foreground transition-all hover:border-accent hover:bg-surface-raised hover:text-foreground active:scale-[0.98]"
              title={line}
              onClick={() => setText(line)}
            >
              {line.length > 72 ? `${line.slice(0, 72)}…` : line}
            </button>
          ))}
        </div>
      ) : null}

      <div className="relative flex items-end gap-2">
        {mentionOpen && filteredMentions.length > 0 ? (
          <ul
            className="absolute bottom-full left-0 z-10 mb-1 max-h-48 w-full min-w-[14rem] overflow-y-auto border border-border bg-background shadow-sm"
            role="listbox"
          >
            {filteredMentions.map((t, i) => (
              <li key={t.roleKey}>
                <button
                  type="button"
                  role="option"
                  aria-selected={i === mentionIndex}
                  className={`flex w-full flex-col gap-0.5 px-3 py-2 text-left transition-colors ${
                    i === mentionIndex
                      ? "bg-accent/10 text-foreground"
                      : "text-foreground hover:bg-surface"
                  }`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    insertMention(t);
                  }}
                >
                  <span className="text-sm font-medium">
                    @{firstName(t.name)}
                  </span>
                  {t.title ? (
                    <span className="text-[11px] text-muted-foreground">
                      {t.name} · {t.title}
                    </span>
                  ) : (
                    <span className="text-[11px] text-muted-foreground">
                      {t.name}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => {
            const val = e.target.value;
            const cursor = e.target.selectionStart ?? val.length;
            setText(val);
            syncMentionState(val, cursor);
          }}
          onClick={(e) => {
            const el = e.currentTarget;
            syncMentionState(el.value, el.selectionStart ?? el.value.length);
          }}
          onKeyDown={(e) => {
            if (mentionOpen && filteredMentions.length > 0) {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setMentionIndex((i) =>
                  Math.min(i + 1, filteredMentions.length - 1),
                );
                return;
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setMentionIndex((i) => Math.max(i - 1, 0));
                return;
              }
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                insertMention(filteredMentions[mentionIndex]!);
                return;
              }
              if (e.key === "Escape") {
                e.preventDefault();
                setMentionOpen(false);
                setMentionStart(null);
                return;
              }
              if (e.key === "Tab") {
                e.preventDefault();
                insertMention(filteredMentions[mentionIndex]!);
                return;
              }
            }
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={3}
          disabled={props.disabled}
          className="min-h-[3.25rem] flex-1 resize-y rounded-[2px] border border-border bg-background px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_16%,transparent)] disabled:opacity-50"
          placeholder={
            props.placeholder ??
            "Speak in character… Type @ to address someone"
          }
        />
        <BusyButton
          type="button"
          pending={props.sending}
          pendingLabel="Sending…"
          disabled={props.disabled || !text.trim()}
          className="mb-0.5 shrink-0 cursor-pointer bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          onClick={send}
        >
          Send
        </BusyButton>
      </div>
    </div>
  );
}
