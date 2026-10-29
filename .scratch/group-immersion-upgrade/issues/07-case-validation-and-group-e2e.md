# 07: Case validation + solo/group e2e smoke

**What to build:** Broken story or stance authoring cannot ship, and smoke paths prove both modes: shared story arc, grey-area options, Decision 3 film, reflections, phase sync, stance gate, commit, integrity—with bots filling empty seats in group and all non-CEO seats in solo.

**Blocked by:** 02 (Seated Rocketbox motion), 05 (Pressure stances), 06 (Stance-aware AI + film), 08 (Shared story parity), 10 (Decision 3 consequence), 11 (Empathy debrief), 12 (Decision-count copy)

**Status:** ready-for-agent

- [ ] `validate:cases` rejects missing stance chips, missing Decision 3 consequences, and malformed grey-area option sets as required by config rules
- [ ] Solo smoke covers hook → three decisions → films → reflection → await release
- [ ] Group smoke covers shared story with mixed human/bot seats → phase sync → stances → commit → integrity → reflection → await release
- [ ] Failure modes are clear enough to re-run after regressions
