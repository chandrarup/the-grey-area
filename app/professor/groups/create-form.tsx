"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { createSessionAction } from "@/app/group/actions";
import { SEAT_ORDER } from "@/lib/case/group-roles";
import { MODELS } from "@/lib/llm/models";

export function CreateSessionForm({
  defaultRoleplayModel,
  defaultGraderModel,
}: {
  defaultRoleplayModel: string;
  defaultGraderModel: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="mt-8 border border-border p-5"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          const id = await createSessionAction(fd);
          router.push(`/professor/groups/${id}`);
        });
      }}
    >
      <label className="text-xs uppercase tracking-wide text-muted-foreground">
        How many decisions? (1–5)
      </label>
      <input
        name="decisionCount"
        type="number"
        min={1}
        max={5}
        defaultValue={1}
        className="mt-2 block w-24 border border-border bg-background px-3 py-2 text-sm"
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            Roleplay model
          </span>
          <select
            name="roleplayModel"
            defaultValue={defaultRoleplayModel}
            className="mt-2 block w-full border border-border bg-background px-2 py-2 text-sm"
          >
            {MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            Grader model
          </span>
          <select
            name="graderModel"
            defaultValue={defaultGraderModel}
            className="mt-2 block w-full border border-border bg-background px-2 py-2 text-sm"
          >
            {MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="mt-6 text-xs uppercase tracking-wide text-muted-foreground">
        Seats — Human gets a join link; AI fills the role
      </p>
      <div className="mt-3 space-y-3">
        {SEAT_ORDER.map((seat) => (
          <div
            key={seat}
            className="flex flex-wrap items-center gap-2 border-b border-border pb-3 last:border-0"
          >
            <span className="w-16 capitalize text-sm text-foreground">{seat}</span>
            {seat === "ceo" ? (
              <span className="text-sm text-muted-foreground">Human only</span>
            ) : (
              <select
                name={seat}
                defaultValue="human"
                className="border border-border bg-background px-2 py-1 text-sm"
              >
                <option value="human">Human</option>
                <option value="ai">AI</option>
              </select>
            )}
            <input
              name={`name_${seat}`}
              placeholder="Display name (optional)"
              className="min-w-[10rem] flex-1 border border-border bg-background px-2 py-1 text-sm"
            />
          </div>
        ))}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-6 bg-accent px-5 py-2.5 text-sm text-accent-foreground disabled:opacity-50"
      >
        {pending ? "Creating…" : "Create session"}
      </button>
    </form>
  );
}
