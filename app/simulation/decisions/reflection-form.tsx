"use client";

import { useRouter } from "next/navigation";
import { saveReflections } from "../actions";
import { stagePath } from "../stages";
import { ReflectionForm } from "@/app/components/reflection-form";

export function SoloReflectionForm({
  runId,
  questions,
}: {
  runId: string;
  questions: string[];
}) {
  const router = useRouter();

  return (
    <ReflectionForm
      questions={questions}
      onSubmit={async (answers) => {
        await saveReflections(runId, answers);
        router.push(stagePath("debrief"));
      }}
    />
  );
}

/** @deprecated Prefer SoloReflectionForm — kept for existing imports. */
export { SoloReflectionForm as ReflectionForm };
