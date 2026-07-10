import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogle } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { generateObject, NoObjectGeneratedError, type LanguageModel } from "ai";
import { LLMConfigError, LLMProviderError, LLMValidationError } from "./errors";
import { getModel, type ModelDefinition } from "./models";
import type { LLMRequest, LLMResponse } from "./types";

// Our own env var names (already in .env.local) rather than each SDK's
// default lookup — Google's default is GOOGLE_GENERATIVE_AI_API_KEY, not
// GEMINI_API_KEY, so we pass apiKey explicitly for all three to stay
// consistent regardless of what a given SDK defaults to.
function resolveLanguageModel(model: ModelDefinition): LanguageModel {
  switch (model.provider) {
    case "anthropic": {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) throw new LLMConfigError("ANTHROPIC_API_KEY is not set. Add it to .env.local.");
      return createAnthropic({ apiKey })(model.providerModel);
    }
    case "openai": {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) throw new LLMConfigError("OPENAI_API_KEY is not set. Add it to .env.local.");
      return createOpenAI({ apiKey })(model.providerModel);
    }
    case "gemini": {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new LLMConfigError("GEMINI_API_KEY is not set. Add it to .env.local.");
      return createGoogle({ apiKey })(model.providerModel);
    }
  }
}

/**
 * Single entry point for every LLM call in the app. Looks up `req.model` in
 * the registry, resolves the matching AI SDK provider, and always returns
 * `data` as a validated object matching `req.schema` — callers never touch
 * a provider SDK directly or branch on which provider ran. All three
 * providers' structured-output quirks (tool-use vs json-schema vs
 * responseSchema, and OpenAI's nested additionalProperties requirement) are
 * handled internally by the AI SDK.
 */
export async function complete<T>(req: LLMRequest<T>): Promise<LLMResponse<T>> {
  const model = getModel(req.model);
  const languageModel = resolveLanguageModel(model);

  try {
    const result = await generateObject({
      model: languageModel,
      schema: req.schema,
      schemaName: req.schemaName,
      system: req.system,
      messages: req.messages,
      temperature: req.temperature,
      maxOutputTokens: req.maxTokens,
    });

    return {
      data: result.object,
      raw: result,
      usage: {
        inputTokens: result.usage.inputTokens,
        outputTokens: result.usage.outputTokens,
      },
      provider: model.provider,
      model: model.providerModel,
    };
  } catch (cause) {
    if (NoObjectGeneratedError.isInstance(cause)) {
      throw new LLMValidationError(`Model did not return a schema-matching object: ${cause.message}`, cause);
    }
    throw new LLMProviderError(`${model.provider} request failed: ${(cause as Error).message}`, cause);
  }
}
