# Memory

Running log for agents. **Newest first.** Keep ~20 active entries; move older ones under Archive.
**Rule:** every substantive change appends an entry here in the same commit.

---

## 2026-10-29 — Ticket 09: Compliant / Shortcut / Bystander option framing

**What:** Remapped case `Posture` to `compliant | shortcut | bystander`. Every Cost of Winning checkpoint now exposes one of each; option keys/branching/`isCompromise` kept coherent (Compliant never compromises; Shortcut always; Bystander from Scene 2 onward). User-facing option labels and CEO group `decisionOptions` rewritten as corporate-pressure grey-area copy (no steal-vs-good). `validate:cases` requires the three-posture set per scene.
**Why:** Spec/ticket 09 — learners should face plausible corporate pressures, not cartoon moral binaries.
**Do not undo:** Do not restore restrictive/cautious/permissive postures or “Refuse / Full cooperation / Authorise” virtue-signal labels; keep keys and integrity latch behaviour.

## 2026-10-29 — Immersion+story upgrade: baseline branch + ticket graph

**What:** Integration branch `integrate/group-immersion-upgrade` baselines the unpushed 3D/group stage work plus grill artefacts (`GLOSSARY.md`, ADRs 0001–0004, `.scratch/group-immersion-upgrade/` spec and tickets 01–12). Spec now requires **shared story** solo↔group (ADR 0004): same arc; solo = human CEO + bots; group = humans + bots. Tickets add story work (08 parity, 09 grey-area framing, 10 D3 consequence, 11 empathy debrief, 12 three-decision copy) alongside immersion 01–07.
**Why:** User confirmed implement-spec for corporate-training simulator goals; worktrees need a committed baseline.
**Do not undo:** Keep ADR 0004 (same story both modes); do not reintroduce a thinner chat-only group path.

## 2026-10-20 — Calmer, seated character motion; chairs no longer clip

**What:** In `three/avatar.tsx` the standing mocap clips are no longer played as full poses over the seated idle. Talk clips are now arms-only additive deltas at weight 0.4; nod/shake are neck+head additive at 0.7; phone is an arms-only pose. Previously talk ran at 2.2× weight with spine tracks, so speakers tipped back through their chair and held standing arm angles. Idle variations are only `waiting`/`thoughtful`, every 20–34 s with 1.6 s crossfades (dropped `lookAround`, `touchFace`, `nervousIdle`). Head turns toward a speaker are smaller (±0.7 rad, 75% of the angle) and slower. Removed the `window.__av` debug hook. Chair seat and backrest in `boardroom.tsx` moved 7 cm back for clearance. `stage-lab` has seat and side camera toggles for checking this.
**Second pass, same day:** Seated avatars now own their chair (`<Avatar chair>`, `Chair` moved into `avatar.tsx`). After the mixer, a settle step holds the hip joint at seat height (`SEATED_PELVIS_Y`) and slides the chair under the hips (damped), so no clip leaves someone floating off the front edge or inside the backrest. The same step measures the pelvis→neck forward lean and straightens the spine toward about 5°, removing the mocap hunch. Eyes now lead head turns and make small saccades. Speaking returns the base layer to the neutral idle, so nobody talks with a hand on their chin. Empty seats still get plain chairs from `boardroom.tsx`.
**Why:** User saw characters moving too much ("zombies") whenever anyone spoke, and Tom's body passing through his chair; after the first pass, seating and posture still looked wrong.
**Do not undo:** Don't play standing clips with spine/pelvis tracks on seated avatars, and don't set action weights above 1.

## 2026-10-20 — Group mode runs end to end for three decisions in the 3D boardroom

