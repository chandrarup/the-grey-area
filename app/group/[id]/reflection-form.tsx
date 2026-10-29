"use client";

import { useRouter } from "next/navigation";
import { ReflectionForm } from "@/app/components/reflection-form";
import { saveGroupReflectionsAction } from "@/app/group/actions";

export function GroupReflectionForm({
  sessionId,
  participantId,
  joinToken,
  questions,
}: {
  sessionId: string;
  participantId: string;
  joinToken: string;
  questions: string[];
}) {
  const router = useRouter();

  return (
    <ReflectionForm
      questions={questions}
      subtitle="Answer these before your group debrief is prepared. Feedback stays hidden until your professor releases it."
      onSubmit={async (answers) => {
        await saveGroupReflectionsAction({
          sessionId,
          participantId,
          joinToken,
          reflections: answers,
        });
        router.refresh();
      }}
    />
  );
}
