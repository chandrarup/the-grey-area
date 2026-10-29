import type { CastMember, Consequence, ScriptBeat } from "@/lib/case/types";
import {
  filmClimatePlace,
  type RoomStanceClimate,
} from "@/lib/group/meeting-runtime";
import { storyFrames } from "../stage-story";

export type FilmBeat = Extract<
  ScriptBeat,
  { kind: "setting" } | { kind: "message" } | { kind: "story" }
>;

/** Title card, illustrated story frames, then the characters' messages. */
export function consequenceFilm(
  consequence: Consequence,
  cast: Pick<CastMember, "id" | "name">[],
  /** Presentation-only; never changes which CEO option / scene plays. */
  climate?: RoomStanceClimate | null,
): FilmBeat[] {
  const byName = new Map(cast.map((m) => [m.name, m]));
  return [
    {
      kind: "setting",
      time: consequence.headline,
      place: climate ? filmClimatePlace(climate) : "What happened next",
      text: "",
    },
    ...(consequence.story ?? storyFrames(consequence.narrative)).map(
      (f): FilmBeat => ({
        kind: "story",
        art: f.art,
        text: f.text,
        invoice: f.invoice,
      }),
    ),
    ...consequence.beats.map(
      (b): FilmBeat => ({
        kind: "message",
        channel: "text",
        from: b.speaker,
        castId: byName.get(b.speaker)?.id,
        text: b.line,
      }),
    ),
  ];
}
