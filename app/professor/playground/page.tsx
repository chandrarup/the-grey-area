import { getProfessorActor } from "@/lib/mode";
import { PlaygroundClient } from "./playground-client";

export default async function PlaygroundPage() {
  await getProfessorActor();
  return <PlaygroundClient />;
}
