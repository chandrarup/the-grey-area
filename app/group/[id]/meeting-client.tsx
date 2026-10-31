"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  startMeetingAction,
  toggleReadyAction,
} from "@/app/group/actions";
import { GROUP_ROLES, type SeatKey } from "@/lib/case/group-roles";
import type {
  GroupSessionState,
  RealtimeMessage,
  RealtimeParticipant,
  RealtimePressureStance,
} from "@/lib/realtime/types";
import { useGroupRealtime } from "@/lib/realtime/use-group-realtime";
import { formatSessionRemaining } from "@/lib/group-session-lifetime";
import {
  readSeatToken,
  seatHeaders,
  storeSeatToken,
} from "@/lib/group/seat-token-client";
import { LoadingSpinner } from "@/app/components/loading-spinner";
import { withBusyBar } from "@/app/components/navigation-progress";
import { prepareVoices } from "@/app/simulation/decisions/three/speech";
import type {
  CastMember,
  PressureStanceChip,
  SceneProp,
  ScriptBeat,
  StageMood,
} from "@/lib/case/types";
import type { GroupFilm, PhaseEventType } from "./group-stage";
import { isScenePhase } from "@/lib/group/meeting-runtime";

const GroupStage = dynamic(() => import("./group-stage"), { ssr: false });

