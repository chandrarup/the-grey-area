# Memory

Running log for agents. **Newest first.** Keep ~20 active entries; move older ones under Archive.
**Rule:** every substantive change appends an entry here in the same commit.

---

## 2026-07-28 — Wider meeting chat; inline @mentions

**What:** Meeting page widened (`max-w-6xl`); chat column gets more space, taller thread, wider bubbles. Removed separate “Address” chips — type `@` in the composer for inline mention picker; mentions insert into the message text.
**Why:** Chat felt cramped inside `max-w-3xl`; address toggles confused users and weren’t required to send.
**Do not undo:** Inline @mention typeahead in speak composer; no separate address selector row.

## 2026-07-28 — Landing stakes panel; meeting & cohort monitor alignment

**What:** Home rebuilt to Paper prototype: scenario hook (no hero animation or old tagline), inline amber CTAs, right-column 8.4 bn stakes panel with countdown. Live meeting widened (`max-w-5xl`): participant tile row, decision dots, scene time label, chat + brief sidebar. Cohort monitor: KPI stats strip, 4-column clickable group cards, live pill + refresh spinner, stacked avatars.
**Why:** Prior pass used wrong source (animated logo, old tagline); meeting and batch board didn’t match production design artefacts.
**Do not undo:** No `BrandMark` animation on `/`; stakes panel is the hero right column; keep prototype-aligned meeting/monitor shells.

## 2026-07-28 — Logo B + amber boardroom design system

**What:** Remapped Paper/Ink tokens to warm amber accent (`#8A4F12` / `#C9822F`); Logo B quartered mark in favicon, headers, landing; hero 1a animated compromise walk; Plex Mono for eyebrows; chat ~14px radii; student @mentions use amber (not red); instructor stalled tiles use `--attention` slate.
**Why:** Apply production design artefacts without rebuilding every screen.
**Do not undo:** One amber accent only in student UI; no green/red status signalling; keep Logo B as identity mark.

## 2026-07-28 — Cohort generate stuck; group AI feedback path

**What:** Cohort “Generate insights” disabled until ≥1 graded group; local busy+timeout so it can’t stick on Generating… Batch tiles show next-step CTAs and **Generate AI grade** on committed groups without assessment. Staff page banners unfinished grades. Final commit no longer awaits grader (fire-and-forget) so the meeting doesn’t hang.
**Why:** Daybreak was committed with 0 graded; Generate ran with nothing to roll up and felt frozen; AI debrief never appeared until grade → release.
**Do not undo:** Keep gradedCount gate on cohort notes; students only see feedback after Release.

## 2026-07-27 — Global busy feedback on actions

**What:** Top indeterminate progress bar (`NavigationProgress` + `tga:busy-start/end` / `withBusyBar`) on navigations and long actions. `BusyButton` / spinner labels on home CTAs, join, create session, batch confirm/invites, meeting Send/Commit/Ready/Start, solo continue/values/reflection/commit, staff grade/release.
**Why:** Submits looked hung with no reaction while server work ran.
**Do not undo:** Keep button-level pending + top bar for multi-second actions; do not leave bare disabled buttons with no label change.

## 2026-07-27 — Board joined vs emailed; chat stability; @mention chips

**What:** Batch board “joined” requires `profileId` (not roster `displayName`); tiles show `N/M joined · X emailed`. Group name is a link to the transcript (Rename is separate). Chat replaces optimistic messages in place and uses instant bottom-stick scroll (no bounce). Speak composer has @mention tags that insert into the draft for existing mention detection.
**Why:** Roster names looked like 5/5 joined before invites; chat bubbles jumped on send; mentions were placeholder-only.
**Do not undo:** Do not count assigned roster names as joined; keep name click → transcript.

## 2026-07-27 — Fix layout script warning + confirm share-links hydrate safe

**What:** Theme init is a plain inline `<script>` in the server root layout body (no `next/script` in `<head>`). Seat link preview stays path-only (`/?join=`); absolute URL only for copy after mount.
**Why:** React 19 warned about script tags from `next/script` in head; hydration still showed stale Vercel vs localhost URL.
**Do not undo:** Do not render `window.location.origin` during the first client paint of share links.

