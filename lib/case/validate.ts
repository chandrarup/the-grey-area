import { listCases } from "./registry";
import type { CaseConfig } from "./types";

type ValidationResult = {
  slug: string;
  sceneCount: number;
  scenesPerDepth: Record<number, number>;
  reachableCount: number;
  pathCount: number;
  errors: string[];
};

function castIds(caseConfig: CaseConfig): Set<string> {
  return new Set(caseConfig.cast.map((member) => member.id));
}

function reachableScenes(caseConfig: CaseConfig): Set<string> {
  const reachable = new Set<string>();
  const queue = [caseConfig.startScene];

  while (queue.length > 0) {
    const sceneId = queue.shift()!;
    if (reachable.has(sceneId)) continue;
    reachable.add(sceneId);

    const scene = caseConfig.scenes[sceneId];
    if (!scene) continue;

    for (const option of scene.options) {
      if (option.next !== null) {
        queue.push(option.next);
      }
    }
  }

  return reachable;
}

function countCompletePaths(
  caseConfig: CaseConfig,
  sceneId: string,
  depthSoFar: number,
  errors: string[],
  pathPrefix: string,
): number {
  const scene = caseConfig.scenes[sceneId];
  if (!scene) {
    errors.push(`Path ${pathPrefix} references missing scene "${sceneId}"`);
    return 0;
  }

  const expectedDepth = depthSoFar + 1;
  if (scene.depth !== expectedDepth) {
    errors.push(
      `Scene "${sceneId}" has depth ${scene.depth} but was reached at depth ${expectedDepth}`,
    );
  }

  let paths = 0;
  for (const option of scene.options) {
    const step = `${pathPrefix}/${sceneId}:${option.key}`;
    if (option.next === null) {
      if (expectedDepth !== caseConfig.maxDepth) {
        errors.push(
          `Terminal option "${option.key}" on "${sceneId}" ends at depth ${expectedDepth}, expected ${caseConfig.maxDepth}`,
        );
      }
      paths += 1;
    } else {
      if (expectedDepth >= caseConfig.maxDepth) {
        errors.push(
          `Non-terminal option "${option.key}" on "${sceneId}" continues past maxDepth ${caseConfig.maxDepth}`,
        );
      }
      paths += countCompletePaths(
        caseConfig,
        option.next,
        expectedDepth,
        errors,
        step,
      );
    }
  }
  return paths;
}

function validateCase(caseConfig: CaseConfig): ValidationResult {
  const errors: string[] = [];
  const knownCast = castIds(caseConfig);
  const scenes = Object.values(caseConfig.scenes);
  const sceneIds = new Set(Object.keys(caseConfig.scenes));

  if (!sceneIds.has(caseConfig.startScene)) {
    errors.push(
      `startScene "${caseConfig.startScene}" does not exist in scenes`,
    );
  }

  const scenesPerDepth: Record<number, number> = {};
  for (const scene of scenes) {
    scenesPerDepth[scene.depth] = (scenesPerDepth[scene.depth] ?? 0) + 1;

    for (const castId of scene.cast) {
      if (!knownCast.has(castId)) {
        errors.push(
          `Scene "${scene.id}" references unknown cast id "${castId}"`,
        );
      }
    }

    if (!knownCast.has(scene.opening.castId)) {
      errors.push(
        `Scene "${scene.id}" opening.castId "${scene.opening.castId}" is not in cast`,
      );
    } else if (!scene.cast.includes(scene.opening.castId)) {
      errors.push(
        `Scene "${scene.id}" opening.castId "${scene.opening.castId}" is not in scene.cast`,
      );
    }

    for (const option of scene.options) {
      if (option.next === null) {
        continue;
      }
      if (!sceneIds.has(option.next)) {
        errors.push(
          `Option "${option.key}" on "${scene.id}" next="${option.next}" is not an existing scene`,
        );
      }
      if (!option.consequence) {
        errors.push(
          `Non-terminal option "${option.key}" on "${scene.id}" is missing consequence`,
        );
      }
    }
  }

  const reachable = reachableScenes(caseConfig);
  for (const sceneId of sceneIds) {
    if (!reachable.has(sceneId)) {
      errors.push(`Scene "${sceneId}" is unreachable from startScene`);
    }
  }

  const pathCount =
    sceneIds.has(caseConfig.startScene)
      ? countCompletePaths(caseConfig, caseConfig.startScene, 0, errors, "")
      : 0;

  return {
    slug: caseConfig.slug,
    sceneCount: scenes.length,
    scenesPerDepth,
    reachableCount: reachable.size,
    pathCount,
    errors,
  };
}

function formatDepthMap(map: Record<number, number>): string {
  const entries = Object.keys(map)
    .map(Number)
    .sort((a, b) => a - b)
    .map((depth) => `${depth}:${map[depth]}`);
  return `{${entries.join(", ")}}`;
}

function main(): void {
  const results = listCases().map(validateCase);
  let failed = false;

  for (const result of results) {
    console.log(`Case: ${result.slug}`);
    console.log(`  scene count: ${result.sceneCount}`);
    console.log(`  scenes per depth: ${formatDepthMap(result.scenesPerDepth)}`);
    console.log(`  reachable count: ${result.reachableCount}`);
    console.log(`  path count: ${result.pathCount}`);

    if (result.errors.length > 0) {
      failed = true;
      console.error(`  ERRORS (${result.errors.length}):`);
      for (const error of result.errors) {
        console.error(`    - ${error}`);
      }
    } else {
      console.log("  errors: 0");
    }
  }

  if (results.length === 0) {
    console.error("No cases registered.");
    process.exit(1);
  }

  if (failed) {
    process.exit(1);
  }
}

main();
