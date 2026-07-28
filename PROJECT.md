# The Cost of Winning

## What we're building

**The Cost of Winning** is an AI ethics simulation: students face escalating executive decisions under realistic pressure and receive AI-assisted feedback after the instructor releases it. Internal repo/package name is `the-grey-area` — that phrase must **never** appear in user-facing copy.

## Who it's for

**Stage 1** (AI-Powered Executive Simulation) of the Transformational Ethics Experience for the CaliBaja North American Leadership Academy. Stages 2 (facilitated Ethics Workshop) and 3 (ongoing Ethics Learning Community) happen outside this app.

## Modes

1. **Solo** — student plays CEO; AI voices other executives.
2. **Live multiplayer** — professor creates groups; each student plays one executive seat in a shared meeting (CEO commits).

## Non-negotiable design principles

- Cases are **typed config** in `lib/case/` — never hard-code story logic in UI/API.
- Recorded **decisions are immutable** (no undo after commit).
- **Integrity latch is monotonic** (`clean` → `compromised`, never back).
- Options must **not signal a “correct” answer**.
- Seat **suggestions never block free input**.
- Students **never see feedback** until the instructor **releases** it.
- UI: **one accent colour**, minimal chrome, editorial/serious — not gamified SaaS.

## Tech stack

| Layer | Choice |
|-------|--------|
| App | Next.js 16 App Router, React 19, TypeScript |
| Style | Tailwind CSS 4 |
| DB | Supabase Postgres + Drizzle ORM |
| Realtime | Supabase Realtime |
| Auth | Dev-identity (cookie + join tokens) today |
| AI | Vercel AI SDK (`ai` + Anthropic / Google / OpenAI) |
| Email | Resend (batch invites) |
| Host | Vercel |

Read `node_modules/next/dist/docs/` before Next APIs — this Next version differs from older training data.

## Deliberately not built yet

- Real **Supabase Auth** + membership-scoped RLS
- Production hardening (Realtime still demo-grade with anon reads)
- Stages 2 & 3 of the ethics program
- Professor case authoring UI (cases stay in code/config for now)
