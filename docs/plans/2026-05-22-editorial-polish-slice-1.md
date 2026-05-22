# Editorial Polish — Slice 1 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add closest-neighbor sentence to per-game prose, a FAQ block to the game page, and FAQ JSON-LD — three concrete SEO wins that score-aware-template every page uniquely.

**Architecture:** Pure-functional generators in `src/lib/seo/` (no client state, no async). New `faq.ts` for FAQ items + a small extension to `prose.ts` for the closest-neighbor sentence. JSON-LD addition in `json-ld.ts`. Page wiring in `src/app/games/[slug]/page.tsx`. All generators take `(game, GAMES)` and return plain strings/objects — same shape as existing helpers.

**Tech Stack:** TypeScript strict, Next.js 16 (RSC), Tailwind 4. No new deps. Project has no unit-test framework — verification is `pnpm exec tsc --noEmit`, a smoke script `scripts/check-seo.ts` (added in Task 1), and a dev-server visual check.

**Out of scope (slice 2+):** OG image radar render, "vs. closest neighbor" mini-section, ItemList JSON-LD for similar games, "who this is for" paragraph.

---

## Pre-flight

```bash
git status                            # working tree should be the in-progress batch 13 on src/data/games.ts; that's fine, we won't touch it
pnpm exec tsc --noEmit                # baseline clean
```

If `tsc` baseline fails, stop and surface it before starting.

---

### Task 1: Add `closestNeighbor` helper to `prose.ts`

A pure helper that returns the top-1 similar game and the single most-different axis. Used by Task 2's prose sentence. No page wiring yet.

**Files:**
- Modify: `src/lib/seo/prose.ts` (append after `longDescription`, ~line 171)
- Create: `scripts/check-seo.ts`

**Step 1: Append helper + sentence generator**

Add to the **top** of `src/lib/seo/prose.ts` next to the existing imports:

```typescript
import { AXES, axisIndex, DEFAULT_LENS, rankBySimilarity, axisDeltas, type AxisKey } from "@/lib/scoring";
```

(replace the existing `AXES, axisIndex, type AxisKey` import with the line above)

Append at the bottom of the file:

```typescript
/**
 * Find the most-similar in-catalog game and the single axis where the two
 * profiles differ the most. Used by the closest-neighbor prose sentence and,
 * later, the "vs. X" mini-section.
 */
export interface ClosestNeighbor {
  neighbor: Game;
  sim: number;            // 0..1
  topAxis: AxisKey;       // axis with largest |delta|
  refValue: number;
  neighborValue: number;
}

export function closestNeighbor(g: Game, catalog: readonly Game[]): ClosestNeighbor | null {
  const ranked = rankBySimilarity(g, catalog, DEFAULT_LENS);
  if (ranked.length === 0) return null;
  const top = ranked[0];
  const deltas = axisDeltas(g.scores, top.game.scores);
  const biggest = deltas[0];
  return {
    neighbor: top.game,
    sim: top.sim,
    topAxis: AXES[biggest.axisIndex].key,
    refValue: biggest.a,
    neighborValue: biggest.b,
  };
}

/**
 * One-sentence editorial hook naming the closest in-catalog neighbor and the
 * axis where the two diverge the most. Returns "" if the catalog has fewer
 * than 2 games or the neighbor's similarity is below 0.55 (too dissimilar to
 * be useful — would generate misleading text).
 */
export function closestNeighborSentence(g: Game, catalog: readonly Game[]): string {
  const cn = closestNeighbor(g, catalog);
  if (!cn) return "";
  if (cn.sim < 0.55) return "";
  const ax = AXES[axisIndex(cn.topAxis)];
  const higher = cn.refValue > cn.neighborValue;
  const direction = higher
    ? `but scores higher on ${ax.label.toLowerCase()} (${cn.refValue} vs. ${cn.neighborValue})`
    : `but scores lower on ${ax.label.toLowerCase()} (${cn.refValue} vs. ${cn.neighborValue})`;
  const pct = Math.round(cn.sim * 100);
  return `Of every game in our catalog, ${g.name} is closest to ${cn.neighbor.name} (${pct}% profile match) ${direction}.`;
}
```

**Step 2: Create the smoke-check script**

Create `scripts/check-seo.ts`:

