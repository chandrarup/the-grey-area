# Advisor realism review — The Cost of Winning (group immersion upgrade)

**Reviewer role:** ADVISOR (corporate ethics training realism)  
**Branch reviewed:** `integrate/group-immersion-upgrade` @ `/Users/chandrarupdaka/Desktop/Bauer/2026/TheGreyArea`  
**Goal:** professional, realistic workplace simulation like how companies train staff — not gamified, not cartoon good-vs-evil, not chatbot-feeling.  
**Sources:** `PROJECT.md`, `GLOSSARY.md`, ADRs 0001–0004, `.scratch/group-immersion-upgrade/spec.md`, `lib/case/cost-of-winning.ts`, `lib/case/cost-of-winning-scripts.ts`, solo (`decision-workspace.tsx`, `scene-script-player.tsx`), group (`group-stage.tsx`), avatar (`avatar.tsx`, `avatar-motion.ts`), `lib/group/meeting-runtime.ts`.

---

## 1. Verdict vs goal

**Partial** — story craft and grey-area *architecture* are close to real corporate ethics sims; delivery still breaks immersion where the product feels like a branching quiz + chat room with optional 3D wallpaper.

- **Aligned:** Case world (GIS / Ardania / Salim / Meridian), briefing pages, cast personas, authored scripts with invoices/emails/news, and Compliant/Shortcut/Bystander postures in config are serious training material — not cartoon villainy.
- **Aligned:** Solo arc (script → decision → consequence film for D1/D2) is the best expression of the goal; dialogue in `cost-of-winning-scripts.ts` mostly sounds like executives who have done this before.
- **Partial / off:** Student-facing option *labels* still leak moral valence (especially Bystander/Shortcut). Scene 3 ends cold (no `consequence`). Meta chrome (“No option is marked right or wrong”) is quiz language.
- **Off vs ADRs/spec:** Hard-synced phases (ADR 0001), pressure stances (ADR 0002), group integrity latch wiring (ADR 0003), Decision 3 film (ticket 10), and empathy/pressure-appeal debrief (ticket 11) are specified but not fully lived in the UI path. `GroupMeetingRuntime` exists; `group-stage.tsx` still advances film/script via **per-seat `localStorage`**.
- **Partial:** Group now *can* play the same `SceneScriptPlayer` (ADR 0004 direction), but advisors cannot drive `moment` beats (`canRespondToMoments={isCeo}`), then land in free chat — still more “meeting chatbot with avatars” than shared lived scenario until hard-sync + stances ship.

---

## 2. Scene-by-scene narrative quality

### Hook / briefing (`briefingPages` + `s1_introduction` script)

**Strong.** Desk, pre-reads, Marcus at 3:12 a.m., fee reveal ($8.4M / 0.1%), Priya’s dropped connection, David underlining — this is how real third-party risk cases open. Invoice props (`LOCAL_FIRM_INVOICE`, `SALIM_INVOICE` in `cost-of-winning-scripts.ts`) are training-grade artifacts.

**Nits:**
- `commitPrefill` on Scene 1 (`cost-of-winning.ts`) editors the CEO’s reasoning toward Tom’s frame (“services no one can describe… adviser we cannot monitor”). Real training leaves the blank blank.
- Opening line still slightly brochure-y (“best technical proposal in the field”); script’s fee beat and Tom’s “What are we being asked to pay?” fix that fast — keep tightening jargon per ticket 10, don’t flatten the commercial tension.

### Decision 1 — `s1_introduction`

| Key | Posture | Label (student-facing) | Notes |
|-----|---------|------------------------|--------|
| `refuse` | compliant | Close the Salim channel and compete on the formal process alone | Defensible; reads slightly like the “clean” textbook move. |
| `conditions` | bystander | Avoid owning an engagement tonight — park with diligence and keep the conversation open | **“Avoid owning”** is author judgment in the label. Real exec language: “Authorize diligence in parallel; no engagement tonight.” |
| `authorise` | shortcut | Green-light Marcus to negotiate now while the window is open | Best of the three — sounds like a rainmaker CEO. |

Consequence films: excellent (Meridian signs, ministry silence; or Avelin invoice; or Salim on file). Beats land.

**Script moments:** Balanced stances (`scope` / `legal` / `structure`; `review_first` / `say_no` / `meet_only`). Silence beats are good pressure. This is the gold standard for the rest of the case.

### Decision 2 branches

**`s2_door_closed` (after `refuse`)** — Strong sunk-cost / board-calendar pressure. David’s “I am not recommending it. I am telling you the calendar.” is perfect.  
Labels: `stop_disclose` fine; `contain` (“Stay quiet with the board… off the pack”) and `keep_going` (“without HQ micromanaging”) still telegraph sneak vs speed. Moment `who_introduced` → “Salim’s network under another name” is excellent grey-area writing.

