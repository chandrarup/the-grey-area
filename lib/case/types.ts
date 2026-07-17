export type Posture = "restrictive" | "cautious" | "permissive";

export type CastMember = {
  id: string; // "marcus" | "david" | "priya" | "tom" | "eleanor"
  name: string; // "Marcus Reed"
  role: string; // "Executive Vice President, International Development"
  persona: string; // full system message
  location?: string; // "Ardania · 3:12 AM"
  isNight?: boolean;
};

export type Consequence = {
  headline: string;
  narrative: string;
  beats: { speaker: string; line: string }[];
};

export type DecisionOption = {
  key: string;
  label: string;
  posture: Posture;
  isCompromise: boolean; // drives the integrity latch
  next: string | null; // null = run ends after this option
  consequence?: Consequence; // required when next !== null
};

export type Scene = {
  id: string;
  depth: number; // 1..5
  title: string;
  timeLabel: string;
  brief: string;
  cast: string[]; // CastMember ids present
  opening: { castId: string; text: string };
  minExchanges: number;
  sceneDirective?: string; // extra staging instructions for the scene director
  commitPrompt: string;
  commitPrefill?: string;
  options: DecisionOption[];
};

export type BriefingPage = { title: string; body: string }; // body is markdown

export type ScoringArea = { key: string; label: string };

export type CaseConfig = {
  slug: string;
  title: string;
  startScene: string;
  maxDepth: number;
  globalSystemPrompt: string;
  briefingPages: BriefingPage[];
  cast: CastMember[];
  scenes: Record<string, Scene>;
  reflectionQuestions: string[];
  rubric: { instructions: string; scoringAreas: ScoringArea[] };
};
