# 04: Group integrity latch

**What to build:** Group sessions carry the same monotonic integrity latch as solo (`clean` → `compromised`). Only a CEO commit of an `isCompromise` option flips it; pressure stances never do; it never clears.

**Blocked by:** 01 (GroupMeetingRuntime seam + tests)

**Status:** resolved

- [x] Group session persists integrity and returns it in group state
- [x] Compromising CEO commit latches compromised; non-compromise commits leave clean unchanged if still clean
- [x] Once compromised, later commits cannot restore clean
- [x] Stances do not mutate integrity
- [x] Runtime (01) encodes the latch rule used by the commit path

## Answer

`group_sessions.integrity` (migration `0010`, default `clean`) persists the latch. `commitGroupDecision` takes `isCompromise` and updates via `resolveIntegrityAfterCeoCommit` → `applyIntegrityLatch` (ticket 01). Group state API and commit response return integrity. Custom commits are non-compromise; no stance/update path writes integrity. Tests: `npm test` (`resolveIntegrityAfterCeoCommit` + latch cases).
