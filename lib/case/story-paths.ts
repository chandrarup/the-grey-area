/**
 * Enumerate complete decision paths for a case (ticket 07 / validate:cases).
 * Pure config — no DB.
 */
import type { CaseConfig } from "./types";

export type PathStep = {
  sceneId: string;
  optionKey: string;
  posture: string;
  isCompromise: boolean;
  next: string | null;
};

/** Depth-first complete paths from startScene to a terminal option. */
export function enumerateCompletePaths(caseConfig: CaseConfig): PathStep[][] {
  const paths: PathStep[][] = [];

  function walk(sceneId: string, prefix: PathStep[]) {
    const scene = caseConfig.scenes[sceneId];
    if (!scene) return;
    for (const option of scene.options) {
      const step: PathStep = {
        sceneId,
        optionKey: option.key,
        posture: option.posture,
        isCompromise: option.isCompromise,
        next: option.next,
      };
      const nextPath = [...prefix, step];
      if (option.next === null) {
        paths.push(nextPath);
      } else {
        walk(option.next, nextPath);
      }
    }
  }

  walk(caseConfig.startScene, []);
  return paths;
}
