import OpenAI from "openai";
import { LLMConfigError, LLMProviderError } from "../errors";
import type { LLMRequest, LLMResponse } from "../types";
import { parseAndValidate } from "../validate";

export async function completeWithOpenAI(
  req: LLMRequest,
  providerModel: string,
): Promise<LLMResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new LLMConfigError("OPENAI_API_KEY is not set. Add it to .env.local.");
  }

  const client = new OpenAI({ apiKey });
  const schemaName = req.schemaName ?? "respond";

  const input = [
    ...(req.system ? [{ role: "system" as const, content: req.system }] : []),
    ...req.messages,
  ];

  let response;
  try {
    response = await client.responses.create({
      model: providerModel,
      input,
      temperature: req.temperature,
      max_output_tokens: req.maxTokens,
      text: {
        format: {
          type: "json_schema",
          name: schemaName,
          strict: true,
          schema: { ...req.schema, additionalProperties: false },
        },
      },
    });
  } catch (cause) {
    throw new LLMProviderError(`OpenAI request failed: ${(cause as Error).message}`, cause);
  }

  const data = parseAndValidate(response.output_text, req.schema);

  return {
    data,
    raw: response,
    usage: {
      inputTokens: response.usage?.input_tokens,
      outputTokens: response.usage?.output_tokens,
    },
    provider: "openai",
    model: providerModel,
  };
}
