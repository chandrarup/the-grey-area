# 03: Hard-synced scene phases

**What to build:** Every seat in a live group meeting shares one scene-phase timeline (decided → film → open → script → live). Film advances when all required human seats have watched, when the film timeout elapses, or when the CEO force-advances. Reload restores server phase; localStorage is not the source of truth.

**Blocked by:** 01 (GroupMeetingRuntime seam + tests)

**Status:** resolved

- [x] Current scene phase (and phase-window deadline as needed) is persisted on the group session and exposed via group state
- [x] All human seats converge on the same phase after refresh/poll
- [x] Film completion follows all-watched OR ~90s timeout OR CEO force-advance
- [x] Per-seat localStorage film-skip is no longer authoritative
- [x] Runtime (01) is the authority for transition rules; UI/API only emit events and render

## Comments

### Advisor QA (2026-10-29)
See `.scratch/group-immersion-upgrade/advisor-realism-review.md` and `scene-walkthrough.md`.

- P0: server-own phase including `script`; stop localStorage as film/script authority; align GroupMeetingRuntime ScenePhase with UI.

## Answer

Hard-sync is live on the session:

- Schema: `scene_phase`, `phase_deadline_at`, `film_watched_seat_ids`, `script_done_seat_ids` (+ migration `0010`).
- Runtime: `ScenePhase` includes `script`; film/script all-ready + timeout/CEO force rules covered by unit tests.
- API: `POST /api/group/[code]/phase`; `GET .../state` returns phase fields; commit/start reset phase for the next scene.
- UI: `group-stage` renders server phase via poll; localStorage is beat-resume only, not phase authority.
