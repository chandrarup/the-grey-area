"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CastMember, Scene, SceneProp } from "@/lib/case/types";
import type { SceneTurn } from "@/lib/engine/scene-director";
import {
  acknowledgeProps,
  commitSceneDecision,
  persistCharacterMessages,
  persistStudentMessage,
} from "../actions";
import { MarkdownBody } from "@/app/components/markdown-body";
import { CastAvatar } from "@/app/components/chat/cast-avatar";
import { MessageBubble, memberLabel } from "@/app/components/chat/message-bubble";
import { ThinkingIndicator } from "@/app/components/chat/thinking-indicator";
import { stagePath } from "../stages";

type DbMessage = {
  id: number;
  sender: string;
  castId: string | null;
  content: string;
};

type FlatMessage = {
  id: string;
  side: "left" | "right";
  castId: string;
  name: string;
  role?: string;
  text: string;
  animate?: boolean;
};

type Props = {
  runId: string;
  caseSlug: string;
  caseTitle: string;
  cast: CastMember[];
  scene: Scene;
  integrity: string;
  depth: number;
  maxDepth: number;
  priorDecisions: { sceneId: string; choice: string; reasoning: string }[];
  initialMessages: DbMessage[];
  needsProps: boolean;
  props: SceneProp[];
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function flattenTranscript(
  turns: SceneTurn[],
  castById: Map<string, CastMember>,
): FlatMessage[] {
  const out: FlatMessage[] = [];
  let i = 0;
  for (const turn of turns) {
    if (turn.speaker === "student") {
      out.push({
        id: `s-${i++}`,
        side: "right",
        castId: "ceo",
        name: "You",
        text: turn.text,
      });
    } else {
      for (const msg of turn.messages) {
        const label = memberLabel(castById, msg.cast_id);
        out.push({
          id: `c-${i++}`,
          side: "left",
          castId: msg.cast_id,
          name: label.name,
          role: label.role,
          text: msg.text,
        });
      }
    }
  }
  return out;
}

export function DecisionWorkspace(props: Props) {
  const {
    runId,
    caseSlug,
    caseTitle,
    cast,
    scene,
    integrity,
    depth,
    maxDepth,
    initialMessages,
    needsProps: initialNeedsProps,
    props: sceneProps,
  } = props;

  const router = useRouter();
  const castById = useMemo(
    () => new Map(cast.map((m) => [m.id, m])),
    [cast],
  );
  const scrollRef = useRef<HTMLDivElement>(null);

  const [showProps, setShowProps] = useState(initialNeedsProps);
  const [transcript, setTranscript] = useState<SceneTurn[]>(() =>
    buildTranscript(initialMessages, scene),
  );
  const [messages, setMessages] = useState<FlatMessage[]>(() =>
    flattenTranscript(buildTranscript(initialMessages, scene), castById),
  );
  const [turnCount, setTurnCount] = useState(() =>
    initialMessages.filter((m) => m.sender === "student").length,
  );
  const [input, setInput] = useState("");
  const [reasoning, setReasoning] = useState(scene.commitPrefill ?? "");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [thinking, setThinking] = useState<{
    castId: string;
    name: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [consequence, setConsequence] = useState<{
    headline: string;
    narrative: string;
    beats: { speaker: string; line: string }[];
  } | null>(null);
  const [terminal, setTerminal] = useState(false);
  const [pending, startTransition] = useTransition();

  const pickerUnlocked = turnCount >= scene.minExchanges;
  const sceneCast = scene.cast
    .map((id) => castById.get(id))
    .filter(Boolean) as CastMember[];

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, thinking, isLoading]);

  async function revealCharacterMessages(
    incoming: { cast_id: string; text: string }[],
  ) {
    for (let i = 0; i < incoming.length; i++) {
      const msg = incoming[i];
      const label = memberLabel(castById, msg.cast_id);
      setThinking({ castId: msg.cast_id, name: label.name });
      await sleep(900 + Math.min(msg.text.length * 8, 1400));
      setThinking(null);
      setMessages((prev) => [
        ...prev,
        {
          id: `live-${Date.now()}-${i}`,
          side: "left",
          castId: msg.cast_id,
          name: label.name,
          role: label.role,
          text: msg.text,
          animate: true,
        },
      ]);
      if (i < incoming.length - 1) await sleep(280);
    }
  }

  async function callDirector(
    studentMessage: string,
    attemptedEarlyCommit: boolean,
  ) {
    setIsLoading(true);
    setError(null);

    const studentFlat: FlatMessage = {
      id: `live-you-${Date.now()}`,
      side: "right",
      castId: "ceo",
      name: "You",
      text: studentMessage,
      animate: true,
    };
    setMessages((prev) => [...prev, studentFlat]);

    const first = sceneCast[0];
    setThinking({
      castId: first?.id ?? "marcus",
      name: first?.name ?? "Someone",
    });

    try {
      await persistStudentMessage(runId, scene.id, studentMessage);
      const response = await fetch("/api/decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          runId,
          caseSlug,
          sceneId: scene.id,
          history: transcript,
          turnCount,
          studentMessage,
          attemptedEarlyCommit,
        }),
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.message ?? "The scene director could not respond.");
      }
      await persistCharacterMessages(runId, scene.id, body.messages);
      setTranscript((prev) => [
        ...prev,
        { speaker: "student", text: studentMessage },
        { speaker: "director", messages: body.messages },
      ]);
      setTurnCount((c) => c + 1);
      setThinking(null);
      await revealCharacterMessages(body.messages);
    } catch (err) {
      setThinking(null);
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSend() {
    if (!input.trim() || isLoading) return;
    const message = input.trim();
    setInput("");
    await callDirector(message, false);
  }

  async function handleCommit() {
    if (!selectedKey || isLoading || consequence) return;
    if (reasoning.trim().length < 20) {
      setError("Reasoning must be at least 20 characters.");
      return;
    }
    if (!pickerUnlocked) {
      setError("Keep the discussion going before you commit.");
      const option = scene.options.find((o) => o.key === selectedKey);
      await callDirector(
        `I'm ready to decide: "${option?.label}." My reasoning: ${reasoning.trim()}`,
        true,
      );
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      const result = await commitSceneDecision({
        runId,
        caseSlug,
        sceneId: scene.id,
        optionKey: selectedKey,
        reasoning: reasoning.trim(),
      });
      if (result.consequence) {
        setConsequence(result.consequence);
      }
      setTerminal(result.isTerminal);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Commit failed.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleContinueAfterConsequence() {
    startTransition(() => {
      if (terminal) {
        router.push(stagePath("decisions"));
        router.refresh();
      } else {
        router.refresh();
      }
    });
  }

  if (showProps && sceneProps.length > 0) {
    return (
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Pre-reads · Decision {depth} of {maxDepth}
        </p>
        <h1 className="mt-2 font-serif text-3xl text-foreground">
          Briefing memos
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Your assistant sent four short notes. They do not point to one obvious
          answer.
        </p>
        <div className="mt-8 flex flex-col gap-6">
          {sceneProps.map((prop) => (
            <article
              key={prop.key}
              className={`border border-border px-5 py-4 ${prop.hot ? "border-l-2 border-l-accent" : ""}`}
            >
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {prop.subtitle}
                {prop.hot ? " · flagged" : ""}
              </p>
              <h2 className="mt-1 font-serif text-xl text-foreground">
                {prop.title}
              </h2>
              <div className="mt-3">
                <MarkdownBody source={prop.body} />
              </div>
            </article>
          ))}
        </div>
        <button
          type="button"
          className="mt-10 bg-accent px-6 py-3 text-sm font-medium text-accent-foreground"
          onClick={() => {
            startTransition(async () => {
              await acknowledgeProps(runId);
              setShowProps(false);
            });
          }}
          disabled={pending}
        >
          Enter the meeting
        </button>
      </div>
    );
  }

  if (consequence) {
    return (
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Consequence
        </p>
        <h1 className="mt-2 font-serif text-3xl text-foreground">
          {consequence.headline}
        </h1>
        <p className="mt-4 max-w-[60ch] text-sm leading-relaxed text-muted-foreground">
          {consequence.narrative}
        </p>
        <div className="mt-8 flex flex-col gap-4">
          {consequence.beats.map((beat, i) => (
            <div key={i} className="border-l-2 border-border pl-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {beat.speaker}
              </p>
              <p className="mt-1 text-sm text-foreground">{beat.line}</p>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={handleContinueAfterConsequence}
          className="mt-10 bg-accent px-6 py-3 text-sm font-medium text-accent-foreground"
        >
          {terminal ? "Continue to reflection" : "Continue to next decision"}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {caseTitle} · Decision {depth} of {maxDepth}
        </p>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Integrity: {integrity}
        </p>
      </div>
      <h1 className="mt-2 font-serif text-3xl leading-tight text-foreground md:text-4xl">
        {scene.title}
      </h1>
      <p className="mt-2 text-xs uppercase tracking-wide text-muted-foreground">
        {scene.timeLabel}
      </p>
      <p className="mt-4 max-w-[52ch] text-sm leading-relaxed text-muted-foreground">
        {scene.brief}
      </p>

      {/* Chat shell — WhatsApp-like meeting thread */}
      <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-background shadow-[0_1px_0_rgba(28,27,25,0.04)]">
        <header className="flex items-center gap-3 border-b border-border bg-surface/80 px-4 py-3 backdrop-blur-sm">
          <div className="flex -space-x-2">
            {sceneCast.slice(0, 4).map((m) => (
              <span key={m.id} className="ring-2 ring-surface rounded-full">
                <CastAvatar castId={m.id} name={m.name} size="sm" />
              </span>
            ))}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              Leadership meeting
            </p>
            <p className="truncate text-[11px] text-muted-foreground">
              {sceneCast.map((m) => m.name.split(" ")[0]).join(", ")}
              {thinking ? ` · ${thinking.name.split(" ")[0]} typing…` : ""}
            </p>
          </div>
          <span className="hidden text-[10px] uppercase tracking-wider text-muted-foreground sm:inline">
            {turnCount}/{scene.minExchanges} exchanges
          </span>
        </header>

        <div
          ref={scrollRef}
          className="chat-thread relative flex h-[min(58vh,28rem)] flex-col gap-3 overflow-y-auto px-3 py-4 sm:px-4"
        >
          <div className="mx-auto mb-2 max-w-[20rem] rounded-full bg-surface/90 px-3 py-1 text-center text-[10px] uppercase tracking-wide text-muted-foreground">
            {scene.timeLabel}
          </div>

          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              side={msg.side}
              castId={msg.castId}
              name={msg.name}
              role={msg.role}
              text={msg.text}
              animate={msg.animate}
            />
          ))}

          {thinking ? (
            <ThinkingIndicator
              castId={thinking.castId}
              name={thinking.name}
            />
          ) : null}
        </div>

        <div className="border-t border-border bg-surface/50 px-3 py-3 sm:px-4">
          <div className="flex items-end gap-2">
            <CastAvatar castId="ceo" name="You" size="sm" />
            <textarea
              id="student-message"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void handleSend();
                }
              }}
              rows={2}
              disabled={isLoading}
              className="min-h-[2.75rem] flex-1 resize-none rounded-2xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none disabled:opacity-60"
              placeholder="Message the room…"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="mb-0.5 shrink-0 rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground disabled:opacity-40"
            >
              Send
            </button>
          </div>
          {error && !pickerUnlocked ? (
            <p className="mt-2 text-sm text-red-700 dark:text-red-400">{error}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-8 border-t border-border pt-8">
        {!pickerUnlocked ? (
          <p className="text-sm italic text-muted-foreground">
            Keep talking with the room. Decision options unlock after{" "}
            {scene.minExchanges} exchanges ({turnCount}/{scene.minExchanges}).
          </p>
        ) : (
          <>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {scene.commitPrompt}
            </p>
            <label
              htmlFor="reasoning"
              className="mt-4 block text-xs font-medium uppercase tracking-wide text-muted-foreground"
            >
              Your reasoning
            </label>
            <textarea
              id="reasoning"
              value={reasoning}
              onChange={(e) => setReasoning(e.target.value)}
              rows={3}
              className="mt-2 w-full border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
            />
            {error ? (
              <p className="mt-3 text-sm text-red-700 dark:text-red-400">
                {error}
              </p>
            ) : null}
            <div className="mt-5 flex flex-col gap-2">
              {scene.options.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setSelectedKey(option.key)}
                  disabled={isLoading}
                  className={`border px-4 py-3 text-left text-sm transition-colors disabled:opacity-50 ${
                    selectedKey === option.key
                      ? "border-accent bg-surface text-foreground"
                      : "border-border text-foreground hover:border-accent hover:bg-surface"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={handleCommit}
              disabled={isLoading || !selectedKey}
              className="mt-6 bg-accent px-6 py-3 text-sm font-medium text-accent-foreground disabled:opacity-50"
            >
              Commit decision
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function buildTranscript(
  messages: DbMessage[],
  scene: Scene,
): SceneTurn[] {
  if (messages.length === 0) {
    return [
      {
        speaker: "director",
        messages: [
          { cast_id: scene.opening.castId, text: scene.opening.text },
        ],
      },
    ];
  }

  const turns: SceneTurn[] = [];
  let buffer: { cast_id: string; text: string }[] = [];

  function flush() {
    if (buffer.length) {
      turns.push({ speaker: "director", messages: buffer });
      buffer = [];
    }
  }

  for (const msg of messages) {
    if (msg.sender === "student") {
      flush();
      turns.push({ speaker: "student", text: msg.content });
    } else {
      buffer.push({
        cast_id: msg.castId ?? "narrator",
        text: msg.content,
      });
    }
  }
  flush();

  if (turns.length === 0) {
    turns.push({
      speaker: "director",
      messages: [
        { cast_id: scene.opening.castId, text: scene.opening.text },
      ],
    });
  }

  return turns;
}
