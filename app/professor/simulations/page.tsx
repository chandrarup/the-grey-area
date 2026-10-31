import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { listCases } from "@/lib/case/registry";
export default async function SimulationsPage() {
  const profile = await requireStaff();
  const cases = listCases();
  return (
    <div className="mx-auto max-w-6xl px-6 py-12 md:px-10 md:py-16">
      <div className="flex flex-wrap items-end justify-between gap-5 border-b border-border pb-9">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent">
            Your teaching workspace
          </p>
          <h1 className="mt-4 font-serif text-5xl tracking-tight md:text-6xl">
            Simulations
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground">
            A safe place to make difficult calls. Choose a story, bring your
            group into the room, and follow what their decisions set in motion.
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          <p>{profile.name}</p>
          <p className="mt-1 text-[10px] uppercase tracking-widest">
            Administrator
          </p>
        </div>
      </div>
      <div className="mt-7 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {cases.length} available{" "}
          {cases.length === 1 ? "simulation" : "simulations"}
        </span>
        <Link href="/professor" className="text-accent hover:underline">
          Monitor sessions ↗
        </Link>
      </div>
      <div className="mt-5 grid gap-7 lg:grid-cols-[1.65fr_1fr]">
        {cases.map((simulation) => (
          <article
            key={simulation.slug}
            className="overflow-hidden rounded-xl border border-border bg-surface"
          >
            <div className="relative aspect-[1.9] overflow-hidden bg-[#19242a]">
              {/* eslint-disable-next-line @next/next/no-img-element -- local SVG cover */}
              <img
                src="/simulations/cost-of-winning.svg"
                alt="An executive boardroom overlooking the city"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#101a20] via-transparent to-transparent" />
              <span className="absolute left-6 top-5 rounded-full border border-white/20 bg-black/20 px-3 py-1 font-mono text-[9px] uppercase tracking-widest text-white/80">
                Executive leadership
              </span>
              <p className="absolute bottom-5 left-6 font-serif text-3xl text-[#f0dfbe]">
                An $8.4 billion opportunity.
                <br />
                <em>A cost nobody has named.</em>
              </p>
            </div>
            <div className="p-6 md:p-8">
              <h2 className="font-serif text-3xl">{simulation.title}</h2>
              <p className="mt-3 max-w-lg text-sm leading-7 text-muted-foreground">
                A major contract. Conflicting advice. Three decisions that test
                how you lead when commercial pressure and personal integrity
                collide.
              </p>
              <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-muted-foreground">
                <span>{simulation.maxDepth} decisions</span>
                <span>30–40 minutes</span>
                <span>1–5 participants per group</span>
                <span>Browser 3D</span>
              </div>
              <div className="mt-7 flex flex-wrap gap-3 border-t border-border pt-6">
                <Link
                  href="/professor/groups/new-batch"
                  className="rounded-md bg-accent px-5 py-3 text-xs font-medium text-accent-foreground"
                >
                  Create groups
                </Link>
                <Link
                  href="/simulation/leadership-team"
                  className="rounded-md border border-border px-5 py-3 text-xs font-medium hover:bg-background"
                >
                  View as student ↗
                </Link>
                <Link
                  href="/professor"
                  className="px-2 py-3 text-xs text-muted-foreground hover:text-foreground"
                >
                  View sessions
                </Link>
              </div>
            </div>
          </article>
        ))}
        <aside className="flex flex-col gap-6">
          <div className="rounded-xl border border-dashed border-border p-7">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              The next story
            </p>
            <h2 className="mt-5 font-serif text-3xl">Room to grow.</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Future simulations will appear here alongside The Cost of Winning.
              Each will have its own story, choices, and consequences.
            </p>
            <span className="mt-6 inline-block text-xs text-muted-foreground">
              No additional simulations published yet
            </span>
          </div>
          <div className="rounded-xl bg-[#19242a] p-7 text-[#f0ede6]">
            <p className="font-mono text-[10px] uppercase tracking-widest text-[#d3b080]">
              From pressure to reflection
            </p>
            <ol className="mt-6 space-y-6">
              {[
                [
                  "01",
                  "Enter the situation",
                  "Briefings and confidential roles put each person inside the story.",
                ],
                [
                  "02",
                  "Live with the decision",
                  "Choices advance the narrative and reveal their ripple effects.",
                ],
                [
                  "03",
                  "Bring it back to work",
                  "Reflect on the pressures, values, and actions that matter outside the room.",
                ],
              ].map(([n, title, body]) => (
                <li key={n} className="flex gap-4">
                  <span className="pt-1 font-mono text-[10px] text-[#d3b080]">
                    {n}
                  </span>
                  <div>
                    <h3 className="font-serif text-xl">{title}</h3>
                    <p className="mt-1 text-xs leading-6 text-white/55">
                      {body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </div>
    </div>
  );
}
