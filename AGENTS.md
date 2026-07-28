# Agents (Cursor and others)

Read **`PROJECT.md` first**, then **`MEMORY.md`**.

**Rule:** any substantive change must append a dated entry to `MEMORY.md` in the same commit.

## Commands

```bash
npm run dev
npm run build
npm run validate:cases
npm run db:migrate
npm run db:seed
```

## Do not

- Put “The Grey Area” in user-facing text (UI, email, student copy).
- Rename internals / package name casually (`the-grey-area` stays internal).
- Break the assessment **release gate** (students only see feedback after release).
- Reintroduce heavy animation or gamified chrome.
- Violate principles in `PROJECT.md` (immutable decisions, monotonic integrity, no “correct” option signaling, suggestions never block free input).
- Duplicate product truth here — update `PROJECT.md` / `MEMORY.md` only.

<!-- BEGIN:nextjs-agent-rules -->
This is NOT the Next.js you know — APIs/file structure may differ. Read `node_modules/next/dist/docs/` before writing Next code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
