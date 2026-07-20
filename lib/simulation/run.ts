import { COST_OF_WINNING } from "@/lib/case/cost-of-winning";
import { getOrCreateRun } from "@/lib/db/queries";
import { getStudentActor } from "@/lib/mode";
import { ensureHomeCase } from "@/lib/simulation/ensure-case";

export const CASE_SLUG = "cost-of-winning";

/** Solo student run — always uses seeded Student A. No login. */
export async function requireStudentRun() {
  const profile = await getStudentActor();
  const published = await ensureHomeCase();
  const run = await getOrCreateRun(profile, published.id);
  return {
    profile,
    caseRow: published,
    caseConfig: (published.config as typeof COST_OF_WINNING) ?? COST_OF_WINNING,
    run,
  };
}
