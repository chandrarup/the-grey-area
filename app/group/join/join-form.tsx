"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { joinWithCodeAction, joinWithTokenAction } from "@/app/group/actions";
import { SEAT_ORDER, type SeatKey } from "@/lib/case/group-roles";
import { storeSeatToken } from "@/lib/group/seat-token-client";

export function JoinForm({ initialToken }: { initialToken: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState(initialToken);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [seat, setSeat] = useState<SeatKey>("marcus");

  const input =
    "mt-2 w-full border border-border bg-background px-3 py-2 text-sm";

  function goToSeat(sessionId: string, seatToken: string) {
    storeSeatToken(sessionId, seatToken);
    router.push(
      `/group/${sessionId}?t=${encodeURIComponent(seatToken)}`,
    );
    router.refresh();
  }

  return (
    <div className="mt-8 space-y-10">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          startTransition(async () => {
            try {
              const result = await joinWithTokenAction(
                token.trim(),
                name.trim(),
              );
              goToSeat(result.sessionId, result.token);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Join failed");
            }
          });
        }}
      >
        <h2 className="text-sm font-medium text-foreground">Join with link / token</h2>
        <input
          className={input}
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Join token"
          required
        />
        <input
          className={input}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your display name"
          required
        />
        <button
          type="submit"
          disabled={pending}
          className="mt-3 bg-accent px-4 py-2 text-sm text-accent-foreground disabled:opacity-50"
        >
          Join seat
        </button>
      </form>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          startTransition(async () => {
            try {
              const result = await joinWithCodeAction(
                code.trim(),
                seat,
                name.trim() || "Participant",
              );
              goToSeat(result.sessionId, result.token);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Join failed");
            }
          });
        }}
      >
        <h2 className="text-sm font-medium text-foreground">Join with code</h2>
        <input
          className={input}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Session code"
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
          className="mt-3 border border-border px-4 py-2 text-sm disabled:opacity-50"
        >
          Join via code
        </button>
      </form>

      {error ? (
        <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
      ) : null}
    </div>
  );
}
