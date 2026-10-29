# The Cost of Winning

Domain language for the executive ethics simulation (solo and live group modes). Internal package name stays `the-grey-area`; that phrase must never appear in user-facing copy.

## Language

**Seat**:
One assigned role in a live group meeting (CEO, Marcus, David, Priya, or Tom).
_Avoid_: Character slot, player class, avatar role

**CEO commit**:
The only recorded group decision: the CEO chooses an option (or custom text) and reasoning for the current scene. Advisors do not vote.
_Avoid_: Group vote, collective choice, multiplayer decision

**Pressure stance**:
A timed, per-seat position an advisor locks in before the CEO commit. It shapes the room (options, AI tone, film, integrity path) but is not a vote.
_Avoid_: Advisor vote, secondary decision, poll

**Scene phase**:
Where the shared group meeting is in its beat sequence for the current scene: decided → film → open → live (commit happens inside live).
_Avoid_: UI mode, screen state, client view

**Integrity latch**:
A one-way run state from clean to compromised once a compromising option is chosen; it never flips back.
_Avoid_: Ethics score, morality meter, reversible integrity

**Consequence film**:
The letterboxed cinematic replay of what followed a committed decision, shown before the next scene opens.
_Avoid_: Cutscene, VR, story cards (those are older presentation forms)

**Hard-sync**:
Server-owned scene phase progression so every seat shares one timeline; local client caches are not the source of truth.
_Avoid_: Per-seat film skip, localStorage phase

**Abstain**:
The default pressure stance recorded when a human advisor’s stance timer expires without a lock.
_Avoid_: Skip, no-op, null stance

**Shared story**:
The same authored narrative arc used in both solo and group modes; modes differ only by which seats are human versus bot.
_Avoid_: Group chat mode, solo-only script, thin multiplayer path

**Bot seat**:
A seat filled by the AI persona when no human participant is assigned or present.
_Avoid_: NPC, dummy player

**Compliant path**:
The grey-area option that does the harder right thing under pressure (often inconvenient or politically costly).
_Avoid_: Correct answer, good choice

**Shortcut path**:
The grey-area option that preserves plausible deniability or speed at ethical cost.
_Avoid_: Evil option, steal the money

**Bystander path**:
The grey-area option that stays silent, deflects, or avoids owning the call.
_Avoid_: Neutral, skip
