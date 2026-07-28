import type { Metadata } from "next";
import { Newsreader, IBM_Plex_Sans } from "next/font/google";
import { NavigationProgressHost } from "@/app/components/navigation-progress-host";
import "./globals.css";

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
  title: {
    default: "The Cost of Winning",
    template: "%s · The Cost of Winning",
  },
  description:
    "An immersive ethics simulation where you lead a company through decisions that look reasonable one at a time — and add up to something else.",
};

/** Runs before paint to avoid a light/dark flash. Kept as a raw inline script in the
 *  server layout (not next/script) so React 19 does not warn about client script tags. */
const THEME_INIT_SCRIPT = `(function(){try{var s=localStorage.getItem("theme");var t=s||(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");document.documentElement.classList.toggle("dark",t==="dark");}catch(e){}})();`;

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
      <body className="flex min-h-full flex-col font-sans">
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <NavigationProgressHost />
        {children}
      </body>
    </html>
  );
}
