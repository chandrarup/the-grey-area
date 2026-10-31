import type { CaseConfig } from "@/lib/case/types";
import { ValuesDebrief } from "./values-debrief";
export type DebriefDecision = { sceneId: string; optionKey?: string | null; choice: string; reasoning?: string | null };
export type DebriefFeedback = {
  summary?: string; letter?: string; strengths?: string[]; growth?: string[];
  practices?: string[]; evidence?: string[];
  scores?: {key:string;label?:string;score?:number;rationale?:string}[];
};
/** Caller MUST verify release before supplying assessment data. Shared by solo and group. */
export function LearningDebrief({ caseConfig, decisions, feedback, notes, group = false }: {
  caseConfig: CaseConfig; decisions: DebriefDecision[]; feedback: DebriefFeedback; notes?: string | null; group?: boolean;
}) {
  const scores = feedback.scores ?? [];
  return <article className="mx-auto max-w-5xl pb-16">
    <header className="border-b border-border pb-9">
      <p className="font-mono text-[10px] uppercase tracking-[.22em] text-accent">{caseConfig.title} · {group ? "Group learning debrief" : "Your learning debrief"}</p>
      <h1 className="mt-4 max-w-2xl font-serif text-4xl leading-tight md:text-5xl">The decision ends.<br/><span className="text-muted-foreground">The learning comes with you.</span></h1>
      <p className="mt-5 max-w-2xl text-sm leading-7 text-muted-foreground">Revisit the pressure, follow the effects of your choices, and choose one response to practise at work. This feedback concerns what happened in the simulation, not your character.</p>
      <nav aria-label="Debrief sections" className="mt-6 flex flex-wrap gap-4 text-xs text-accent"><a href="#your-path">Your path</a><a href="#coaching">Coaching</a><a href="#values">Values</a><a href="#next-time">Next time</a></nav>
    </header>
    {feedback.summary ? <p className="mt-8 max-w-3xl font-serif text-xl leading-relaxed">{feedback.summary}</p> : null}
    <section id="your-path" className="scroll-mt-8 pt-10">
      <p className="font-mono text-[10px] uppercase tracking-widest text-accent">01 · What happened</p>
      <h2 className="mt-2 font-serif text-3xl">Follow your decisions</h2>
      <div className="mt-5 space-y-4">{decisions.map((decision,index) => {
        const scene=caseConfig.scenes[decision.sceneId];
        const option=scene?.options.find(o=>o.key===decision.optionKey);
        const frames=option?.consequence?.story;
        return <section key={`${decision.sceneId}-${index}`} className="rounded-xl border border-border bg-surface p-5 md:p-7">
          <div className="flex gap-4"><span className="font-mono text-xs text-accent">{String(index+1).padStart(2,"0")}</span><div className="min-w-0 flex-1">
            <h3 className="font-serif text-2xl">{scene?.title ?? "Decision"}</h3>
            <p className="mt-2 text-sm font-medium">{decision.choice}</p>
            {decision.reasoning ? <details className="mt-3 text-xs text-muted-foreground"><summary className="cursor-pointer text-accent">Your reasoning, in your words</summary><p className="mt-2 whitespace-pre-wrap leading-6">{decision.reasoning}</p></details> : null}
            {option?.consequence ? <div className="mt-4 grid gap-4 border-t border-border pt-4 md:grid-cols-2"><div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">What followed · {option.consequence.headline}</p><p className="mt-2 text-sm leading-6">{frames?.[0]?.text ?? option.consequence.narrative}</p></div><div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Who felt the effect</p><p className="mt-2 text-sm leading-6">{frames?.[frames.length-1]?.text ?? "Discuss who carried the effects of this decision."}</p></div></div> : <p className="mt-4 text-sm text-muted-foreground">Discuss the observed effects of this custom decision with your instructor.</p>}
          </div></div>
        </section>;
      })}</div>
    </section>
    <section id="coaching" className="scroll-mt-8 pt-12">
      <p className="font-mono text-[10px] uppercase tracking-widest text-accent">02 · What to notice</p><h2 className="mt-2 font-serif text-3xl">A coach’s perspective</h2>
      {feedback.letter ? <p className="mt-5 whitespace-pre-wrap border-l-2 border-accent bg-surface p-6 text-sm leading-7">{feedback.letter}</p> : null}
      <div className="mt-5 grid gap-5 md:grid-cols-2">{[["Keep doing",feedback.strengths],["Try differently",feedback.growth]].map(([title,items])=><section key={title as string} className="rounded-xl border border-border p-6"><h3 className="font-serif text-xl">{title as string}</h3><ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">{(items as string[] | undefined)?.map((item,i)=><li key={i} className="border-t border-border pt-3">{item}</li>)}</ul></section>)}</div>
      {notes ? <aside className="mt-5 rounded-xl border border-accent/30 bg-surface p-6"><h3 className="font-serif text-xl">Your instructor’s note</h3><p className="mt-3 whitespace-pre-wrap text-sm leading-7">{notes}</p></aside> : null}
    </section>
    <div id="values" className="scroll-mt-8"><ValuesDebrief values={caseConfig.debriefValues} scores={scores}/></div>
    <section id="next-time" className="mt-10 scroll-mt-8 rounded-xl bg-[#19242a] p-7 text-[#f0ede6] md:p-9">
      <p className="font-mono text-[10px] uppercase tracking-widest text-[#d3b080]">03 · Take it into work</p><h2 className="mt-3 font-serif text-3xl">Make one response easier next time.</h2>
      <ul className="mt-5 space-y-3 text-sm leading-7">{feedback.practices?.map((item,i)=><li key={i}>{item}</li>)}</ul>
      <p className="mt-5 border-t border-white/15 pt-5 text-sm leading-7 text-white/70">Finish this sentence with your instructor or team:<br/><em>“When I feel pressure to ___, I will ___ before deciding, and ask ___ for support.”</em></p>
    </section>
    <details className="mt-8 rounded-xl border border-border p-6"><summary className="cursor-pointer text-sm font-medium">Explore the supporting evidence and dimension scores</summary><p className="mt-4 text-xs leading-6 text-muted-foreground">Scores describe the evidence in this exercise. They are prompts for discussion, not a verdict on professional suitability.</p>
      <div className="mt-4 divide-y divide-border">{scores.map(s=><div key={s.key} className="py-4"><div className="flex justify-between gap-4 text-sm"><span>{s.label ?? s.key.replaceAll('_',' ')}</span>{typeof s.score === 'number' ? <span className="font-mono text-accent">{s.score}/10</span>:null}</div><p className="mt-2 text-sm leading-6 text-muted-foreground">{s.rationale ?? "Evidence was not supplied for this dimension."}</p></div>)}</div>
      {feedback.evidence?.length ? <ul className="mt-5 list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground">{feedback.evidence.map((item,i)=><li key={i}>{item}</li>)}</ul> : null}
    </details>
  </article>;
}
