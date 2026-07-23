"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MessageBubble } from "@/app/components/chat/message-bubble";
import { characterName, seatTitle } from "@/lib/group/public-roster";
import { GROUP_ROLES, type SeatKey } from "@/lib/case/group-roles";
import { useGroupRealtime } from "@/lib/realtime/use-group-realtime";
import type { RealtimeMessage, RealtimeParticipant } from "@/lib/realtime/types";

/**
 * Staff read-only live transcript — same bubble language as the meeting,
 * works while ACTIVE (not only after commit).
 */
export function StaffLiveTranscript({
  sessionId,
  caseSlug,
  initialMessages,
}: {
  sessionId: string;
  caseSlug: string;
  initialMessages: {
    id: number;
    roleKey: string;
    senderKind: string;
    content: string;
    sceneId: string;
  }[];
}) {
  const [messages, setMessages] = useState<RealtimeMessage[]>(
    initialMessages.map((m) => ({
      id: m.id,
      roleKey: m.roleKey,
      senderKind: m.senderKind,
      content: m.content,
      sceneId: m.sceneId,
    })),
  );
  const [participants, setParticipants] = useState<RealtimeParticipant[]>([]);
  const [status, setStatus] = useState<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef(
    initialMessages.length
      ? initialMessages[initialMessages.length - 1]!.id
      : 0,
  );

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/group/${sessionId}/state?after=${cursorRef.current}`,
      );
      if (!res.ok) return;
      const data = await res.json();
      setStatus(data.status ?? "");
      setParticipants(data.participants ?? []);
      if (Array.isArray(data.messages) && data.messages.length > 0) {
        setMessages((prev) => {
          const seen = new Set(prev.map((m) => m.id));
          const next = [...prev];
          for (const m of data.messages as RealtimeMessage[]) {
            if (!seen.has(m.id)) next.push(m);
          }
          return next;
        });
        cursorRef.current = data.cursor ?? cursorRef.current;
      } else if (cursorRef.current === 0 && Array.isArray(data.messages)) {
        setMessages(data.messages);
        cursorRef.current = data.cursor ?? 0;
      }
    } catch {
      // ignore
    }
  }, [sessionId]);

  useEffect(() => {
    void refresh();
    const id = setInterval(() => void refresh(), 4000);
    return () => clearInterval(id);
  }, [refresh]);

  useGroupRealtime(sessionId, {
    onChange: () => void refresh(),
    onMessageInsert: (row) => {
      const msg: RealtimeMessage = {
        id: Number(row.id),
        roleKey: String(row.role_key),
        senderKind: String(row.sender_kind),
        content: String(row.content),
        sceneId: String(row.scene_id),
      };
      setMessages((prev) =>
        prev.some((m) => m.id === msg.id) ? prev : [...prev, msg],
      );
      cursorRef.current = Math.max(cursorRef.current, msg.id);
    },
  });

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  return (
    <section className="mt-10">
      <h2 className="text-sm font-medium text-foreground">Live transcript</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Read-only · {status || "…"} · character names · Realtime
      </p>
      <div className="mt-4 overflow-hidden border border-border bg-background">
        <div
          ref={scrollRef}
          className="chat-thread flex h-[min(52vh,28rem)] flex-col gap-3 overflow-y-auto px-3 py-4 sm:px-4"
        >
          {messages.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No messages yet.
            </p>
          ) : (
            messages.map((m) => {
              const isNarrator =
                m.senderKind === "narrator" || m.roleKey === "narrator";
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
              const charName = characterName(m.roleKey, caseSlug);
              const seat = participants.find((p) => p.roleKey === m.roleKey);
              const student =
                seat?.displayName &&
                !/^you\b/i.test(seat.displayName) &&
                seat.displayName !== charName
                  ? seat.displayName
                  : null;
              const title =
                GROUP_ROLES[m.roleKey as SeatKey]?.title ??
                seatTitle(m.roleKey);
              return (
                <MessageBubble
                  key={m.id}
                  side="left"
                  castId={m.roleKey === "ceo" ? "ceo" : m.roleKey}
                  name={charName}
                  role={
                    student ? `${title} · ${student}` : title
                  }
                  text={m.content}
                />
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
