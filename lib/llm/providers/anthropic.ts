import Anthropic from "@anthropic-ai/sdk";
import { LLMConfigError, LLMProviderError, LLMValidationError } from "../errors";
import type { LLMRequest, LLMResponse } from "../types";
import { assertMatchesSchema } from "../validate";

// Anthropic has no dedicated "structured output" mode — we force it by
// requiring the model to call a single tool whose input_schema is exactly
// the schema we want back, then read `data` off that tool call's input.
export async function completeWithAnthropic(
  req: LLMRequest,
  providerModel: string,
): Promise<LLMResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new LLMConfigError("ANTHROPIC_API_KEY is not set. Add it to .env.local.");
  }

  const client = new Anthropic({ apiKey });
  const toolName = req.schemaName ?? "respond";

  let message;
  try {
    message = await client.messages.create({
      model: providerModel,
      max_tokens: req.maxTokens ?? 1024,
      temperature: req.temperature,
      system: req.system,
      messages: req.messages.map((m) => ({ role: m.role, content: m.content })),
      tools: [
        {
          name: toolName,
          description: `Return the response in the required shape for ${toolName}.`,
          input_schema: req.schema as Anthropic.Tool.InputSchema,
        },
      ],
      tool_choice: { type: "tool", name: toolName, disable_parallel_tool_use: true },
    });
  } catch (cause) {
    throw new LLMProviderError(`Anthropic request failed: ${(cause as Error).message}`, cause);
  }

  const toolUse = message.content.find((block) => block.type === "tool_use");
  if (!toolUse) {
    throw new LLMValidationError("Anthropic response contained no tool_use block", message);
  }

  assertMatchesSchema(toolUse.input, req.schema);

  return {
    data: toolUse.input,
    raw: message,
    usage: {
      inputTokens: message.usage.input_tokens,
      outputTokens: message.usage.output_tokens,
    },
    provider: "anthropic",
    model: providerModel,
  };
}
