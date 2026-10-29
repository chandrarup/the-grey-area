# Code review — integrate/group-immersion-upgrade

**Axes:** Standards + Spec (skill: code-review)  
**Fixed point:** `3d1a40a` (merge-base with `main`)  
**HEAD:** `f1e1e01` · 28 commits · `118 files, +13841 / −979`  
**Spec:** `.scratch/group-immersion-upgrade/spec.md` + issues `01`–`12` (all marked resolved)  
**ADRs / domain:** `docs/adr/0001`–`0004`, `GLOSSARY.md`, `PROJECT.md` principles  

Do **not** treat ticket “resolved” checkboxes as proof; findings below were verified against the diff.

---

## MUST-FIX punch list (ranked)

Follow-up fix agent: address these before merge. None are trivial one-liners.

1. **Decision 3 film still per-seat localStorage (Standards + Spec)**  
   - **Where:** `app/group/[id]/terminal-consequence.tsx` (`group-film:${sessionId}:${decisionId}`).  
   - **Why:** Ticket 03 / ADR 0001 / GLOSSARY Hard-sync — film skip must not be per-seat localStorage; mid-arc hard-sync is server-owned, but terminal D3 film is not. Seats can diverge after the final decision.  
   - **Fix direction:** Drive D3 film through the same server `scene_phase` / `film_watched_seat_ids` / timeout / CEO-force path as mid-meeting films (or an equivalent session-owned terminal film window).

2. **Marcus fee story still hard-coded in API (Standards)**  
   - **Where:** `lib/group/ai-turn.ts` — `marcusFeeNote` when `roleKey === "marcus"` && `currentSceneId.startsWith("s1")`. Diff extends that string with pacing instead of retiring it.  
   - **Why:** `PROJECT.md` — cases are typed config; never hard-code story logic in UI/API. `scene.sceneDirective` is already injected.  
   - **Fix direction:** Move fee-reveal pacing/directive into case config (scene directive / beat meta); delete the role+scene string branch from `ai-turn.ts`.

3. **Story strings hard-coded in desk / film prop art (Standards)**  
   - **Where:** `app/simulation/decisions/stage-desk.tsx` (“7:45 Leadership call — Ardania”, “Salim: answer needed tonight”); `app/simulation/decisions/three/film-props.tsx` (“Travel — Ardania”, “Ardania bid office”).  
   - **Why:** Same `PROJECT.md` typed-config rule; these landed in the immersion baseline diff.  
   - **Fix direction:** Pull copy from case/story config (or prop metadata on consequences); UI renders only.

---

## Standards

### Hard violations (MUST-FIX)

1. **Story hard-coded in UI** — `PROJECT.md` (“typed config… never hard-code story in UI/API”)  
   - `app/simulation/decisions/stage-desk.tsx`: laptop calendar embeds “7:45 Leadership call — Ardania” / “Salim: answer needed tonight” (not from case config).  
   - `app/simulation/decisions/three/film-props.tsx`: “Travel — Ardania” / “Ardania bid office” baked into prop art.

2. **Story hard-coded in API** — same `PROJECT.md` rule  
   - `lib/group/ai-turn.ts`: still keys Marcus fee text off `roleKey === "marcus" && currentSceneId.startsWith("s1")`, even though `scene.sceneDirective` is already injected. Diff **extends** that string with pacing copy instead of moving it into case config.

3. **Per-seat localStorage film skip** — `docs/adr/0001-hard-synced-scene-phases.md` / `GLOSSARY.md` Hard-sync (“Avoid: Per-seat film skip, localStorage phase”)  
   - Mid-meeting phases are server-owned, but `app/group/[id]/terminal-consequence.tsx` still uses `group-film:${sessionId}:${decisionId}` in `localStorage` so each seat can skip the Decision 3 film independently.

### Judgement-call smells

