# Ethics Simulation Platform — Build Context

## What this is
A data-driven **simulation engine** for ethical-leadership training. A student plays a
senior executive through escalating ethical decisions; a second AI grades their reasoning.
Each simulation ("case") is ONE config row — the engine is generic, so new cases are added
by supplying a new case config, NOT by writing new code.

First case: **"The Cost of Winning"** — student is CEO of Global Infrastructure Solutions,
facing 5 escalating decisions around a bribery/corruption slippery slope.

## Stack
Next.js (App Router, TS) + Tailwind · Supabase (Postgres + Auth + Row Level Security) ·
LLM API for in-scene characters + grader · Deploy on Vercel.

## Roles (enforced by Supabase RLS, not just hidden in UI)
- Admin: everything.
- Professor: create/edit cases, edit character + grader prompts live, publish, enroll
  students, view all students' transcripts/grades + class summary.
- Student: ONE attempt per case; sees only own flow + own feedback + own past sims.
  Cannot see other students, cannot edit, cannot self-elevate.

## Case schema (data-driven — the template)
case = { meta, cast[], decisions[], endings, rubric }
- meta: title, company, background, stakes
- cast: [{ id, name, role, persona, private_agenda }]  # EVP, General Counsel, CFO,
  Chief Compliance Officer, Board Chair
- decisions: [{ id, title, scenario_setup, characters_present, opening_pressure{cast_id:line},
  options[{label, is_compromise}], adaptation_notes, max_turns }]
- endings: { clean, compromised }  # + "even honest CEOs face crises" beat
- rubric: professor's 10 dimensions + coach prompt

## Student flow
Start → Meet your leadership team → Read the case → Values pre-reflection →
5-decision simulation → Debrief

## Decision loop (the core)
Per decision:
1. Show scenario_setup; characters deliver opening_pressure as named chat bubbles.
2. Student replies freely. ONE scene-director LLM call voices all present characters,
   applies pressure PERSUASIVELY (always real reasons: jobs, loyalty, "everyone's
   comfortable"), steers toward commitment. Returns JSON {messages:[{cast_id,text}],
   ready_to_commit}. Cap ~3 turns.
3. Choice options + reasoning box appear; student commits.
4. Record {choice, reasoning}; run integrity latch.
5. Next decision's pressure is ADAPTED from history.

## Integrity latch
session.integrity starts "clean". First time student picks an is_compromise option →
flips to "compromised", MONOTONIC (never flips back). One compromised decision
permanently locks out the clean ending. Ending chosen by this flag.

## Feedback model
No grades shown mid-sim (immersion stays intact). At the very end: per-decision feedback
(what they did, bias in play, stronger move) + overall summary (strengths, mistakes, how
to improve) mapped to the 10-point rubric. Student sees own; professor sees full report +
class rollup.

## Build order
1. Design foundation + app shell + student landing screen  ← CURRENT
2. Supabase + case schema + seed "The Cost of Winning"
3. Decision engine (Decision 1 end-to-end)
4. Chain all 5 + latch + endings
5. Debrief shell
6. Grading layer
7. Professor dashboard + auth + deploy

## Design direction
Serious, credible, editorial — executive-education gravity. Minimal palette, one restrained
accent, generous whitespace, strong type hierarchy, calm. NOT gamified, NOT generic-SaaS,
NOT AI-slop gradients.