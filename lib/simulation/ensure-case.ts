import { eq } from "drizzle-orm";
import { getCase } from "@/lib/case/registry";
import { db } from "@/lib/db";
import { cases } from "@/lib/db/schema";

const SLUG = "cost-of-winning";

/**
 * Auto-publish Cost of Winning if missing, and always refresh `config`
 * from the typed case in `lib/case/` so DB blobs cannot drift from the
 * registry the API uses (e.g. renamed start scenes).
 */
export async function ensureHomeCase() {
  const config = getCase(SLUG);
  const [existing] = await db
    .select()
    .from(cases)
    .where(eq(cases.slug, SLUG))
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(cases)
      .set({ title: config.title, config, status: "published" })
      .where(eq(cases.id, existing.id))
      .returning();
    return { ...updated, config };
  }

  const [created] = await db
    .insert(cases)
    .values({
      slug: config.slug,
      title: config.title,
      config,
      status: "published",
      version: 1,
    })
    .returning();

  return { ...created, config };
}
