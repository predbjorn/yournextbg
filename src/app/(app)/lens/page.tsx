import { getUser } from "@/lib/auth/get-session";
import { getLensSeed } from "@/lib/lens/queries";
import { LensClient } from "@/components/lens/lens-client";
import { Stamp } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function LensPage() {
  // Public route: anyone can explore the lens without an account. When
  // signed in we seed with the user's top-rated game; otherwise we fall
  // back to a known central catalog anchor.
  const user = await getUser();
  const seed = await getLensSeed(user?.id ?? null);

  return (
    <main className="min-h-screen bg-cs-paper-deep cs-grain">
      <div className="container mx-auto px-6 py-10 max-w-6xl">
        <header className="mb-8">
          <Stamp color="muted">comparison lens</Stamp>
          <h1
            className="font-cs-display text-cs-ink mt-1"
            style={{
              fontSize: 36,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              lineHeight: 1.05,
            }}
          >
            Two games, one shape.
          </h1>
          <p
            className="font-cs-display italic text-cs-ink/70 mt-3"
            style={{ fontSize: 15, maxWidth: 580 }}
          >
            Anchor on any game, then pick a comparison. The 12-axis radar
            overlays both. Re-rank under a different lens to see who their
            neighbors really are.
          </p>
        </header>
        <LensClient seed={seed} />
      </div>
    </main>
  );
}
