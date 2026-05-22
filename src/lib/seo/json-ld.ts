/**
 * Schema.org JSON-LD generators for SEO rich results.
 *
 * Game pages emit a Game object enriched with our 12-axis profile as
 * additionalProperty entries — Google may surface these in rich snippets
 * and they're indexable by structured-data search.
 */

import { AXES } from "@/lib/scoring";
import type { Game } from "@/data/types";
import type { FaqItem } from "./faq";

const SITE_URL = "https://yournextbg.com";

interface GameJsonLd {
  "@context": "https://schema.org";
  "@type": "Game";
  name: string;
  url: string;
  description: string;
  numberOfPlayers?: {
    "@type": "QuantitativeValue";
    minValue: number;
    maxValue: number;
  };
  playMode?: string;
  gamePlatform: "Board Game";
  sameAs?: string[];
  additionalProperty: Array<{
    "@type": "PropertyValue";
    name: string;
    value: number;
    minValue: 0;
    maxValue: 10;
    description: string;
  }>;
}

interface BreadcrumbJsonLd {
  "@context": "https://schema.org";
  "@type": "BreadcrumbList";
  itemListElement: Array<{
    "@type": "ListItem";
    position: number;
    name: string;
    item?: string;
  }>;
}

function playerCountRange(g: Game): { min: number; max: number } | undefined {
  if (!g.playerCount) return undefined;
  const counts = [
    ...g.playerCount.best,
    ...g.playerCount.good,
    ...g.playerCount.bad,
  ]
    .flatMap((s) => {
      // "3P", "4P", "5+P", "10P", "10–15P"...
      const m = s.match(/(\d+)(?:[–-](\d+))?/);
      if (!m) return [];
      const lo = parseInt(m[1], 10);
      const hi = m[2] ? parseInt(m[2], 10) : lo;
      return [lo, hi];
    })
    .filter((n) => Number.isFinite(n));
  if (counts.length === 0) return undefined;
  return { min: Math.min(...counts), max: Math.max(...counts) };
}

export function gameJsonLd(game: Game, description: string): GameJsonLd {
  const range = playerCountRange(game);
  const sameAs: string[] = [];
  if (game.bggId) {
    sameAs.push(`https://boardgamegeek.com/boardgame/${game.bggId}`);
  }

  return {
    "@context": "https://schema.org",
    "@type": "Game",
    name: game.name,
    url: `${SITE_URL}/games/${game.slug}`,
    description,
    gamePlatform: "Board Game",
    ...(range && {
      numberOfPlayers: {
        "@type": "QuantitativeValue",
        minValue: range.min,
        maxValue: range.max,
      },
    }),
    ...(sameAs.length > 0 && { sameAs }),
    additionalProperty: AXES.map((ax, i) => ({
      "@type": "PropertyValue",
      name: `${ax.label} (${ax.branch})`,
      value: game.scores[i],
      minValue: 0,
      maxValue: 10,
      description: `${ax.label} score on the yournextbg 12-axis profile rubric. ${ax.diffExplanation}`,
    })),
  };
}

export function gameBreadcrumb(game: Game): BreadcrumbJsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Games",
        item: `${SITE_URL}/games`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: game.name,
      },
    ],
  };
}

interface FaqJsonLd {
  "@context": "https://schema.org";
  "@type": "FAQPage";
  mainEntity: Array<{
    "@type": "Question";
    name: string;
    acceptedAnswer: {
      "@type": "Answer";
      text: string;
    };
  }>;
}

export function faqJsonLd(items: readonly FaqItem[]): FaqJsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: it.a,
      },
    })),
  };
}

/** Serialize a JSON-LD object to a JSON string safe to embed in <script>. */
export function jsonLdString(obj: object): string {
  return JSON.stringify(obj).replace(/</g, "\\u003c");
}
