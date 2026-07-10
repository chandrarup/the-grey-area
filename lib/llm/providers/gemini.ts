import { GoogleGenAI } from "@google/genai";
import { LLMConfigError, LLMProviderError, LLMValidationError } from "../errors";
import type { LLMRequest, LLMResponse } from "../types";
import { parseAndValidate } from "../validate";

export async function completeWithGemini(
  req: LLMRequest,
  providerModel: string,
): Promise<LLMResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new LLMConfigError("GEMINI_API_KEY is not set. Add it to .env.local.");
  }

  const client = new GoogleGenAI({ apiKey });

  // Gemini has no separate "assistant" message list — history is folded
  // into `contents`, and system instructions are their own config field.
  const contents = req.messages.map((m) => ({
    role: m.role === "assistant" ? ("model" as const) : ("user" as const),
    parts: [{ text: m.content }],
  }));

  let response;
  try {
    response = await client.models.generateContent({
      model: providerModel,
      contents,
      config: {
        systemInstruction: req.system,
        temperature: req.temperature,
        maxOutputTokens: req.maxTokens,
        responseMimeType: "application/json",
        responseJsonSchema: req.schema,
      },
    });
  } catch (cause) {
    throw new LLMProviderError(`Gemini request failed: ${(cause as Error).message}`, cause);
  }

  if (!response.text) {
    throw new LLMValidationError("Gemini response contained no text", response);
  }

  const data = parseAndValidate(response.text, req.schema);

  return {
    data,
    raw: response,
    usage: {
      inputTokens: response.usageMetadata?.promptTokenCount,
      outputTokens: response.usageMetadata?.candidatesTokenCount,
    },
    provider: "gemini",
    model: providerModel,
  };
}
