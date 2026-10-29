# 05: Authored pressure stances + commit gate

**What to build:** Before the CEO can make the call, every human advisor locks an authored pressure stance (chips + optional note) or abstains on timeout; AI/bot seats auto-stance. Stances are persisted and shown on the CEO commit overlay. Commit still requires ≥6 human messages **and** stance readiness. Stances are not votes—branching stays CEO-only.

**Blocked by:** 01 (GroupMeetingRuntime seam + tests), 03 (Hard-synced scene phases)

**Status:** resolved

- [x] Case config can author 2–3 stance chips per advisor seat per scene
- [x] Human advisors can lock a stance (+ optional note) during the live phase window; ~2 min timeout records Abstain
- [x] Bot advisor seats auto-lock a stance from their brief
- [x] One stance record persisted per (session, scene, seat)
- [x] CEO commit overlay shows locked stances / abstains
- [x] “Make the call” unlocks only when message gate and human-advisor stance readiness both pass
- [x] CEO has no stance; `option.next` / custom-end behaviour unchanged

## Answer

Authored `pressureStances` (2–3 chips per advisor seat per scene) live on case config (`cost-of-winning-stances.ts`); `validate:cases` enforces them. Entering hard-synced `live` sets `stance_deadline_at` (~2 min), auto-locks bot seats to the first chip, and persists one `group_pressure_stances` row per (session, scene, seat). Humans lock via `POST /api/group/[code]/stance` (optional note); elapsed deadline → Abstain on state poll. CEO overlay lists locked/Abstain rows; commit uses `evaluateCeoCommitGate` (≥6 human msgs **and** human-advisor readiness). CEO never stances; branching/`option.next` unchanged. Integrity latch untouched. Migration `0013_group_pressure_stances`.
