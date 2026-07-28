"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  startMeetingAction,
  toggleReadyAction,
} from "@/app/group/actions";
import { CastAvatar } from "@/app/components/chat/cast-avatar";
import { MessageBubble } from "@/app/components/chat/message-bubble";
import { ThinkingIndicator } from "@/app/components/chat/thinking-indicator";
import { AnswerComposer } from "@/app/components/group/answer-composer";
import {
  GROUP_ROLES,
  HUMAN_MSG_GATE,
  suggestionLines,
  type SeatKey,
} from "@/lib/case/group-roles";
import type {
  GroupSessionState,
  RealtimeMessage,
  RealtimeParticipant,
} from "@/lib/realtime/types";
import { useGroupRealtime } from "@/lib/realtime/use-group-realtime";
import { formatSessionRemaining } from "@/lib/group-session-lifetime";
import { characterName } from "@/lib/group/public-roster";
import {
  readSeatToken,
  seatHeaders,
  storeSeatToken,
} from "@/lib/group/seat-token-client";
import { LoadingSpinner } from "@/app/components/loading-spinner";
import { withBusyBar } from "@/app/components/navigation-progress";

type Msg = RealtimeMessage;

function displayNameForRole(
  roleKey: string,
  cast: { id: string; name: string }[],
  participants: RealtimeParticipant[],
) {
  const seat = participants.find((p) => p.roleKey === roleKey);
  const raw = seat?.displayName?.trim();
  if (raw && !/^you\b/i.test(raw) && !raw.startsWith("You —")) return raw;
  const member = cast.find((c) => c.id === roleKey);
  if (member?.name) return member.name;
  return characterName(roleKey);
}

const FALLBACK_POLL_MS = 2000;

