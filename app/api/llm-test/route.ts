import { NextResponse } from "next/server";
import { complete } from "@/lib/llm/complete";
import { LLMConfigError, LLMProviderError, LLMValidationError } from "@/lib/llm/errors";
import type { JSONSchema } from "@/lib/llm/types";

const SCHEMA: JSONSchema = {
  type: "object",
  properties: {
    character: { type: "string" },
    line: { type: "string" },
    ready_to_commit: { type: "boolean" },
  },
  required: ["character", "line", "ready_to_commit"],
  additionalProperties: false,
};

export async function GET(request: Request) {
  const model = new URL(request.url).searchParams.get("model");
  if (!model) {
    return NextResponse.json({ error: "Missing required ?model= query param" }, { status: 400 });
  }

  try {
    const result = await complete({
      model,
      schemaName: "scene_line",
      system: "You are Marcus Webb, a smooth corporate EVP. Reply in character.",
      messages: [
        {
          role: "user",
          content:
            "Convince me in one sentence to hire your consultant, then set ready_to_commit true.",
        },
      ],
      schema: SCHEMA,
    });

    return NextResponse.json({
      provider: result.provider,
      model: result.model,
      data: result.data,
      usage: result.usage,
    });
  } catch (error) {
    if (error instanceof LLMConfigError) {
      return NextResponse.json({ error: "config", message: error.message }, { status: 400 });
    }
    if (error instanceof LLMValidationError) {
      return NextResponse.json({ error: "validation", message: error.message }, { status: 502 });
    }
    if (error instanceof LLMProviderError) {
      return NextResponse.json({ error: "provider", message: error.message }, { status: 502 });
    }
    throw error;
  }
}