**What:** The live group meeting now uses the solo 3D stage (`app/group/[id]/group-stage.tsx`, loaded `ssr:false` from `meeting-client.tsx`). Per scene each seat sees: decision card (what the CEO chose + reasoning) → the same consequence film as solo (`three/film-beats.ts` is now shared by both) → scene title card → live boardroom. Every message is spoken by that seat's avatar with lip-sync and captions (CEO lines are caption-only; the CEO tile is labelled with the CEO's name); a backlog skips to the latest 3. Chat panel + composer on the right, "My brief" overlay, CEO "Make the call" overlay (same 6-message gate). Films are marked watched per seat in localStorage (`group-film:<session>:<decisionId>`). Server: each scene's authored opening line is posted once as `sender_kind = "script"` on start and on every advance (previously scenes after the first opened empty and the consequence was filed under the old scene, so no one saw it). Starting the meeting resets the clock to 45 minutes (`MEETING_TTL_SECONDS`; lobby stays 30). Decision count is capped at the case's `maxDepth` (3) and forms default to 3. The concluded page lists the three decisions and polls for release (`await-release.tsx`). CEO suggestion chips use the current scene's options. AI seats are told replies are spoken aloud (≤3 short sentences). Page no longer ships character personas to the browser.
**Also:** Migration `0004` now creates its demo `anon` read policies only when that role exists, so `npm run db:migrate` completes on Neon (it was failing there, leaving `0005`–`0008` unapplied and group session creation broken).
**Why:** User asked for the group path to work end to end across three decisions with the same immersive experience as solo.
**Do not undo:** Keep consequence films derived from `group_decisions` + case config (not from narrator messages). Keep the `script` sender kind out of the human-message gate. Release gate unchanged — the concluded page shows only the group's own decisions until release.

## 2026-10-19 — Solo meeting and consequences are a real-time 3D world with talking characters

**What:** The live call is now a first-person 3D boardroom (`app/simulation/decisions/three/`, React Three Fiber + drei + three). Cast at HQ sit at the table; remote cast appear live on a wall screen, each rendered in their own room. Characters are realistic Microsoft Rocketbox avatars (MIT) converted to `public/avatars/*.glb` (~21 MB total) by `scripts/avatars/build-rocketbox.mjs`; cast mapping is in `public/avatars/LICENSE.txt`. `avatar.tsx` poses them out of T-pose procedurally (`rig.ts`) and animates breathing, blinking, gaze (everyone looks at the speaker, and at you during moments/decisions), talking gestures, mood expressions, and narration-driven actions (`narration.act`: write/lean/phone/nod/shake/lookDown). Speech (`speech.ts`) uses HeadTTS — Kokoro neural voices in the browser via WebGPU/WASM, loaded from jsDelivr, model fetched from Hugging Face on first use — and lip-syncs from its Oculus viseme timings; until it's ready (or if unsupported) it falls back to browser speech with estimated mouth movement. Lines auto-advance when spoken ("Skip ›" to jump); upcoming lines are pre-synthesised. Consequences play as a letterboxed film (`film.tsx`): character close-ups (messages spoken on camera), camera moves through the empty boardroom, and realistic paper props (`film-props.tsx`, invoice, newspaper, regulator letter, statement, file index, redline). Students can add their own photo ("Add your photo"); it is stored only in localStorage and shown on their tile. Saved progress keys are now `stage:v3` + a script content fingerprint. `stage-call.tsx` and `stage-vr.tsx` removed.
**Why:** User wanted Kiin-style lived scenes with real-looking characters who speak and act, not silhouettes or panels.
**Do not undo:** Keep Rocketbox attribution with the GLBs. Voices/3D are solo-only; group mode unchanged. Film props add illustrative detail (amounts, file names) beyond case text — professor should review. First visit downloads the voice model (~160 MB, fp16 WebGPU); desktop Chrome recommended.

## 2026-10-19 — Solo decisions are a scripted scene player, not a chat

**What:** Every scene now has an authored `script` (`lib/case/cost-of-winning-scripts.ts`, type `ScriptBeat` in `lib/case/types.ts`). The solo player (`app/simulation/decisions/decision-workspace.tsx` + `stage-beats.tsx`) plays it full-screen, one beat at a time: establishing shots, texts/emails/headlines arriving, documents, the desk of pre-reads, one speaker at a time in the room, and timed `moment` beats where the CEO responds. Authored responses get authored reactions; "Say something else" sends free text to the existing scene director; letting the timer run out plays the silence beats. Then the decision, then the consequence as arriving messages. Spoken lines are persisted as messages so the professor transcript is unchanged; progress is kept in localStorage per run+scene. `commitSceneDecision` no longer calls `revalidatePath` (it remounted the next scene mid-consequence). Phone-frame components removed.
**Why:** The chat-in-a-phone version still read as a chatbot. The goal is a Kiin-style lived scenario with a clear script.
**Do not undo:** Moment responses are stances, never marked right/wrong; free text is always available; group mode ignores `script`; professor UI and release gate unchanged. Script lines are new authored content — professor should review.

