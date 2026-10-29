# 02: Seated Rocketbox motion (solo + group)

**What to build:** Boardroom characters sit and speak like professionals—only needed actions, no standing “zombie” talk poses. Solo and group share the improved Rocketbox seated pipeline (seated-compatible clips, additive upper body, settle as safety net, intent-driven actions).

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] Seated idle and talk/gesture motion no longer drive standing full-body poses that tip bodies through chairs
- [x] Solo and group boardroom stages both use the upgraded motion path
- [x] Intent layer covers at least idle / listen / speak (and existing nod/phone/write-style acts where already used)
- [x] Ready Player Me is not introduced; Rocketbox remains the avatar source
- [x] Visual check in stage-lab or live boardroom confirms calmer, seated behaviour

## Answer

Intent + clip policy live in `app/simulation/decisions/three/avatar-motion.ts` (`resolveAvatarIntent`, `clipLayerFor`). `avatar.tsx` drives the mixer from intent; talk/listen/nod/phone are arms/head additives; `settle()` unchanged. `boardroom.tsx` sets `isSpeaker`/`listening` for HQ and remote seats — solo and group already share `MeetingStage` → `Boardroom`. `scripts/avatars/build-rocketbox-anims.mjs` exports only professional clips and strips spine/pelvis from standing sources (prefers `sit_chair_*` when available). Stage-lab: idle / listen / speak + seat/side shots. Tests: `npm run test:unit`.

**Blocker:** Regenerating `public/avatars/anims_{m,f}.glb` needs the offline `anim_out/` Rocketbox scratch tree (not in repo); runtime layering already enforces arms/head-only until rebuild.
