# The Cost of Winning

> **Contributors / agents:** read [`PROJECT.md`](./PROJECT.md) first, then [`MEMORY.md`](./MEMORY.md).

**The Cost of Winning** is Stage 1: AI-Powered Executive Simulation of a three-stage ethics program, the Transformational Ethics Experience for the CaliBaja North American Leadership Academy (Stage 2 = a facilitated Ethics Workshop; Stage 3 = an ongoing Ethics Learning Community — those are delivered outside this app). This app immerses participants in the case and gives AI-driven feedback on their decisions, biases and blind spots.

It is an AI ethics simulation: play solo against AI executives, or join a live multiplayer executive meeting where each student has an assigned role. Instructors create sessions (or whole-class batches), share join links, monitor progress, grade with AI assistance, and release feedback.

> Internal repo / package name remains `the-grey-area`; that name must not appear in user-facing product copy.

## How this was built

Cases are authored as typed config in `lib/case/` so the simulation engine stays generic and case-agnostic. All LLM calls go through one schema-validated layer in `lib/llm/` (Vercel AI SDK) across Anthropic, Google, and OpenAI. Group mode uses Supabase Realtime so students share a live meeting; writes stay on server routes and Drizzle. The project began as a Python/Streamlit prototype and was rebuilt on Next.js for real-time multiplayer and a controllable UI.

## Tech stack

| Layer | Technology | Version (from `package.json`) |
|-------|------------|-------------------------------|
| Framework | Next.js App Router, React, TypeScript | Next **16.2.10**, React **19.2.4**, TypeScript **^5** |
| Styling | Tailwind CSS | **^4** |
| Database | Supabase Postgres via Drizzle ORM | Drizzle ORM **^0.45.2**, `postgres` **^3.4.9** |
| Realtime | Supabase Realtime (`postgres_changes`) | `@supabase/supabase-js` **^2.109.0** |
| Auth | Dev-identity today (mode cookie + join tokens); Supabase Auth planned | — |
| AI | Vercel AI SDK (`ai` + `@ai-sdk/*`) | `ai` **^7.0.22**, provider SDKs **^4.0.x** |
| Email | Resend (batch seat invites) | `resend` **^6.18.0** |
| Hosting | Vercel | — |

## Run it locally

**Prerequisites:** Node.js **20+**, npm, and a [Supabase](https://supabase.com) project (Postgres + Realtime).

1. **Install**

   ```bash
   npm install
   ```

2. **Environment**

   ```bash
   cp .env.example .env.local
   ```

   | Variable | Purpose |
   |----------|---------|
   | `DATABASE_URL` | Supabase → **Connect** → **Session pooler** (URI, port 6543) |
   | `NEXT_PUBLIC_SUPABASE_URL` | Project **Settings → API → Project URL** |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project **Settings → API → anon public** |
   | `SUPABASE_SERVICE_ROLE_KEY` | Project **Settings → API → service_role** — server only |
   | `DEV_IDENTITY` | `true` locally enables a small **Switch role** control in area headers |
   | `GEMINI_API_KEY` | At least one LLM key (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY` as needed) |
   | `NEXT_PUBLIC_APP_BASE_URL` | Canonical URL for join links in emails (**required** for batch invites) |
   | `RESEND_API_KEY` | Resend API key for batch seat invites |
   | `EMAIL_FROM` | Verified sender, e.g. `The Cost of Winning <invites@yourdomain.com>` (**required** — no silent default) |
   | `EMAIL_TEST_TO` | Optional: redirect every invite to this inbox while testing (intended recipient is logged) |

   **Resend sandbox vs class mail:** Resend’s default sandbox from-address (`onboarding@resend.dev`) can only deliver to the Resend account owner’s own email. Other recipients fail. To email a real class, [verify a domain in Resend](https://resend.com/domains), then set `EMAIL_FROM` to an address on that domain. Use **Send test to myself** on the invites screen (or `EMAIL_TEST_TO`) to verify configuration before mailing the roster.

3. **Database**

   ```bash
   npm run db:migrate
   npm run db:seed
   ```

4. **Start**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) — the marketing home. Choose **I'm a student** or **I'm an instructor**.

5. **Checks**

   ```bash
   npm run validate:cases
   npm run db:smoke
   ```

### Local instructor / admin access

With `DEV_IDENTITY=true`, use **Switch role** in the student or instructor header (Admin / Professor / Student). Seeded profiles come from `npm run db:seed` (`professor@dev.local`, `admin@dev.local`, etc.).

Or promote in SQL:

```sql
UPDATE profiles SET role = 'professor' WHERE email = 'your@email.test';
```

`/dev/identity` (also gated by `DEV_IDENTITY`) picks any seeded profile by cookie.

## Using the product

### For students

From the home page, choose **I'm a student**, then **Start solo play** — meet the team, read the briefing, work through decisions with AI executives, and get feedback.

For a live meeting, open the unique invite link from your instructor (`/?join=…`). You land on join, read your confidential brief, mark ready, and take part; the CEO commits decisions.

### For instructors

Choose **I'm an instructor**. Create a session or a roster batch (Create → Edit groups → Send invites → Monitor — you can move between those steps at any time). Groups get memorable names (e.g. Harbor Table); the short code stays as a backup join id. Share per-seat links or email invites, monitor the batch board, open a group for live transcript and assessment, write feedback, and release the debrief. Solo student runs live under **Solo runs**. Model defaults are under **Settings**.

## Project structure

```
app/                    Next.js App Router — pages, API routes, server actions
  student/              Student entry hub
  simulation/           Solo student flow
  group/                Multiplayer join + live meeting
  professor/            Instructor sessions, batches, grading
  api/group/[code]/     Group REST: state, messages, commits, AI turns
lib/case/               Case config, types, validation
lib/llm/                Schema-validated LLM entry point
lib/db/                 Drizzle schema, queries, migrations, seed
lib/group/              Seat auth, roster, batch planning
lib/realtime/           Supabase Realtime hooks
lib/auth/role-guard.ts  Role decision for area layouts (swap for Supabase Auth here)
lib/email/              Resend invite templates
drizzle/                SQL migrations
```

## Status & roadmap

Single-player and live multiplayer work on **dev-identity** (header switch + join tokens). Batch roster import, email invites, and the batch monitor are implemented but demo-grade with anon Realtime reads. **Real Supabase Auth**, membership-scoped RLS, and production hardening are the main next milestones.

## Deploying (Vercel)

Set the same environment variables. Use the Session pooler for `DATABASE_URL`. Omit or set `DEV_IDENTITY=false` in production. After first deploy, run `npm run db:migrate` against the production database.

| Script | Purpose |
|--------|---------|
| `npm run db:generate` | Generate SQL migrations from `lib/db/schema.ts` |
| `npm run db:migrate` | Apply migrations |
| `npm run db:push` | Push schema directly (dev convenience) |
| `npm run db:seed` | Upsert the case + dev profiles |
| `npm run validate:cases` | Validate case configs |
| `npm run db:smoke` | DB smoke test |
