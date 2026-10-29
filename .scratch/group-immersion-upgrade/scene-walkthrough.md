# Learner walkthrough — The Cost of Winning

Facts from case config and scripts only (`lib/case/cost-of-winning.ts`, `lib/case/cost-of-winning-scripts.ts`), plus solo/group stage wiring in `app/simulation/` and `app/group/`.

**Case shape:** `slug: cost-of-winning`, `maxDepth: 3`, `startScene: s1_introduction`. Structure: 1 start + 3 Scene-2 branches + 3 Scene-3 endings (re-converged). Each checkpoint exposes one **compliant**, one **bystander**, one **shortcut** option.

**Setting (from config):** Learner is newly appointed CEO of Global Infrastructure Solutions (GIS). Bid: $8.4B Ardania Integrated Transport and Energy Corridor. Local adviser Victor Salim (Salim Strategic Advisory) via Marcus Reed. Competitor Meridian is in play.

---

## Pre-decision stages

### Solo (`STAGES` in `app/simulation/stages.ts`)

1. **Meet Your Leadership Team** (`/simulation/leadership-team`)  
   Shows cast except Eleanor: Marcus Reed, David Okafor, Priya Nair, Tom Bradley (name, role, location). Copy: executives will press across three decisions. Continue → case packet.

2. **Read the Case** (`/simulation/read-case`)  
   Pager over `briefingPages` (6 pages): Week 1 office; $8.4B Ardania contract; what could go wrong; Victor Salim development; executive team; three decisions — your call (Monday 7:45 a.m., 30 minutes, no undo).

3. **Your Leadership Values** (`/simulation/values`)  
   Prompt: “What will guide you when growth, loyalty, and integrity collide?” (≥20 chars). Submit → “Enter the simulation” → decisions.

4. **The Decisions** — scenes below (authored script → commit → consequence story/film where authored).

### Group (lobby → meeting)

- **No** separate leadership-team / values stages.
- **Lobby:** same `briefingPages` via `LobbyBriefingGate`, then seat-specific brief (`GROUP_ROLES`: stance, objective, rebuttals, etc.) and roster (names/titles; AI seats marked). CEO also sees Scene 1 option labels.
- After start: shared meeting phases (post–ticket 08): **decided → film → open → script → live**. Same authored `scene.script` as solo before free discussion. Solo = human CEO + bot seats; group = mix of humans + bots for empty seats.

---

## Branch tree (all 3 decision depths)

```
s1_introduction  [The Introduction]
├── refuse      (compliant)  → s2_door_closed
│   ├── stop_disclose (compliant) → s3_clean_file
│   ├── contain       (bystander) → s3_gap_record
│   └── keep_going    (shortcut)  → s3_managed
├── conditions  (bystander)  → s2_invoice_diligence
│   ├── stop_disclose (compliant) → s3_clean_file
│   ├── contain       (bystander) → s3_gap_record
│   └── keep_going    (shortcut)  → s3_managed
└── authorise   (shortcut)   → s2_invoice_authorised
    ├── stop_disclose (compliant) → s3_gap_record   ← note: not clean_file
    ├── contain       (bystander) → s3_gap_record
    └── keep_going    (shortcut)  → s3_managed

s3_*  [The Call] — all options next: null (end)
├── full_coop   (compliant)
├── narrow_coop (bystander)
└── managed     (shortcut)
```

Integrity latch (config comment): first `isCompromise` flips permanently. Compliant never compromises; Shortcut always does; Bystander compromises from Scene 2 onward (Scene 1 `conditions` is non-compromising).

---

## Scene 1 — `s1_introduction`

**Title:** The Introduction  
**Time:** Monday, 7:45 a.m. — week two · 30 minutes  
**Cast:** marcus, david, priya, tom

### Hook / script beats (summary)

