import { getProfessorActor } from "@/lib/mode";
import { GradeTranscriptClient } from "./grade-client";

export default async function GradeTranscriptPage() {
  await getProfessorActor();
  return <GradeTranscriptClient />;
}
