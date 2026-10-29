# Group immersion upgrade + shared story

Status: ready-for-agent

## Problem Statement

The Cost of Winning ethics simulation should feel like corporate virtual training: one clear story end-to-end, grey-area choices under pressure, lived consequences, and a professional boardroom—not a chatbot or a gamified quiz. Today solo and group diverge (group skips the authored script), options are not framed as Compliant / Shortcut / Bystander, Decision 3 has no consequence film, group lacks an empathy debrief, and immersion still has zombie motion, per-seat film desync, and no pressure stances or group integrity latch.

## Solution

**One story, two casting modes.** Solo and multiplayer play the **same** narrative arc (hook → grey-area decisions → lived consequences → empathy debrief). In solo, one human (CEO) and all other seats are bots. In multiplayer, any mix of humans and bots fills the seats; missing humans are bots. Same scenes, same scripts, same consequence films, same reflection prompts.

Then deepen immersion on the existing web stack (Next.js, R3F, Rocketbox, Supabase):

1. Seated-compatible Rocketbox motion (shared stage).
2. Hard-synced scene phases.
3. Pressure stances (not votes) + CEO commit gates.
4. Group integrity latch matching solo.
5. Remap options to Compliant / Shortcut / Bystander framing; add Decision 3 consequence; group empathy debrief with pressure reflection.

## User Stories

1. As a solo player, I want the full authored story (hook, dialogue, decisions, films, debrief), so that training feels like a lived scenario.
2. As a multiplayer participant, I want that **same** story, so that group mode is not a thinner chat-only version.
3. As a multiplayer organizer, I want empty seats filled by bots, so that a partial roster still runs the full meeting.
4. As a solo player, I want every non-CEO seat to be a bot, so that the room is fully cast.
5. As a learner, I want options framed as Compliant (hard but right) / Shortcut (plausible deniability) / Bystander (stay silent / deflect), so that no choice looks cartoon-evil.
6. As a learner, I want each major choice to advance time and show ripple effects (client, board, regulator, press), including after the final decision.
7. As a learner, I want an empathy debrief that asks what pressures made the shortcut look appealing, so that the lesson transfers to real work.
8. As a group participant, I want everyone on one film/phase timeline, so that we share one meeting.
9. As an advisor, I want to lock a pressure stance before the CEO decides, so that my seat formally pressures the room.
10. As a professor, I want group integrity to latch like solo, and feedback only after release.
11. As a participant, I want characters to sit and speak professionally, with only needed actions—not zombie motion.
12. As a developer, I want one GroupMeetingRuntime seam and validated case config, so that story and sync rules stay testable.

*(Immersion stories from the prior spec remain in force; see tickets 01–07 and 08–12.)*

## Implementation Decisions

- **Story parity:** Group plays the same `script` / beat pipeline as solo for each scene; live chat and human/bot seats layer on top during discussion/decision beats. Do not maintain a separate thinner group narrative.
- **Casting:** Seat occupancy = human participant or AI bot. Solo = human CEO only; all other seats AI. Group = humans where joined; bots for the rest (including AI-flagged seats).
- **Grey-area framing:** Keep three options per checkpoint; remapping user-facing labels/copy to Compliant / Shortcut / Bystander equivalents. Preserve integrity latch via `isCompromise` (Shortcut and often Bystander compromise; Compliant usually does not—author precisely per scene). Avoid “steal vs do right” wording.
- **Consequences:** Lived films for Decisions 1–2–3 (add Decision 3). No handbook “incorrect” popups.
- **Debrief:** Solo and group both get reflection including pressure appeal; release gate unchanged.
- **Immersion:** ADRs 0001–0003; GroupMeetingRuntime; Rocketbox seated pipeline; hard-sync phases; pressure stances; group integrity. Glossary vocabulary throughout.
- Track work under `.scratch/group-immersion-upgrade/`.

## Testing Decisions

- Highest seam: GroupMeetingRuntime for phase/stance/gate/integrity.
- `validate:cases` for scripts, stance chips, grey-area option completeness, Decision 3 consequences.
- Smoke/e2e: solo full arc and group arc with mixed human/bot seats.
- Visual avatar QA manual (stage-lab). No Unity.

## Out of Scope

Unity/Unreal, Ready Player Me, headset WebXR, student voice VAD, professor 3D observe, rewriting a wholly new case world (stay Ardania / Salim), multi-seat voting.

## Further Notes

- Implementation preference: story parity and grey-area framing can proceed in parallel with runtime (01) and motion (02). Hard-sync and stances follow 01. Final e2e (07) waits on story + immersion critical path.
- Feature slug unchanged: `group-immersion-upgrade`.