```typescript
/**
 * Smoke check for SEO generators. Not a unit-test framework — just exercises
 * each helper against two real catalog games and prints output, plus a
 * handful of cheap assertions. Run between tasks:
 *
 *   pnpm tsx scripts/check-seo.ts
 */

import { GAMES } from "../src/data/games";
import {
  generateBranchProse,
  metaDescription,
  longDescription,
  closestNeighbor,
  closestNeighborSentence,
} from "../src/lib/seo/prose";

function pick(slug: string) {
  const g = GAMES.find((x) => x.slug === slug);
  if (!g) throw new Error(`Sample game not in catalog: ${slug}`);
  return g;
}

const samples = [pick("brass-birmingham"), pick("azul")].filter(Boolean);
if (samples.length === 0) {
  // fall back to first two games in catalog if the named ones aren't present
  samples.push(...GAMES.slice(0, 2));
}

let failures = 0;
function check(label: string, cond: boolean, detail?: string) {
  const tag = cond ? "PASS" : "FAIL";
  console.log(`  [${tag}] ${label}${detail ? ` — ${detail}` : ""}`);
  if (!cond) failures++;
}

for (const g of samples) {
  console.log(`\n=== ${g.name} (${g.slug}) ===`);

  const prose = generateBranchProse(g);
  console.log("thinking:    ", prose.thinking);
  console.log("interaction: ", prose.interaction);
  console.log("luck:        ", prose.luck);
  console.log("experience:  ", prose.experience);

  const cn = closestNeighbor(g, GAMES);
  console.log("closest:     ", cn ? `${cn.neighbor.name} (sim ${cn.sim.toFixed(3)}, top axis ${cn.topAxis})` : "(none)");
  console.log("cn sentence: ", closestNeighborSentence(g, GAMES));
  console.log("meta:        ", metaDescription(g));
  console.log("long:        ", longDescription(g));

  check("prose.thinking is non-empty", prose.thinking.length > 20);
  check("metaDescription <= 160 chars", metaDescription(g).length <= 160, `len=${metaDescription(g).length}`);
  if (cn) {
    check("closest neighbor is not self", cn.neighbor.id !== g.id);
    check("similarity in [0,1]", cn.sim >= 0 && cn.sim <= 1);
  }
}

console.log(`\n${failures === 0 ? "OK" : "FAILED"} — ${failures} failure(s)`);
process.exit(failures === 0 ? 0 : 1);
```

**Step 3: Verify**

```bash
pnpm exec tsc --noEmit
pnpm tsx scripts/check-seo.ts
```

Expected: `tsc` exits 0. Smoke script prints `OK — 0 failure(s)` and shows a non-empty closest-neighbor sentence for both sample games.

**Step 4: Commit**

```bash
git add src/lib/seo/prose.ts scripts/check-seo.ts
git commit -m "$(cat <<'EOF'
Add closestNeighbor helper + SEO smoke-check script

Pure-functional helpers in lib/seo/prose: closestNeighbor() picks the top
match by DEFAULT_LENS similarity and the single most-divergent axis;
closestNeighborSentence() emits one editorial sentence naming both games.
Returns "" when sim < 0.55 to avoid misleading prose on outlier games.

scripts/check-seo.ts is a tsx smoke runner against two real catalog games —
no test framework, just enough assertions to catch obvious regressions
between tasks.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Wire closest-neighbor sentence into the lead paragraph

**Files:**
- Modify: `src/app/games/[slug]/page.tsx:54-60, 120-125`

**Step 1: Pull in the new helper**

Edit the import block (around line 14-18):

```typescript
import {
  generateBranchProse,
  longDescription,
  metaDescription,
  closestNeighborSentence,
} from "@/lib/seo/prose";
```

**Step 2: Compute the sentence in the page component**

Inside `GamePage`, after `const prose = generateBranchProse(game);` (line ~59), add:

```typescript
  const closestSentence = closestNeighborSentence(game, GAMES);
```

**Step 3: Render it after the existing lead paragraph**

Change the lead section (lines ~121-125) from:

```tsx
      <section className="mb-10 max-w-3xl">
        <p className="text-[18px] leading-relaxed font-serif text-[var(--ink)]">
          {prose.thinking} {prose.interaction}
        </p>
      </section>
