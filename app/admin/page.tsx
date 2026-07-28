import Link from "next/link";
import { resolveAppRole, homeForRole } from "@/lib/auth/role-guard";
import { redirect } from "next/navigation";
import { AreaHeader } from "@/app/components/area-header";
import { isDevIdentityEnabled } from "@/lib/auth/role-guard";

/** Admin tools — only when role is admin (dev switch or future auth). */
export default async function AdminPage() {
  const role = await resolveAppRole();
  if (role !== "admin") {
    redirect(homeForRole(role));
  }

  return (
    <>
      <AreaHeader
        area="instructor"
        links={[
          { href: "/professor", label: "Sessions" },
          { href: "/admin", label: "Admin" },
        ]}
      />
      <div className="mx-auto max-w-lg px-6 py-16 md:px-8">
        <h1 className="font-serif text-3xl text-foreground">Admin</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Operational tools for this deployment.
        </p>
        <ul className="mt-8 space-y-3 text-sm">
          <li>
            <Link href="/professor" className="underline underline-offset-2">
              Instructor sessions
            </Link>
          </li>
          {isDevIdentityEnabled() ? (
            <li>
              <Link
                href="/dev/identity"
                className="underline underline-offset-2"
              >
                Dev identity picker
              </Link>
            </li>
          ) : null}
        </ul>
      </div>
    </>
  );
}
