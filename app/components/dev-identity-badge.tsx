import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth";
import { homePathForRole } from "@/lib/db/access";

export async function DevIdentityBadge() {
  if (process.env.DEV_IDENTITY !== "true") {
    return null;
  }

  let profile = null;
  try {
    profile = await getCurrentProfile();
  } catch {
    return null;
  }

  if (!profile) {
    return (
      <Link
        href="/dev/identity"
        className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
      >
        Sign in (dev)
      </Link>
    );
  }

  return (
    <p className="text-xs text-muted-foreground">
      signed in as{" "}
      <Link
        href={homePathForRole(profile.role)}
        className="text-foreground underline-offset-2 hover:underline"
      >
        {profile.name}
      </Link>{" "}
      ({profile.role})
      {" — "}
      <Link
        href="/dev/identity"
        className="underline underline-offset-2 hover:text-foreground"
      >
        switch
      </Link>
    </p>
  );
}