```

to:

```tsx
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
```

**Step 4: Verify**

```bash
pnpm exec tsc --noEmit
pnpm dev   # background; visit http://localhost:3000/games/brass-birmingham and one other
```

Expected: `tsc` exits 0. Two different game pages show two different closest-neighbor sentences (the names must differ between pages).

**Step 5: Commit**

```bash
git add src/app/games/\[slug\]/page.tsx
git commit -m "$(cat <<'EOF'
Surface closest-neighbor sentence below the lead paragraph

Every per-game page now mentions one other catalog game by name in the
above-the-fold prose — each page becomes substantively unique on Google
even when score buckets collide.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Add FAQ generator (`src/lib/seo/faq.ts`)

Score-aware questions and answers. Pure-functional. Five fixed questions per game; answers chosen from buckets.

**Files:**
- Create: `src/lib/seo/faq.ts`
- Modify: `scripts/check-seo.ts` (add FAQ exercise)

**Step 1: Create the FAQ generator**

Create `src/lib/seo/faq.ts`:

```typescript
/**
 * Score-aware FAQ generator. Five fixed questions, each answered from the
 * game's score vector and meta-axes. Used both as visible page content and
 * as FAQPage JSON-LD (eligible for Google rich results).
 */

import { axisIndex } from "@/lib/scoring";
import type { Game } from "@/data/types";

export interface FaqItem {
  q: string;
  a: string;
}

function score(g: Game, key: Parameters<typeof axisIndex>[0]): number {
  return g.scores[axisIndex(key)];
}

function isSoloGood(g: Game): string {
  if (g.solo >= 8) return `Yes — ${g.name} has an excellent solo mode (solo ${g.solo}/10). Many players consider it a top-tier solo experience.`;
  if (g.solo >= 6) return `${g.name} works well solo (solo ${g.solo}/10), though the multiplayer is where the design shines.`;
  if (g.solo >= 4) return `${g.name} is playable solo (solo ${g.solo}/10), but the experience is noticeably thinner without other players.`;
  if (g.solo >= 2) return `${g.name} is technically solo-able (solo ${g.solo}/10), but it isn't designed for it — pick something else for solo nights.`;
  return `No — ${g.name} is a strictly multiplayer experience (solo ${g.solo}/10).`;
}

function bestPlayerCount(g: Game): string {
  const best = g.playerCount?.best ?? [];
  const good = g.playerCount?.good ?? [];
  const bad = g.playerCount?.bad ?? [];
  if (best.length === 0 && good.length === 0) {
    return `${g.name} doesn't have a strong player-count preference in our rubric — it plays similarly across its full range.`;
  }
  const bestStr = best.join(", ");
  const parts: string[] = [];
  if (best.length > 0) parts.push(`${g.name} is at its best at ${bestStr}`);
  if (good.length > 0) parts.push(`with ${good.join(", ")} also strong`);
  if (bad.length > 0) parts.push(`${bad.join(", ")} is the weakest count`);
  return parts.join("; ") + ".";
}

function isHeavy(g: Game): string {
  const w = score(g, "weight");
  if (w >= 8) return `Yes — ${g.name} is a heavy game (weight ${w}/10). Expect a serious rules teach and a multi-hour first session.`;
  if (w >= 6) return `${g.name} is medium-heavy (weight ${w}/10) — substantial but learnable in one sitting with an experienced teacher.`;
  if (w >= 4) return `${g.name} sits in the medium-weight range (weight ${w}/10). New players can pick it up in a single explanation.`;
  if (w >= 2) return `${g.name} is on the lighter side (weight ${w}/10) — easy to teach, friendly to new players.`;
  return `${g.name} is very light (weight ${w}/10). Rules explained in minutes.`;
}

function howLucky(g: Game): string {
  const input = score(g, "input");
  const output = score(g, "output");
  if (output >= 7) return `${g.name} has significant output randomness (${output}/10) — dice, reveals, or end-of-turn surprises can swing the outcome after your decisions.`;
  if (input >= 7) return `${g.name} has high input luck (${input}/10) but low output luck (${output}/10) — variance arrives before you choose, so good play means adapting to what you're dealt.`;
  if (input <= 3 && output <= 3) return `${g.name} is a near-skill game (input ${input}/10, output ${output}/10) — very little blame to lay on the dice.`;
  return `${g.name} has moderate variance (input ${input}/10, output ${output}/10).`;
}