1. Setting: office 47th floor, 7:41 a.m.; phone face-down.
2. Marcus text from Ardania (3:12 a.m.): Salim until tonight; hear him before Tom closes it.
3. Desk: four pre-reads (Marcus / David / Priya / Tom — Tom’s flagged hot).
4. Call connects 7:45 — Marcus opens: best technical bid; Salim reads informal process; competitor courting; signal today.
5. Tom asks for terms; Marcus reveals modest retainer + **$8.4M success fee** (0.1%); Priya chat confirms the number; David can’t benchmark without scope.
6. Moment (30s): CEO can probe scope / legality / fee structure (or silence → dinner-as-signal pressure).
7. Priya annual-report test; Tom “no commitment before review”; Marcus leans in; second moment on “something tonight?”; Salim’s phone lights up — Marcus needs an answer within the hour.

### Options

| key | posture | label | isCompromise | next |
|-----|---------|-------|--------------|------|
| `refuse` | compliant | “Close the Salim channel and compete on the formal process alone” | false | `s2_door_closed` |
| `conditions` | bystander | “Avoid owning an engagement tonight — park with diligence and keep the conversation open” | false | `s2_invoice_diligence` |
| `authorise` | shortcut | “Green-light Marcus to negotiate now while the window is open” | true | `s2_invoice_authorised` |

### Consequences

- **`refuse` — headline: “Nine days later”**  
  Door closed; Marcus professional but distant; Meridian announces in-country advisory partnership; ministry stops answering clarifications.

- **`conditions` — headline: “Six weeks later”**  
  Tom’s expedited review still open; one controlled Salim meeting under “no agency” script; invoice from unselected local firm for unitemised “coordination services” via Salim’s network; Tom wants hold.

- **`authorise` — headline: “Five weeks later”**  
  Retainer closed; Salim “on the file”; vague invoice under local discretion; trusted voices split on whether this is normal.

---

## Scene 2a — `s2_door_closed` (after refuse)

**Title:** The Invoice  
**Time:** Nine days later — the door closed behind you

### Hook / script beats

1. Evening setting (Thu 6:10 p.m.); board packet locks tomorrow.
2. David email: pipeline slide shows Ardania “paused” — needs one true sentence.
3. Marcus text: ministry silent six days; Meridian at ministry; “another way in.”
4. Call: David calendars the board; Marcus pitches local firm (retainer, no success fee, draft / no written scope); Tom wants screening; Marcus says it’s a draft.
5. Moment: who introduced the firm / tell the board / keep off the slide.
6. Marcus close: are we still trying to win this?

### Options

| key | posture | label | isCompromise | next |
|-----|---------|-------|--------------|------|
| `stop_disclose` | compliant | “Stop the new outreach and put the first Salim call on the board record” | false | `s3_clean_file` |
| `contain` | bystander | “Stay quiet with the board — reopen through Marcus's partner off the pack” | true | `s3_gap_record` |
| `keep_going` | shortcut | “Keep the corridor warm — let Marcus run the local channel without HQ micromanaging” | true | `s3_managed` |

### Consequences

- **`stop_disclose` — “Four months later”**  
  First decision on the record; board backs clean file; Meridian preferred interlocutor; trade journal “walked away”; regulators ask — file complete, headline ugly.

- **`contain` — “Four months later”**  
  Second partner booked as “market intelligence”; emails stop mid-thread; journalist cut-out draft; regulators want docs; gap where first decision should be explained.

- **`keep_going` — “Four months later”**  
  Corridor warms (ministry aide returns calls); press + regulators; executive offers to “help the file make sense” before production.

---

## Scene 2b — `s2_invoice_diligence` (after conditions)

**Title:** The Invoice  
**Time:** Six weeks later — diligence still open

### Hook / script beats

1. Morning: AP flags one item for CEO sign-off.
2. Invoice paper: Avelin Coordination Group SARL — $385k “coordination services,” sticky: not approved vendor, via Salim meeting, diligence open.
3. Tom text: don’t approve; review unfinished.
4. Call: Tom — invoice outside guardrails; Marcus — real work through introductions; David — need hours/people/deliverables; chat: no line items.
5. Moment: did Marcus agree / partial pay / cost of refusing.
6. Priya: if a reporter read this aloud, could anyone explain it?

### Options

| key | posture | label | isCompromise | next |
|-----|---------|-------|--------------|------|
| `stop_disclose` | compliant | “Hold the invoice and brief Audit and the board on the gap” | false | `s3_clean_file` |
| `contain` | bystander | “Stay off the record — clear it under a capped local code while diligence stays 'in progress'” | true | `s3_gap_record` |
| `keep_going` | shortcut | “Clear the invoice and leave local partners to Marcus” | true | `s3_managed` |