**`s2_invoice_diligence` (after `conditions`)** — Best Scene 2: physical invoice beat, AP sticky, Tom’s guardrails vs Marcus’s “they started working.”  
`contain` label — “Stay off the record — clear it under a capped local code while diligence stays 'in progress'” — is **handbook evil**. Rewrite as something a CFO would actually put in chat: “Clear under local vendor code with a hard cap while Tom finishes.”

**`s2_invoice_authorised` (after `authorise`)** — Sunk-cost loyalty is real. `contain` (“Pay, shorten the description, and keep the board at 'routine advisory'”) again labels the crime. Script moment `normal_here` / Priya’s fact-vs-wish line should stay.

### Decision 3 endings (re-converged)

**`s3_clean_file` / `s3_gap_record` / `s3_managed`** — Scripts are the strongest late-game material: litigation hold chat, records index with **none on file**, Eleanor’s “loyal back — and to what,” Tom on spoliation. Moment responses are balanced and adult.

**Gap:** Options `full_coop` / `narrow_coop` / `managed` have `next: null` and **no `consequence`** in `cost-of-winning.ts`. Spec ticket 10 and validate rules treat consequences as required for non-terminals; terminals currently skip the lived film. Training ends on the commit screen / chat — **cold**. After a production demand, learners need one more time-jump (investigation outcome, board action, jobs, or press) before reflection.

**Debrief gaps:**
- `reflectionQuestions` ask organizational pressures and loyalty/fear, but **not** the explicit pressure-appeal prompt the spec wants (“what made the shortcut look appealing”).
- Group path still orients to “await release” / concluded list (ticket 11 open) — advisors get less structured reflection than solo.
- Rubric/coach letter is for professors post-release (fine); student-facing empathy bridge is thin.

---

## 3. Grey-area framing check (Compliant / Shortcut / Bystander)

**Config layer: mostly good. Student surface: still virtue-signaling.**

- `posture` on options + `validate.ts` (one of each posture; Compliant never `isCompromise`; Shortcut always) is the right authoring contract. Students never see the words Compliant/Shortcut/Bystander in `DecisionView` — good.
- **Integrity mapping is thoughtful:** Scene 1 `conditions` (bystander) is `isCompromise: false` — parking with diligence isn’t a latch flip. Scene 2+ bystander (`contain`) *does* compromise. That matches real “process theater” risk. Keep that author precision.
- **Virtue leak is in the labels**, not the keys:
  - Bystander repeatedly uses “avoid owning,” “stay quiet,” “stay off the record,” “shorten the description.”
  - Shortcut D3 uses “reconstructed,” “made coherent,” “narrative be shaped” — clear spoliation branding.
  - Compliant always sounds like the ethics officer’s preferred memo.
- **UI meta:** `decision-workspace.tsx` DecisionView: “No option is marked right or wrong” undoes immersion and *implies* a hidden right answer. Delete that sentence; keep “Once you say it, it’s on the record.”
- Moment stances in scripts are **not** virtue-signaling — treat option labels like those moment chips: three plausible executive moves, equal rhetorical weight.

---

## 4. Immersion / professionalism

### Dialogue tone
Authored lines: professional. AI live chat (group + solo free-text moments) will always risk chatbot mush; personas in `cast` are strong enough if models stay short and in-character (MEMORY already notes spoken-aloud ≤3 sentences for AI seats — keep that discipline).

### Motion (`avatar-motion.ts` / `avatar.tsx`)
Intent policy is correct for corporate sim: seated-safe layers, speak/listen/idle, beat actions (`write` / `lean` / `phone`). This is the anti-zombie *design*. Residual risk is still visual QA (standing talk clips as additives, idle variants) — ticket 02 territory; do not reintroduce full-body standing talk on chair seats.

### Phase sync — **still missing as product truth**
- ADR 0001 / ticket 03: server-owned phase.
- Reality: `group-stage.tsx` uses `localStorage` keys `group-film:…` and `group-script:…:done`. Seats can desync (one in film, one in live).
- `lib/group/meeting-runtime.ts` models `decided → film → open → live` and **omits `script`**, while UI implements `script` after open — seam/UI mismatch. Runtime not yet the authority for what the room sees.

### Pressure stances — **not the ADR thing yet**
- `GROUP_ROLES[].initialStance` is brief copy, not lockable chips before CEO commit (ADR 0002 / tickets 05–06).
- Advisors “pressure” only via chat + 6-message gate — closer to forum than executive advisory ritual.

