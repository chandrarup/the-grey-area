"use client";

import { useState } from "react";
import { MarkdownBody } from "@/app/components/markdown-body";
import { ContinueButton } from "../continue-button";

type Page = { title: string; body: string };

export function BriefingPager({
  pages,
  runId,
}: {
  pages: Page[];
  runId: string;
}) {
  const [index, setIndex] = useState(0);
  const safeIndex = Math.min(Math.max(0, index), Math.max(0, pages.length - 1));
  const page = pages[safeIndex];
  const last = safeIndex === pages.length - 1;

  if (!page) {
    return (
      <p className="text-sm text-muted-foreground">
        Briefing packet is empty. Return to the previous stage or start over.
      </p>
    );
  }

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Packet {safeIndex + 1} of {pages.length}
      </p>
      <h2 className="mt-2 font-serif text-2xl text-foreground">{page.title}</h2>
      <div className="mt-4">
        <MarkdownBody source={page.body} />
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={safeIndex === 0}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          className="border border-border px-4 py-2 text-sm disabled:opacity-40"
        >
          Previous
        </button>
        {!last ? (
          <button
            type="button"
            onClick={() =>
              setIndex((i) => Math.min(pages.length - 1, i + 1))
            }
            className="bg-accent px-4 py-2 text-sm text-accent-foreground"
          >
            Next page
          </button>
        ) : (
          <ContinueButton
            runId={runId}
            fromSlug="read-case"
            toSlug="values"
            label="Continue to values"
          />
        )}
      </div>
    </div>
  );
}
