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
  const page = pages[index];
  const last = index === pages.length - 1;

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Packet {index + 1} of {pages.length}
      </p>
      <h2 className="mt-2 font-serif text-2xl text-foreground">{page.title}</h2>
      <div className="mt-4">
        <MarkdownBody source={page.body} />
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-3">
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
