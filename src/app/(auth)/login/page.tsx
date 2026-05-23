/**
 * /login — editorial split-screen.
 *
 * Desktop (lg+): two columns — left ink panel with brand pitch + decorative
 * radar, right form column. Mobile: single column, brand panel hidden,
 * form fills the viewport.
 *
 * Server component; the form interactivity lives in <LoginForm /> which
 * runs in the browser and owns the Supabase calls.
 *
 * Layout proportions mirror `design/design_handoff_yournextbg/prod-auth.jsx`
 * `ProductionLogin` — see that file for the canonical spec.
 */

import type { Metadata } from "next";
import { Paper, Radar, Stamp } from "@/components/ui";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign in",
  description:
    "Sign in to yournextbg — the board-game recommender built on a 12-axis taste profile.",
  robots: { index: false, follow: false },
};

// Plausible 12-axis vector for the decorative radar. Order matches AXES
// in `@/lib/scoring/axes`: weight, depth, density, interaction, conflict,
// negotiation, input, output, catchup, theme, engine, narrative.
const DECORATIVE_RADAR: readonly number[] = [
  8, 9, 8, 6, 4, 3, 5, 2, 5, 8, 8, 5,
];

export default function LoginPage() {
  return (
    <Paper
      tone="deep"
      grain={false}
      className="grid min-h-screen w-full lg:grid-cols-[1.05fr_1fr]"
    >
      {/* LEFT — brand pitch (desktop only) */}
      <Paper
        tone="ink"
        className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between"
        style={{ padding: "48px 56px" }}
      >
        {/* Decorative radar tucked in the top-right corner. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute"
          style={{ top: -60, right: -80, opacity: 0.5 }}
        >
          <Radar
            size={500}
            values={DECORATIVE_RADAR}
            labelSize={9}
            ringOpacity={0.12}
            spokeOpacity={0.18}
          />
        </div>

        {/* Top: wordmark + tagline */}
        <div className="relative z-10">
          <div
            className="font-cs-display text-cs-paper"
            style={{ fontSize: 24, fontWeight: 600 }}
          >
            your<em style={{ fontWeight: 500 }}>next</em>bg
          </div>
          <div style={{ marginTop: 4 }}>
            <Stamp color="thinking">the board-game taste matcher</Stamp>
          </div>
        </div>

        {/* Center: headline + sub-paragraph */}
        <div className="relative z-10">
          <h1
            className="font-cs-display text-cs-paper"
            style={{
              fontSize: 56,
              fontWeight: 600,
              letterSpacing: "-0.025em",
              lineHeight: 0.98,
              margin: 0,
            }}
          >
            Find the next game
            <br />
            <em
              className="text-cs-branch-thinking"
              style={{ fontWeight: 500 }}
            >
              you&apos;ll love
            </em>
            .
          </h1>
          <p
            className="font-cs-display"
            style={{
              fontSize: 16,
              lineHeight: 1.55,
              color: "rgba(239,230,208,0.8)",
              maxWidth: 440,
              marginTop: 18,
            }}
          >
            Every game scored on 12 axes across four branches —{" "}
            <span className="text-cs-branch-thinking">Thought</span>,{" "}
            <span className="text-cs-branch-interaction">Interaction</span>,{" "}
            <span className="text-cs-branch-luck">Luck</span>,{" "}
            <span className="text-cs-branch-experience">Experience</span>.
            Rate a few games you already own and we&apos;ll show you the
            next ten you should try.
          </p>
        </div>

        {/* Bottom: 3-stat row */}
        <div
          className="relative z-10 flex"
          style={{ gap: 36 }}
        >
          {(
            [
              ["1,847", "games scored"],
              ["12", "axes per game"],
              ["BGG", "one-click import"],
            ] as const
          ).map(([big, sub]) => (
            <div key={big}>
              <div
                className="font-cs-display text-cs-branch-thinking"
                style={{
                  fontSize: 30,
                  fontWeight: 600,
                  letterSpacing: "-0.02em",
                  lineHeight: 1,
                }}
              >
                {big}
              </div>
              <div style={{ marginTop: 4 }}>
                <Stamp
                  color="paper"
                  style={{ opacity: 0.6 }}
                >
                  {sub}
                </Stamp>
              </div>
            </div>
          ))}
        </div>
      </Paper>

      {/* RIGHT — sign-in form */}
      <section
        className="flex items-center justify-center bg-cs-paper text-cs-ink"
        style={{ padding: "48px 32px" }}
      >
        <div className="w-full" style={{ maxWidth: 480 }}>
          <LoginForm />
        </div>
      </section>
    </Paper>
  );
}
