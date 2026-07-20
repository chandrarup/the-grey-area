"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  commitGroupDecisionAction,
  processGroupAiQueueAction,
  sendGroupMessageAction,
  startMeetingAction,
  toggleReadyAction,
} from "@/app/group/actions";
import { CastAvatar } from "@/app/components/chat/cast-avatar";
import { MessageBubble } from "@/app/components/chat/message-bubble";
import { ThinkingIndicator } from "@/app/components/chat/thinking-indicator";
import {
  GROUP_ROLES,
  seatDisplayName,
  type SeatKey,
} from "@/lib/case/group-roles";
import type {
  GroupSessionState,
  RealtimeMessage,
  RealtimeParticipant,
} from "@/lib/realtime/types";
import { formatSessionRemaining } from "@/lib/group-session-lifetime";

type Msg = {
  id: number;
  roleKey: string;
  senderKind: string;
  content: string;
  sceneId: string;
};

function roleToCastId(roleKey: string) {
  return roleKey.toLowerCase();
}

/** Never show another seat as "You …" — strip bad stored names from older joins. */
function displayNameForRole(
  roleKey: string,
  cast: { id: string; name: string }[],
  participants: RealtimeParticipant[],
) {
  const seat = participants.find((p) => p.roleKey === roleKey);
  const raw = seat?.displayName?.trim();
  if (raw && !/^you\b/i.test(raw) && !raw.startsWith("You —")) {
    return raw;
  }
  const member = cast.find((c) => c.id === roleKey);
  if (member?.name) return member.name;
  return seatDisplayName(roleKey);
}

const POLL_MS = 1500;

