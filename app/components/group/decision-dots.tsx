export function DecisionDots({
  made,
  total,
}: {
  made: number;
  total: number;
}) {
  return (
    <div className="flex gap-1" aria-hidden>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`h-0.5 w-[1.625rem] ${
            i < made ? "bg-accent" : "bg-border"
          }`}
        />
      ))}
    </div>
  );
}
