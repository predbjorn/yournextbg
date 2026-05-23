import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GAMES, getGameBySlug } from "@/data/games";
import { gameSubtitle } from "@/lib/facets";
import { Radar, Stamp } from "@/components/ui";
import { ScorePanel } from "@/components/game/ScorePanel";
import { MetaStrip } from "@/components/game/MetaStrip";
import { SimilarGamesList } from "@/components/game/SimilarGamesList";
import { generateFaq } from "@/lib/seo/faq";
import {
  gameJsonLd,
  gameBreadcrumb,
  faqJsonLd,
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
  const faq = generateFaq(game);
  const faqLd = faqJsonLd(faq);
  const longDesc = longDescription(game);
  const jsonLd = gameJsonLd(game, longDesc);
  const breadcrumb = gameBreadcrumb(game);

  return (
    <main className="min-h-screen bg-cs-paper-deep cs-grain">
      <div className="max-w-[1200px] mx-auto px-8 pt-12 pb-24">
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
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: jsonLdString(faqLd) }}
        />

        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-3 font-cs-mono uppercase text-cs-muted mb-8"
          style={{ fontSize: 10, letterSpacing: "0.18em" }}
        >
          <Link href="/" className="hover:text-cs-ink">
            yournextbg
          </Link>
          <span aria-hidden>›</span>
          <Link href="/games" className="hover:text-cs-ink">
            Games
          </Link>
          <span aria-hidden>›</span>
          <span className="text-cs-ink/70">{gameSubtitle(game)}</span>
        </nav>

        {/* Hero row */}
        <section className="grid gap-10 lg:grid-cols-[1fr_360px] items-start mb-12">
          <header>
            <Stamp color="muted">game profile</Stamp>
            <h1
              className="font-cs-display text-cs-ink mt-1"
              style={{
                fontSize: "clamp(40px, 6vw, 64px)",
                fontWeight: 600,
                letterSpacing: "-0.03em",
                lineHeight: 0.98,
              }}
            >
              {game.name}
            </h1>
            {game.signature && (
              <p
                className="font-cs-display italic text-cs-ink/70 mt-4 max-w-3xl"
                style={{ fontSize: 19, lineHeight: 1.4 }}
              >
                {game.signature}
              </p>
            )}
            {game.bggId && (
              <p
                className="font-cs-mono text-cs-muted mt-5"
                style={{ fontSize: 11, letterSpacing: "0.06em" }}
              >
                BGG ·{" "}
                <a
                  href={`https://boardgamegeek.com/boardgame/${game.bggId}`}
                  target="_blank"
                  rel="noopener"
                  className="hover:text-cs-ink"
                  style={{ borderBottom: "1px dotted rgba(28,26,20,0.4)" }}
                >
                  boardgamegeek.com/boardgame/{game.bggId}
                </a>
              </p>
            )}
            <p
              className="font-cs-display text-cs-ink mt-7 max-w-3xl"
              style={{ fontSize: 18, lineHeight: 1.55 }}
            >
              {prose.thinking} {prose.interaction}
            </p>
            {closestSentence && (
              <p
                className="font-cs-display italic text-cs-ink/70 mt-3 max-w-3xl"
                style={{ fontSize: 16, lineHeight: 1.55 }}
              >
                {closestSentence}
              </p>
            )}
          </header>
          <div className="flex justify-center">
            <Radar size={320} values={game.scores} />
          </div>
        </section>

        {/* Meta strip: solo / fiddly / player counts */}
        <section className="mb-10">
          <MetaStrip game={game} />
        </section>

        {/* 12-axis breakdown */}
        <section className="mb-12">
          <h2
            className="font-cs-display text-cs-ink"
            style={{
              fontSize: 30,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              marginBottom: 6,
            }}
          >
            The 12-axis profile
          </h2>
          <p
            className="font-cs-display italic text-cs-ink/70 max-w-2xl mb-6"
            style={{ fontSize: 15 }}
          >
            Every score is on a 0–10 scale. The rubric and methodology
            behind these numbers is documented in the{" "}
            <a
              href="https://github.com/predbjorn/yournextbg#readme"
              target="_blank"
              rel="noopener"
              className="text-cs-ink not-italic"
              style={{ borderBottom: "1px dotted rgba(28,26,20,0.4)" }}
            >
              README
            </a>
            .
          </p>
          <ScorePanel game={game} prose={prose} />
        </section>

        {/* Second prose block */}
        <section className="mb-12 max-w-3xl">
          <p
            className="font-cs-display text-cs-ink mb-4"
            style={{ fontSize: 17, lineHeight: 1.6 }}
          >
            {prose.luck}
          </p>
          <p
            className="font-cs-display text-cs-ink"
            style={{ fontSize: 17, lineHeight: 1.6 }}
          >
            {prose.experience}
          </p>
        </section>

        {/* Similar games */}
        <section className="mb-12">
          <h2
            className="font-cs-display text-cs-ink"
            style={{
              fontSize: 30,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              marginBottom: 6,
            }}
          >
            Games like {game.name}
          </h2>
          <p
            className="font-cs-display italic text-cs-ink/70 max-w-2xl mb-6"
            style={{ fontSize: 15 }}
          >
            Ranked by weighted Euclidean distance across the 12-axis
            profile, using the default research-weighted lens. Click any
            game to see its full profile.
          </p>
          <SimilarGamesList game={game} limit={6} />
        </section>

        {/* FAQ */}
        <section className="mb-12">
          <h2
            className="font-cs-display text-cs-ink"
            style={{
              fontSize: 30,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              marginBottom: 6,
            }}
          >
            Frequently asked
          </h2>
          <p
            className="font-cs-display italic text-cs-ink/70 max-w-2xl mb-6"
            style={{ fontSize: 15 }}
          >
            Answers derived directly from {game.name}&apos;s 12-axis profile.
          </p>
          <dl className="max-w-3xl">
            {faq.map((item) => (
              <div
                key={item.q}
                className="py-5"
                style={{ borderBottom: "1px solid rgba(28,26,20,0.08)" }}
              >
                <dt
                  className="font-cs-display text-cs-ink mb-1"
                  style={{ fontSize: 17, fontWeight: 600 }}
                >
                  {item.q}
                </dt>
                <dd
                  className="font-cs-display text-cs-ink/75"
                  style={{ fontSize: 15, lineHeight: 1.6 }}
                >
                  {item.a}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* CTA into the lens */}
        <section
          className="pt-8"
          style={{ borderTop: "1px dashed rgba(28,26,20,0.2)" }}
        >
          <p
            className="font-cs-display italic text-cs-ink/75"
            style={{ fontSize: 15 }}
          >
            Want to overlay {game.name} against a candidate game and see
            exactly where they diverge?{" "}
            <Link
              href={`/lens?a=${game.id}`}
              className="text-cs-ink not-italic"
              style={{
                borderBottom: "1px dotted rgba(28,26,20,0.4)",
                fontWeight: 600,
              }}
            >
              Open it in the lens →
            </Link>
          </p>
        </section>

        <footer
          className="mt-24 pt-8 text-center font-cs-mono uppercase text-cs-muted"
          style={{
            fontSize: 10,
            letterSpacing: "0.22em",
            borderTop: "1px solid rgba(28,26,20,0.12)",
          }}
        >
          Methodology v1 · MDA · Quantic Foundry · BGG forum consensus
        </footer>
      </div>
    </main>
  );
}