### Consequences

- **`stop_disclose` — “Three months later”**  
  Invoice frozen; Audit briefed; Salim competitor track quiet; reporter “hesitating” vs Meridian; routine regulator inquiry; file shows hold + unfinished diligence.

- **`contain` — “Three months later”**  
  Cleared under vendor code that doesn’t name Salim; diligence memos stop; partial ledger in press; regulators want missing reviews; gap board-told vs books.

- **`keep_going` — “Three months later”**  
  Invoice paid, more follow; corridor warmer; journalists + regulators together; offer to reconstruct diligence so file “reads cleanly.”

---

## Scene 2c — `s2_invoice_authorised` (after authorise)

**Title:** The Invoice  
**Time:** Five weeks later — Salim is on the file

### Hook / script beats

1. Evening: retainer cleared week one; first invoice today.
2. Invoice: Salim Strategic Advisory — vague lines totaling under local discretion.
3. David text: can approve under local discretion; can’t describe it.
4. Call: Marcus sunk-cost / Meridian inherits access; Tom demands names for “stakeholder alignment”; Priya asks for engagement letter; Marcus: Salim doesn’t put names in invoices.
5. Moment: get names first / is this normal / book it.
6. David: first decision already on the file; this one goes next to it.

### Options

| key | posture | label | isCompromise | next |
|-----|---------|-------|--------------|------|
| `stop_disclose` | compliant | “Cut the payments and put the engagement and invoice on the board agenda” | false | `s3_gap_record` |
| `contain` | bystander | “Pay, shorten the description, and keep the board at 'routine advisory'” | true | `s3_gap_record` |
| `keep_going` | shortcut | “Clear it and let local leadership own the paperwork” | true | `s3_managed` |

### Consequences

- **`stop_disclose` — “Three months later”**  
  Payments cut; board told what first decision set in motion; Salim gone; file shows retainer + invoice + stop; press has both; regulators want everything; gap between “authorised to negotiate” and invoice claims.

- **`contain` — “Three months later”**  
  Descriptions shorten, approvals accelerate; bank trail ≠ board summary; missing diligence; gap becomes the story.

- **`keep_going` — “Three months later”**  
  Local leadership owns file; corridor moves; then journalists, regulators, production deadline; offer to help record “make sense.”

---

## Scene 3a — `s3_clean_file`

**Title:** The Call  
**Time:** Months later — clean file, ugly headline  
**Cast:** marcus, david, priya, tom, **eleanor**

### Hook / script beats

1. Sunday morning phone buzzing; trade journal: GIS walked away; shareholders want why.
2. Email: Office of Procurement Integrity document request on advisers/intermediaries.
3. Eleanor text: call at 8 with the team.
4. Call: Eleanor — clean file, unflattering press; careful or merely late?
5. Tom: file complete, produce Monday; litigation hold chat.
6. Marcus: story will still be hesitation; wants framing out first; draft statement in outbox.
7. Moment: what full production exposes / answer only what’s asked / Marcus’s framing.
8. David: jobs question coming; engineers staffed against the bid.

### Options

| key | posture | label | isCompromise | next |
|-----|---------|-------|--------------|------|
| `full_coop` | compliant | “Produce the complete file and flag any open questions yourself” | false | `null` |
| `narrow_coop` | bystander | “Answer what is asked — keep the rest of the story inside the building” | true | `null` |
| `managed` | shortcut | “Limit production and let the narrative be shaped before it leaves” | true | `null` |

### Consequence

**Missing.** No `consequence` / `COST_OF_WINNING_STORIES` entry for any Scene 3 option (ticket 10 still open). Run ends after commit.

---

## Scene 3b — `s3_gap_record`

**Title:** The Call  
**Time:** Months later — a gap in the record

### Hook / script beats

1. Night: production due Friday; Legal in building since Monday.
2. Document: records index — diligence last update undated; board “routine advisory”; payments present; **written scope — none**.
3. Marcus text: people on the ground can help papers line up — call before Tom.
4. Call (you started): Tom — can produce what exists, not what unfinished; bridging the gap is a different decision.
5. Eleanor: who is offering? David chat: still no scope. Marcus: write-ups of what happened = documentation. Tom: post-hoc docs as contemporaneous = the problem.
6. Moment: dated today? / self-report the gap / produce exactly what’s requested.

