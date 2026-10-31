import Link from "next/link";
import { ThemeToggle } from "@/app/components/theme-toggle";
import { logout } from "@/app/login/actions";

/**
 * Shared product chrome for area layouts.
 * Marketing home provides its own header; root layout stays bare.
 */
export function AreaHeader({
  area,
  links,
}: {
  area: "student" | "instructor";
  links: { href: string; label: string }[];
}) {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex min-h-16 py-3 max-w-6xl items-center justify-between gap-4 px-6 md:px-8">
        <div className="flex min-w-0 items-center gap-6">
          <Link href="/" className="shrink-0">
            <span className="font-serif text-lg">Ethics Experience</span>
          </Link>
          <nav className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="hidden font-mono text-[10px] uppercase tracking-wider text-muted-foreground sm:inline">
            {area === "student" ? "Student preview" : "Instructor"}
          </span>
          <form action={logout}><button className="text-xs text-muted-foreground hover:text-foreground">Sign out</button></form>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
