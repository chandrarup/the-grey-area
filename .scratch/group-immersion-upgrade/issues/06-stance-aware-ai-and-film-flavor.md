# 06: Stance-aware AI + film flavor

**What to build:** Locked pressure stances leave a trace in the meeting: bot replies bias from the room’s stances, and the consequence film flavors aligned vs split/conflicted rooms—without changing which scene the CEO’s option selects.

**Blocked by:** 05 (Authored pressure stances + commit gate)

**Status:** resolved

- [x] AI turn prompts include the locked stances (and abstains) for the current scene
- [x] Consequence film presentation differs in flavor when the room was aligned vs split (still same CEO branch)
- [x] No combinatorial stance×stance scene graph is introduced
- [x] Integrity and `option.next` remain unaffected by film flavor alone

## Answer

`evaluateRoomStanceClimate` / `filmClimatePlace` on `GroupMeetingRuntime` classify locked chips as aligned (all brief-default or all alternative) vs split (mix / thin room). `runAiTurn` + legacy queue inject `formatPressureStancePrompt` (locks, notes, abstains; not a vote). Consequence film title-card `place` and decided-card eyebrow use climate only; same `option.consequence` / `option.next`. No stance×stance scene graph.
