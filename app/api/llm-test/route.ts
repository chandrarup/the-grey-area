import { NextResponse } from "next/server";
import { z } from "zod";
import { complete } from "@/lib/llm/complete";
import { LLMConfigError, LLMProviderError, LLMValidationError } from "@/lib/llm/errors";

const SCHEMA = z.object({
  character: z.string(),
  line: z.string(),
  ready_to_commit: z.boolean(),
});

// Nested-schema sanity check: an object property inside an array inside an
// object. This is the shape the decision engine actually uses, so proving
// it round-trips is the whole point of swapping to the AI SDK.
const NESTED_SCHEMA = z.object({
  messages: z.array(
    z.object({
      cast_id: z.string(),
      text: z.string(),
    }),
  ),
  ready_to_commit: z.boolean(),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const model = url.searchParams.get("model");
  const nested = url.searchParams.get("nested") === "1";
  if (!model) {
    return NextResponse.json({ error: "Missing required ?model= query param" }, { status: 400 });
  }

  try {
    const result = nested
      ? await complete({
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
        })
      : await complete({
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
