import type { CaseConfig } from "@/lib/case/types";
/** Render only beneath the page's assessment-release gate. Evidence comes from reviewed feedback. */
export function ValuesDebrief({
  values,
  scores,
}: {
  values: CaseConfig["debriefValues"];
  scores: { key: string; rationale?: string }[];
}) {
  if (!values?.length) return null;
  return (
    <section className="mt-10 border-t border-border pt-8">
      <p className="text-xs uppercase tracking-widest text-accent">
        From the story to your work
      </p>
      <h2 className="mt-3 font-serif text-3xl">
        Your decisions and the values at stake
      </h2>
      <p className="mt-3 text-sm leading-7 text-muted-foreground">
        These are the values explored in this case. Read the evidence alongside
        the pressure you experienced, then consider what you would do in your
        own organization.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {values.map((value) => {
          const evidence = scores.find(
            (s) => s.key === value.scoringKey,
          )?.rationale;
          return (
            <article
              key={value.name}
              className="rounded-lg border border-border bg-surface p-5"
            >
              <h3 className="font-serif text-xl">{value.name}</h3>
              <p className="mt-2 text-xs leading-6 text-muted-foreground">
                {value.description}
              </p>
              <p className="mt-4 border-t border-border pt-4 text-sm leading-6">
                {evidence ||
                  "This assessment does not yet include evidence for this value. Discuss a specific decision with your instructor."}
              </p>
            </article>
          );
        })}
      </div>
      <p className="mt-6 font-serif text-xl leading-relaxed">
        What specific pressures made the shortcut look appealing in the
        moment—and what support would help you respond differently at work?
      </p>
    </section>
  );
}
