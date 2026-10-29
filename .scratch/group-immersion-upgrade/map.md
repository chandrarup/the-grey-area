# Group immersion upgrade — map

## Notes

Integration branch for immersion + shared-story tickets 01–12.

## Decisions-so-far

- **07 case validation + arc smokes:** `validate:cases` + `story-arc.test.ts`; `smoke:solo` / `smoke:group` / `smoke:arcs` prove shared story without browser. See [issues/07-case-validation-and-group-e2e.md](issues/07-case-validation-and-group-e2e.md).
- **06 stance-aware AI + film flavor:** Locked stances enter AI prompts; film title/eyebrow flavors aligned vs split via `evaluateRoomStanceClimate` (no branch graph). See [issues/06-stance-aware-ai-and-film-flavor.md](issues/06-stance-aware-ai-and-film-flavor.md).
- **05 pressure stances + commit gate:** Authored chips per advisor/scene; persist lock/Abstain; bots auto-stance; CEO overlay + dual commit gate (msgs + readiness). See [issues/05-pressure-stances-and-commit-gate.md](issues/05-pressure-stances-and-commit-gate.md).
- **10 Decision 3 film + label/quiz polish:** Terminal `s3_*` options carry consequence stories; solo + group play the film before reflections/concluded. Virtue-leaking labels and DecisionView quiz meta removed; Scene 1 `commitPrefill` cleared. See [issues/10-decision3-consequence-and-hook-polish.md](issues/10-decision3-consequence-and-hook-polish.md).
- **11 empathy debrief parity:** Same reflection set (incl. pressure-appeal) for solo + group; group humans reflect before await-release; release gate unchanged. See [issues/11-empathy-debrief-parity.md](issues/11-empathy-debrief-parity.md).
- **04 group integrity latch:** `group_sessions.integrity` is monotonic clean→compromised; only CEO `isCompromise` commits flip it via `GroupMeetingRuntime` latch helpers; returned on group state. See [issues/04-group-integrity-latch.md](issues/04-group-integrity-latch.md).
- **12 three-decision copy:** Solo UI no longer promises five decisions; DB defaults for `decision_count` are 3. See [issues/12-decision-count-copy-cleanup.md](issues/12-decision-count-copy-cleanup.md).

## Fog

(open questions live with open tickets)
