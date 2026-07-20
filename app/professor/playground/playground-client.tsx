"use client";

import { useState, useTransition } from "react";
import { playgroundChat } from "./playground-actions";

const CAST = [
  { id: "marcus", name: "Marcus Reed" },
  { id: "david", name: "David Okafor" },
  { id: "priya", name: "Priya Nair" },
  { id: "tom", name: "Tom Bradley" },
  { id: "eleanor", name: "Eleanor Voss" },
] as const;

export function PlaygroundClient() {
  const [castId, setCastId] = useState<string>("marcus");
  const [input, setInput] = useState("");
  const [log, setLog] = useState<{ role: string; text: string }[]>([]);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-2xl px-6 py-12 md:px-8">
      <a href="/professor" className="text-sm underline">
        ← Dashboard
      </a>
      <h1 className="mt-4 font-serif text-3xl text-foreground">
        Persona playground
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Chat with a single cast member to pressure-test voice and arguments.
      </p>

      <label className="mt-8 block text-xs uppercase text-muted-foreground">
        Persona
      </label>
      <select
        className="mt-2 border border-border bg-background px-3 py-2 text-sm"
        value={castId}
        onChange={(e) => setCastId(e.target.value)}
      >
        {CAST.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <div className="mt-8 flex flex-col gap-4">
        {log.map((entry, i) => (
          <div key={i} className="text-sm">
            <p className="text-xs uppercase text-muted-foreground">{entry.role}</p>
            <p className="mt-1 text-foreground">{entry.text}</p>
          </div>
        ))}
      </div>

      <textarea
        className="mt-6 w-full border border-border bg-background px-3 py-2 text-sm"
        rows={3}
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
      <button
        type="button"
        disabled={pending || !input.trim()}
        className="mt-3 bg-accent px-4 py-2 text-sm text-accent-foreground disabled:opacity-50"
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const message = input.trim();
            setInput("");
            setLog((prev) => [...prev, { role: "You", text: message }]);
            try {
              const reply = await playgroundChat(castId, message, log);
              setLog((prev) => [
                ...prev,
                {
                  role: CAST.find((c) => c.id === castId)?.name ?? castId,
                  text: reply,
                },
              ]);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Failed");
            }
          })
        }
      >
        Send
      </button>
    </div>
  );
}
