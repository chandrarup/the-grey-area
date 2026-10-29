# 01: GroupMeetingRuntime seam + tests

**What to build:** A single domain seam that owns scene-phase transitions, pressure-stance readiness, CEO commit gate evaluation, and integrity latch rules for a group meeting—so later work does not bury those rules in React. Table-driven tests prove the external behaviour of that seam.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] GroupMeetingRuntime can evaluate phase transitions (including film watched / timeout / CEO force → open → live) from session + events without UI
- [ ] Runtime can evaluate stance lock, abstain, and “all human advisors ready”
- [ ] Runtime can evaluate CEO commit gates (human-message count and stance readiness) and integrity latch on compromise commit
- [ ] Table-driven tests cover the main transition and gate cases at this seam only (not R3F)
- [ ] Vocabulary matches GLOSSARY.md; behaviour respects ADRs 0001–0003
