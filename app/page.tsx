export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-6 md:px-8">
      <div className="max-w-2xl py-20 md:py-28">
        <h1 className="font-serif text-4xl leading-tight text-foreground md:text-6xl">
          The Cost of Winning
        </h1>

        <p className="mt-6 font-serif text-xl leading-snug text-foreground md:text-2xl">
          You are the newly appointed CEO of Global Infrastructure Solutions.
        </p>

        <p className="mt-6 max-w-[60ch] text-base leading-relaxed text-muted-foreground">
          A major contract is on the table, competition is fierce, and how
          you lead over the next five decisions will define your tenure.
        </p>

        <div className="mt-10 border-l-2 border-accent bg-surface px-6 py-5">
          <p className="text-sm font-medium text-foreground">
            What&rsquo;s at stake
          </p>
          <p className="mt-2 max-w-[55ch] text-sm leading-relaxed text-muted-foreground">
            Your company&rsquo;s contracts, your leadership team&rsquo;s
            trust, and your own integrity. Some choices in this simulation
            cannot be undone, and they will shape how the story ends.
          </p>
        </div>

        <div className="mt-12">
          <button
            type="button"
            className="bg-accent px-6 py-3 text-sm font-medium text-accent-foreground transition-transform hover:opacity-90 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Begin Simulation
          </button>
        </div>
      </div>
    </div>
  );
}