## 2026-07-27 — Fix share-links hydration mismatch

**What:** Seat link preview no longer calls `window.location` during render (server had Vercel `APP_BASE_URL`, client had localhost). Preview shows `/?join=…`; absolute URL resolves after mount for copy.
**Why:** React hydration failed on professor group page.
**Do not undo:** Keep base URL resolution post-mount when localhost differs from env.

## 2026-07-27 — Lobby gate, meeting chat repair, token reclaim, loading UX

**What:** Confidential brief / roster / ready stay hidden until all shared briefing pages are read (all roles). Active meetings with orphan scene ids auto-repair to start scene so chat + options render. Invite `?join=` / `?token=` auto-open via `/group/open` and seats can reclaim by token. Optimistic Ready + spinners on Ready/Start/open group. Localhost share links stay on localhost.
**Why:** Brief leaked early; empty “waiting for scene” after 3-scene trim; rejoin dropped token; Ready/nav felt hung.
**Do not undo:** Keep briefing gate; keep token reclaim; do not send local join links to production APP_BASE when on localhost.

## 2026-07-27 — Join UI: code collapsed, name optional

**What:** On `/group/join`, “Join with code” is collapsed until expanded; display name is optional (falls back to roster assigned name → character name). Same optional name on home join panel.
**Why:** Invite-token path is primary; forcing a name and showing code join cluttered the flow.
**Do not undo:** Do not re-require display name on join forms.

## 2026-07-27 — Durable agent context

**What:** Added `PROJECT.md` (source of truth), `MEMORY.md`, thin `CLAUDE.md` / `AGENTS.md`; removed stale `context.md`; README points to `PROJECT.md`.
**Why:** So any agent resumes with one short, current brief.
**Do not undo:** Do not resurrect `context.md` or duplicate product truth into agent pointer files.

## 2026-07-27 — Batch/roster invite & group-name fixes

**What:** Invite preflight + surfaced Resend errors + test-to-self; draft batch plan persisted server-side with Edit → Invites → Monitor nav; memorable group `display_name` (pool ≥40) primary, short code secondary; board tiles show status/scene/activity → transcript.
**Why:** Invites failed silently on Resend sandbox; back-nav lost edit state; random codes were unreadable.
**Do not undo:** Keep `invite_error`, draft `draft_plan` / batch status, friendly names as primary labels; do not default `EMAIL_FROM` to `onboarding@resend.dev`.

## 2026-07-27 — Product rename + entry redesign

**What:** User-facing name is **The Cost of Winning**; marketing `/` with student/instructor CTAs; role areas via `lib/auth/role-guard.ts`; mode switcher only when `DEV_IDENTITY=true`.
**Why:** Align product language with the academy Stage 1 brand.
**Do not undo:** Never put “The Grey Area” in UI/email/student copy; keep repo package name as-is.

## 2026-07-27 — Case rebuilt to three scenes

**What:** `lib/case/cost-of-winning.ts` is `maxDepth: 3` (7 scenes: 1→3→3); defaults for decision count → 3; `validate:cases` clean.
**Why:** Shorter, clearer arc than the old five-decision shape.
**Do not undo:** Do not silently restore a five-decision tree without an explicit product decision.

## ~2026-07 — Batch roster, invites, monitor

**What:** Roster upload → group split → sessions; Resend seat invites; batch live board + cohort insights.
**Why:** Instructors need whole-class multiplayer setup.
**Do not undo:** Keep join-token per seat; students must not see unreleased assessment.

## ~2026-07 — Solo + live multiplayer working

**What:** Solo engine (scenes, integrity latch, grader, release gate) and group mode (lobby, realtime meeting, CEO commit, group assessment) ship on **dev-identity**.
**Why:** Core Stage 1 experience.
**Do not undo:** Integrity latch monotonic; decisions immutable; release gate for student feedback; suggestions never block free input.

---

## Archive

*(Older entries move here when the active list exceeds ~20.)*
