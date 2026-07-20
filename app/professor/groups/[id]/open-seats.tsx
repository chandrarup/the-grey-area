"use client";

export function OpenSeatButtons({
  seats,
}: {
  seats: {
    roleKey: string;
    title: string;
    token: string;
    displayName: string | null;
    isReady: boolean;
  }[];
}) {
  return (
    <ul className="mt-6 divide-y divide-border border border-border">
      {seats.map((seat) => (
        <li
          key={seat.roleKey}
          className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
        >
          <div>
            <p className="text-sm font-medium text-foreground">{seat.title}</p>
            <p className="text-xs text-muted-foreground">
              {seat.displayName
                ? `${seat.displayName}${seat.isReady ? " · ready" : " · joined"}`
                : "Not opened yet"}
            </p>
          </div>
          <button
            type="button"
            className="bg-accent px-4 py-2 text-sm text-accent-foreground"
            onClick={() => {
              window.open(
                `/group/open?token=${encodeURIComponent(seat.token)}`,
                `seat-${seat.roleKey}`,
                "noopener,noreferrer",
              );
            }}
          >
            Open window
          </button>
        </li>
      ))}
    </ul>
  );
}
