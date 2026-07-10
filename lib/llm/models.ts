import { LLMConfigError } from "./errors";

export type Provider = "anthropic" | "openai" | "gemini";

export type ModelDefinition = {
  /** Stable id used everywhere in the app (UI, seed data, professor settings). */
  id: string;
  provider: Provider;
  /** The exact model string the provider's SDK expects. */
  providerModel: string;
  label: string;
};

// Single source of truth for which models exist. The future professor
// settings page reads from this list instead of hardcoding provider ids.
export const MODELS: ModelDefinition[] = [
  {
    id: "claude-haiku",
    provider: "anthropic",
    providerModel: "claude-haiku-4-5-20251001",
    label: "Claude Haiku 4.5",
  },
  {
    id: "gpt-5-mini",
    provider: "openai",
    providerModel: "gpt-5-mini",
    label: "GPT-5 mini",
  },
  {
    id: "gemini-flash",
    provider: "gemini",
    providerModel: "gemini-2.5-flash",
    label: "Gemini 2.5 Flash",
  },
];

export function getModel(id: string): ModelDefinition {
  const model = MODELS.find((entry) => entry.id === id);
  if (!model) {
    const known = MODELS.map((entry) => entry.id).join(", ");
    throw new LLMConfigError(`Unknown model id "${id}". Known ids: ${known}`);
  }
  return model;
}
