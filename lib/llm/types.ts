import type { ZodType } from "zod";

export type LLMMessage = {
  role: "user" | "assistant";
  content: string;
};

export type LLMRequest<T = unknown> = {
  /** Registry id from models.ts, e.g. "claude-haiku". */
  model: string;
  system?: string;
  messages: LLMMessage[];
  /** The shape every provider must return, normalized to this schema by the AI SDK. */
  schema: ZodType<T>;
  /** Name for the schema/tool — required by some providers, cosmetic for others. */
  schemaName?: string;
  temperature?: number;
  maxTokens?: number;
};

export type LLMUsage = {
  inputTokens?: number;
  outputTokens?: number;
};

export type LLMResponse<T = unknown> = {
  /** Always the parsed object matching `schema`, regardless of provider. */
  data: T;
  raw?: unknown;
  usage?: LLMUsage;
  provider: string;
  model: string;
};