### Options

| key | posture | label | isCompromise | next |
|-----|---------|-------|--------------|------|
| `full_coop` | compliant | “Disclose the gap, produce everything, and self-report” | false | `null` |
| `narrow_coop` | bystander | “Answer carefully and limit what leaves the building” | true | `null` |
| `managed` | shortcut | “Allow the file to be reconstructed before anyone else reads it” | true | `null` |

### Consequence

**Missing** (same as all Scene 3 endings).

---

## Scene 3c — `s3_managed`

**Title:** The Call  
**Time:** Months later — the bill arrives

### Hook / script beats

1. Night: production demand lands at nine tomorrow.
2. News: questions over GIS adviser payments in Ardania.
3. Marcus text: coherent narrative by morning — say the word.
4. Eleanor-led call: Marcus offers narrative (intent, local practice, what invoices bought) vs fragments; Tom flags spoliation if created after demand as if before; preservation notice chat.
5. Eleanor: Marcus loyal through every turn — will you be loyal back, and to what?
6. Moment: what isn’t already in the file / worst case of producing as-is / protect the people who protected the company.

### Options

| key | posture | label | isCompromise | next |
|-----|---------|-------|--------------|------|
| `full_coop` | compliant | “Produce the file as it stands — no reconstruction — and self-report” | false | `null` |
| `narrow_coop` | bystander | “Controlled production with careful messaging” | true | `null` |
| `managed` | shortcut | “Allow the file to be made coherent before production” | true | `null` |

### Consequence

**Missing** (same as all Scene 3 endings).

---

## Post-decision stages

### Solo

1. **Reflections** (after all three decisions; `caseConfig.reflectionQuestions`):
   - Which decision was the most difficult, and why?
   - At what point did the ethical dilemma become apparent to you?
   - Which stakeholders influenced your thinking the most — and which did you neglect?
   - What organisational pressures affected your judgment?
   - How did loyalty and fear influence your decisions?
   - If every decision you made became public tomorrow, would you make the same choices? What would you change?
2. **Await release / debrief gate** — “reflections submitted; continue to debrief when professor releases feedback.” Debrief page shows “Feedback not released yet” until assessment `status === "released"`.
3. **Debrief** (when released) — overall readiness, coaching letter, readiness scores, optional professor notes. Students never see AI feedback before release.

### Group (after ticket 08 story parity; ticket 11 still open)

1. After Decision 3: **meeting concluded** — lists the group’s decisions on the record.
2. **Await release** — polling until professor releases; “Your group debrief appears here when your professor releases it.”
3. **No group reflection form** in code yet (ticket 11: empathy debrief parity still `ready-for-agent`). ADR 0004 *intends* reflections in both modes; current group path skips solo’s reflection questions.
4. **Released group debrief** — epilogue, summary, what went well / improve / better decisions / evidence, professor notes (shape differs from solo assessment UI).

---

## Solo vs group differences (still present after ticket 08)

| Area | Solo | Group |
|------|------|-------|
| Pre-sim | Leadership team → read case → values | Lobby: briefing pages + seat brief only (no values stage) |
| Story delivery | Authored `script` then decision | Same script pipeline (phases: decided → film → open → **script** → live) |
| Casting | Human CEO; other seats bots | Humans + bots for empty seats; same personas |
| Consequence films | Scenes 1–2 from `consequence` / stories | Same case consequences for decisions that have them |
| Scene 3 consequence | **None authored** | **None authored** |
| Commit | Solo CEO in decision workspace | CEO commit in live (stance/message gates in group runtime) |
| Reflections | Required (`reflectionQuestions`) | **Not wired** yet (ticket 11) |
| Post | Debrief page + solo assessment shape | Concluded → AwaitRelease → group debrief shape |

Ticket 08 (shared story parity): **resolved** — same narrative/scripts/films where authored. Remaining gaps called out by open tickets: Scene 3 consequence film (10), group reflection/empathy debrief (11).
