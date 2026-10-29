# 11: Empathy debrief parity (solo + group)

**What to build:** Both modes end with an empathy-driven reflection that bridges sim to reality, including a prompt on what pressures made the shortcut path look appealing. Group no longer skips straight from Decision 3 to “await release” without reflection. Release gate still hides AI feedback until the professor releases.

**Blocked by:** 08 (Shared story parity)

**Status:** resolved

- [x] Group participants complete reflection prompts after the final consequence (including pressure-appeal question)
- [x] Solo reflection set includes the same pressure-appeal intent (reuse or align wording)
- [x] Feedback/grades remain invisible until release
- [x] Debrief content can reference values / choices without labeling options as correct/incorrect in the student UI

## Answer

Shared case `reflectionQuestions` now include the pressure-appeal prompt. Solo uses the shared reflection form unchanged in gate behaviour. Group `committed`/`graded` seats must submit reflections (persisted on `group_participants.reflections`) before the decisions + await-release UI; released debrief path and release gate unchanged.

## Comments

### Advisor QA (2026-10-29)
See `.scratch/group-immersion-upgrade/advisor-realism-review.md` and `scene-walkthrough.md`.

- Add explicit pressure-appeal reflection; group must not skip straight to await-release.
