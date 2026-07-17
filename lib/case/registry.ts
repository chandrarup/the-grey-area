import { COST_OF_WINNING } from "./cost-of-winning";
import type { CaseConfig, DecisionOption, Scene } from "./types";

const CASES: Record<string, CaseConfig> = {
  [COST_OF_WINNING.slug]: COST_OF_WINNING,
};

export function getCase(slug: string): CaseConfig {
  const caseConfig = CASES[slug];
  if (!caseConfig) {
    const known = Object.keys(CASES).join(", ") || "(none)";
    throw new Error(`Unknown case slug "${slug}". Known cases: ${known}`);
  }
  return caseConfig;
}

export function getScene(caseConfig: CaseConfig, sceneId: string): Scene {
  const scene = caseConfig.scenes[sceneId];
  if (!scene) {
    throw new Error(
      `Unknown scene "${sceneId}" in case "${caseConfig.slug}"`,
    );
  }
  return scene;
}

export function getOption(
  scene: Scene,
  optionKey: string,
): DecisionOption | undefined {
  return scene.options.find((option) => option.key === optionKey);
}

export function isTerminal(option: DecisionOption): boolean {
  return option.next === null;
}

export function listCases(): CaseConfig[] {
  return Object.values(CASES);
}
