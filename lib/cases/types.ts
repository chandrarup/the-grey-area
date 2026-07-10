export type CastMember = {
  id: string;
  name: string;
  role: string;
  persona: string;
  private_agenda: string;
};

export type DecisionOption = {
  label: string;
  is_compromise: boolean;
};

export type Decision = {
  id: string;
  title: string;
  scenario_setup: string;
  characters_present: string[];
  /** Ordered opening lines delivered as the first bubbles, before the student replies. */
  opening_pressure: { cast_id: string; line: string }[];
  options: DecisionOption[];
  /** Notes for how this decision's pressure should shift based on prior choices. Unused until decisions are chained. */
  adaptation_notes?: string;
  max_turns: number;
};

export type Endings = {
  clean: string;
  compromised: string;
};

export type RubricDimension = {
  id: string;
  label: string;
  description: string;
};

export type Rubric = {
  dimensions: RubricDimension[];
  coach_prompt: string;
};

export type CaseMeta = {
  title: string;
  company: string;
  background: string;
  stakes: string;
};

export type CaseConfig = {
  meta: CaseMeta;
  cast: CastMember[];
  decisions: Decision[];
  endings: Endings;
  rubric: Rubric;
};
