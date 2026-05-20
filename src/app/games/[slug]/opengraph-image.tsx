/**
 * Per-game Open Graph image. Shows the game name + branch averages +
 * top 3 highest-scoring axes — gives a glanceable card on social shares.
 */

import { ImageResponse } from "next/og";
import { AXES, BRANCHES, type Branch } from "@/lib/scoring";
import { GAMES, getGameBySlug } from "@/data/games";

export const alt = "Board game 12-axis profile";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BG = "#0d1117";
const BG_CARD = "#1c2128";
const INK = "#e6edf3";
const INK_DIM = "#8b949e";
const INK_MUTE = "#6e7681";
const BORDER = "#2d333b";

const BRANCH_ORDER: Branch[] = ["tanke", "interaksjon", "flaks", "opplevelse"];
const BRANCH_LABEL: Record<Branch, string> = {
  tanke: "Tanke",
  interaksjon: "Interaksjon",
  flaks: "Flaks",
  opplevelse: "Opplevelse",
};

function branchAverage(scores: readonly number[], branch: Branch): number {
  const idx = AXES.map((ax, i) => ({ ax, i })).filter((x) => x.ax.branch === branch);
  const sum = idx.reduce((s, { i }) => s + scores[i], 0);
  return Math.round((sum / idx.length) * 10) / 10;
}

export async function generateStaticParams() {
  return GAMES.map((g) => ({ slug: g.slug }));
}

export default async function OG({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const game = getGameBySlug(slug);
  if (!game) {
    return new ImageResponse(<div />, { ...size });
  }

  // Top 3 highest-scoring axes
  const topAxes = AXES.map((ax, i) => ({ ax, value: game.scores[i] }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: BG,
          display: "flex",
          flexDirection: "column",
          padding: 56,
          position: "relative",
        }}
      >
        {/* Header strip */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontFamily: "monospace",
            fontSize: 20,
            color: INK_MUTE,
            letterSpacing: 4,
            textTransform: "uppercase",
            marginBottom: 36,
            paddingBottom: 18,
            borderBottom: `1px solid ${BORDER}`,
          }}
        >
          <span style={{ color: BRANCHES.interaksjon.color }}>yournextbg</span>
          <span>{game.categoryLabel}</span>
        </div>

        {/* Game name */}
        <div
          style={{
            fontSize: 86,
            fontWeight: 700,
            color: INK,
            lineHeight: 1.0,
            letterSpacing: -2,
            marginBottom: 20,
            maxWidth: 1080,
          }}
        >
          {game.name}
        </div>

        {/* Signature */}
        {game.signature && (
          <div
            style={{
              fontSize: 28,
              color: INK_DIM,
              fontStyle: "italic",
              maxWidth: 1080,
              marginBottom: 44,
              lineHeight: 1.3,
            }}
          >
            {game.signature}
          </div>
        )}

        {/* Branch averages — 4 chips */}
        <div style={{ display: "flex", gap: 16, marginBottom: 28 }}>
          {BRANCH_ORDER.map((b) => {
            const color = BRANCHES[b].color;
            const avg = branchAverage(game.scores, b);
            return (
              <div
                key={b}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  flex: 1,
                  backgroundColor: BG_CARD,
                  border: `1px solid ${BORDER}`,
                  borderLeft: `4px solid ${color}`,
                  padding: "18px 22px",
                }}
              >
                <div
                  style={{
                    fontFamily: "monospace",
                    fontSize: 14,
                    color,
                    letterSpacing: 3,
                    textTransform: "uppercase",
                    marginBottom: 6,
                  }}
                >
                  {BRANCH_LABEL[b]}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 4,
                    fontSize: 48,
                    fontWeight: 700,
                    color: INK,
                    lineHeight: 1,
                  }}
                >
                  <span>{avg.toFixed(1)}</span>
                  <span style={{ fontSize: 22, color: INK_MUTE, fontWeight: 400 }}>
                    /10
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Top-3 standout axes */}
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            fontFamily: "monospace",
            fontSize: 18,
            color: INK_MUTE,
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          <span>Standouts:</span>
          {topAxes.map(({ ax, value }) => (
            <div
              key={ax.key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 14px",
                border: `1px solid ${BRANCHES[ax.branch].color}`,
                color: BRANCHES[ax.branch].color,
                borderRadius: 2,
                backgroundColor: "rgba(255,255,255,0.02)",
              }}
            >
              <span>{ax.label}</span>
              <span style={{ color: INK, fontWeight: 700 }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            position: "absolute",
            bottom: 36,
            left: 56,
            right: 56,
            display: "flex",
            justifyContent: "space-between",
            fontFamily: "monospace",
            fontSize: 18,
            color: INK_MUTE,
            letterSpacing: 3,
            textTransform: "uppercase",
            paddingTop: 14,
            borderTop: `1px solid ${BORDER}`,
          }}
        >
          <span>yournextbg.com/games/{game.slug}</span>
          <span>12-axis profile</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