export function GroupMeetingClient(props: {
  mode: "lobby" | "meeting";
  sessionId: string;
  sessionCode: string;
  roleKey: string;
  participantId: string;
  joinToken: string;
  isReady: boolean;
  isCeo: boolean;
  status: string;
  decisionsMade: number;
  decisionCount: number;
  scene: {
    id: string;
    title: string;
    timeLabel?: string;
    brief?: string;
    minExchanges: number;
  } | null;
  cast: { id: string; name: string }[];
  sceneCast: { id: string; name: string; title: string }[];
  messages: Msg[];
  options: { key: string; label: string }[];
  roleBriefCollapsed?: {
    name: string;
    title: string;
    stance: string;
    objective: string;
    opening?: string | null;
  };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [status, setStatus] = useState(props.status);
  const [isReady, setIsReady] = useState(props.isReady);
  const [messages, setMessages] = useState<Msg[]>(props.messages);
  const [participants, setParticipants] = useState<RealtimeParticipant[]>([]);
  const [thinkingRoleKeys, setThinkingRoleKeys] = useState<string[]>([]);
  const [sceneId, setSceneId] = useState(props.scene?.id ?? null);
  const [decisionsMade, setDecisionsMade] = useState(props.decisionsMade);
  const [msRemaining, setMsRemaining] = useState<number | null>(null);
  const [briefOpen, setBriefOpen] = useState(false);
  const [reasoning, setReasoning] = useState("");
  const [optionKey, setOptionKey] = useState<string | null>(null);
  const [customText, setCustomText] = useState("");
  const [countdown, setCountdown] = useState(30 * 60);
  const [seatToken, setSeatToken] = useState(props.joinToken);
  const cursorRef = useRef(
    props.messages.length ? Math.max(...props.messages.map((m) => m.id)) : 0,
  );
  const sceneIdRef = useRef(props.scene?.id ?? null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const tickRef = useRef<(() => Promise<void>) | null>(null);
  const stickToBottomRef = useRef(true);
  const scrollInstantRef = useRef(false);
  const [animateIds, setAnimateIds] = useState<Set<number>>(() => new Set());
  const pendingOptimisticRef = useRef<{
    id: number;
    content: string;
    roleKey: string;
  } | null>(null);

  useEffect(() => {
    setStatus(props.status);
    setIsReady(props.isReady);
    if (props.scene?.id) {
      setSceneId(props.scene.id);
      sceneIdRef.current = props.scene.id;
    }
  }, [props.status, props.isReady, props.scene?.id]);

  // Active but no scene payload — force a refresh so chat can mount.
  useEffect(() => {
    if (props.mode === "meeting" && status === "active" && !props.scene) {
      const t = setTimeout(() => router.refresh(), 400);
      return () => clearTimeout(t);
    }
  }, [props.mode, status, props.scene, router]);

  useEffect(() => {
    const fromUrl =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("t")
        : null;
    const token =
      props.joinToken ||
      fromUrl ||
      readSeatToken(props.sessionId) ||
      "";
    if (token) {
      storeSeatToken(props.sessionId, token);
      setSeatToken(token);
    }
  }, [props.joinToken, props.sessionId]);

  // Keep transcript in sync when server re-renders with history
  useEffect(() => {
    if (props.messages.length === 0) return;
    setMessages((prev) => {
      const map = new Map(prev.filter((m) => m.id > 0).map((m) => [m.id, m]));
      for (const m of props.messages) map.set(m.id, m);
      // Drop optimistic rows once a matching confirmed message exists
      const confirmed = Array.from(map.values());
      const temps = prev.filter((m) => m.id < 0);
      const keptTemps = temps.filter(
        (t) =>
          !confirmed.some(
            (c) => c.content === t.content && c.roleKey === t.roleKey,
          ),
      );
      return [...confirmed, ...keptTemps].sort((a, b) => a.id - b.id);
    });
    cursorRef.current = Math.max(
      cursorRef.current,
      ...props.messages.map((m) => m.id),
    );
  }, [props.messages]);

  const mergeMessage = useCallback((m: Msg, opts?: { animate?: boolean }) => {
    setMessages((prev) => {
      if (m.id > 0) {
        const existingIdx = prev.findIndex((x) => x.id === m.id);
        if (existingIdx >= 0) {
          const next = [...prev];
          next[existingIdx] = m;
          return next;
        }
        // Replace optimistic placeholder in place
        const tempIdx = prev.findIndex(
          (x) =>
            x.id < 0 &&
            x.content === m.content &&
            x.roleKey === m.roleKey,
        );
        if (tempIdx >= 0) {
          const next = [...prev];
          next[tempIdx] = m;
          if (pendingOptimisticRef.current?.id === prev[tempIdx]!.id) {
            pendingOptimisticRef.current = null;
          }
          return next;
        }
        return [...prev, m].sort((a, b) => a.id - b.id);
      }
      // Optimistic insert
      return [...prev, m];
    });
    if (m.id > 0) {
      cursorRef.current = Math.max(cursorRef.current, m.id);
      if (opts?.animate) {
        setAnimateIds((prev) => {
          const next = new Set(prev);
          next.add(m.id);
          return next;
        });
      }
    }
  }, []);

  const mergeState = useCallback(
    (state: GroupSessionState) => {
      setStatus(state.status);
      setSceneId(state.currentSceneId);
      setDecisionsMade(state.decisionsMade);
      setParticipants(state.participants);
      setThinkingRoleKeys(state.thinkingRoleKeys);
      setMsRemaining(state.msRemaining);
      const me = state.participants.find((p) => p.id === props.participantId);
      if (me) setIsReady(me.isReady);

      if (state.messages.length > 0) {
        setMessages((prev) => {
          const map = new Map(
            prev.filter((m) => m.id > 0).map((m) => [m.id, m]),
          );
          for (const m of state.messages) map.set(m.id, m);
          const confirmed = Array.from(map.values());
          const temps = prev.filter((m) => m.id < 0);
          const keptTemps = temps.filter(
            (t) =>
              !confirmed.some(
                (c) => c.content === t.content && c.roleKey === t.roleKey,
              ),
          );
          return [...confirmed, ...keptTemps].sort((a, b) => a.id - b.id);
        });
        cursorRef.current = Math.max(
          cursorRef.current,
          ...state.messages.map((m) => m.id),
          state.cursor,
        );
      } else {
        cursorRef.current = Math.max(cursorRef.current, state.cursor);
      }

      const prevScene = sceneIdRef.current;
      if (
        state.currentSceneId &&
        prevScene &&
        state.currentSceneId !== prevScene
      ) {
        sceneIdRef.current = state.currentSceneId;
        router.refresh();
      } else if (state.currentSceneId) {
        sceneIdRef.current = state.currentSceneId;
      }

      if (
        state.status !== props.status &&
        (state.status === "active" ||
          state.status === "committed" ||
          state.status === "graded" ||
          state.status === "released" ||
          state.status === "expired")
      ) {
        router.refresh();
      }
    },
    [props.participantId, props.status, router],
  );

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/group/${props.sessionId}/state?after=${cursorRef.current}`,
      );
      if (!res.ok) return;
      mergeState((await res.json()) as GroupSessionState);
    } catch {
      // ignore
    }
  }, [props.sessionId, mergeState]);

  useEffect(() => {
    tickRef.current = fetchState;
    void fetchState();
    const id = setInterval(() => void fetchState(), FALLBACK_POLL_MS);
    return () => {
      clearInterval(id);
      tickRef.current = null;
    };
  }, [fetchState]);

  useGroupRealtime(props.sessionId, {
    onChange: () => void tickRef.current?.(),
    onMessageInsert: (row) => {
      const roleKey = String(row.role_key);
      mergeMessage(
        {
          id: Number(row.id),
          roleKey,
          senderKind: String(row.sender_kind),
          content: String(row.content),
          sceneId: String(row.scene_id),
        },
        { animate: roleKey !== props.roleKey },
      );
    },
  });

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !stickToBottomRef.current) return;
    const instant = scrollInstantRef.current;
    scrollInstantRef.current = false;
    el.scrollTo({
      top: el.scrollHeight,
      behavior: instant ? "auto" : "auto",
    });
  }, [messages, thinkingRoleKeys]);

  useEffect(() => {
    const t = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  async function sendMessage(body: string) {
    if (!body.trim() || sending) return;
    setSending(true);
    setError(null);
    const optimisticId = -Date.now();
    pendingOptimisticRef.current = {
      id: optimisticId,
      content: body,
      roleKey: props.roleKey,
    };
    stickToBottomRef.current = true;
    scrollInstantRef.current = true;
    mergeMessage({
      id: optimisticId,
      roleKey: props.roleKey,
      senderKind: "human",
      content: body,
      sceneId: sceneId ?? props.scene?.id ?? "",
    });
    try {
      await withBusyBar(async () => {
        const res = await fetch(`/api/group/${props.sessionCode}/message`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...seatHeaders(seatToken),
          },
          body: JSON.stringify({ roleKey: props.roleKey, text: body }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Send failed");
        if (data.message) {
          mergeMessage(data.message as Msg, { animate: false });
        }

        const mentioned: string[] = data.mentionedAiRoles ?? [];
        setThinkingRoleKeys(mentioned);
        for (const role of mentioned) {
          void fetch(`/api/group/${props.sessionCode}/ai-turn`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...seatHeaders(seatToken),
            },
            body: JSON.stringify({
              triggerMessageId: data.message.id,
              roleKey: role,
            }),
          }).finally(() => {
            setThinkingRoleKeys((prev) => prev.filter((r) => r !== role));
            void tickRef.current?.();
          });
        }
        void tickRef.current?.();
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Send failed");
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      pendingOptimisticRef.current = null;
    } finally {
      setSending(false);
    }
  }

  async function commit() {
    if (committing) return;
    setError(null);
    setCommitting(true);
    try {
      await withBusyBar(async () => {
        const res = await fetch(`/api/group/${props.sessionCode}/commit`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...seatHeaders(seatToken),
          },
          body: JSON.stringify({
            optionKey: optionKey === "custom" ? undefined : optionKey,
            customText: optionKey === "custom" ? customText : undefined,
            reasoning,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Commit failed");
        router.refresh();
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Commit failed");
    } finally {
      setCommitting(false);
    }
  }

  const humans = participants.filter((p) => !p.isAi);
  const readyCount = humans.filter((p) => p.joined && p.isReady).length;
  const humanTotal = humans.length || 1;
  const missingReady = humans.filter((p) => p.joined && !p.isReady);
  const missingJoined = humans.filter((p) => !p.joined);
  const canCeoStart =
    props.isCeo &&
    missingJoined.length === 0 &&
    missingReady.length === 0 &&
    humans.length > 0;

  if (props.mode === "lobby") {
    const myBrief = GROUP_ROLES[props.roleKey as SeatKey];
    return (
      <div className="mt-8 space-y-4">
        <p className="rounded-lg border border-accent/40 bg-surface px-3 py-2 text-sm text-foreground">
          You are{" "}
          <span className="font-medium">
            {myBrief?.name ?? props.roleKey}
          </span>
          {myBrief?.title ? (
            <span className="text-muted-foreground"> — {myBrief.title}</span>
          ) : null}
        </p>
        <p className="text-sm text-muted-foreground">
          Ready {readyCount} / {humanTotal}
          {msRemaining != null && msRemaining > 0
            ? ` · ${formatSessionRemaining(msRemaining)}`
            : ""}
        </p>
        <ul className="space-y-1 text-sm">
          {(participants.length ? participants : []).map((p) => (
            <li key={p.id} className="text-muted-foreground">
              <span className="text-foreground">
                {GROUP_ROLES[p.roleKey as SeatKey]?.title ?? p.roleKey}
              </span>
              {" — "}
              {p.isAi
                ? "AI"
                : p.joined
                  ? `${p.displayName ?? "Joined"}${p.isReady ? " · ready" : ""}`
                  : "Waiting…"}
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={pending}
            className="border border-border px-4 py-2 text-sm disabled:opacity-50"
            onClick={() => {
              const next = !isReady;
              setIsReady(next);
              setParticipants((prev) =>
                prev.map((p) =>
                  p.id === props.participantId ? { ...p, isReady: next } : p,
                ),
              );
              startTransition(async () => {
                try {
                  await withBusyBar(async () => {
                    await toggleReadyAction(props.participantId, next);
                  });
                } catch (err) {
                  setIsReady(!next);
                  setError(
                    err instanceof Error ? err.message : "Could not update ready",
                  );
                }
              });
            }}
          >
            {pending ? (
              <LoadingSpinner
                label={isReady ? "Saving…" : "Updating…"}
              />
            ) : isReady ? (
              "Unready"
            ) : (
              "I've read my brief — Ready"
            )}
          </button>
          {props.isCeo ? (
            <button
              type="button"
              disabled={pending || !canCeoStart}
              className="bg-accent px-4 py-2 text-sm text-accent-foreground disabled:opacity-40"
              title={
                !canCeoStart
                  ? [
                      ...missingJoined.map(
                        (p) =>
                          `${GROUP_ROLES[p.roleKey as SeatKey]?.name ?? p.roleKey} not joined`,
                      ),
                      ...missingReady.map(
                        (p) =>
                          `${p.displayName ?? p.roleKey} not ready`,
                      ),
                    ].join(", ")
                  : undefined
              }
              onClick={() =>
                startTransition(async () => {
                  try {
                    await withBusyBar(async () => {
                      await startMeetingAction(
                        props.sessionId,
                        false,
                        props.participantId,
                      );
                      router.refresh();
                    });
                  } catch (err) {
                    setError(
                      err instanceof Error ? err.message : "Cannot start",
                    );
                  }
                })
              }
            >
              {pending && canCeoStart ? (
                <LoadingSpinner label="Starting…" className="text-accent-foreground" />
              ) : (
                "Start meeting"
              )}
            </button>
          ) : null}
        </div>
        {props.isCeo && !canCeoStart ? (
          <p className="text-xs text-muted-foreground">
            Waiting on:{" "}
            {[
              ...missingJoined.map(
                (p) =>
                  `${GROUP_ROLES[p.roleKey as SeatKey]?.name ?? p.roleKey} (join)`,
              ),
              ...missingReady.map(
                (p) => `${p.displayName ?? p.roleKey} (ready)`,
              ),
            ].join(", ") || "roster…"}
          </p>
        ) : null}
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
      </div>
    );
  }

  if (status !== "active" || !props.scene) {
    return (
      <div className="mt-8 space-y-3">
        {status === "active" && !props.scene ? (
          <>
            <LoadingSpinner label="Loading meeting scene…" />
            <p className="text-sm text-muted-foreground">
              Scene data is missing or out of date. Refreshing…
            </p>
            <button
              type="button"
              className="border border-border px-3 py-1.5 text-xs"
              onClick={() => router.refresh()}
            >
              Refresh now
            </button>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            {status === "committed" || status === "graded"
              ? "Meeting concluded — the debrief will appear when your professor releases it."
              : status === "lobby"
                ? "Waiting for the CEO to start the meeting…"
                : "Waiting for the next scene or professor debrief."}
          </p>
        )}
      </div>
    );
  }

  const sceneMessages = messages.filter(
    (m) => m.sceneId === (sceneId ?? props.scene!.id),
  );
  const humanCount = sceneMessages.filter((m) => m.senderKind === "human").length;
  const commitUnlocked = humanCount >= HUMAN_MSG_GATE;
  const suggestions = suggestionLines(props.roleKey);
  const mm = Math.floor(countdown / 60);
  const ss = String(countdown % 60).padStart(2, "0");
  const myBrief = GROUP_ROLES[props.roleKey as SeatKey];
  const myLabel = myBrief?.name ?? characterName(props.roleKey);

  return (
    <div className="mt-6 max-w-2xl space-y-6">
      <p className="rounded-lg border border-accent/40 bg-surface px-3 py-2 text-sm text-foreground">
        You are <span className="font-medium">{myLabel}</span>
        {myBrief?.title ? (
          <span className="text-muted-foreground"> — {myBrief.title}</span>
        ) : null}
        {!seatToken ? (
          <span className="mt-1 block text-xs text-red-700">
            Missing seat token — re-open your join link so messages send as this role.
          </span>
        ) : null}
      </p>
      <header className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {props.scene.timeLabel ?? "Meeting"} · Decision{" "}
              {decisionsMade + 1} of {props.decisionCount}
            </p>
            <h2 className="font-serif text-2xl text-foreground">
              {props.scene.title}
            </h2>
          </div>
          <span className="text-xs tabular-nums text-muted-foreground">
            {mm}:{ss}
            {msRemaining != null && msRemaining > 0
              ? ` · ${formatSessionRemaining(msRemaining)}`
              : ""}
          </span>
        </div>
        <div className="flex flex-wrap gap-3">
          {props.sceneCast.map((s) => {
            const isYou = s.id === props.roleKey;
            const seat = participants.find((p) => p.roleKey === s.id);
            const isAi = seat?.isAi ?? s.id === "eleanor";
            return (
              <div key={s.id} className="flex items-center gap-2 text-xs">
                <CastAvatar castId={s.id} name={s.name} size="sm" />
                <div>
                  <p className="font-medium text-foreground">
                    {s.name}
                    {isYou ? " (you)" : isAi ? " (AI)" : ""}
                  </p>
                  <p className="text-muted-foreground">{s.title}</p>
                </div>
              </div>
            );
          })}
        </div>
      </header>

      {props.scene.brief ? (
        <div className="border-l-2 border-accent bg-surface px-4 py-3 text-sm leading-relaxed text-foreground">
          {props.scene.brief}
        </div>
      ) : null}

      {props.roleBriefCollapsed ? (
        <div>
          <button
            type="button"
            className="text-xs uppercase tracking-wide text-muted-foreground underline"
            onClick={() => setBriefOpen((o) => !o)}
          >
            {briefOpen ? "Hide my brief" : "My brief"}
          </button>
          {briefOpen ? (
            <div className="mt-2 border border-border bg-surface px-4 py-3 text-sm">
              <p className="font-medium">
                {props.roleBriefCollapsed.name} —{" "}
                {props.roleBriefCollapsed.title}
              </p>
              <p className="mt-2 text-muted-foreground">
                {props.roleBriefCollapsed.stance}
              </p>
              <p className="mt-2">{props.roleBriefCollapsed.objective}</p>
              {props.roleBriefCollapsed.opening ? (
                <p className="mt-2 italic text-muted-foreground">
                  {props.roleBriefCollapsed.opening}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-border bg-background">
        <div
          ref={scrollRef}
          onScroll={() => {
            const el = scrollRef.current;
            if (!el) return;
            const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
            stickToBottomRef.current = dist < 80;
          }}
          className="chat-thread flex h-[min(48vh,24rem)] flex-col gap-3 overflow-y-auto px-3 py-4 sm:px-4"
        >
          {sceneMessages.map((m) => {
            const isMe = m.roleKey === props.roleKey;
            const isNarrator =
              m.senderKind === "narrator" || m.roleKey === "narrator";
            const charName = characterName(m.roleKey);
            const humanName = displayNameForRole(
              m.roleKey,
              props.cast,
              participants,
            );
            const title =
              GROUP_ROLES[m.roleKey as SeatKey]?.title ??
              (m.roleKey === "ceo" ? "Chief Executive Officer" : undefined);
            if (isNarrator) {
              return (
                <p
                  key={m.id}
                  className="mx-auto max-w-[90%] whitespace-pre-wrap text-center text-xs italic text-muted-foreground"
                >
                  {m.content}
                </p>
              );
            }
            return (
              <MessageBubble
                key={m.id}
                side={isMe ? "right" : "left"}
                castId={m.roleKey === "ceo" ? "ceo" : m.roleKey}
                name={isMe ? "You" : charName}
                role={
                  isMe
                    ? myLabel
                    : humanName !== charName
                      ? `${title ?? ""} · ${humanName}`.replace(/^ · /, "")
                      : title
                }
                text={m.content}
                animate={m.id > 0 && animateIds.has(m.id)}
              />
            );
          })}
          {thinkingRoleKeys[0] ? (
            <ThinkingIndicator
              castId={thinkingRoleKeys[0]}
              name={characterName(thinkingRoleKeys[0])}
            />
          ) : null}
        </div>

        <div className="border-t border-border bg-surface/50 px-3 py-3 sm:px-4">
          <AnswerComposer
            key={`speak-${props.roleKey}`}
            suggestions={suggestions}
            sending={sending}
            onSend={sendMessage}
            mentionTargets={props.sceneCast
              .filter((s) => s.id !== props.roleKey)
              .map((s) => ({
                roleKey: s.id,
                name: s.name,
                title: s.title,
              }))}
            placeholder="Speak in character… Tag a character below to address them"
          />
          {error ? (
            <p className="mt-2 text-sm text-red-700">{error}</p>
          ) : (
            <p className="mt-2 text-[10px] text-muted-foreground">
              Live · Realtime · {humanCount}/{HUMAN_MSG_GATE} human msgs
            </p>
          )}
        </div>
      </div>

      {props.isCeo ? (
        <div className="border-t border-border pt-6">
          <AnswerComposer
            mode="commit"
            options={props.options}
            reasoning={reasoning}
            onReasoningChange={setReasoning}
            selectedKey={optionKey}
            onSelectOption={setOptionKey}
            customText={customText}
            onCustomTextChange={setCustomText}
            commitUnlocked={commitUnlocked}
            unlockHint={`Commit unlocks after ${HUMAN_MSG_GATE} human messages (${humanCount}/${HUMAN_MSG_GATE}).`}
            commitDisabled={
              committing ||
              pending ||
              !optionKey ||
              reasoning.trim().length < 20 ||
              (optionKey === "custom" && !customText.trim())
            }
            committing={committing}
            onCommit={commit}
          />
        </div>
      ) : (
        <p className="text-sm italic text-muted-foreground">
          The CEO will decide.
        </p>
      )}
    </div>
  );
}
