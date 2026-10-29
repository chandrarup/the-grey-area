# 04: Group integrity latch

**What to build:** Group sessions carry the same monotonic integrity latch as solo (`clean` → `compromised`). Only a CEO commit of an `isCompromise` option flips it; pressure stances never do; it never clears.

**Blocked by:** 01 (GroupMeetingRuntime seam + tests)

**Status:** claimed

- [ ] Group session persists integrity and returns it in group state
- [ ] Compromising CEO commit latches compromised; non-compromise commits leave clean unchanged if still clean
- [ ] Once compromised, later commits cannot restore clean
- [ ] Stances do not mutate integrity
- [ ] Runtime (01) encodes the latch rule used by the commit path
