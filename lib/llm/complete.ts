import { getModel } from "./models";
import { completeWithAnthropic } from "./providers/anthropic";
import { completeWithOpenAI } from "./providers/openai";
import { completeWithGemini } from "./providers/gemini";
import type { LLMRequest, LLMResponse } from "./types";

/**
 * Single entry point for every LLM call in the app. Looks up `req.model` in
 * the registry, routes to the matching provider adapter, and always returns
 * `data` parsed and validated against `req.schema` — callers never touch a
 * provider SDK directly or branch on which provider ran.
 */
export async function complete(req: LLMRequest): Promise<LLMResponse> {
  const model = getModel(req.model);

  switch (model.provider) {
    case "anthropic":
      return completeWithAnthropic(req, model.providerModel);
    case "openai":
      return completeWithOpenAI(req, model.providerModel);
    case "gemini":
      return completeWithGemini(req, model.providerModel);
  }
}
