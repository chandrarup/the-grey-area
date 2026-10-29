# 05: Authored pressure stances + commit gate

**What to build:** Before the CEO can make the call, every human advisor locks an authored pressure stance (chips + optional note) or abstains on timeout; AI/bot seats auto-stance. Stances are persisted and shown on the CEO commit overlay. Commit still requires ≥6 human messages **and** stance readiness. Stances are not votes—branching stays CEO-only.

**Blocked by:** 01 (GroupMeetingRuntime seam + tests), 03 (Hard-synced scene phases)

**Status:** ready-for-agent

- [ ] Case config can author 2–3 stance chips per advisor seat per scene
- [ ] Human advisors can lock a stance (+ optional note) during the live phase window; ~2 min timeout records Abstain
- [ ] Bot advisor seats auto-lock a stance from their brief
- [ ] One stance record persisted per (session, scene, seat)
- [ ] CEO commit overlay shows locked stances / abstains
- [ ] “Make the call” unlocks only when message gate and human-advisor stance readiness both pass
- [ ] CEO has no stance; `option.next` / custom-end behaviour unchanged
