/**
 * 12-axis radar/spider chart. Two games can be overlaid.
 *
 * Pure presentational — no state. Takes already-resolved Game objects.
 */

import { AXES, BRANCHES, type ScoreVector } from "@/lib/scoring";
import type { Game } from "@/data/types";

const R = 180;
const N = AXES.length;
const SECTOR_DEG = 360 / N;

function polarToXY(angleDeg: number, r: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: r * Math.cos(rad), y: r * Math.sin(rad) };
}

function polygonPoints(scores: ScoreVector): string {
  return AXES.map((_, i) => {
    const p = polarToXY(i * SECTOR_DEG, (R * scores[i]) / 10);
    return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  }).join(" ");
}

function vertexDots(scores: ScoreVector, color: string) {
  return AXES.map((_, i) => {
    const p = polarToXY(i * SECTOR_DEG, (R * scores[i]) / 10);
    return (
      <circle
        key={i}
        cx={p.x.toFixed(1)}
        cy={p.y.toFixed(1)}
        r={3}
        fill={color}
      />
    );
  });
}

interface RadarProps {
  gameA?: Game | null;
  gameB?: Game | null;
  className?: string;
}

export function Radar({ gameA, gameB, className }: RadarProps) {
  return (
    <svg
      viewBox="-260 -260 520 520"
      className={className}
      aria-label="12-axis profile radar"
    >
      {/* Concentric rings 2/4/6/8/10 */}
      {[2, 4, 6, 8, 10].map((v) => (
        <circle
          key={v}
          cx={0}
          cy={0}
          r={(R * v) / 10}
          fill="none"
          stroke="#2d333b"
          strokeWidth={0.6}
          strokeDasharray="2 3"
        />
      ))}
      <circle cx={0} cy={0} r={R} fill="none" stroke="#3a4452" strokeWidth={1} />

      {/* Tick numbers along the top axis */}
      {[2, 4, 6, 8, 10].map((v) => {
        const p = polarToXY(0, (R * v) / 10);
        return (
          <text
            key={`tick-${v}`}
            x={(p.x + 5).toFixed(1)}
            y={(p.y - 1).toFixed(1)}
            fill="#6e7681"
            fontFamily="var(--font-mono)"
            fontSize={7}
            opacity={0.55}
          >
            {v}
          </text>
        );
      })}

      {/* Spokes + labels */}
      {AXES.map((ax, i) => {
        const angle = i * SECTOR_DEG;
        const end = polarToXY(angle, R);
        const labelP = polarToXY(angle, R + 32);
        const color = BRANCHES[ax.branch].color;
        return (
          <g key={ax.key}>
            <line
              x1={0}
              y1={0}
              x2={end.x.toFixed(1)}
              y2={end.y.toFixed(1)}
              stroke={color}
              strokeWidth={0.6}
              strokeOpacity={0.45}
            />
            <text
              x={labelP.x.toFixed(1)}
              y={labelP.y.toFixed(1)}
              textAnchor="middle"
              dominantBaseline="central"
              fill={color}
              fontFamily="var(--font-mono)"
              fontSize={10}
              letterSpacing={0.6}
              fontWeight={600}
            >
              {ax.label.toUpperCase()}
            </text>
          </g>
        );
      })}

      {/* Game A polygon (solid orange) */}
      {gameA && (
        <g>
          <polygon
            points={polygonPoints(gameA.scores)}
            fill="#f78166"
            fillOpacity={0.18}
            stroke="#f78166"
            strokeWidth={2}
            strokeLinejoin="round"
          />
          {vertexDots(gameA.scores, "#f78166")}
        </g>
      )}

      {/* Game B polygon (dashed blue) */}
      {gameB && (
        <g>
          <polygon
            points={polygonPoints(gameB.scores)}
            fill="#58a6ff"
            fillOpacity={0.12}
            stroke="#58a6ff"
            strokeWidth={2}
            strokeDasharray="5 3"
            strokeLinejoin="round"
          />
          {vertexDots(gameB.scores, "#58a6ff")}
        </g>
      )}
    </svg>
  );
}
