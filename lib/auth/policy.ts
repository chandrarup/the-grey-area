/** The production allowlist grants both owners full administrator access. */
export function isAllowedAdmin(
  email: string | undefined,
  allowlist: string | undefined,
): boolean {
  if (!email || !allowlist) return false;
  return allowlist
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.trim().toLowerCase());
}

/** Demo identity must never be available in a production build. */
export function localPreviewEnabled(env = process.env): boolean {
  return env.NODE_ENV === "development" && env.DEV_IDENTITY === "true";
}
