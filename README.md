# The Cost of Winning · Ethics simulation workspace

Read `PROJECT.md` for product intent and `MEMORY.md` for implementation history.
The internal package remains `the-grey-area`.

An instructor workspace for story-led ethics training. The first published simulation,
**The Cost of Winning**, puts a CEO and executive team through three decisions with
27 complete paths. Choices embody compliance under pressure, plausible-deniability
shortcuts, and silence. Authored consequences play before the next decision; reflection
and instructor-released feedback connect the story to values and workplace behavior.

## Entry and access

- `/` routes instructors to `/login`; `/?join=…` opens the student's assigned seat.
- `/login` uses Supabase email/password authentication. Only verified emails explicitly
  listed in the server-only `ADMIN_EMAILS` setting receive full administrator access.
  There is no public registration or role switch. The two owner accounts are pending setup.
- `/professor/simulations` is the simulation library. The Cost of Winning is available;
  the future-story tile is a placeholder, not an implemented additional simulation.
- **Create groups** opens roster setup; **View sessions** opens the live monitor;
  **View as student** opens a separate solo run owned by the signed-in instructor.
- Students receive unique invite links. They cannot browse the library, launch solo runs,
  select arbitrary seats by group code, or use instructor/AI testing endpoints.
- Group endpoints verify a seat token or staff session. A participant UUID is not a credential.
  Explicit per-tab tokens take precedence over cookies. Released feedback remains accessible
  after the meeting's play window; expired unfinished sessions cannot be played.
- Live state uses authenticated HTTP polling. Anonymous Supabase Realtime subscriptions
  have been removed from the active flow. Migration `0014` removes direct browser access
  to application tables. **Apply it before treating a deployed database as private.**

## Local development

Requires Node 20+, npm, and the existing Supabase Postgres project.

```bash
npm install
cp .env.example .env.local
# Fill database/provider settings; do not overwrite an existing configured .env.local.
npm run db:migrate
npm run db:seed
npm run dev
```

Local-only instructor preview: set `DEV_IDENTITY=true`, run `npm run dev`, open
`/login`, and choose **Open local instructor preview**. This explicitly sets a local
preview session. It is disabled in production even if the flag is accidentally left on.
Never use the preview switch as a production login.

## Provision the two administrators later

1. Create the two email/password accounts in Supabase Auth; verify their email addresses.
2. Put their exact comma-separated email addresses in server-only `ADMIN_EMAILS`.
3. Set the Supabase URL and anon key. The service-role key never belongs in browser code.
4. Apply database migrations, including `0014_private_training_data.sql`, using the
   database owner connection. Server queries use Drizzle; browser database reads are denied.
5. Run the production build, sign in as each administrator, and verify group access.

Do not copy credentials from source control. A previously populated service credential was
removed from `.env.example`; rotate that credential before deployment and update secret storage.
No real owner accounts or passwords were created by this change.

Auth follows [Supabase's server-client flow](https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs):
cookie refresh in `proxy.ts`, server-verified `getUser()`, allowlist authorization in `lib/auth.ts`.

## Browser 3D

This is a normal-browser 3D experience, not headset VR. Solo and group modes share the
boardroom, avatars, speech pipeline, script player, and consequence films.

- `three/rig.ts` keeps procedural gaze/lean separate from the mixer pose. Frozen animations
  must not accumulate bone rotations across frames; the 600-frame regression test covers this.
- `three/boardroom.tsx` handles seated camera framing, lighting, room geometry, and remote
  video tiles with their own correct camera aspect ratio.
- `three/stage-canvas.tsx` provides shared rendering, loading feedback, and graphics fallback.
- `three/meeting-stage.tsx` renders captions and interactive controls above the room.
- `three/film.tsx` plays consequences with reduced-motion support and readable captions.
- `/stage-lab` is an instructor-only visual QA surface for idle, focus, reactions, and speech.

Avatar geometry remains the existing Rocketbox asset set. This change improves pose stability
and presentation; it does not replace the characters with photorealistic scans.

## Checks

```bash
npm run validate:cases
npm test
npm run test:unit
npx tsc --noEmit
npm run build
npm run lint
```

With the dev server running and `.env.local` configured:

```bash
npx tsx --env-file=.env.local lib/auth/access.smoke.ts
npx tsx --env-file=.env.local lib/auth/data-access.smoke.ts
npm run smoke:solo
npm run smoke:group
```

The access smoke creates and cleans up its own test groups; it makes no AI/email calls.
The data-access smoke validates migration permissions in a transaction that always rolls back.
The arc smokes test persistence, consequences, reflections, and release gating without LLM calls.

## Code map

| Location | Responsibility |
| --- | --- |
| `lib/case/` | Typed story, scripts, choices, consequences, reflection prompts, debrief values |
| `app/login/`, `lib/auth/`, `proxy.ts` | Instructor login, allowlist, session handling |
| `app/professor/` | Simulation library, group creation, monitoring, reviewed feedback |
| `app/simulation/` | Instructor's student preview and shared presentation |
| `app/group/`, `lib/group/` | Invite-only participant flow and shared meeting rules |
| `app/api/group/` | Seat-checked state, messages, phases, stances, decisions |
| `lib/engine/`, `lib/llm/` | Prompt construction, structured AI calls and assessment |
| `lib/db/`, `drizzle/` | Server-side persistence and migrations |

Email invites still use Resend; verify a sending domain and configure `EMAIL_FROM` and
`NEXT_PUBLIC_APP_BASE_URL` before emailing a roster. Never send a test to a real class.

### Dialogue and experience checks

Dialogue uses the server speech endpoint and the same Web Audio context unlocked by the learner's click. The stage exposes enable/replay, volume and an output meter. An expired session shows a sign-in/invitation message; a speech-service fallback is labelled as a device voice. `/stage-lab` previews the seated cast and `/stage-lab/debrief` previews fictional learning feedback; both require staff access. Real participant feedback remains behind instructor release.

Run `npm run test:unit` for audio lifecycle, rig stability, seated arm clearance and wardrobe regressions.
