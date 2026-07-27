# The Grey Area

The Grey Area is **Stage 1: AI-Powered Executive Simulation** of a three-stage ethics program, the Transformational Ethics Experience for the CaliBaja North American Leadership Academy (Stage 2 = a facilitated Ethics Workshop; Stage 3 = an ongoing Ethics Learning Community — those are delivered outside this app). This app immerses participants in the case **The Cost of Winning** and gives AI-driven feedback on their decisions, biases and blind spots.

The Grey Area is an AI ethics simulation where participants play solo against AI executives or join a live multiplayer executive meeting, each student in an assigned role. Professors create sessions (or whole class batches), share join links, monitor progress, grade with AI assistance, and release feedback. It is Stage 1 of the CaliBaja academy program; Stages 2 and 3 happen outside this app.

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

1. **Clone and install**

   ```bash
   npm install
   ```

2. **Environment**

   ```bash
   cp .env.example .env.local
   ```

   Fill in at least:

   | Variable | Purpose |
   |----------|---------|
   | `DATABASE_URL` | Supabase → **Connect** → **Session pooler** (URI, port 6543). Used by Drizzle migrations, seed, and server queries. |
   | `NEXT_PUBLIC_SUPABASE_URL` | Project **Settings → API → Project URL** |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project **Settings → API → anon public** (browser Realtime subscriptions) |
   | `SUPABASE_SERVICE_ROLE_KEY` | Project **Settings → API → service_role** — **server only**, never `NEXT_PUBLIC_` |
   | `DEV_IDENTITY` | Set to `true` locally to enable the header mode toggle (Admin / Professor / Student) |
   | `GEMINI_API_KEY` | At least one LLM key (also `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` as needed) |
   | `NEXT_PUBLIC_APP_BASE_URL` | Optional locally; canonical URL for join links in emails (e.g. production origin) |
   | `RESEND_API_KEY`, `EMAIL_FROM` | Required only for batch email invites; optional `EMAIL_TEST_TO` redirects all mail to one inbox for testing |

3. **Database**

   ```bash
   npm run db:migrate
   npm run db:seed
   ```

   `db:push` is available as a dev shortcut if you prefer pushing schema without migration files.

4. **Start**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

5. **Useful checks**

   ```bash
   npm run validate:cases   # validate case config in lib/case/
   npm run db:smoke         # quick DB connectivity smoke test
   ```

### Seeing the professor / admin side locally

With `DEV_IDENTITY=true`, use the **Admin / Professor / Student** toggle in the site header. Professor mode maps to the seeded profile `professor@dev.local`; admin maps to `admin@dev.local`. Run `npm run db:seed` first so those profiles exist.

Alternatively, promote a profile in SQL:

```sql
UPDATE profiles SET role = 'professor' WHERE email = 'your@email.test';
```

The `/dev/identity` page (also gated by `DEV_IDENTITY=true`) lets you pick any seeded profile via cookie for flows that use `requireProfile()`.

## Using the product

### For students

**Single player:** Switch to **Student** in the header, then follow the simulation flow — meet the leadership team, read the case briefing, work through decisions in conversation with AI executives, and receive an AI-generated debrief on your reasoning.

**Group:** Open the unique link your professor sent (`/?join=…` or `/group/join?token=…`). Read your confidential role brief, enter your name, mark ready, and join the live meeting. Discuss in character; the **CEO** seat commits each decision. After the meeting, debrief appears when the professor releases it.

### For professors

Switch to **Professor** in the header, then go to `/professor`.

- **Create a session** — choose decision count (1–5), roleplay/grader models, and which seats are Human vs AI; share per-seat join links.
- **Create groups from roster** (`/professor/groups/new-batch`) — upload an Excel/CSV roster, auto-split into balanced groups, confirm, copy links or **send email invites** (Resend).
- **Monitor a batch** (`/professor/groups/batch/[id]`) — live board per group (progress, messages, stalled flag), cohort rollup, optional AI cohort insights.
- **Session detail** (`/professor/groups/[id]`) — live lobby, read-only transcript, path taken, AI assessment with readiness bars, professor feedback notes, generate grade, edit, and **release** to the group.
- **Solo runs** (`/professor/runs`) — review individual student simulation runs.
- **Settings** (`/settings`) — default LLM models for roleplay and grading.

Sessions expire after **30 minutes** in lobby or active meeting unless extended in code.

## Project structure

```
app/                    Next.js App Router — pages, API routes, server actions
  simulation/           Solo student flow (briefing, decisions, debrief)
  group/                Multiplayer join + live meeting UI
  professor/            Professor home, sessions, batches, grading tools
  api/group/[code]/     Group REST: state, messages, commits, AI turns
  api/professor/        Professor APIs (e.g. batch board snapshot)
lib/case/               Case config ("The Cost of Winning"), types, validation
lib/llm/                Single schema-validated LLM entry point + model registry
lib/db/                 Drizzle schema, queries, migrations, seed
lib/group/              Seat auth, roster parsing, batch planning, AI turn logic
lib/realtime/           Supabase Realtime hooks and shared state types
lib/engine/             Scene director, solo/group grading
lib/email/              Resend client and batch invite templates
drizzle/                SQL migrations
```

## Status & roadmap

Single-player and live multiplayer work today on **dev-identity** (header mode toggle + per-seat join tokens). Batch roster import, Resend email invites, and the batch monitor board are implemented but still demo-grade alongside anon Realtime reads. **Real Supabase Auth**, membership-scoped RLS, and production hardening are the main next milestones.

## Deploying (Vercel)

Set the same environment variables in **Project → Settings → Environment Variables**. Use the Session pooler for `DATABASE_URL`. Omit or set `DEV_IDENTITY=false` in production unless you intentionally keep the demo toggle. After first deploy, run `npm run db:migrate` against the production database (locally with production `DATABASE_URL`, or via Supabase SQL).

| Script | Purpose |
|--------|---------|
| `npm run db:generate` | Generate SQL migrations from `lib/db/schema.ts` |
| `npm run db:migrate` | Apply migrations |
| `npm run db:push` | Push schema directly (dev convenience) |
| `npm run db:seed` | Upsert *The Cost of Winning* + dev profiles |
| `npm run validate:cases` | Validate case configs |
| `npm run db:smoke` | DB smoke test |
