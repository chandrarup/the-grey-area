/** Small inline spinner for pending actions. */
export function LoadingSpinner({
  label,
  className = "",
  size = "sm",
}: {
  label?: string;
  className?: string;
  size?: "sm" | "md";
}) {
  const dim = size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";
  return (
    <span
      className={`inline-flex items-center gap-2 ${className}`}
      role="status"
      aria-live="polite"
    >
      <svg
        className={`${dim} animate-spin text-current`}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="3"
        />
        <path
          className="opacity-90"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z"
        />
      </svg>
      {label ? <span>{label}</span> : null}
    </span>
  );
}
