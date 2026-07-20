"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { deleteGroupSessionAction } from "@/app/group/actions";

export function DeleteSessionButton({
  sessionId,
  code,
}: {
  sessionId: string;
  code: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      className="mt-6 border border-red-300 px-4 py-2 text-sm text-red-800 dark:border-red-900 dark:text-red-400 disabled:opacity-50"
      onClick={() =>
        startTransition(async () => {
          if (
            !confirm(`Delete session ${code}? All messages and data will be removed.`)
          ) {
            return;
          }
          await deleteGroupSessionAction(sessionId);
          router.push("/professor");
          router.refresh();
        })
      }
    >
      Delete this session
    </button>
  );
}
