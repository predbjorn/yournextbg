import type { MetadataRoute } from "next";
import { GAMES } from "@/data/games";

const SITE_URL = "https://yournextbg.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    ...GAMES.map((g) => ({
      url: `${SITE_URL}/games/${g.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
