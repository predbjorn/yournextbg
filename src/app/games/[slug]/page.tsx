import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GAMES, getGameBySlug } from "@/data/games";
import { gameSubtitle } from "@/lib/facets";
import { ScorePanel } from "@/components/game/ScorePanel";
import { MetaStrip } from "@/components/game/MetaStrip";
import { SimilarGamesList } from "@/components/game/SimilarGamesList";
import {
  gameJsonLd,
  gameBreadcrumb,
  jsonLdString,
} from "@/lib/seo/json-ld";
import {
  generateBranchProse,
  longDescription,
  metaDescription,
  closestNeighborSentence,
} from "@/lib/seo/prose";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return GAMES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const game = getGameBySlug(slug);
  if (!game) return { title: "Game not found · yournextbg" };

  const desc = metaDescription(game);
  const canonical = `/games/${game.slug}`;

  return {
    title: `${game.name} — profile & similar games`,
    description: desc,
    alternates: { canonical },
    openGraph: {
      title: `${game.name} — 12-axis profile`,
      description: desc,
      type: "article",
      url: canonical,
    },
    twitter: {
      card: "summary_large_image",
      title: `${game.name} — 12-axis profile`,
      description: desc,
    },
  };
}

export default async function GamePage({ params }: PageProps) {
  const { slug } = await params;
  const game = getGameBySlug(slug);
  if (!game) notFound();

  const prose = generateBranchProse(game);
  const closestSentence = closestNeighborSentence(game, GAMES);
  const longDesc = longDescription(game);
  const jsonLd = gameJsonLd(game, longDesc);
  const breadcrumb = gameBreadcrumb(game);

  return (
    <main className="max-w-[1200px] mx-auto px-8 pt-16 pb-24">
      {/* JSON-LD for rich results */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: jsonLdString(jsonLd) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumb) }}
      />

      {/* Header */}
      <header className="mb-10">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--ink-mute)] mb-7"
        >
          <Link href="/" className="hover:text-[var(--accent)]">
            yournextbg
          </Link>
          <span aria-hidden>›</span>
          <Link href="/games" className="hover:text-[var(--accent)]">
            Games
          </Link>
          <span aria-hidden>›</span>
          <span className="text-[var(--ink-dim)]">{gameSubtitle(game)}</span>
        </nav>

        <h1 className="font-serif font-bold text-[clamp(40px,6vw,72px)] leading-[0.95] tracking-[-0.03em] mb-4">
          {game.name}
        </h1>

        {game.signature && (
          <p className="text-[20px] italic text-[var(--ink-dim)] max-w-3xl leading-snug font-light mb-4">
            {game.signature}
          </p>
        )}

        {game.bggId && (
          <p className="font-mono text-[11px] text-[var(--ink-mute)]">
            BGG:{" "}
            <a
              href={`https://boardgamegeek.com/boardgame/${game.bggId}`}
              target="_blank"
              rel="noopener"
              className="text-[var(--steel)] hover:underline"
            >
              boardgamegeek.com/boardgame/{game.bggId}
            </a>
          </p>
        )}
      </header>

      {/* Lead paragraph — first prose block above the fold for SEO */}
      <section className="mb-10 max-w-3xl">
        <p className="text-[18px] leading-relaxed font-serif text-[var(--ink)]">
          {prose.thinking} {prose.interaction}
        </p>
        {closestSentence && (
          <p className="mt-4 text-[16px] leading-relaxed font-serif text-[var(--ink-dim)] italic">
            {closestSentence}
          </p>
        )}
      </section>

      {/* Meta strip: solo / fiddly / player counts */}
      <section className="mb-10">
        <MetaStrip game={game} />
      </section>

      {/* 12-axis breakdown */}
      <section className="mb-12">
        <h2 className="font-serif text-3xl font-bold tracking-tight mb-2">
          The 12-axis profile
        </h2>
        <p className="text-[var(--ink-dim)] italic mb-6 max-w-2xl">
          Every score is on a 0–10 scale. The rubric and methodology behind
          these numbers is documented in the{" "}
          <a
            href="https://github.com/predbjorn/yournextbg#readme"
            target="_blank"
            rel="noopener"
            className="text-[var(--steel)] hover:underline"
          >
            README
          </a>
          .
        </p>
        <ScorePanel game={game} prose={prose} />
      </section>

      {/* Second prose block — luck + experience */}
      <section className="mb-12 max-w-3xl">
        <p className="text-[17px] leading-relaxed font-serif text-[var(--ink)] mb-4">
          {prose.luck}
        </p>
        <p className="text-[17px] leading-relaxed font-serif text-[var(--ink)]">
          {prose.experience}
        </p>
      </section>

      {/* Similar games */}
      <section className="mb-12">
        <h2 className="font-serif text-3xl font-bold tracking-tight mb-2">
          Games like {game.name}
        </h2>
        <p className="text-[var(--ink-dim)] italic mb-6 max-w-2xl">
          Ranked by weighted Euclidean distance across the 12-axis profile,
          using the default research-weighted lens. Click any game to see its
          full profile.
        </p>
        <SimilarGamesList game={game} limit={6} />
      </section>

      {/* CTA back to the comparator */}
      <section className="pt-8 border-t border-dashed border-[var(--border)]">
        <p className="text-[15px] text-[var(--ink-dim)] italic">
          Want to overlay {game.name} against a candidate game and see exactly
          where they diverge?{" "}
          <Link
            href="/"
            className="text-[var(--accent)] hover:underline font-medium not-italic"
          >
            Open it in the comparator →
          </Link>
        </p>
      </section>

      <footer className="mt-24 pt-8 border-t border-[var(--border)] text-center font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--ink-mute)]">
        Methodology v1 · MDA · Quantic Foundry · BGG forum consensus
      </footer>
    </main>
  );
}
