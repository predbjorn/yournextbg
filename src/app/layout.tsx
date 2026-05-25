import type { Metadata, Viewport } from "next";
import { Fraunces, JetBrains_Mono, Newsreader } from "next/font/google";
import "./globals.css";
import { PostHogInit } from "@/components/analytics/posthog-init";

/**
 * Theme is resolved entirely in the browser via the inline script below
 * (cookie + prefers-color-scheme). We deliberately don't read the cookie
 * server-side here because that would force every route — including the
 * SEO-critical static /games/[slug] — to be dynamic. The cookie name is
 * `yntb-theme`, written by /profile's PrefsSection.
 *
 * The /profile ThemeProvider still mounts further down the tree for
 * signed-in users to react to OS scheme changes when theme=auto. The
 * inline script handles the first paint for *everyone*.
 */

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700", "800"],
  style: ["normal", "italic"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

// Cardstock display face. Powers `--font-cs-display` in globals.css and
// the `font-cs-display` Tailwind utility. Coexists with Newsreader until
// later Plan 02 tasks port components over and a cleanup task removes it.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0d1117",
  colorScheme: "dark",
};

export const metadata: Metadata = {
  title: {
    default: "yournextbg — find your next board game by profile",
    template: "%s · yournextbg",
  },
  description:
    "A board game recommender built on a 12-axis profile, not collaborative filtering. Compare games by what plays similarly at the table.",
  metadataBase: new URL("https://yournextbg.com"),
  applicationName: "yournextbg",
  keywords: [
    "board games",
    "board game recommendations",
    "board game recommender",
    "find similar board games",
    "board game comparison",
    "BGG alternative",
  ],
  authors: [{ name: "predbjorn", url: "https://github.com/predbjorn" }],
  creator: "predbjorn",
  publisher: "yournextbg",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "yournextbg",
    description:
      "A board game recommender built on a 12-axis profile. Compare games by what plays similarly at the table.",
    url: "/",
    siteName: "yournextbg",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "yournextbg — find your next board game by profile",
    description:
      "A board game recommender built on a 12-axis profile, not collaborative filtering.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Inline pre-paint script. Reads the `yntb-theme` cookie at parse time
  // and falls back to prefers-color-scheme. Running in <head> means the
  // html element gets `data-theme` set before any CSS evaluates — no
  // flash. Stays as a string constant so the layout is statically
  // renderable.
  const initScript = `(() => {
    try {
      var m = document.cookie.match(/(?:^|; )yntb-theme=([^;]+)/);
      var t = m ? decodeURIComponent(m[1]) : "auto";
      var mode = (t === "light" || t === "dark")
        ? t
        : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
      document.documentElement.dataset.theme = mode;
    } catch (e) {}
  })();`;

  return (
    <html
      lang="en"
      className={`${newsreader.variable} ${jetbrainsMono.variable} ${fraunces.variable} h-full antialiased`}
      // The inline script below sets `data-theme` before hydration; React
      // doesn't know about that mutation, so silence its warning here.
      suppressHydrationWarning
    >
      <head>
        <script
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: initScript }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <PostHogInit />
        {children}
      </body>
    </html>
  );
}
