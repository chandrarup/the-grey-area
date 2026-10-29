# 09: Grey-area option framing (Compliant / Shortcut / Bystander)

**What to build:** At each decision checkpoint, the three options read as corporate grey-area pressures: Compliant (harder right thing), Shortcut (plausible deniability), Bystander (silence / deflect)—never “steal vs do right.” Remap labels and supporting copy; keep branching and `isCompromise` coherent.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] Every decision scene exposes three options aligned to Compliant / Shortcut / Bystander framing in user-facing copy
- [x] No option signals itself as the “correct” answer
- [x] `isCompromise` / integrity behaviour remains coherent with the shortcut and bystander paths as authored
- [x] `validate:cases` still passes after copy/structure updates

## Answer

Remapped `Posture` to `compliant | shortcut | bystander` (replacing restrictive/cautious/permissive). Every Cost of Winning decision scene now has one of each; option **keys**, `next`, and stories unchanged. User-facing labels (and CEO group `decisionOptions`) rewritten as corporate-pressure framing without steal-vs-good or “correct answer” signalling. Integrity: Compliant never compromises; Shortcut always does; Bystander compromises from Scene 2 onward (Scene 1 bystander stays non-compromising as authored). `validate:cases` enforces the three-posture set plus that Compliant/Shortcut integrity rule.
