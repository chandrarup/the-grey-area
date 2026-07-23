"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  deleteExpiredGroupSessionsAction,
  deleteGroupSessionAction,
} from "@/app/group/actions";

type SessionRow = {
  id: string;
  code: string;
  status: string;
  decisionsMade: number;
  decisionCount: number;
  roleplayModel: string;
  expired: boolean;
  remainingLabel: string | null;
  batchId?: string | null;
};

export function ProfessorSessionList({ sessions }: { sessions: SessionRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const expiredCount = sessions.filter((s) => s.expired).length;

  if (sessions.length === 0) {
    return (
      <p className="px-4 py-3 text-sm text-muted-foreground">
        None yet — create one above.
      </p>
    );
  }

  return (
    <div>
      {expiredCount > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2">
          <p className="text-xs text-muted-foreground">
            {expiredCount} expired (30 min limit)
          </p>
          <button
            type="button"
            disabled={pending}
            className="text-xs underline disabled:opacity-50"
            onClick={() =>
              startTransition(async () => {
                await deleteExpiredGroupSessionsAction();
                router.refresh();
              })
            }
          >
            Delete all expired
          </button>
        </div>
      ) : null}
      <ul className="divide-y divide-border">
        {sessions.map((s) => (
          <li
            key={s.id}
            className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
          >
            <div className="min-w-0">
              <Link
                href={`/professor/groups/${s.id}`}
                className="font-medium text-foreground underline-offset-2 hover:underline"
              >
                {s.code}
              </Link>
              <span className="ml-2 text-muted-foreground">
                {s.status} · {s.decisionsMade}/{s.decisionCount} ·{" "}
                {s.roleplayModel}
                {s.remainingLabel ? ` · ${s.remainingLabel}` : ""}
              </span>
              {s.batchId ? (
                <Link
                  href={`/professor/groups/batch/${s.batchId}`}
                  className="ml-2 text-xs text-muted-foreground underline"
                >
                  batch
                </Link>
              ) : null}
            </div>
            <button
              type="button"
              disabled={pending}
              title={`Delete session ${s.code}`}
              className="interactive shrink-0 border border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
              onClick={() =>
                startTransition(async () => {
                  if (
                    !confirm(
                      `Delete session ${s.code}? This cannot be undone.`,
                    )
                  ) {
                    return;
                  }
                  await deleteGroupSessionAction(s.id);
                  router.refresh();
                })
              }
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
