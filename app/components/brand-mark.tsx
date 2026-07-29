/**
 * Logo B — quartered square with one compromised (amber) quadrant.
 * Reads as boardroom table / ledger / grey area; survives favicon size.
 */
export function BrandMark({
  size = "md",
  animate = false,
  className = "",
  title = "The Cost of Winning",
}: {
  size?: "sm" | "md" | "lg";
  /** Hero 1a — compromise walks the square (12s). Respects prefers-reduced-motion. */
  animate?: boolean;
  className?: string;
  title?: string;
}) {
  const dim =
    size === "lg" ? "h-24 w-24 sm:h-32 sm:w-32" : size === "sm" ? "h-5 w-5" : "h-8 w-8";

  if (animate) {
    return (
      <div
        role="img"
        aria-label={title}
        className={`tcw-mark-animate grid shrink-0 grid-cols-2 grid-rows-2 border border-border ${dim} ${className}`}
      >
        <div className="relative border-b border-r border-border">
          <span className="tcw-q1 absolute inset-0 bg-accent" />
        </div>
        <div className="relative border-b border-border">
          <span className="tcw-q2 absolute inset-0 bg-accent" />
        </div>
        <div className="relative border-r border-border">
          <span className="tcw-q4 absolute inset-0 bg-accent" />
        </div>
        <div className="relative">
          <span className="tcw-q3 absolute inset-0 bg-accent" />
        </div>
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label={title}
      className={`grid shrink-0 grid-cols-2 grid-rows-2 border border-current ${dim} ${className}`}
      style={{ color: "var(--foreground)" }}
    >
      <div className="border-b border-r border-current" />
      <div className="border-b border-current" />
      <div className="border-r border-current bg-accent" />
      <div />
    </div>
  );
}

export function BrandLockup({
  size = "md",
  showTagline = false,
  className = "",
}: {
  size?: "sm" | "md";
  showTagline?: boolean;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <BrandMark size={size === "sm" ? "sm" : "md"} />
      <span className="min-w-0">
        <span
          className={`block font-serif font-medium leading-tight text-foreground ${
            size === "sm" ? "text-base" : "text-lg"
          }`}
        >
          The Cost of Winning
        </span>
        {showTagline ? (
          <span className="mt-0.5 block font-mono text-[9.5px] uppercase tracking-[0.22em] text-muted-foreground">
            Executive Ethics Simulation
          </span>
        ) : null}
      </span>
    </span>
  );
}
