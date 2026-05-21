/**
 * Default Open Graph image for the site. Rendered at the Edge.
 * 1200×630, matches social card aspect ratio across X / FB / LinkedIn.
 */

import { ImageResponse } from "next/og";

export const alt = "yournextbg — find your next board game by profile";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BG = "#0d1117";
const INK = "#e6edf3";
const INK_DIM = "#8b949e";
const BRANCH = {
  thinking: "#58a6ff",
  interaction: "#f78166",
  luck: "#d4a458",
  experience: "#8957e5",
};

export default async function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: BG,
          display: "flex",
          flexDirection: "column",
          padding: 72,
          position: "relative",
        }}
      >
        {/* Top branch stripe */}
        <div style={{ display: "flex", gap: 6, marginBottom: 56 }}>
          {Object.values(BRANCH).map((c) => (
            <div
              key={c}
              style={{ flex: 1, height: 6, backgroundColor: c, opacity: 0.85 }}
            />
          ))}
        </div>

        {/* Wordmark */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 24,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              fontSize: 28,
              color: BRANCH.interaction,
              letterSpacing: 8,
              textTransform: "uppercase",
              fontFamily: "monospace",
              fontWeight: 700,
            }}
          >
            yournextbg
          </div>
          <div
            style={{
              fontSize: 18,
              color: INK_DIM,
              letterSpacing: 3,
              textTransform: "uppercase",
              fontFamily: "monospace",
            }}
          >
            v1 · recommender
          </div>
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: 112,
            fontWeight: 700,
            color: INK,
            lineHeight: 1.0,
            letterSpacing: -3,
            display: "flex",
            flexWrap: "wrap",
            marginBottom: 28,
          }}
        >
          Find your{" "}
          <span style={{ color: BRANCH.interaction, fontStyle: "italic", fontWeight: 800 }}>
            &nbsp;next&nbsp;
          </span>{" "}
          board game.
        </div>

        {/* Subline */}
        <div
          style={{
            fontSize: 30,
            color: INK_DIM,
            fontStyle: "italic",
            maxWidth: 920,
            lineHeight: 1.35,
          }}
        >
          A recommender built on a 12-axis profile — not what other people own,
          but what plays similarly at the table.
        </div>

        {/* Bottom URL strip */}
        <div
          style={{
            position: "absolute",
            bottom: 56,
            left: 72,
            right: 72,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontFamily: "monospace",
            fontSize: 22,
            color: INK_DIM,
            letterSpacing: 4,
            textTransform: "uppercase",
            paddingTop: 18,
            borderTop: `1px solid #2d333b`,
          }}
        >
          <span>yournextbg.com</span>
          <span>open methodology · MIT</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
