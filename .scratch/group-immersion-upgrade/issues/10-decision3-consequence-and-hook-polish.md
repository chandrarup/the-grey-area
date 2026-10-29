# 10: Decision 3 consequence film + hook polish

**What to build:** After the final decision, learners still get a lived consequence film (time jump + ripple effects: investigation, client, board, or press as authored)—not a cold end. Tighten the opening hook so dialogue stays plain and workplace-real, not compliance-jargon-heavy, while keeping the same story in both modes.

**Blocked by:** 09 (Grey-area option framing)

**Status:** resolved

- [x] Scene 3 options each carry a consequence suitable for the film pipeline
- [x] Solo and group show the Decision 3 consequence before reflections / concluded
- [x] Opening hook beats use straightforward workplace dialogue (jargon reduced where it blocked clarity)
- [x] Stories/films stay consequence-based (no handbook “incorrect” popup)

## Comments

### Advisor QA (2026-10-29)
See `.scratch/group-immersion-upgrade/advisor-realism-review.md` and `scene-walkthrough.md`.

- P0: author + play Decision 3 consequence films for all s3_* options before reflections/concluded.

## Answer

Decision 3 now has lived consequence films on every `s3_clean_file` / `s3_gap_record` / `s3_managed` option (`full_coop` / `narrow_coop` / `managed`), with matching `COST_OF_WINNING_STORIES` frames. Solo `decision-workspace` already plays `result.consequence` before Finish → reflections; group committed/graded path uses `TerminalConsequence` so the film runs once per seat before the concluded list / await-release.

**Also shipped with this ticket (advisor P0 label/quiz polish that belongs with story polish):**
- Rewrote virtue-leaking student-facing labels (e.g. Avoid owning / Stay off the record / reconstructed / made coherent / shorten the description) to equal-weight exec language; keys, `posture`, `isCompromise`, and `next` unchanged. Mirrored Scene 1 strings in CEO `decisionOptions`.
- Removed DecisionView quiz meta (“No option is marked right or wrong”); removed Scene 1 `commitPrefill`.
- Light opening-hook jargon tighten on Marcus’s first line (engineering package / ministry file / rules).
- `validate:cases` requires `consequence` on every option, including terminals.