function howConfrontational(g: Game): string {
  const interaction = score(g, "interaction");
  const conflict = score(g, "conflict");
  if (conflict >= 7) return `Highly confrontational — ${g.name} scores ${conflict}/10 on direct conflict. Friendships will be tested.`;
  if (conflict >= 4) return `${g.name} has meaningful but contained conflict (${conflict}/10) — friction without table-flipping.`;
  if (interaction >= 6) return `${g.name} is interactive (${interaction}/10) but not aggressive (conflict ${conflict}/10) — the contention is over shared resources, not direct attacks.`;
  return `${g.name} is largely non-confrontational (interaction ${interaction}/10, conflict ${conflict}/10) — leans toward parallel play.`;
}

export function generateFaq(g: Game): FaqItem[] {
  return [
    { q: `Is ${g.name} good solo?`,              a: isSoloGood(g) },
    { q: `What player count is ${g.name} best at?`, a: bestPlayerCount(g) },
    { q: `Is ${g.name} a heavy game?`,           a: isHeavy(g) },
    { q: `How much luck is there in ${g.name}?`, a: howLucky(g) },
    { q: `Is ${g.name} confrontational?`,        a: howConfrontational(g) },
  ];
}
```

**Step 2: Exercise it in the smoke script**

Append at the end of `scripts/check-seo.ts`, before the final `console.log(... failures ...)` line:

```typescript
import { generateFaq } from "../src/lib/seo/faq";

for (const g of samples) {
  console.log(`\n=== FAQ: ${g.name} ===`);
  const faq = generateFaq(g);
  for (const item of faq) {
    console.log(`Q: ${item.q}`);
    console.log(`A: ${item.a}\n`);
  }
  check("FAQ has 5 items", faq.length === 5);
  check("All FAQ answers mention the game name", faq.every((x) => x.a.includes(g.name)));
}
```

Note: the new `import` must move to the top of the file with the others — re-order so all imports are at the top.

**Step 3: Verify**

```bash
pnpm exec tsc --noEmit
pnpm tsx scripts/check-seo.ts
```

Expected: `tsc` exits 0. Script prints `OK — 0 failure(s)` and shows five distinct, score-aware FAQ entries per sample game.

**Step 4: Commit**

```bash
git add src/lib/seo/faq.ts scripts/check-seo.ts
git commit -m "$(cat <<'EOF'
Add score-aware FAQ generator for game pages

Five fixed questions per game (solo, player count, weight, luck, conflict)
each answered from the 12-axis scores + meta-axes. Pure-functional, no
client state. Wired into the smoke-check script.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Add `faqJsonLd` to `json-ld.ts`

**Files:**
- Modify: `src/lib/seo/json-ld.ts` (append before `jsonLdString`)

**Step 1: Append FAQ JSON-LD generator**

Add the import at the top of `src/lib/seo/json-ld.ts`:

```typescript
import type { FaqItem } from "./faq";
```

Append before `jsonLdString` (around line 128):

```typescript
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
```

**Step 2: Verify**

```bash
pnpm exec tsc --noEmit
```

Expected: exits 0.

**Step 3: Commit**

```bash
git add src/lib/seo/json-ld.ts
git commit -m "$(cat <<'EOF'
Add FAQPage JSON-LD generator

Eligible for Google FAQ rich results — each page emits its five score-aware
Q&A pairs as structured data alongside the existing Game schema.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Render FAQ block + FAQ JSON-LD on the page

**Files:**
- Modify: `src/app/games/[slug]/page.tsx`

**Step 1: Imports**

Add to the imports at the top:

```typescript
import { generateFaq } from "@/lib/seo/faq";
import {
  gameJsonLd,
  gameBreadcrumb,
  faqJsonLd,
  jsonLdString,
} from "@/lib/seo/json-ld";
```

(Replace the existing `gameJsonLd, gameBreadcrumb, jsonLdString` import line with the block above.)

**Step 2: Compute FAQ in the component**

After `const closestSentence = closestNeighborSentence(game, GAMES);` (from Task 2), add:

```typescript
  const faq = generateFaq(game);
  const faqLd = faqJsonLd(faq);
