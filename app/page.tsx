import Link from "next/link";
import { getPublishedCase } from "@/lib/db/queries";
import { ensureHomeCase } from "@/lib/simulation/ensure-case";
import { ResetSoloButton } from "@/app/components/reset-solo-button";

/**
 * Admin hub — default landing. No login. Pick a mode and go.
 */
export default async function Home() {
  let caseOk = false;
  let setupError: string | null = null;
  try {
    await ensureHomeCase();
    const published = await getPublishedCase("cost-of-winning");
    caseOk = Boolean(published);
  } catch (error) {
    setupError = error instanceof Error ? error.message : "Database unavailable";
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-16 md:px-8">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Admin
      </p>
      <h1 className="mt-2 font-serif text-4xl text-foreground md:text-5xl">
        The Grey Area
      </h1>
      <p className="mt-4 max-w-[50ch] text-sm leading-relaxed text-muted-foreground">
        No login. Use the header toggle anytime, or open a path below.
      </p>

      {!caseOk ? (
        <div className="mt-8 border border-border border-l-2 border-l-accent bg-surface px-5 py-4 text-sm">
          <p className="font-medium text-foreground">Setup needed</p>
          <p className="mt-2 text-muted-foreground">
            {setupError ??
              "Case is not published. Run npm run db:migrate && npm run db:seed"}
          </p>
        </div>
      ) : (
        <p className="mt-6 text-xs text-muted-foreground">
          Case ready · cost-of-winning published
        </p>
      )}

      <div className="mt-12 grid gap-4">
        <Link
          href="/simulation/leadership-team"
          className="block border border-border px-6 py-5 transition-colors hover:border-accent hover:bg-surface"
        >
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Student · single player
          </p>
          <p className="mt-2 font-serif text-2xl text-foreground">
            Play the simulation
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Meet the team, read the case, make five decisions as CEO.
          </p>
        </Link>

        <Link
          href="/professor"
          className="block border border-border px-6 py-5 transition-colors hover:border-accent hover:bg-surface"
        >
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Professor
          </p>
          <p className="mt-2 font-serif text-2xl text-foreground">
            Create group sessions
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Assign seats (CEO, Marcus, David, Priya, Tom) and open each role in
            its own window.
          </p>
        </Link>
      </div>

      {caseOk ? (
        <div className="mt-10">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Solo attempt
          </p>
          <div className="mt-3">
            <ResetSoloButton label="Reset student solo run" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
