// A deliberately small subset of JSON Schema — enough to describe the flat,
// mostly-scalar shapes the decision engine needs back from a model. Extend
// as real case schemas demand more (nested objects, arrays of objects, etc.)
export type JSONSchemaType = "string" | "number" | "integer" | "boolean" | "array" | "object";

export type JSONSchema = {
  type: JSONSchemaType;
  description?: string;
  enum?: Array<string | number>;
  items?: JSONSchema;
  properties?: Record<string, JSONSchema>;
  required?: string[];
  additionalProperties?: boolean;
};

export type LLMMessage = {
  role: "user" | "assistant";
  content: string;
};

export type LLMRequest = {
  /** Registry id from models.ts, e.g. "claude-haiku". */
  model: string;
  system?: string;
  messages: LLMMessage[];
  /** The JSON shape every provider must return, normalized to this schema. */
  schema: JSONSchema;
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
  /** Always the parsed JSON object matching `schema`, regardless of provider. */
  data: T;
  raw?: unknown;
  usage?: LLMUsage;
  provider: string;
  model: string;
};
