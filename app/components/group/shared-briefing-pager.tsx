"use client";

import { useState } from "react";
import { MarkdownBody } from "@/app/components/markdown-body";

type Page = { title: string; body: string };

/** Shared (non-confidential) briefing reader for the group lobby. */
export function SharedBriefingPager({ pages }: { pages: Page[] }) {
  const [index, setIndex] = useState(0);
  if (pages.length === 0) return null;
  const page = pages[index]!;
  const last = index === pages.length - 1;

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Shared briefing · {index + 1} of {pages.length}
      </p>
      <h2 className="mt-2 font-serif text-2xl text-foreground">{page.title}</h2>
      <div className="mt-4 text-sm leading-relaxed text-muted-foreground">
        <MarkdownBody source={page.body} />
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={index === 0}
          onClick={() => setIndex((i) => i - 1)}
          className="border border-border px-4 py-2 text-sm disabled:opacity-40"
        >
          Previous
        </button>
        {!last ? (
          <button
            type="button"
            onClick={() => setIndex((i) => i + 1)}
            className="bg-accent px-4 py-2 text-sm text-accent-foreground"
          >
            Next page
          </button>
        ) : (
          <p className="self-center text-xs text-muted-foreground">
            End of shared briefing
          </p>
        )}
      </div>
    </div>
  );
}
