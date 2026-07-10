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

// Nested-schema sanity check for the Part A normalizer fix: an object
// property inside an array inside an object. This is the shape most likely
// to trip up OpenAI's strict json_schema mode if additionalProperties:false
// isn't injected at every level, not just the top one.
const NESTED_SCHEMA: JSONSchema = {
  type: "object",
  properties: {
    messages: {
      type: "array",
      items: {
        type: "object",
        properties: {
          cast_id: { type: "string" },
          text: { type: "string" },
        },
        required: ["cast_id", "text"],
      },
    },
    ready_to_commit: { type: "boolean" },
  },
  required: ["messages", "ready_to_commit"],
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const model = url.searchParams.get("model");
  const nested = url.searchParams.get("nested") === "1";
  if (!model) {
    return NextResponse.json({ error: "Missing required ?model= query param" }, { status: 400 });
  }

  try {
    const result = await complete(
      nested
        ? {
            model,
            schemaName: "scene_turn",
            system:
              "You are directing a scene with Marcus Webb (EVP) and Diane Osei (General Counsel).",
            messages: [
              {
                role: "user",
                content:
                  "Webb pushes for the consultant, Osei raises one quiet question. Two messages, then set ready_to_commit true.",
              },
            ],
            schema: NESTED_SCHEMA,
          }
        : {
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
          },
    );

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
