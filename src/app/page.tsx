import Link from "next/link";
import { GAMES } from "@/data/games";
import { Btn, Radar, Stamp } from "@/components/ui";

const HERO_ID = "brass-birmingham";

export default function Home() {
  const hero = GAMES.find((g) => g.id === HERO_ID) ?? GAMES[0];

  return (
    <main className="min-h-screen bg-cs-paper-deep cs-grain">
      <div className="max-w-[1200px] mx-auto px-8 pt-20 pb-24">
        <header className="mb-16">
          <div className="flex justify-between items-center mb-12 pb-6 font-cs-mono uppercase text-cs-muted"
            style={{
              fontSize: 11,
              letterSpacing: "0.18em",
              borderBottom: "1px solid rgba(28,26,20,0.12)",
            }}
          >
            <span>yournextbg</span>
            <span>v1 · cardstock</span>
          </div>
          <h1
            className="font-cs-display text-cs-ink"
            style={{
              fontSize: "clamp(56px, 9vw, 112px)",
              fontWeight: 600,
              letterSpacing: "-0.04em",
              lineHeight: 0.94,
              marginBottom: 28,
            }}
          >
            Find your{" "}
            <span
              className="italic text-cs-branch-thinking"
              style={{ fontWeight: 700 }}
            >
              next
            </span>{" "}
            board game.
          </h1>
          <p
            className="font-cs-display italic text-cs-ink/70 max-w-3xl"
            style={{ fontSize: 22, lineHeight: 1.4 }}
          >
            A recommender built on a 12-axis feature profile — what plays
            similarly at the table, not just what other people happen to own.
          </p>
        </header>

        <section className="grid gap-10 lg:grid-cols-[1fr_360px] items-center">
          <div>
            <Stamp color="muted">today&apos;s anchor</Stamp>
            <h2
              className="font-cs-display text-cs-ink mt-1"
              style={{
                fontSize: 40,
                fontWeight: 600,
                letterSpacing: "-0.02em",
                lineHeight: 1.05,
              }}
            >
              {hero.name}
            </h2>
            {hero.signature && (
              <p
                className="font-cs-display italic text-cs-ink/70 mt-3"
                style={{ fontSize: 17 }}
              >
                {hero.signature}
              </p>
            )}
            <p
              className="font-cs-display text-cs-ink/80 mt-6 max-w-xl"
              style={{ fontSize: 16, lineHeight: 1.55 }}
            >
              Drop any game on the lens, overlay a comparison, and re-rank
              under five different philosophies — same weight class, same
              feel, same luck profile, or the research-weighted default.
              Sign in to save a shelf, rate games, and get profile-tuned
              recommendations.
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <Link href="/lens" className="contents">
                <Btn tone="primary" size="lg">
                  Open the lens →
                </Btn>
              </Link>
              <Link href={`/games/${hero.slug}`} className="contents">
                <Btn tone="ghost" size="lg">
                  See {hero.name}
                </Btn>
              </Link>
              <Link href="/login" className="contents">
                <Btn tone="ghost" size="lg">
                  Sign in
                </Btn>
              </Link>
            </div>
          </div>
          <div className="flex justify-center">
            <Radar size={340} values={hero.scores} />
          </div>
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
