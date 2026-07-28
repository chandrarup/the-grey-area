import Link from "next/link";

const STEPS = [
  { key: "create", label: "Create", href: (id: string | null) =>
      id ? `/professor/groups/batch/${id}/edit` : "/professor/groups/new-batch" },
  { key: "edit", label: "Edit groups", href: (id: string | null) =>
      id ? `/professor/groups/batch/${id}/edit` : "/professor/groups/new-batch" },
  { key: "invites", label: "Send invites", href: (id: string | null) =>
      id ? `/professor/groups/batch/${id}/invites` : "#" },
  { key: "monitor", label: "Monitor", href: (id: string | null) =>
      id ? `/professor/groups/batch/${id}` : "#" },
] as const;

export function BatchFlowNav({
  batchId,
  current,
  batchStatus,
}: {
  batchId: string | null;
  current: "create" | "edit" | "invites" | "monitor";
  batchStatus?: string | null;
}) {
  return (
    <nav
      aria-label="Batch flow"
      className="mt-6 flex flex-wrap items-center gap-x-1 gap-y-2 text-sm"
    >
      {STEPS.map((step, i) => {
        const active = step.key === current;
        const disabled =
          !batchId &&
          (step.key === "invites" || step.key === "monitor");
        const draftBlock =
          batchStatus === "draft" &&
          (step.key === "invites" || step.key === "monitor");
        const href = step.href(batchId);
        const label =
          step.key === "create" && batchId ? "Roster" : step.label;

        return (
          <span key={step.key} className="inline-flex items-center gap-1">
            {i > 0 ? (
              <span className="mx-1 text-muted-foreground" aria-hidden>
                →
              </span>
            ) : null}
            {disabled || (draftBlock && step.key === "invites" && !batchId) ? (
              <span className="text-muted-foreground/50">{label}</span>
            ) : active ? (
              <span className="font-medium text-foreground">{label}</span>
            ) : (
              <Link
                href={href}
                className="text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
              >
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
