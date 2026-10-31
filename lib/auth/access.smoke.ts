/** HTTP access regression with temporary, named fixtures. No AI/email calls.
 * Run: npx tsx --env-file=.env.local lib/auth/access.smoke.ts
 */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, closeDb } from "@/lib/db";
import { SEAT_COOKIE } from "@/lib/group-cookie";
import { profiles, groupSessions } from "@/lib/db/schema";
import {
  createGroupSession,
  deleteGroupSession,
  listParticipants,
} from "@/lib/db/group-queries";
const origin = process.env.AUTH_SMOKE_ORIGIN || "http://localhost:3000";
const sessions: string[] = [];
let profileId = "";
async function check(path: string, expected: number, init?: RequestInit) {
  const res = await fetch(`${origin}${path}`, { redirect: "manual", ...init });
  assert.equal(
    res.status,
    expected,
    `${path}: expected ${expected}, got ${res.status}`,
  );
  return res;
}
async function main() {
  for (const path of [
    "/professor",
    "/professor/simulations",
    "/simulation/decisions",
    "/settings",
    "/stage-lab",
  ]) {
    const res = await check(path, 307);
    assert.equal(res.headers.get("location"), "/login");
  }
  await check("/professor/simulations", 307, {
    headers: { Cookie: "tga_mode=admin" },
  });
  await check("/api/llm-test?model=gemini-flash", 401);
  await check("/api/decision", 401, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  await check("/api/speech", 401, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  const [profile] = await db
    .insert(profiles)
    .values({
      name: "Access smoke fixture",
      email: `access-smoke-${randomUUID()}@test.invalid`,
      role: "admin",
    })
    .returning();
  profileId = profile.id;
  if (process.env.AUTH_SMOKE_PRODUCTION === "true") {
    await check("/professor/simulations", 307, {
      headers: { Cookie: `dev_profile_id=${profileId}` },
    });
    const login = await (await check("/login", 200)).text();
    assert.equal(login.includes("Open local instructor preview"), false);
  }
  for (let i = 0; i < 2; i++) {
    const { session } = await createGroupSession({
      createdBy: profile,
      caseSlug: "cost-of-winning",
      decisionCount: 3,
      seats: {
        ceo: "human",
        marcus: "ai",
        david: "ai",
        priya: "ai",
        tom: "ai",
      },
    });
    sessions.push(session.id);
  }
  const [a, b] = sessions;
  const seat = (await listParticipants(a)).find((p) => p.roleKey === "ceo")!;
  await check(`/api/group/${a}/state`, 403);
  await check(`/api/group/${a}/state`, 403, {
    headers: { "x-seat-token": seat.id },
  });
  const auth = { headers: { "x-seat-token": seat.joinToken! } };
  const state = await (await check(`/api/group/${a}/state`, 200, auth)).json();
  assert.equal(state.sessionId, a);
  assert.equal(
    JSON.stringify(state).includes(seat.joinToken!),
    false,
    "seat token must never appear in public state",
  );
  assert.equal(
    "assessment" in state,
    false,
    "unreleased assessment is not in state",
  );
  await check(`/api/group/${b}/state`, 403, auth);
  await check(`/api/group/${a}/state`, 403, {
    headers: {
      "x-seat-token": "invalid",
      Cookie: `${SEAT_COOKIE}=${seat.joinToken!}`,
    },
  });
  await db
    .update(groupSessions)
    .set({ status: "released", expiresAt: new Date(Date.now() - 3600000) })
    .where(eq(groupSessions.id, a));
  await check(`/api/group/${a}/state`, 200, auth);
  await db
    .update(groupSessions)
    .set({ status: "expired" })
    .where(eq(groupSessions.id, a));
  await check(`/api/group/${a}/state`, 403, auth);
  console.log(
    "PASS: signed-out staff access, forged role cookie, AI routes, valid seat, cross-group denial, UUID rejection, released feedback access, expired invite denial.",
  );
}
main()
  .finally(async () => {
    for (const id of sessions) await deleteGroupSession(id);
    if (profileId) await db.delete(profiles).where(eq(profiles.id, profileId));
    await closeDb();
  })
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
