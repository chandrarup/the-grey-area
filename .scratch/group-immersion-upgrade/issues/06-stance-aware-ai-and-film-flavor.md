# 06: Stance-aware AI + film flavor

**What to build:** Locked pressure stances leave a trace in the meeting: bot replies bias from the room’s stances, and the consequence film flavors aligned vs split/conflicted rooms—without changing which scene the CEO’s option selects.

**Blocked by:** 05 (Authored pressure stances + commit gate)

**Status:** ready-for-agent

- [ ] AI turn prompts include the locked stances (and abstains) for the current scene
- [ ] Consequence film presentation differs in flavor when the room was aligned vs split (still same CEO branch)
- [ ] No combinatorial stance×stance scene graph is introduced
- [ ] Integrity and `option.next` remain unaffected by film flavor alone
