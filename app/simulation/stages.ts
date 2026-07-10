export type Stage = {
  slug: string;
  label: string;
};

export const STAGES: Stage[] = [
  { slug: "leadership-team", label: "Meet Your Leadership Team" },
  { slug: "read-case", label: "Read the Case" },
  { slug: "values", label: "Your Leadership Values" },
  { slug: "decisions", label: "The Decisions" },
  { slug: "debrief", label: "Debrief" },
];

export function stagePath(slug: string) {
  return `/simulation/${slug}`;
}

export function nextStage(slug: string): Stage | null {
  const index = STAGES.findIndex((stage) => stage.slug === slug);
  if (index === -1 || index === STAGES.length - 1) return null;
  return STAGES[index + 1];
}