```

**Step 3: Emit the FAQ JSON-LD `<script>`**

Below the two existing `<script type="application/ld+json">` tags (around line 76), add a third:

```tsx
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: jsonLdString(faqLd) }}
      />
```

**Step 4: Render the FAQ section**

Insert this section **between** the "Similar games" section and the CTA section (around line 175, after `</section>` of SimilarGamesList and before the `border-t border-dashed` CTA section):

```tsx
      {/* FAQ — score-aware Q&A, also emitted as FAQPage JSON-LD above */}
      <section className="mb-12">
        <h2 className="font-serif text-3xl font-bold tracking-tight mb-2">
          Frequently asked
        </h2>
        <p className="text-[var(--ink-dim)] italic mb-6 max-w-2xl">
          Answers derived directly from {game.name}&apos;s 12-axis profile.
        </p>
        <dl className="max-w-3xl divide-y divide-[var(--border)]">
          {faq.map((item) => (
            <div key={item.q} className="py-4">
              <dt className="font-serif font-semibold text-[17px] text-[var(--ink)] mb-1">
                {item.q}
              </dt>
              <dd className="text-[16px] leading-relaxed text-[var(--ink-dim)]">
                {item.a}
              </dd>
            </div>
          ))}
        </dl>
      </section>
```

**Step 5: Verify**

```bash
pnpm exec tsc --noEmit
pnpm exec next build           # production build must succeed — generates all /games/[slug] pages
pnpm dev                       # in background; visit two different game pages
```

In a browser, on at least one game page:

1. FAQ section visible with 5 questions and 5 answers.
2. View source — three separate `<script type="application/ld+json">` blocks present (Game, BreadcrumbList, FAQPage).
3. Paste the page URL into https://search.google.com/test/rich-results (optional sanity check) — FAQ should be detected.
4. The closest-neighbor sentence and the FAQ refer to the same game name consistently.

**Step 6: Commit**

```bash
git add src/app/games/\[slug\]/page.tsx
git commit -m "$(cat <<'EOF'
Render FAQ block + FAQPage JSON-LD on per-game pages

Five score-aware Q&A entries surface below similar-games. Same items are
embedded as FAQPage structured data, eligible for Google FAQ rich results.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Final verification + push

**Step 1: Full verification matrix**

```bash
pnpm exec tsc --noEmit
pnpm tsx scripts/check-seo.ts
pnpm exec next build
```

All three exit 0. `next build` should generate one static page per catalog entry under `/games/[slug]`.

**Step 2: Spot-check three live pages**

Pick three games with very different profiles, e.g.:
- A heavy euro (`brass-birmingham`)
- A light filler (`azul` or `sushi-go-party`)
- A confrontational/conflict game (any with `conflict >= 7` from `src/data/games.ts`)

For each, verify:
- Closest-neighbor sentence names a *plausible* neighbor (sanity check the rubric, not the code)
- All five FAQ answers mention the game by name
- No broken layout on small viewport (375px)

If a closest-neighbor pairing looks obviously wrong on a real page (e.g. a heavy 18xx game paired with a children's game), **don't fix it in code** — it's a scoring problem and belongs in the catalog work happening in parallel. Note it in `docs/scoring-log.md` under a new "neighbor-sanity" section.

**Step 3: Push**

```bash
git push origin main
```

Vercel auto-deploys. Watch the deploy log; first successful build of the post-FAQ pages is the "done" signal.

---

## Definition of done

- [ ] Each task's verification step passed before its commit.
- [ ] `pnpm exec tsc --noEmit` and `pnpm exec next build` both exit 0 at the end.
- [ ] `scripts/check-seo.ts` exits 0.
- [ ] Three live spot-checked pages render closest-neighbor sentence + 5-item FAQ + FAQ JSON-LD in view source.
- [ ] Six commits pushed to `main` (one per task; Task 6 has no commit, just push).
- [ ] No new dependencies in `package.json`.
- [ ] No changes to `src/lib/scoring/`, `src/data/types.ts`, `supabase/migrations/`, `scripts/seed-games.ts`, `next.config.ts` (per CLAUDE.md "don't touch" list).
