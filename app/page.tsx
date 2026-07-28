import Link from "next/link";
import { redirect } from "next/navigation";
import { enterAsInstructor, enterAsStudent } from "@/app/actions/enter";
import { ThemeToggle } from "@/app/components/theme-toggle";
import { EnterPathButton } from "@/app/components/enter-path-button";
import { isDevIdentityEnabled } from "@/lib/auth/role-guard";

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
    // Auto-seat via open route so invite links re-enter without a blank join form.
    redirect(`/group/open?token=${encodeURIComponent(token)}`);
  }

  const showDevHint = isDevIdentityEnabled();

  return (
    <div className="relative flex min-h-full flex-col">
      {/* Full-bleed atmosphere — muted editorial plane, no stock photo */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute inset-0 bg-background" />
        <div
          className="absolute inset-0 opacity-[0.55] dark:opacity-40"
          style={{
            backgroundImage: `
              radial-gradient(ellipse 90% 60% at 70% -10%, color-mix(in srgb, var(--accent) 22%, transparent), transparent 55%),
              radial-gradient(ellipse 50% 40% at 10% 90%, color-mix(in srgb, var(--border) 80%, transparent), transparent 50%),
              linear-gradient(165deg, var(--background) 0%, color-mix(in srgb, var(--surface) 70%, var(--background)) 45%, var(--background) 100%)
            `,
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.35] dark:opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.45'/%3E%3C/svg%3E")`,
            backgroundSize: "180px 180px",
          }}
        />
      </div>

      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6 md:px-8">
        <p className="font-serif text-lg text-foreground md:text-xl">
          The Cost of Winning
        </p>
        <ThemeToggle />
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 pb-20 pt-8 md:px-8 md:pt-16">
        {/* Hero — brand first, one headline, one support, one CTA group */}
        <section className="max-w-2xl">
          <h1 className="font-serif text-[clamp(2.5rem,6vw,4.25rem)] leading-[1.08] tracking-tight text-foreground">
            The Cost of Winning
          </h1>
          <p className="mt-8 max-w-[36ch] font-serif text-xl leading-snug text-foreground md:text-2xl">
            An immersive ethics simulation where you lead a company through
            decisions that look reasonable one at a time — and add up to
            something else.
          </p>
          <p className="mt-5 max-w-[42ch] text-sm leading-relaxed text-muted-foreground">
            Play solo against AI executives, or join a live team meeting.
            About 30–40 minutes. AI-driven feedback on how you decided.
          </p>
        </section>

        {/* How it works */}
        <section className="mt-20 border-t border-border pt-12 md:mt-28">
          <h2 className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            How it works
          </h2>
          <ol className="mt-8 grid gap-10 sm:grid-cols-3">
            {[
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
            ].map((step) => (
              <li key={step.n}>
                <p className="font-mono text-[11px] tracking-wide text-muted-foreground">
                  {step.n}
                </p>
                <p className="mt-3 font-serif text-xl text-foreground">
                  {step.title}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </section>

        {/* Two paths only */}
        <section className="mt-20 grid gap-4 sm:grid-cols-2 sm:gap-6 md:mt-24">
          <EnterPathButton
            action={enterAsStudent}
            variant="accent"
            eyebrow="Student"
            title="I'm a student"
            body="Start the solo simulation, or open the invite link you were sent."
          />
          <EnterPathButton
            action={enterAsInstructor}
            variant="outline"
            eyebrow="Instructor"
            title="I'm an instructor"
            body="Create sessions, share seats, monitor groups, and release feedback."
          />
        </section>

        {showDevHint ? (
          <p className="mt-16 text-center text-[11px] text-muted-foreground">
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
