# 08: Shared story parity (solo = group narrative)

**What to build:** Multiplayer plays the **same** end-to-end authored story as solo (hook beats, scene scripts, decision moments, consequence films). Solo casts one human (CEO) and bot seats; group casts any mix of humans and bots for empty/AI seats. Group must not remain a chat-only thinner path (ADR 0004).

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Group scene flow uses the same script/beat pipeline as solo for story delivery (discussion/decision still allow human chat where seats are human)
- [ ] Unfilled group seats run as bot seats with the same personas as solo AI cast
- [ ] Solo continues to treat only the CEO as human; other seats bot
- [ ] Consequence films after decisions appear in both modes from the same case consequences
- [ ] User-facing copy never implies group is a different case
