import { createGoogle } from "@ai-sdk/google";
import { generateSpeech } from "ai";
import { LLMConfigError, LLMProviderError } from "./errors";

/** Gemini prebuilt voices — distinct per seat for the boardroom cast. */
export const GEMINI_CAST_VOICES: Record<string, string> = {
  marcus: "Charon",
  david: "Fenrir",
  tom: "Orus",
  priya: "Aoede",
  eleanor: "Leda",
  narrator: "Kore",
};

const MODEL = "gemini-2.5-flash-preview-tts" as const;

export type SpeechAudio = {
  bytes: Uint8Array;
  mediaType: string;
  voice: string;
};

/**
 * Server-side TTS for the boardroom. Uses Gemini (GEMINI_API_KEY) so dialogue
 * does not depend on the fragile in-browser HeadTTS CDN/WebGPU path.
 */
export async function synthesizeCastSpeech(
  castId: string,
  text: string,
): Promise<SpeechAudio> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new LLMConfigError(
      "GEMINI_API_KEY is not set. Add it to .env.local for boardroom voices.",
    );
  }
  const voice = GEMINI_CAST_VOICES[castId] ?? GEMINI_CAST_VOICES.narrator;
  const google = createGoogle({ apiKey });
  try {
    const result = await generateSpeech({
      model: google.speech(MODEL),
      text,
      voice,
    });
    return {
      bytes: result.audio.uint8Array,
      mediaType: result.audio.mediaType || "audio/wav",
      voice,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new LLMProviderError(`Gemini TTS failed: ${message}`);
  }
}