**Same day, sensory pass:** Calls are a `call` beat — a phone that rings (synthesised ringtone + `navigator.vibrate` + on-screen buzz) until Accept; Decline makes them call straight back. Texts/news land on a lock screen with a ping/sting; emails open in a mail window with a chime. Setting beats carry `mood` (morning/evening/night) which themes the whole stage (night switches the stage to the dark palette). Live calls show video tiles with locations, a speaking indicator, a running call clock and faint room tone; the last 5 seconds of a moment tick. All audio is Web Audio in `stage-sound.ts` (no assets), unlocks on first click, and has a Sound on/off toggle; all stage motion is disabled under `prefers-reduced-motion`. Saved progress keys are versioned by script length so script edits don't resume stale queues. This is a deliberate, user-requested exception to "no heavy animation" — scoped to the solo decisions stage only.

**Same day, staging pass:** (1) Desk beat is a real desk (`stage-desk.tsx`): wood surface in perspective, window/lamp light by mood, laptop, steaming mug, phone, pen; papers slide on one by one and lift into a reading view when clicked. (2) Once the call connects, the scene plays inside a video-call room (`stage-call.tsx`): speaker view + filmstrip for lines, gallery for moments/narration/decision, location backdrops, silhouettes that breathe/talk, live captions, "Recording" indicator, meeting chat panel with join/system messages, toolbar (Leave is refused). New `chat` beat type pops a chat toast + chat entry; 12 chat lines added across scenes. Moments and the decision appear as overlays on the call; the chat box doubles as free-text input during moments. (3) Character voices: browser speech synthesis (`stage-voice.ts`) reads lines and chat in a distinct voice per cast member; Voices on/off toggle; quality depends on OS voices. (4) Consequences play in an "immersive replay" (`stage-vr.tsx`): warp transition on the time jump, then glass panels on a 3D arc around the viewer over a moving floor grid, pointer-driven look-around, narrator/character voices. It's a browser 3D scene, not WebXR headset VR. Chat beats are persisted as cast messages for the professor transcript.

**Same day, story frames:** Consequences now play as a story, not a paragraph: title card, then one illustrated frame per moment (`story` beats), then the characters' messages. `Consequence.story` holds the frames, authored per option in `COST_OF_WINNING_STORIES` (scripts file); the text is the narrative verbatim, only split, and `validate:cases` fails if they drift. Art is animated line-art in `stage-story.tsx` (invoice, stamp, press, regulator letter, ledger, handshake, silent phone, board, gap in the file, figure walking away, corridor skyline, closing door, hourglass, network, two voices, pen rewriting). Narrator voice reads each frame. Consequences without `story` fall back to automatic sentence splitting + keyword art.

## 2026-10-01 — Demo-run fixes: Gemini truncation, grader, solo scene advance

**What:** `complete()` sets Gemini `thinkingBudget: 0`. Graders get 12000 output tokens; the group grader retries once and its prompt states exact list lengths. `DecisionWorkspace` is keyed by `sceneId`. Solo grading (reflection submit + professor "Run AI grader") uses the Settings grader model.
**Why:** In a full end-to-end rehearsal, Gemini 2.5 thinking tokens ate `maxOutputTokens`, so solo replies and group grades came back as truncated JSON. Gemini also returned list lengths outside the schema. "Continue to next decision" left the consequence screen stuck because `router.refresh()` kept the client state. Solo grading ignored the model choice, so it failed once the Gemini free tier (20 requests/day) ran out.
**Do not undo:** Keep per-call token budgets sized for visible output, or re-enable thinking only with a larger budget. Keep the `key={sceneId}` remount.

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
