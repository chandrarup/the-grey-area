# 07: Case validation + solo/group e2e smoke

**What to build:** Broken story or stance authoring cannot ship, and smoke paths prove both modes: shared story arc, grey-area options, Decision 3 film, reflections, phase sync, stance gate, commit, integrity—with bots filling empty seats in group and all non-CEO seats in solo.

**Blocked by:** 02 (Seated Rocketbox motion), 05 (Pressure stances), 06 (Stance-aware AI + film), 08 (Shared story parity), 10 (Decision 3 consequence), 11 (Empathy debrief), 12 (Decision-count copy)

**Status:** resolved

- [x] `validate:cases` rejects missing stance chips, missing Decision 3 consequences, and malformed grey-area option sets as required by config rules
- [x] Solo smoke covers hook → three decisions → films → reflection → await release
- [x] Group smoke covers shared story with mixed human/bot seats → phase sync → stances → commit → integrity → reflection → await release
- [x] Failure modes are clear enough to re-run after regressions

## Answer

`validate:cases` already gates stances / grey-area postures / consequences. Added `story-arc.test.ts` (27 paths, D3 films, scripts, integrity). DB smokes (no browser/LLM): `npm run smoke:solo`, `npm run smoke:group`, or `npm run smoke:arcs` (validate + unit + both). Failures throw `FAIL solo-arc:` / `FAIL group-arc:` with the step that broke.
