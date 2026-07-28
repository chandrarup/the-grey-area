"use client";

import { useCallback, useEffect, useState } from "react";
import {
  SharedBriefingPager,
  hasCompletedBriefing,
} from "@/app/components/group/shared-briefing-pager";

/**
 * Hides confidential brief / roster / ready controls until the shared
 * briefing pager has been read through (all roles).
 */
export function LobbyBriefingGate({
  storageKey,
  pages,
  children,
}: {
  storageKey: string;
  pages: { title: string; body: string }[];
  children: React.ReactNode;
}) {
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDone(hasCompletedBriefing(storageKey));
  }, [storageKey]);

  const onComplete = useCallback(() => {
    setDone(true);
  }, []);

  return (
    <>
      <section className="mt-10">
        <SharedBriefingPager
          pages={pages}
          storageKey={storageKey}
          onComplete={onComplete}
        />
      </section>

      {done ? (
          <div className="mt-12">{children}</div>
      ) : (
        <p className="mt-10 text-sm text-muted-foreground">
          Read through all {pages.length} shared briefing pages. Your
          confidential role brief and ready controls appear when you reach the
          last page.
        </p>
      )}
    </>
  );
}