export function GroupMeetingClient(props: {
  mode: "lobby" | "meeting";
  sessionId: string;
  roleKey: string;
  participantId: string;
  isReady: boolean;
  isCeo: boolean;
  status: string;
  scene: { id: string; title: string; minExchanges: number } | null;
  cast: { id: string; name: string }[];
  messages: Msg[];
  options: { key: string; label: string }[];
  roleMission?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [text, setText] = useState("");
  const [reasoning, setReasoning] = useState("");
  const [optionKey, setOptionKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState(props.status);
  const [isReady, setIsReady] = useState(props.isReady);
  const [messages, setMessages] = useState<RealtimeMessage[]>(props.messages);
  const [participants, setParticipants] = useState<RealtimeParticipant[]>([]);
  const [thinkingRoleKeys, setThinkingRoleKeys] = useState<string[]>([]);
  const [sceneId, setSceneId] = useState(props.scene?.id ?? null);
  const [msRemaining, setMsRemaining] = useState<number | null>(null);
  const cursorRef = useRef(
    props.messages.length
      ? Math.max(...props.messages.map((m) => m.id))
      : 0,
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const processingAi = useRef(false);

  const mergeState = useCallback((state: GroupSessionState) => {
    setStatus(state.status);
    setSceneId(state.currentSceneId);
    setParticipants(state.participants);
    setThinkingRoleKeys(state.thinkingRoleKeys);
    setMsRemaining(state.msRemaining);
    const me = state.participants.find((p) => p.id === props.participantId);
    if (me) setIsReady(me.isReady);

    if (state.messages.length > 0) {
      setMessages((prev) => {
        const map = new Map(prev.map((m) => [m.id, m]));
        for (const m of state.messages) map.set(m.id, m);
        return Array.from(map.values()).sort((a, b) => a.id - b.id);
      });
      cursorRef.current = Math.max(
        cursorRef.current,
        ...state.messages.map((m) => m.id),
        state.cursor,
      );
    } else {
      cursorRef.current = Math.max(cursorRef.current, state.cursor);
    }
  }, [props.participantId]);

  useEffect(() => {
    let cancelled = false;

    async function tick() {
      try {
        const res = await fetch(
          `/api/group/${props.sessionId}/state?after=${cursorRef.current}`,
        );
        if (!res.ok || cancelled) return;
        const state = (await res.json()) as GroupSessionState;
        mergeState(state);

        if (
          state.thinkingRoleKeys.length > 0 &&
          !processingAi.current &&
          props.mode === "meeting"
        ) {
          processingAi.current = true;
          try {
            await processGroupAiQueueAction(props.sessionId);
          } finally {
            processingAi.current = false;
          }
        }

        if (
          state.status !== props.status &&
          (state.status === "active" ||
            state.status === "committed" ||
            state.status === "graded" ||
            state.status === "released" ||
            state.status === "expired")
        ) {
          if (state.status !== status) {
            router.refresh();
          }
        }
      } catch {
        // ignore transient poll errors
      }
    }

    void tick();
    const id = setInterval(tick, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [
    props.sessionId,
    props.mode,
    props.status,
    status,
    mergeState,
    router,
  ]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, thinkingRoleKeys, sending]);

  async function sendMessage() {
    if (!text.trim() || sending) return;
    const body = text.trim();
    setText("");
    setSending(true);
    setError(null);
    try {
      await sendGroupMessageAction(
        props.sessionId,
        props.roleKey,
        body,
        props.participantId,
      );
      void processGroupAiQueueAction(props.sessionId);
      const res = await fetch(
        `/api/group/${props.sessionId}/state?after=${cursorRef.current}`,
      );
      if (res.ok) mergeState((await res.json()) as GroupSessionState);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Send failed");
      setText(body);
    } finally {
      setSending(false);
    }
  }

  if (props.mode === "lobby") {
    return (
      <div className="mt-8 flex flex-wrap gap-3">
        {props.participantId ? (
          <button
            type="button"
            disabled={pending}
            className="border border-border px-4 py-2 text-sm"
            onClick={() =>
              startTransition(async () => {
                await toggleReadyAction(props.participantId, !isReady);
                setIsReady(!isReady);
              })
            }
          >
            {isReady ? "Unready" : "Mark ready"}
          </button>
        ) : null}
        {props.isCeo ? (
          <button
            type="button"
            disabled={pending}
            className="bg-accent px-4 py-2 text-sm text-accent-foreground"
            onClick={() =>
              startTransition(async () => {
                try {
                  await startMeetingAction(
                    props.sessionId,
                    false,
                    props.participantId,
                  );
                  router.refresh();
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Cannot start");
                }
              })
            }
          >
            Open the meeting
          </button>
        ) : null}
        {error ? <p className="w-full text-sm text-red-700">{error}</p> : null}
        <div className="w-full mt-4 text-sm text-muted-foreground">
          <p className="text-xs uppercase tracking-wide">Roster</p>
          <ul className="mt-2 space-y-1">
            {participants.length
              ? participants.map((p) => (
                  <li key={p.id}>
                    {p.roleKey}:{" "}
                    {p.isAi
                      ? "AI"
                      : p.joined
                        ? `${p.displayName ?? "Joined"}${p.isReady ? " · ready" : ""}`
                        : "Waiting…"}
                  </li>
                ))
              : null}
          </ul>
        </div>
        <p className="w-full text-xs text-muted-foreground">
          Lobby updates live every few seconds.
          {msRemaining != null && msRemaining > 0
            ? ` · ${formatSessionRemaining(msRemaining)}`
            : ""}
        </p>
      </div>
    );
  }

  if (status !== "active" || !props.scene) {
    return (
      <div className="mt-8">
        <p className="text-sm text-muted-foreground">
          {status === "committed" || status === "graded"
            ? "Meeting finished. Waiting for the professor to release the debrief."
            : "Waiting for the next scene or professor debrief."}
        </p>
      </div>
    );
  }

  const sceneMessages = messages.filter(
    (m) => m.sceneId === (sceneId ?? props.scene!.id),
  );
  const humanCount = sceneMessages.filter((m) => m.senderKind === "human").length;
  const commitUnlocked = humanCount >= 6;
  const myCastId = roleToCastId(props.roleKey);
  const thinkingName =
    thinkingRoleKeys[0] != null
      ? displayNameForRole(thinkingRoleKeys[0], props.cast, participants)
      : null;

  return (
    <div className="mt-8 max-w-2xl">
      <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-[0_1px_0_rgba(28,27,25,0.04)]">
        <header className="flex items-center gap-3 border-b border-border bg-surface/80 px-4 py-3">
          <div className="flex -space-x-2">
            {props.cast.slice(0, 4).map((m) => (
              <span key={m.id} className="rounded-full ring-2 ring-surface">
                <CastAvatar castId={m.id} name={m.name} size="sm" />
              </span>
            ))}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {props.scene.title}
            </p>
            <p className="truncate text-[11px] text-muted-foreground">
              You are {displayNameForRole(props.roleKey, props.cast, participants)}
              {thinkingName ? ` · ${thinkingName.split(" ")[0]} typing…` : ""}
            </p>
          </div>
          <span className="hidden text-[10px] uppercase tracking-wider text-muted-foreground sm:inline">
            {humanCount}/6 msgs
            {msRemaining != null && msRemaining > 0
              ? ` · ${formatSessionRemaining(msRemaining)}`
              : ""}
          </span>
        </header>

        <div
          ref={scrollRef}
          className="chat-thread flex h-[min(52vh,26rem)] flex-col gap-3 overflow-y-auto px-3 py-4 sm:px-4"
        >
          {sceneMessages.map((m) => {
            const isMe = m.roleKey === props.roleKey;
            const castId = roleToCastId(m.roleKey);
            const otherTitle =
              GROUP_ROLES[m.roleKey as SeatKey]?.title ??
              (m.senderKind === "ai" ? "AI seat" : undefined);
            return (
              <MessageBubble
                key={m.id}
                side={isMe ? "right" : "left"}
                castId={isMe ? myCastId : castId}
                name={
                  isMe
                    ? "You"
                    : displayNameForRole(m.roleKey, props.cast, participants)
                }
                role={isMe ? undefined : otherTitle}
                text={m.content}
              />
            );
          })}
          {thinkingRoleKeys[0] ? (
            <ThinkingIndicator
              castId={roleToCastId(thinkingRoleKeys[0])}
              name={displayNameForRole(thinkingRoleKeys[0], props.cast, participants)}
            />
          ) : null}
        </div>

        <div className="border-t border-border bg-surface/50 px-3 py-3 sm:px-4">
          <div className="flex items-end gap-2">
            <CastAvatar
              castId={myCastId}
              name={displayNameForRole(props.roleKey, props.cast, participants)}
              size="sm"
            />
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void sendMessage();
                }
              }}
              rows={2}
              className="min-h-[2.75rem] flex-1 resize-none rounded-2xl border border-border bg-background px-4 py-2.5 text-sm focus:border-accent focus:outline-none"
              placeholder="Speak in character…"
            />
            <button
              type="button"
              disabled={sending || !text.trim()}
              className="mb-0.5 shrink-0 rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground disabled:opacity-40"
              onClick={() => void sendMessage()}
            >
              Send
            </button>
          </div>
          {error ? (
            <p className="mt-2 text-sm text-red-700">{error}</p>
          ) : (
            <p className="mt-2 text-[10px] text-muted-foreground">
              Live sync · updates every {POLL_MS / 1000}s
            </p>
          )}
        </div>
      </div>

      {props.isCeo ? (
        <div className="mt-10 border-t border-border pt-6">
          {!commitUnlocked ? (
            <p className="text-sm italic text-muted-foreground">
              Commit unlocks after 6 human messages ({humanCount}/6).
            </p>
          ) : (
            <>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                CEO decision
              </p>
              <textarea
                value={reasoning}
                onChange={(e) => setReasoning(e.target.value)}
                rows={2}
                className="mt-3 w-full border border-border bg-background px-3 py-2 text-sm"
                placeholder="Reasoning (20+ characters)"
              />
              <div className="mt-3 flex flex-col gap-2">
                {props.options.map((o) => (
                  <button
                    key={o.key}
                    type="button"
                    className={`border px-3 py-2 text-left text-sm ${
                      optionKey === o.key
                        ? "border-accent bg-surface"
                        : "border-border"
                    }`}
                    onClick={() => setOptionKey(o.key)}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                disabled={pending || !optionKey}
                className="mt-4 bg-accent px-4 py-2 text-sm text-accent-foreground disabled:opacity-50"
                onClick={() =>
                  startTransition(async () => {
                    try {
                      await commitGroupDecisionAction({
                        sessionId: props.sessionId,
                        optionKey: optionKey!,
                        reasoning,
                        participantId: props.participantId,
                      });
                      router.refresh();
                    } catch (err) {
                      setError(
                        err instanceof Error ? err.message : "Commit failed",
                      );
                    }
                  })
                }
              >
                Commit
              </button>
            </>
          )}
        </div>
      ) : (
        <p className="mt-8 text-sm italic text-muted-foreground">
          The CEO will decide when the discussion is ready.
        </p>
      )}
    </div>
  );
}
