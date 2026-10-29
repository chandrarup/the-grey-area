# 12: Decision-count copy cleanup (three decisions)

**What to build:** All user-facing and default config copy says **three** decisions end-to-end (not five). Forms and empty states match `maxDepth: 3`.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] No student/professor UI string still promises five decisions for this case
- [x] Group session defaults / create forms align with three decisions for Cost of Winning
- [x] Smoke of landing/meeting/concluded copy shows consistent “three”

## Answer

Solo stage copy (leadership team, values, decisions complete, debrief gate) now says **three** decisions. Schema + migration `0009` set `group_sessions` / `group_batches.decision_count` DB default to `3` (forms already defaulted to 3 / max 3). Left intact: “five-person meeting” seat count and story “five weeks later.”
