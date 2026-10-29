/** Grey-area path at a checkpoint — user-facing framing, not a scored “correct” answer. */
export type Posture = "compliant" | "shortcut" | "bystander";

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
  /** Narrative split into illustrated frames for the solo replay. */
  story?: StoryFrame[];
  beats: { speaker: string; line: string }[];
};

export type DecisionOption = {
  key: string;
  label: string;
  posture: Posture;
  isCompromise: boolean; // drives the integrity latch
  next: string | null; // null = run ends after this option
  consequence?: Consequence; // required for every option (incl. terminal film)
};

export type SceneProp = {
  key: string;
  title: string;
  subtitle: string;
  hot: boolean;
  body: string;
};

/**
 * Authored beats for the solo player. Played one at a time, in order.
 * `moment` beats are where the CEO responds; suggested responses never
 * replace free input, and none is marked as preferred.
 */
export type StageMood = "morning" | "evening" | "night";

export type StoryArt =
  | "invoice"
  | "stamp"
  | "press"
  | "regulator"
  | "ledger"
  | "handshake"
  | "phone"
  | "board"
  | "gap"
  | "distant"
  | "skyline"
  | "door"
  | "hourglass"
  | "network"
  | "voices"
  | "pen";

export type Invoice = {
  vendor: string;
  vendorAddress: string;
  number: string;
  date: string;
  billTo: string;
  currency: string;
  items: { description: string; amount: number }[];
  terms: string;
  bank: string;
  stamp?: string;
  sticky?: string;
};

export type StoryFrame = { art: StoryArt; text: string; invoice?: Invoice };

export type ScriptBeat =
  | {
      kind: "setting";
      time: string;
      place: string;
      text: string;
      mood?: StageMood;
    }
  | {
      kind: "call";
      from: string;
      castId?: string;
      detail: string;
      connected: string;
    }
  | {
      kind: "narration";
      text: string;
      act?: {
        castId: string;
        action: "write" | "lean" | "phone" | "nod" | "shake" | "lookDown";
      };
    }
  | { kind: "story"; art: StoryArt; text: string; invoice?: Invoice }
  | { kind: "line"; castId: string; text: string }
  | { kind: "chat"; castId: string; text: string }
  | {
      kind: "message";
      channel: "text" | "email" | "news";
      from: string;
      castId?: string;
      meta?: string;
      subject?: string;
      text: string;
    }
  | { kind: "document"; title: string; subtitle?: string; body: string }
  | { kind: "invoice"; invoice: Invoice }
  | { kind: "desk"; text: string }
  | {
      kind: "moment";
      prompt: string;
      seconds?: number;
      responses: { key: string; say: string; reaction: ScriptBeat[] }[];
      silence?: ScriptBeat[];
    };

export type Scene = {
  id: string;
  depth: number; // 1..maxDepth (this case: 3)
  title: string;
  timeLabel: string;
  brief: string;
  cast: string[]; // CastMember ids present
  opening: { castId: string; text: string };
  minExchanges: number;
  props?: SceneProp[];
  sceneDirective?: string; // extra staging instructions for the scene director
  script?: ScriptBeat[];
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
