# The Grey Area

Executive ethics simulation. Cases are typed config; the engine stays generic.

## Setup

1. Create a [Neon](https://neon.tech) project and copy the **pooled** connection string.
2. Copy env defaults and fill in secrets:

```bash
cp .env.example .env.local
```

Set at least:

```
DATABASE_URL=postgresql://...@...neon.tech/neondb?sslmode=require
DEV_IDENTITY=true
```

`DEV_IDENTITY=true` enables the fake identity picker at `/dev/identity`. Leave it unset in production — that route 404s and `getCurrentProfile()` throws.

3. Apply schema and seed:

```bash
npm run db:migrate
npm run db:seed
```

4. Run the app:

```bash
npm run dev
```

Open [http://localhost:3000/dev/identity](http://localhost:3000/dev/identity) and pick Student A, Student B, or Professor.

## Database scripts

| Script | Purpose |
|--------|---------|
| `npm run db:generate` | Generate SQL migrations from `lib/db/schema.ts` |
| `npm run db:migrate` | Apply migrations to Neon |
| `npm run db:push` | Push schema directly (dev convenience) |
| `npm run db:seed` | Upsert Cost of Winning + three dev profiles |

## Auth note

There is no real auth yet. `lib/auth.ts` exposes `getCurrentProfile` / `requireProfile` / `requireStaff` reading a `dev_profile_id` cookie. Ownership is enforced in `lib/db/queries.ts` so Supabase Auth + RLS can land later as an additive layer.
