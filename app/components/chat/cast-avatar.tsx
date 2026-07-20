/** Stable avatar colors per cast — muted, on-brand (no purple). */
const AVATAR_TONES: Record<string, { bg: string; fg: string }> = {
  marcus: { bg: "#3d4f63", fg: "#f0ebe3" },
  david: { bg: "#5c5346", fg: "#f5f0e8" },
  priya: { bg: "#3f5a54", fg: "#eef5f2" },
  tom: { bg: "#2c2a28", fg: "#f2efe9" },
  eleanor: { bg: "#6b4a42", fg: "#f7efe9" },
  ceo: { bg: "var(--accent)", fg: "var(--accent-foreground)" },
  narrator: { bg: "#8a857c", fg: "#faf9f7" },
};

export function avatarTone(castId: string) {
  return AVATAR_TONES[castId] ?? AVATAR_TONES.narrator;
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function CastAvatar({
  castId,
  name,
  size = "md",
}: {
  castId: string;
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const tone = avatarTone(castId);
  const dim =
    size === "sm" ? "h-8 w-8 text-[10px]" : size === "lg" ? "h-11 w-11 text-sm" : "h-9 w-9 text-[11px]";

  const KNOWN: Record<string, string> = {
    marcus: "MR",
    david: "DO",
    priya: "PN",
    tom: "TB",
    eleanor: "EV",
    ceo: "CE",
  };
  const label =
    KNOWN[castId] ??
    (/^you$/i.test(name.trim()) ? KNOWN[castId] ?? "YO" : initials(name));

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-medium tracking-wide ${dim}`}
      style={{ background: tone.bg, color: tone.fg }}
      title={name}
      aria-hidden
    >
      {label}
    </span>
  );
}