- **Duplicated Code** — CEO commit gate (msg + stance ready) in both `app/api/group/[code]/commit/route.ts` and `commitGroupDecision` (`lib/db/group-queries.ts`).  
- **Divergent Change** — `group-stage.tsx` owns phase emit, stance UI, film, script, chat, and CEO overlay (~1k lines).  
- **Mysterious Name / Primitive Obsession** — `stanceClimate: "aligned" | "split"` as presentation strings rather than a named climate type tied to stance aggregation.  
- **Duplicated Code** — Marcus fee directive duplicated: case `sceneDirective` vs `marcusFeeNote` in `ai-turn.ts` (feeds hard violation #2).

### Looked compliant

Monotonic integrity latch (`applyIntegrityLatch` / DB `integrity`); pressure stances authored in `lib/case/`, dual gate, no vote/`option.next`/latch from stances (ADRs 0002–0003); Compliant/Shortcut/Bystander labels without virtue-signal copy; shared script pipeline (ADR 0004); release gate + await-release; free text on moments/CEO custom; MEMORY.md dated entries; no user-facing “The Grey Area.”

---

## Spec

Verified against `git diff 3d1a40a...HEAD` on `integrate/group-immersion-upgrade` @ `f1e1e01` (not ticket checkboxes). Mid-arc hard-sync, runtime seam, stances/gate, D1–D3 consequences, grey-area remap, reflections, and three-decision copy are largely present. Residual gaps below.

### (a) Missing / partial

1. **MUST-FIX — D3 film still localStorage-authoritative.** Ticket 03: *“Per-seat localStorage film-skip is no longer authoritative.”* Mid-arc path uses server `scene_phase` / `film_watched_seat_ids`; `TerminalConsequence` still keys phase off `localStorage` (`group-film:…`) and skips the shared all-watched / timeout / CEO-force rules. Conflicts with ADR 0001’s shared film timeline after Decision 3.

2. **Partial — seated anim rebuild.** Ticket 02 Answer: *“Regenerating `anims_{m,f}.glb` needs … anim_out/ … runtime layering already enforces arms/head-only until rebuild.”* Bone filters land; seated-source rebuild is still the documented residual vs *“no longer drive standing full-body poses that tip bodies through chairs.”*

3. **Partial — film “flavor.”** Ticket 06: *“Consequence film presentation differs in flavor when the room was aligned vs split.”* Code only swaps title-card `place` / eyebrow via `filmClimatePlace`; story frames and beats are identical.

4. **Partial — group integrity smoke.** Ticket 07: *“Group smoke covers … commit → integrity.”* `group-arc.smoke.ts` only asserts `integrity === "clean"` on a compliant path; solo smoke flips to `compromised` on shortcut. Latch wiring exists; group regression coverage does not prove the flip.

5. **Partial — bystander integrity authoring.** Ticket 09 Answer: *“Bystander compromises from Scene 2 onward.”* `validate:cases` enforces Compliant≠compromise / Shortcut=compromise only — not the Scene 2+ bystander rule.

### (b) Scope creep

- **Speech pacing** (`speech-pacing.ts`, commit `f1e1e01`) — fee/reveal TTS ellipsis; not in tickets 01–12.  
- **Briefing-pager race fix** (`80bfe32`) — unrelated to immersion tickets.

### (c) Looks implemented, looks wrong

- **Ticket 03 marked resolved while D3 still client-skips film** (see MUST-FIX) — acceptance text is broader than the live-meeting path that was wired.  
- Stale `.scratch/.../scene-walkthrough.md` / advisor review still claim missing D3 films, hard-sync, and reflections; **code has those** — docs lag, not product gaps.

**Not gaps (spot-check OK):** `GroupMeetingRuntime` + tests (01); intent/`clipLayerFor` shared boardroom (02); server phase API + poll for live scenes (03 mid-arc); integrity persist/commit latch (04); stance chips/gate/overlay (05); stance prompt in AI turn (06); validate + arc smokes (07); shared script pipeline (08); posture remap + quiz meta/`commitPrefill` gone (09/10); D3 consequences authored (10); shared pressure-appeal reflection + group form (11); no “five decisions” UI (12); release gate intact.

---

## Follow-up (non-blocking)

Not MUST-FIX; useful for a polish pass:

- Deduplicate CEO commit-gate checks (API route vs `commitGroupDecision`).  
- Slim `group-stage.tsx` (phase/stance/film/script/chat/overlay).  
- Strengthen group smoke to assert `compromised` after a shortcut CEO commit.  
- Optionally validate Scene 2+ bystander `isCompromise` in `validate:cases`.  
- Refresh advisor QA / scene-walkthrough docs so they match shipped code.  
- Rebuild `anims_{m,f}.glb` from seated Rocketbox sources when `anim_out/` is available (ticket 02 residual).  
- Decide whether title-card-only climate is enough for ticket 06 “flavor,” or author light frame variants.

---

## Summary

**Standards:** 3 hard violations (worst: D3 localStorage film + hard-coded Marcus/desk/film story); 4 judgement-call smells.  
**Spec:** 1 MUST-FIX gap (D3 hard-sync), 4 partials, 2 scope-creep notes; tickets 01–12 largely present aside from terminal film authority.
