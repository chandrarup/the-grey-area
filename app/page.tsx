import Link from "next/link";
import { redirect } from "next/navigation";
import { ThemeToggle } from "@/app/components/theme-toggle";
import { BrandLockup } from "@/app/components/brand-mark";
import { LandingStakesPanel } from "@/app/components/landing-stakes-panel";
import { LandingCtas } from "@/app/components/landing-ctas";
import { isDevIdentityEnabled } from "@/lib/auth/role-guard";

const STEPS = [
  {
    n: "01",
    title: "Read the situation",
    body: "Step into a company under pressure. Brief yourself before the room opens.",
  },
  {
    n: "02",
    title: "Make the calls",
    body: "Decide under time and conflicting advice — alone with AI, or with your peers.",
  },
  {
    n: "03",
    title: "See what they cost",
    body: "Get clear feedback on patterns, blind spots, and what the path revealed.",
  },
] as const;

/**
 * Product front door. Invite links (?join=) never see this page.
 */
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ join?: string }>;
}) {
  const { join } = await searchParams;
  if (join?.trim()) {
    const token = join.trim();
    redirect(`/group/open?token=${encodeURIComponent(token)}`);
  }

  const showDevHint = isDevIdentityEnabled();

  return (
    <div className="relative flex min-h-full flex-col">
      <header className="mx-auto flex w-full max-w-[85rem] items-center justify-between px-7 py-5 md:px-8">
        <BrandLockup size="sm" />
        <ThemeToggle />
      </header>

      <main className="mx-auto flex w-full max-w-[85rem] flex-1 flex-col px-7 md:px-8">
        <section className="grid min-h-[calc(100vh-4.5rem)] grid-cols-1 items-center gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-[4.5rem]">
          <div className="flex flex-col gap-7 py-16 lg:py-20">
            <p className="m-0 font-mono text-[11px] uppercase tracking-[0.22em] text-accent">
              Stage 1 · Transformational Ethics Experience
            </p>
            <h1 className="m-0 font-serif text-[clamp(2.75rem,6vw,4.75rem)] font-medium leading-[1.02] tracking-tight text-foreground">
              The Cost of Winning
            </h1>
            <p className="m-0 max-w-[46ch] font-serif text-xl leading-relaxed text-foreground">
              You are three weeks into the top job when a contract worth more
              than the company arrives with a condition nobody will put in
              writing.
            </p>
            <p className="m-0 max-w-[52ch] text-[14.5px] leading-relaxed text-muted-foreground">
              A live executive ethics simulation. Play solo against AI
              executives, or take a seat in a five-person leadership meeting.
              30–40 minutes. Your reasoning is assessed, not your answer.
            </p>
            <LandingCtas />
          </div>

          <div className="flex items-center justify-center border-border py-16 lg:border-l lg:py-20 lg:pl-[4.5rem]">
            <LandingStakesPanel />
          </div>
        </section>

        <section className="border-t border-border">
          <div className="flex flex-col gap-12 py-20 md:py-24">
            <p className="m-0 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              How it works
            </p>
            <div className="grid border-t border-border sm:grid-cols-3">
              {STEPS.map((step, i) => (
                <article
                  key={step.n}
                  className={`flex flex-col items-center gap-3.5 px-6 py-10 text-center sm:px-10 ${
                    i < STEPS.length - 1 ? "sm:border-r sm:border-border" : ""
                  }`}
                >
                  <p className="m-0 font-mono text-xs text-accent">{step.n}</p>
                  <h2 className="m-0 font-serif text-2xl font-medium leading-snug text-foreground">
                    {step.title}
                  </h2>
                  <p className="m-0 max-w-[34ch] text-sm leading-relaxed text-muted-foreground">
                    {step.body}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {showDevHint ? (
          <p className="pb-16 text-center font-mono text-[11px] text-muted-foreground">
            Dev identity is on.{" "}
            <Link href="/dev/identity" className="underline underline-offset-2">
              Profile picker
            </Link>
          </p>
        ) : null}
      </main>
    </div>
  );
}
