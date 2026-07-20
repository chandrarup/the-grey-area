"use server";

import { z } from "zod";
import { getProfessorActor } from "@/lib/mode";
import { getCase } from "@/lib/case/registry";
import { complete } from "@/lib/llm/complete";
import { DEFAULT_ROLEPLAY_MODEL } from "@/lib/llm/models";
import { getModelPrefs } from "@/lib/model-prefs";

export async function playgroundChat(
  castId: string,
  message: string,
  history: { role: string; text: string }[],
): Promise<string> {
  await getProfessorActor();
  const prefs = await getModelPrefs();
  const caseConfig = getCase("cost-of-winning");
  const member = caseConfig.cast.find((c) => c.id === castId);
  if (!member) throw new Error("Unknown cast member");

  const schema = z.object({ text: z.string() });
  const result = await complete({
    model: prefs.roleplayModel || DEFAULT_ROLEPLAY_MODEL,
    schemaName: "playground_reply",
    system: `${member.persona}\n\nStay in character. Reply in 2-5 sentences.`,
    messages: [
      ...history.map((h) =>
        h.role === "You"
          ? { role: "user" as const, content: h.text }
          : { role: "assistant" as const, content: h.text },
      ),
      { role: "user", content: message },
    ],
    schema,
    temperature: 0.7,
    maxTokens: 400,
  });
  return result.data.text;
}
