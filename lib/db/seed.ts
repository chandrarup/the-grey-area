import { config } from "dotenv";

config({ path: ".env.local" });
config();

import { eq } from "drizzle-orm";
import { COST_OF_WINNING } from "@/lib/case/cost-of-winning";
import { db } from "@/lib/db";
import { cases, profiles } from "@/lib/db/schema";

const DEV_PROFILES = [
  {
    email: "student-a@dev.local",
    name: "Student A",
    role: "student" as const,
  },
  {
    email: "student-b@dev.local",
    name: "Student B",
    role: "student" as const,
  },
  {
    email: "professor@dev.local",
    name: "Professor",
    role: "professor" as const,
  },
  {
    email: "admin@dev.local",
    name: "US Admin",
    role: "admin" as const,
  },
];

async function upsertProfile(input: (typeof DEV_PROFILES)[number]) {
  const [existing] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.email, input.email))
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(profiles)
      .set({ name: input.name, role: input.role })
      .where(eq(profiles.id, existing.id))
      .returning();
    return updated;
  }

  const [created] = await db.insert(profiles).values(input).returning();
  return created;
}

async function upsertCase() {
  const [existing] = await db
    .select()
    .from(cases)
    .where(eq(cases.slug, COST_OF_WINNING.slug))
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(cases)
      .set({
        title: COST_OF_WINNING.title,
        config: COST_OF_WINNING,
        status: "published",
        version: (existing.version ?? 1) + 1,
      })
      .where(eq(cases.id, existing.id))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(cases)
    .values({
      slug: COST_OF_WINNING.slug,
      title: COST_OF_WINNING.title,
      config: COST_OF_WINNING,
      status: "published",
      version: 1,
    })
    .returning();
  return created;
}

async function main() {
  console.log("Seeding profiles…");
  for (const profile of DEV_PROFILES) {
    const row = await upsertProfile(profile);
    console.log(`  ${row.name} (${row.role}) — ${row.id}`);
  }

  console.log("Seeding case…");
  const caseRow = await upsertCase();
  console.log(`  ${caseRow.slug} — ${caseRow.id} [${caseRow.status}]`);

  console.log("Done.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
