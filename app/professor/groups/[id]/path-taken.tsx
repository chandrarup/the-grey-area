import { getCase } from "@/lib/case/registry";

type DecisionRow = {
  id: number;
  sceneId: string;
  optionKey: string | null;
  decision: string;
  reasoning: string;
};

/**
 * Path taken: scene titles + chosen options / reasoning.
 */
export function GroupPathTaken({
  caseSlug,
  decisions,
}: {
  caseSlug: string;
  decisions: DecisionRow[];
}) {
  if (decisions.length === 0) return null;
  const caseConfig = getCase(caseSlug);

  return (
    <section className="mt-10">
      <h2 className="text-sm font-medium text-foreground">Path taken</h2>
      <ol className="mt-3 space-y-3">
        {decisions.map((d, i) => {
          const scene = caseConfig.scenes[d.sceneId];
          const option = scene?.options.find((o) => o.key === d.optionKey);
          return (
            <li key={d.id} className="border border-border px-3 py-3 text-sm">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Decision {i + 1}
                {scene?.depth ? ` · depth ${scene.depth}` : ""}
              </p>
              <p className="mt-1 font-medium text-foreground">
                {scene?.title ?? d.sceneId}
              </p>
              {scene?.timeLabel ? (
                <p className="text-xs text-muted-foreground">{scene.timeLabel}</p>
              ) : null}
              <p className="mt-2 text-foreground">
                {option?.label ?? d.decision}
              </p>
              {d.reasoning ? (
                <p className="mt-1 text-muted-foreground">{d.reasoning}</p>
              ) : null}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
