"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Thin top progress bar during same-origin navigations and long client waits.
 * Call `window.dispatchEvent(new Event("tga:busy-start"))` / `tga:busy-end`
 * from forms that run multi-second server actions.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(false);
    window.dispatchEvent(new Event("tga:busy-end"));
  }, [pathname, searchParams]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }
      const a = (e.target as HTMLElement | null)?.closest?.("a");
      if (!a) return;
      const href = a.getAttribute("href");
      if (!href || href.startsWith("#") || a.target === "_blank") return;
      try {
        const url = new URL(href, window.location.href);
        if (url.origin !== window.location.origin) return;
        if (
          url.pathname === window.location.pathname &&
          url.search === window.location.search
        ) {
          return;
        }
        setActive(true);
      } catch {
        /* ignore */
      }
    };

    const start = () => setActive(true);
    const end = () => setActive(false);

    document.addEventListener("click", onClick);
    window.addEventListener("tga:busy-start", start);
    window.addEventListener("tga:busy-end", end);
    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("tga:busy-start", start);
      window.removeEventListener("tga:busy-end", end);
    };
  }, []);

  if (!active) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5 overflow-hidden bg-border/40"
      role="progressbar"
      aria-label="Loading"
      aria-busy="true"
    >
      <div className="tga-progress-indeterminate h-full w-1/3 bg-accent" />
    </div>
  );
}

/** Fire global busy bar for the duration of an async action. */
export async function withBusyBar<T>(fn: () => Promise<T>): Promise<T> {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("tga:busy-start"));
  }
  try {
    return await fn();
  } finally {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("tga:busy-end"));
    }
  }
}
