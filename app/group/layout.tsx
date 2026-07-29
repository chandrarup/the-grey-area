import Link from "next/link";
import { ThemeToggle } from "@/app/components/theme-toggle";

/** Minimal chrome for join + live meeting — no instructor controls. */
export default function GroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6 md:px-8">
          <Link href="/" className="font-serif text-base text-foreground">
            The Cost of Winning
          </Link>
          <ThemeToggle />
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </>
  );
}
