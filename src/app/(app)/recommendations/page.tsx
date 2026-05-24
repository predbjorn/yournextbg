import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/get-session";
import { getProfileRecs, getRatingsCount } from "@/lib/recs/queries";
import { RecsGrid } from "@/components/recs/recs-grid";
import { Stamp } from "@/components/ui";

export const dynamic = "force-dynamic";

const MIN_RATINGS = 5;

export default async function RecommendationsPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const ratings = await getRatingsCount();
  if (ratings < MIN_RATINGS) {
    return (
      <main className="min-h-screen bg-cs-paper-deep cs-grain">
        <div className="container mx-auto px-6 py-10 max-w-4xl">
          <header className="mb-8">
            <Stamp color="muted">recommendations</Stamp>
            <h1
              className="font-cs-display text-cs-ink mt-1"
              style={{
                fontSize: 36,
                fontWeight: 600,
                letterSpacing: "-0.02em",
                lineHeight: 1.05,
              }}
            >
              Need {MIN_RATINGS - ratings} more rating
              {MIN_RATINGS - ratings === 1 ? "" : "s"}.
            </h1>
            <p
              className="font-cs-display italic text-cs-ink/70 mt-3"
              style={{ fontSize: 16, maxWidth: 520 }}
            >
              We build recommendations from a weighted centroid in axis
              space. A handful of ★1–5 ratings is enough to draw a useful
              taste profile; one or two isn&apos;t.
            </p>
            <Link
              href="/rate"
              className="font-cs-mono uppercase text-cs-ink mt-6 inline-block"
              style={{
                fontSize: 11,
                letterSpacing: "0.18em",
                borderBottom: "1px dotted rgba(28,26,20,0.4)",
              }}
            >
              Rate some games →
            </Link>
          </header>
        </div>
      </main>
    );
  }

  const recs = await getProfileRecs(30);

  return (
    <main className="min-h-screen bg-cs-paper-deep cs-grain">
      <div className="container mx-auto px-6 py-10 max-w-6xl">
        <header className="mb-8">
          <Stamp color="muted">recommendations</Stamp>
          <h1
            className="font-cs-display text-cs-ink mt-1"
            style={{
              fontSize: 36,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              lineHeight: 1.05,
            }}
          >
            Picked for your taste
          </h1>
          <p
            className="font-cs-display italic text-cs-ink/70 mt-3"
            style={{ fontSize: 15, maxWidth: 560 }}
          >
            Distance from your weighted centroid in 12-axis space. The
            anchor line below each card names the rated game that pulled
            it into your shortlist.
          </p>
        </header>
        <RecsGrid initial={recs} />
      </div>
    </main>
  );
}
