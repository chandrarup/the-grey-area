# The Cost of Winning

## What we're building

**The Cost of Winning** is an AI ethics simulation: students face escalating executive decisions under realistic pressure and receive AI-assisted feedback after the instructor releases it. Internal repo/package name is `the-grey-area` — that phrase must **never** appear in user-facing copy.

## Who it's for

**Stage 1** (AI-Powered Executive Simulation) of the Transformational Ethics Experience for the CaliBaja North American Leadership Academy. Stages 2 (facilitated Ethics Workshop) and 3 (ongoing Ethics Learning Community) happen outside this app.

## Modes

1. **Instructor workspace** — verified allowlisted administrators sign in to a simulation library, create groups, monitor all sessions, review and release feedback. The two owner emails/accounts will be configured later.
2. **Student preview** — only signed-in instructors can play the solo CEO experience, on their own run.
3. **Invite-only multiplayer** — students enter their assigned seat through a personal link; no library, public solo entry, arbitrary role switch, or code-only seat claiming. CEO commits.

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
| Live state | Authenticated HTTP polling (anonymous Realtime removed) |
| Auth | Supabase email/password + server-only admin email allowlist; student seat tokens |
| AI | Vercel AI SDK (`ai` + Anthropic / Google / OpenAI) |
| Email | Resend (batch invites) |
| Host | Vercel |

Read `node_modules/next/dist/docs/` before Next APIs — this Next version differs from older training data.

## Deliberately not built yet

- Provision the two owner accounts and set `ADMIN_EMAILS`
- Apply `0014_private_training_data.sql` to deployments; until applied, old demo database grants remain
- Rotate the formerly committed example service credential before deployment
- Headset VR (this experience uses normal-browser 3D)
- Stages 2 & 3 of the ethics program
- Professor case authoring UI (cases stay in code/config for now)

## Presentation and debrief

Browser 3D is shared across solo preview and group play. Characters remain seated with
bounded procedural gaze layered on a restored animation pose. Cameras do not bob or follow
the mouse; films respect reduced-motion preferences. Case-defined values are connected to
reviewed assessment evidence only after release, then followed by workplace reflection.
The library currently contains one playable case and an explicitly labeled future-case placeholder.
