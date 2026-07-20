"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { joinWithCodeAction } from "@/app/group/actions";
import { SEAT_ORDER, type SeatKey } from "@/lib/case/group-roles";
import { storeSeatToken } from "@/lib/group/seat-token-client";

export function HomeJoinPanel() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [seat, setSeat] = useState<SeatKey>("tom");
  const [error, setError] = useState<string | null>(null);

  const input =
    "mt-2 w-full border border-border bg-background px-3 py-2 text-sm";

  return (
    <form
      className="mt-4 space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          try {
            const result = await joinWithCodeAction(
              code.trim(),
              seat,
              name.trim(),
            );
            storeSeatToken(result.sessionId, result.token);
            router.push(
              `/group/${result.sessionId}?t=${encodeURIComponent(result.token)}`,
            );
          } catch (err) {
            setError(err instanceof Error ? err.message : "Join failed");
          }
        });
      }}
    >
      <input
        className={input}
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="Session code (e.g. K7QP2M)"
        required
      />
      <input
        className={input}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your display name"
        required
      />
      <select
        className={input}
        value={seat}
        onChange={(e) => setSeat(e.target.value as SeatKey)}
      >
        {SEAT_ORDER.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={pending}
        className="bg-accent px-4 py-2 text-sm text-accent-foreground disabled:opacity-50"
      >
        {pending ? "Joining…" : "Join session"}
      </button>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </form>
  );
}
