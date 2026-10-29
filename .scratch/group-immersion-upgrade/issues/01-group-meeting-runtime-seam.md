# 01: GroupMeetingRuntime seam + tests

**What to build:** A single domain seam that owns scene-phase transitions, pressure-stance readiness, CEO commit gate evaluation, and integrity latch rules for a group meeting—so later work does not bury those rules in React. Table-driven tests prove the external behaviour of that seam.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] GroupMeetingRuntime can evaluate phase transitions (including film watched / timeout / CEO force → open → live) from session + events without UI
- [x] Runtime can evaluate stance lock, abstain, and “all human advisors ready”
- [x] Runtime can evaluate CEO commit gates (human-message count and stance readiness) and integrity latch on compromise commit
- [x] Table-driven tests cover the main transition and gate cases at this seam only (not R3F)
- [x] Vocabulary matches GLOSSARY.md; behaviour respects ADRs 0001–0003

## Answer

Pure seam at `lib/group/meeting-runtime.ts` (`GroupMeetingRuntime`): phase transitions (decided→film→open→live via all-watched / 90s timeout / CEO force), stance readiness (locked|abstain; bots never block), CEO commit gate (≥6 human msgs + readiness), monotonic integrity latch. Table-driven `node:test` suite via `npm test`. No UI/API wiring — later tickets call this seam.
