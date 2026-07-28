"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { joinWithCodeAction, joinWithTokenAction } from "@/app/group/actions";
import { SEAT_ORDER, type SeatKey } from "@/lib/case/group-roles";
import { storeSeatToken } from "@/lib/group/seat-token-client";
import { BusyButton } from "@/app/components/busy-button";
import { withBusyBar } from "@/app/components/navigation-progress";

export function JoinForm({ initialToken }: { initialToken: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState(initialToken);
  const [code, setCode] = useState("");
  const [tokenName, setTokenName] = useState("");
  const [codeName, setCodeName] = useState("");
  const [seat, setSeat] = useState<SeatKey>("marcus");
  const [codeOpen, setCodeOpen] = useState(false);

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
      {pending ? (
        <p className="text-sm text-muted-foreground">Joining your seat…</p>
      ) : null}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          startTransition(async () => {
            try {
              await withBusyBar(async () => {
                const result = await joinWithTokenAction(
                  token.trim(),
                  tokenName.trim(),
                );
                goToSeat(result.sessionId, result.token);
              });
            } catch (err) {
              setError(err instanceof Error ? err.message : "Join failed");
            }
          });
        }}
      >
        <h2 className="text-sm font-medium text-foreground">
          Join with link / token
        </h2>
        <input
          className={input}
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Join token"
          required
          disabled={pending}
        />
        <input
          className={input}
          value={tokenName}
          onChange={(e) => setTokenName(e.target.value)}
          placeholder="Display name (optional)"
          autoComplete="nickname"
          disabled={pending}
        />
        <BusyButton
          type="submit"
          pending={pending}
          pendingLabel="Joining…"
          className="mt-3 bg-accent px-4 py-2 text-sm text-accent-foreground disabled:opacity-50"
        >
          Join seat
        </BusyButton>
      </form>

      <div>
        <button
          type="button"
          className="flex w-full items-center justify-between border border-border px-3 py-2 text-left text-sm text-foreground"
          aria-expanded={codeOpen}
          onClick={() => setCodeOpen((o) => !o)}
        >
          <span className="font-medium">Join with code</span>
          <span className="text-xs text-muted-foreground">
            {codeOpen ? "Hide" : "Show"}
          </span>
        </button>

        {codeOpen ? (
          <form
            className="mt-3 border border-t-0 border-border px-3 pb-3 pt-1"
            onSubmit={(e) => {
              e.preventDefault();
              setError(null);
              startTransition(async () => {
                try {
                  await withBusyBar(async () => {
                    const result = await joinWithCodeAction(
                      code.trim(),
                      seat,
                      codeName.trim(),
                    );
                    goToSeat(result.sessionId, result.token);
                  });
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Join failed");
                }
              });
            }}
          >
            <input
              className={input}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Session code"
              required
              disabled={pending}
            />
            <input
              className={input}
              value={codeName}
              onChange={(e) => setCodeName(e.target.value)}
              placeholder="Display name (optional)"
              autoComplete="nickname"
              disabled={pending}
            />
            <select
              className={input}
              value={seat}
              onChange={(e) => setSeat(e.target.value as SeatKey)}
              disabled={pending}
            >
              {SEAT_ORDER.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <BusyButton
              type="submit"
              pending={pending}
              pendingLabel="Joining…"
              className="mt-3 border border-border px-4 py-2 text-sm disabled:opacity-50"
            >
              Join via code
            </BusyButton>
          </form>
        ) : null}
      </div>

      {error ? (
        <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
      ) : null}
    </div>
  );
}
