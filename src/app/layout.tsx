import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "yournextbg — find your next board game by profile",
  description:
    "A board game recommender built on a 12-axis profile, not collaborative filtering. Compare games by what plays similarly at the table.",
  metadataBase: new URL("https://yournextbg.com"),
  openGraph: {
    title: "yournextbg",
    description:
      "A board game recommender built on a 12-axis profile. Compare games by what plays similarly at the table.",
    type: "website",
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
