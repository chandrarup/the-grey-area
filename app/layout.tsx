import type { Metadata } from "next";
import { Newsreader, IBM_Plex_Sans } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ModeSwitcherServer } from "./components/mode-switcher-server";
import { ThemeToggle } from "./components/theme-toggle";
import { NavControls } from "./components/nav-controls";
import Link from "next/link";

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600"],
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "The Cost of Winning: Executive Ethics Simulator",
};

const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("theme");
    var theme = stored || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.classList.toggle("dark", theme === "dark");
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${newsreader.variable} ${plexSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <header className="border-b border-border">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6 md:px-8">
            <div className="flex min-w-0 items-center gap-4">
              <Link
                href="/"
                className="shrink-0 text-sm text-muted-foreground hover:text-foreground"
              >
                The Grey Area
              </Link>
              <NavControls />
            </div>
            <div className="flex shrink-0 items-center gap-3 md:gap-4">
              <Link
                href="/settings"
                className="hidden text-xs text-muted-foreground hover:text-foreground sm:inline"
              >
                Settings
              </Link>
              <ModeSwitcherServer />
              <ThemeToggle />
            </div>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
