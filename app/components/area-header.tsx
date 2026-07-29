import Link from "next/link";
import { ThemeToggle } from "@/app/components/theme-toggle";
import { DevRoleSwitch } from "@/app/components/dev-role-switch";
import { BrandLockup } from "@/app/components/brand-mark";

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
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-6 md:px-8">
        <div className="flex min-w-0 items-center gap-6">
          <Link href="/" className="shrink-0">
            <BrandLockup size="sm" />
          </Link>
          <nav className="hidden items-center gap-4 sm:flex">
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
            {area === "student" ? "Student" : "Instructor"}
          </span>
          <DevRoleSwitch />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
