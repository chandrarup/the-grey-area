# 03: Hard-synced scene phases

**What to build:** Every seat in a live group meeting shares one scene-phase timeline (decided → film → open → live). Film advances when all required human seats have watched, when the film timeout elapses, or when the CEO force-advances. Reload restores server phase; localStorage is not the source of truth.

**Blocked by:** 01 (GroupMeetingRuntime seam + tests)

**Status:** claimed

- [ ] Current scene phase (and phase-window deadline as needed) is persisted on the group session and exposed via group state
- [ ] All human seats converge on the same phase after refresh/poll
- [ ] Film completion follows all-watched OR ~90s timeout OR CEO force-advance
- [ ] Per-seat localStorage film-skip is no longer authoritative
- [ ] Runtime (01) is the authority for transition rules; UI/API only emit events and render

## Comments

### Advisor QA (2026-10-29)
See `.scratch/group-immersion-upgrade/advisor-realism-review.md` and `scene-walkthrough.md`.

- P0: server-own phase including `script`; stop localStorage as film/script authority; align GroupMeetingRuntime ScenePhase with UI.
