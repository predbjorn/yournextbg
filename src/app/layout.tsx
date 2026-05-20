import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Newsreader } from "next/font/google";
import "./globals.css";

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
  return (
    <html
      lang="en"
      className={`${newsreader.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
