# The Grey Area

Executive ethics simulation. Cases are typed config; the engine stays generic.

## Setup

1. Create a [Supabase](https://supabase.com) project.
2. Copy env defaults and fill in secrets:

```bash
cp .env.example .env.local
```

Set at least:

| Variable | Where to find it |
|----------|------------------|
| `DATABASE_URL` | Supabase → **Connect** → **Session pooler** (URI, port 6543). Use for Drizzle migrations, seed, and server queries. |
| `NEXT_PUBLIC_SUPABASE_URL` | Project **Settings → API → Project URL** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project **Settings → API → anon public** |
| `SUPABASE_SERVICE_ROLE_KEY` | Project **Settings → API → service_role** (server only — never expose to the browser) |
| `DEV_IDENTITY` | `true` locally for the mode toggle (Admin / Professor / Student) |

`DEV_IDENTITY=true` enables the fake identity picker. Leave it unset in production — real auth is not wired yet.

3. Apply schema and seed:

```bash
npm run db:migrate
npm run db:seed
```

4. Run the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and use the header mode switcher.

## Vercel deployment

Add the same environment variables in **Project → Settings → Environment Variables**:

- `DATABASE_URL` — Session pooler connection string (not the direct connection unless you know you need it).
- `NEXT_PUBLIC_SUPABASE_URL` — safe for browser bundles.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — safe for browser bundles; used for Realtime postgres_changes on group tables.
- `SUPABASE_SERVICE_ROLE_KEY` — **Production / Preview only on the server.** Do not prefix with `NEXT_PUBLIC_`. Used by server routes for mutations (when wired); group writes today go through Next.js server actions + Drizzle.
- `DEV_IDENTITY` — omit or `false` in production unless you intentionally keep the demo toggle.
- LLM keys as needed (`GEMINI_API_KEY`, etc.).

After the first deploy, run migrations against the Supabase database (`npm run db:migrate` locally with production `DATABASE_URL`, or use Supabase SQL editor for one-off applies).

## Database scripts

| Script | Purpose |
|--------|---------|
| `npm run db:generate` | Generate SQL migrations from `lib/db/schema.ts` |
| `npm run db:migrate` | Apply migrations to Supabase Postgres |
| `npm run db:push` | Push schema directly (dev convenience) |
| `npm run db:seed` | Upsert Cost of Winning + dev profiles |

## Realtime (group sessions)

Migration `0004_supabase_realtime` adds `group_messages`, `group_participants`, and `group_sessions` to the `supabase_realtime` publication and enables **demo-grade** RLS: anon can `SELECT` only. Clients subscribe via `lib/supabase/browser.ts`; all writes stay on server routes.

When Supabase Auth lands, replace public read policies with membership-scoped policies and private channels.

## Auth note

There is no real auth yet. Mode toggle + join tokens identify users in demos. Ownership is enforced in query helpers so Supabase Auth + tighter RLS can land later as an additive layer.
