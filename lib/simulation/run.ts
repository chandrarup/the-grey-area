import { getCase } from "@/lib/case/registry";
import { getOrCreateRun, resetRun } from "@/lib/db/queries";
import { getStudentActor } from "@/lib/mode";
import { ensureHomeCase } from "@/lib/simulation/ensure-case";

export const CASE_SLUG = "cost-of-winning";

/** Solo student run — always uses seeded Student A. No login. */
export async function requireStudentRun() {
  const profile = await getStudentActor();
  const published = await ensureHomeCase();
  // Typed registry is source of truth (matches /api/decision). DB stores a mirror.
  const caseConfig = getCase(CASE_SLUG);
  let run = await getOrCreateRun(profile, published.id);

  // Heal runs pointed at a renamed/removed scene after a case port.
  if (
    run.currentSceneId &&
    !caseConfig.scenes[run.currentSceneId]
  ) {
    run = await resetRun(profile, run.id, caseConfig.startScene);
  }

  return {
    profile,
    caseRow: published,
    caseConfig,
    run,
  };
}