### Group vs solo parity
| Capability | Solo | Group now |
|------------|------|-----------|
| Authored script beats | Yes | Yes via `SceneScriptPlayer` (if seat hits Begin) |
| Moment responses | CEO | CEO only; advisors watch |
| D1/D2 consequence film | Yes | Yes (if film props / localStorage) |
| D3 consequence | No | No |
| Integrity latch | Run state | Runtime helper exists; product wiring incomplete |
| Empathy / pressure debrief | Reflection Qs (partial) | Await-release skewed (ticket 11) |
| Shared timeline | N/A | Per-seat local phase |

Rounded-full white CTAs (“See what happened”, “Begin the scene”) on dark cards read more product-demo than boardroom training chrome — minor but stacks with “gamified SaaS” risk in `PROJECT.md`.

---

## 5. Ranked UX improvements (implementable here)

### P0 — must fix for “real corporate sim” feel
1. **Rewrite student-facing option labels** in `lib/case/cost-of-winning.ts` (and mirrored strings in `lib/case/group-roles.ts` `decisionOptions`) so Compliant / Shortcut / Bystander are equal-weight management postures. Kill “Avoid owning,” “Stay quiet,” “Stay off the record,” “shorten the description,” “reconstructed / made coherent” as moral tells. Keep keys/`posture`/`isCompromise`/`next` stable.
2. **Add Decision 3 `consequence` (+ `COST_OF_WINNING_STORIES` frames)** for `full_coop` / `narrow_coop` / `managed` on all three `s3_*` scenes; play film in solo `decision-workspace` and group film pipeline before reflections/concluded (ticket 10).
3. **Wire hard-sync:** persist scene phase on session; drive `group-stage` from server/`GroupMeetingRuntime` events; stop treating `localStorage` as authority (ticket 03). Extend runtime `ScenePhase` to include `script` to match ADR 0004 / UI.
4. **Remove quiz meta** from DecisionView (“No option is marked right or wrong”); clear or neutralize Scene 1 `commitPrefill` so it doesn’t draft Tom’s memo for the student.

### P1 — immersion that separates this from a chatbot
5. **Pressure stance chips** (authored per scene/seat) locked before CEO overlay; show on CEO commit UI; bias bot replies; optional film flavor (tickets 05–06). Not votes.
6. **Group empathy debrief** after D3 film: same reflection set as solo + explicit “what pressures made the faster / quieter path look necessary?”; release gate unchanged (ticket 11).
7. **Script phase as shared meeting:** all humans enter/exit script together; advisors get non-commit “presence” during moments (even if only CEO’s free-text hits the director) so the room doesn’t feel like a CEO cutscene others skip via `scriptDoneKey`.
8. **Group integrity latch** persisted and available to grading/path tone (ticket 04) so compromised runs feel continuous across modes.

### P2 — polish toward VR/sim training without Unity
9. Tone down gamified chrome on group title/film cards (full pills → quiet boardroom controls); keep one accent.
10. Consequence films: lean harder on props already in `film-props.tsx` / invoices (bank trail, regulator letter, redline) over abstract art keys where possible — paper-on-desk is more “compliance training lab” than storybook vignette.
11. Avatar: stage-lab pass on idle/listen/speak only; gate exotic actions to authored `act` beats; no ambient “zombie” cycling.
12. Align opening hook copy (ticket 10): fewer abstract process words, more calendar/cash/name pressure — scripts already do this better than briefs in places; sync them.

---

## 6. What NOT to change (preserve)

- **Ardania / Salim / Meridian / GIS world** and three-decision escalating structure — do not invent a new case.
- **Option keys and branching graph** (`refuse` / `conditions` / `authorise` → door/diligence/authorised → `s3_clean_file` / `s3_gap_record` / `s3_managed`) — remap labels/copy, not topology.
- **Authored scripts and `moment` stance design** — the best training content in the repo; extend, don’t replace with free chat.
- **Invoice artifacts** (`LOCAL_FIRM_INVOICE`, `SALIM_INVOICE`) and consequence story frames for D1/D2.
- **Cast personas** (Marcus rainmaker, David numerate blind spot, Priya swing, Tom prosecutor-calm, Eleanor testing) — textbook corporate ethics casting done right.
- **CEO-only commit; advisors do not vote** (ADR 0002).
- **Monotonic integrity latch semantics** and Compliant≠compromise / Shortcut=compromise author rules.
- **Release gate** — students never see AI feedback until professor release.
- **Shared story principle** (ADR 0004) — one narrative, casting differs; do not rebuild a thin group-only chat plot.
- **Seated motion policy** in `avatar-motion.ts` (bone filters, no standing full-body talk on chairs).
- **No “The Grey Area” in user-facing copy**; keep editorial/serious UI principles in `PROJECT.md`.
- **Immutable decisions / no undo** after commit.

---

*End of review. No code changes made.*
