import type { Metadata, Viewport } from "next";
import { Fraunces, JetBrains_Mono, Newsreader } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { PostHogInit } from "@/components/analytics/posthog-init";
import type { ThemeChoice } from "@/lib/supabase/types";

/**
 * Cookie name shared with /profile's PrefsSection. The client writes both
 * user_prefs.theme and this cookie on every theme change, so signed-in
 * and signed-out users both get FOUC-free initial paint.
 */
const THEME_COOKIE = "yntb-theme";

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

function isThemeChoice(v: string | undefined): v is ThemeChoice {
  return v === "light" || v === "dark" || v === "auto";
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const raw = cookieStore.get(THEME_COOKIE)?.value;
  const theme: ThemeChoice = isThemeChoice(raw) ? raw : "auto";

  // Inline pre-paint script. Reads the cookie that's already baked into
  // the response and the OS-level media query when theme="auto". Doing
  // this in `<head>` means the html element gets the right `data-theme`
  // attribute before any CSS evaluates, so there's no flash.
  const initScript = `(() => {
    try {
      var t = ${JSON.stringify(theme)};
      var mode = t === "auto"
        ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
        : t;
      document.documentElement.dataset.theme = mode;
    } catch (e) {}
  })();`;

  return (
    <html
      lang="en"
      className={`${newsreader.variable} ${jetbrainsMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <head>
        <script
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: initScript }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider theme={theme} />
        <PostHogInit />
        {children}
      </body>
    </html>
  );
}
