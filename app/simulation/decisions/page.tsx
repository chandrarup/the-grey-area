import {
  getDecisions,
  getMessages,
} from "@/lib/db/queries";
import { getScene } from "@/lib/case/registry";
import { requireStudentRun } from "@/lib/simulation/run";
import { enforceStageAccess } from "@/lib/simulation/progress";
import type { RunStageData } from "@/lib/db/schema";
import { DecisionWorkspace } from "./decision-workspace";
import { ReflectionForm } from "./reflection-form";

export default async function DecisionsPage() {
  const { profile, caseConfig, run } = await requireStudentRun();
  const stageData = (run.stageData ?? {}) as RunStageData;
  enforceStageAccess("decisions", stageData);

  const decisions = await getDecisions(profile, run.id);
  const messages = await getMessages(profile, run.id);

  const isComplete =
    run.status === "submitted" ||
    run.status === "graded" ||
    run.currentSceneId === null;

  if (isComplete && !stageData.reflections?.length) {
    return (
      <ReflectionForm
        runId={run.id}
        questions={caseConfig.reflectionQuestions}
      />
    );
  }

  if (isComplete) {
    return (
      <div className="border-l-2 border-accent bg-surface px-6 py-5">
        <p className="text-sm font-medium text-foreground">
          All five decisions are complete.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Your reflections are submitted. Continue to debrief when your
          professor releases feedback.
        </p>
        <a
          href="/simulation/debrief"
          className="mt-6 inline-block bg-accent px-6 py-3 text-sm font-medium text-accent-foreground"
        >
          Go to debrief
        </a>
      </div>
    );
  }

  const sceneId = run.currentSceneId ?? caseConfig.startScene;
  const scene = getScene(caseConfig, sceneId);
  const sceneMessages = messages.filter((m) => m.sceneId === sceneId);
  const needsProps =
    Boolean(scene.props?.length) &&
    !stageData.propsAcknowledged &&
    decisions.length === 0;

  return (
    <DecisionWorkspace
      runId={run.id}
      caseSlug={caseConfig.slug}
      caseTitle={caseConfig.title}
      cast={caseConfig.cast}
      scene={scene}
      integrity={run.integrity ?? "clean"}
      depth={run.depth ?? 1}
      maxDepth={caseConfig.maxDepth}
      priorDecisions={decisions.map((d) => ({
        sceneId: d.sceneId,
        choice: d.choice,
        reasoning: d.reasoning ?? "",
      }))}
      initialMessages={sceneMessages.map((m) => ({
        id: m.id,
        sender: m.sender,
        castId: m.castId,
        content: m.content,
      }))}
      needsProps={needsProps}
      props={scene.props ?? []}
    />
  );
}
