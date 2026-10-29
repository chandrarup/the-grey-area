# Group immersion upgrade — map

## Notes

Integration branch for immersion + shared-story tickets 01–12.

## Decisions-so-far

- **04 group integrity latch:** `group_sessions.integrity` is monotonic clean→compromised; only CEO `isCompromise` commits flip it via `GroupMeetingRuntime` latch helpers; returned on group state. See [issues/04-group-integrity-latch.md](issues/04-group-integrity-latch.md).
- **12 three-decision copy:** Solo UI no longer promises five decisions; DB defaults for `decision_count` are 3. See [issues/12-decision-count-copy-cleanup.md](issues/12-decision-count-copy-cleanup.md).

## Fog

(open questions live with open tickets)
