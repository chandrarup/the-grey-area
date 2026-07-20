"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setCaseStatus, setUserRole } from "./actions";

type CaseRow = {
  id: string;
  slug: string;
  title: string;
  status: string;
  version: number;
};

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export function AdminControls({
  cases,
  users,
  runCount,
}: {
  cases: CaseRow[];
  users: UserRow[];
  runCount: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="mt-10 grid gap-10 lg:grid-cols-2">
      <section>
        <h2 className="text-sm font-medium text-foreground">Cases</h2>
        <ul className="mt-4 divide-y divide-border border border-border">
          {cases.map((c) => (
            <li key={c.id} className="px-4 py-4 text-sm">
              <p className="font-medium text-foreground">{c.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {c.slug} · v{c.version} · {c.status}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(["draft", "published", "archived"] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    disabled={pending || c.status === status}
                    className="border border-border px-3 py-1 text-xs hover:border-accent disabled:opacity-40"
                    onClick={() =>
                      startTransition(async () => {
                        await setCaseStatus(c.id, status);
                        router.refresh();
                      })
                    }
                  >
                    {status}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-muted-foreground">
          Active solo runs in system: {runCount}
        </p>
      </section>

      <section>
        <h2 className="text-sm font-medium text-foreground">Users & roles</h2>
        <ul className="mt-4 divide-y divide-border border border-border">
          {users.map((u) => (
            <li key={u.id} className="px-4 py-4 text-sm">
              <p className="font-medium text-foreground">{u.name || u.email}</p>
              <p className="mt-1 text-xs text-muted-foreground">{u.email}</p>
              <select
                className="mt-3 border border-border bg-background px-2 py-1 text-sm"
                defaultValue={u.role}
                disabled={pending}
                onChange={(e) =>
                  startTransition(async () => {
                    await setUserRole(
                      u.id,
                      e.target.value as "student" | "professor" | "admin",
                    );
                    router.refresh();
                  })
                }
              >
                <option value="student">student</option>
                <option value="professor">professor</option>
                <option value="admin">admin</option>
              </select>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
