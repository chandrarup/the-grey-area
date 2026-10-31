import { resolveSeatFromRequest } from "@/lib/group/seat-auth";
import { getCurrentProfile } from "@/lib/auth";
import { NextResponse } from "next/server";
import {
  LLMConfigError,
  LLMProviderError,
} from "@/lib/llm/errors";
import { synthesizeCastSpeech } from "@/lib/llm/speech";

type Body = {
  castId?: string;
  text?: string;
};

/**
 * Boardroom TTS. Returns WAV/audio bytes for a cast line.
 * Auth is intentionally light (same as other student simulation routes today).
 */
export async function POST(request: Request) {
  if (!await getCurrentProfile() && !await resolveSeatFromRequest(request)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const castId = body.castId?.trim() || "narrator";
  const text = body.text?.replace(/\s+/g, " ").trim() ?? "";
  if (!text || text.length > 2000) {
    return NextResponse.json(
      { error: "text required (1–2000 chars)" },
      { status: 400 },
    );
  }

  try {
    const audio = await synthesizeCastSpeech(castId, text);
    return new NextResponse(Buffer.from(audio.bytes), {
      status: 200,
      headers: {
        "Content-Type": audio.mediaType,
        "Cache-Control": "no-store",
        "X-Voice": audio.voice,
      },
    });
  } catch (err) {
    if (err instanceof LLMConfigError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    if (err instanceof LLMProviderError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    const message = err instanceof Error ? err.message : "TTS failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