type Msg = RealtimeMessage;


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
  /** Server-owned hard-synced phase (ADR 0001). */
  scenePhase?: string;
  phaseDeadlineAt?: string | null;
  stanceDeadlineAt?: string | null;
  filmWatchedSeatIds?: string[];
  scriptDoneSeatIds?: string[];
  scene: {
    id: string;
    title: string;
    timeLabel?: string;
    brief?: string;
    commitPrompt?: string;
    mood?: StageMood;
    minExchanges: number;
  } | null;
  cast: CastMember[];
  sceneCast: { id: string; name: string; title: string }[];
  messages: Msg[];
  options: { key: string; label: string }[];
  /** Authored chips per advisor seat for this scene. */
  pressureStances?: Record<string, PressureStanceChip[]>;
  roleBriefCollapsed?: {
    name: string;
    title: string;
    stance: string;
    objective: string;
    opening?: string | null;
  };
  film?: GroupFilm | null;
  script?: ScriptBeat[];
  sceneProps?: SceneProp[];
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
  const [scenePhase, setScenePhase] = useState(props.scenePhase ?? "open");
  const [phaseDeadlineAt, setPhaseDeadlineAt] = useState<string | null>(
    props.phaseDeadlineAt ?? null,
  );
  const [stanceDeadlineAt, setStanceDeadlineAt] = useState<string | null>(
    props.stanceDeadlineAt ?? null,
  );
  const [stances, setStances] = useState<RealtimePressureStance[]>([]);
  const [filmWatchedSeatIds, setFilmWatchedSeatIds] = useState<string[]>(
    props.filmWatchedSeatIds ?? [],
  );
  const [scriptDoneSeatIds, setScriptDoneSeatIds] = useState<string[]>(
    props.scriptDoneSeatIds ?? [],
  );
  const [msRemaining, setMsRemaining] = useState<number | null>(null);
  const [reasoning, setReasoning] = useState("");
  const [optionKey, setOptionKey] = useState<string | null>(null);
  const [customText, setCustomText] = useState("");
  const [seatToken, setSeatToken] = useState(props.joinToken);
  const cursorRef = useRef(
    props.messages.length ? Math.max(...props.messages.map((m) => m.id)) : 0,
  );
  const sceneIdRef = useRef(props.scene?.id ?? null);
  const tickRef = useRef<(() => Promise<void>) | null>(null);
  const pendingOptimisticRef = useRef<{
    id: number;
    content: string;
    roleKey: string;
  } | null>(null);

  useEffect(() => {
    setStatus(props.status);
    setIsReady(props.isReady);
    if (props.scenePhase) setScenePhase(props.scenePhase);
    if (props.phaseDeadlineAt !== undefined) {
      setPhaseDeadlineAt(props.phaseDeadlineAt);
    }
    if (props.stanceDeadlineAt !== undefined) {
      setStanceDeadlineAt(props.stanceDeadlineAt);
    }
    if (props.scene?.id) {
      setSceneId(props.scene.id);
      sceneIdRef.current = props.scene.id;
    }
  }, [
    props.status,
    props.isReady,
    props.scene?.id,
    props.scenePhase,
    props.phaseDeadlineAt,
    props.stanceDeadlineAt,
  ]);

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

  const mergeMessage = useCallback((m: Msg) => {
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
    if (m.id > 0) cursorRef.current = Math.max(cursorRef.current, m.id);
  }, []);

  const mergeState = useCallback(
    (state: GroupSessionState) => {
      setStatus(state.status);
      setSceneId(state.currentSceneId);
      setDecisionsMade(state.decisionsMade);
      if (state.scenePhase) setScenePhase(state.scenePhase);
      setPhaseDeadlineAt(state.phaseDeadlineAt ?? null);
      setStanceDeadlineAt(state.stanceDeadlineAt ?? null);
      if (Array.isArray(state.filmWatchedSeatIds)) {
        setFilmWatchedSeatIds(state.filmWatchedSeatIds);
      }
      if (Array.isArray(state.scriptDoneSeatIds)) {
        setScriptDoneSeatIds(state.scriptDoneSeatIds);
      }
      if (Array.isArray(state.stances)) {
        setStances(state.stances);
      }
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
      mergeMessage({
        id: Number(row.id),
        roleKey: String(row.role_key),
        senderKind: String(row.sender_kind),
        content: String(row.content),
        sceneId: String(row.scene_id),
      });
    },
  });

  useEffect(() => {
    void prepareVoices();
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
          mergeMessage(data.message as Msg);
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

  async function lockStance(chipKey: string, note?: string) {
    setError(null);
    try {
      await withBusyBar(async () => {
        const res = await fetch(`/api/group/${props.sessionCode}/stance`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...seatHeaders(seatToken),
          },
          body: JSON.stringify({ action: "lock", chipKey, note }),
        });
        const data = (await res.json()) as {
          error?: string;
          stance?: RealtimePressureStance;
        };
        if (!res.ok) throw new Error(data.error ?? "Stance lock failed");
        if (data.stance) {
          setStances((prev) => {
            const rest = prev.filter((s) => s.roleKey !== data.stance!.roleKey);
            return [...rest, data.stance!];
          });
        }
        if (tickRef.current) await tickRef.current();
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Stance lock failed");
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
        setReasoning("");
        setOptionKey(null);
        setCustomText("");
        router.refresh();
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Commit failed");
    } finally {
      setCommitting(false);
    }
  }

  /** Emit a hard-sync phase event; server/runtime owns the next phase. */
  const emitPhaseEvent = useCallback(
    async (type: PhaseEventType) => {
      if (!seatToken) return;
      try {
        const res = await fetch(`/api/group/${props.sessionCode}/phase`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...seatHeaders(seatToken),
          },
          body: JSON.stringify({ type }),
        });
        const data = (await res.json()) as {
          error?: string;
          scenePhase?: string;
          phaseDeadlineAt?: string | null;
          filmWatchedSeatIds?: string[];
          scriptDoneSeatIds?: string[];
        };
        if (!res.ok) throw new Error(data.error || "Phase update failed");
        if (data.scenePhase && isScenePhase(data.scenePhase)) {
          setScenePhase(data.scenePhase);
        }
        if (data.phaseDeadlineAt !== undefined) {
          setPhaseDeadlineAt(data.phaseDeadlineAt);
        }
        if (Array.isArray(data.filmWatchedSeatIds)) {
          setFilmWatchedSeatIds(data.filmWatchedSeatIds);
        }
        if (Array.isArray(data.scriptDoneSeatIds)) {
          setScriptDoneSeatIds(data.scriptDoneSeatIds);
        }
        void tickRef.current?.();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Phase update failed");
      }
    },
    [props.sessionCode, seatToken],
  );

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
                    await toggleReadyAction(props.participantId, next, seatToken);
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
                        seatToken,
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

  return (
    <GroupStage
      key={props.scene.id}
      sessionId={props.sessionId}
      roleKey={props.roleKey}
      isCeo={props.isCeo}
      scene={{
        id: props.scene.id,
        title: props.scene.title,
        timeLabel: props.scene.timeLabel,
        brief: props.scene.brief,
        commitPrompt: props.scene.commitPrompt,
        mood: props.scene.mood ?? "morning",
      }}
      decisionsMade={decisionsMade}
      decisionCount={props.decisionCount}
      cast={props.cast}
      sceneCast={props.sceneCast}
      participants={participants}
      messages={sceneMessages}
      thinkingRoleKeys={thinkingRoleKeys}
      msRemaining={msRemaining}
      sending={sending}
      onSend={sendMessage}
      options={props.options}
      reasoning={reasoning}
      onReasoningChange={setReasoning}
      optionKey={optionKey}
      onSelectOption={setOptionKey}
      customText={customText}
      onCustomTextChange={setCustomText}
      committing={committing}
      onCommit={commit}
      error={error}
      missingToken={!seatToken}
      roleBrief={props.roleBriefCollapsed}
      film={props.film ?? null}
      script={props.script ?? []}
      sceneProps={props.sceneProps}
      scenePhase={isScenePhase(scenePhase) ? scenePhase : "open"}
      phaseDeadlineAt={phaseDeadlineAt}
      stanceDeadlineAt={stanceDeadlineAt}
      filmWatchedSeatIds={filmWatchedSeatIds}
      scriptDoneSeatIds={scriptDoneSeatIds}
      pressureStances={props.pressureStances ?? {}}
      stances={stances}
      onLockStance={lockStance}
      onPhaseEvent={emitPhaseEvent}
    />
  );
}
