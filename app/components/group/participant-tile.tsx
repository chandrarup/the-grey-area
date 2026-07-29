import { CastAvatar } from "@/app/components/chat/cast-avatar";

export function ParticipantTile({
  name,
  title,
  roleKey,
  tag,
  active,
}: {
  name: string;
  title: string;
  roleKey: string;
  tag?: string;
  active?: boolean;
}) {
  return (
    <div
      className={`flex flex-col gap-2.5 border p-3.5 transition-colors ${
        active
          ? "border-accent bg-surface-raised"
          : "border-border bg-surface"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <CastAvatar castId={roleKey} name={name} size="sm" />
        {tag ? (
          <span
            className={`text-[9px] uppercase tracking-wider ${
              active ? "text-accent" : "text-muted-foreground"
            }`}
          >
            {tag}
          </span>
        ) : null}
      </div>
      <div className="min-w-0">
        <p className="truncate text-[12.5px] font-semibold text-foreground">
          {name}
        </p>
        <p className="truncate text-[11px] text-muted-foreground">{title}</p>
      </div>
    </div>
  );
}
