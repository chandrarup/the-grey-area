import Link from "next/link";

/**
 * Student entry — one purpose, one primary action.
 * Invite links bypass the marketing home and land on /group/join.
 */
export default function StudentHomePage() {
  return (
    <div className="mx-auto max-w-lg px-6 py-16 md:px-8">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
        Student
      </p>
      <h1 className="mt-3 font-serif text-3xl text-foreground md:text-4xl">
        Begin the simulation
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Play as CEO through The Cost of Winning — about 30–40 minutes, with
        AI executives in the room and feedback at the end.
      </p>

      <Link
        href="/simulation/leadership-team"
        className="mt-10 inline-block bg-accent px-6 py-3 text-sm font-medium text-accent-foreground"
      >
        Start solo play
      </Link>

      <p className="mt-10 text-sm text-muted-foreground">
        Joining a live team meeting? Open the unique link from your instructor —
        you will not need this page.
      </p>
    </div>
  );
}
