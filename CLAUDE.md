# Working on yournextbg

@AGENTS.md

> A board game recommender built on a 12-axis feature profile (not collaborative filtering). Live at https://yournextbg.com.

## Required reading (in order)

1. **`README.md`** — methodology essay. Read top to bottom before touching scoring or recommendation logic.
2. **`docs/scoring-handoff.md`** — full briefing for adding games to the catalog. Self-contained: rubric, anchors, workflow, quality bar, pitfalls, target list.
3. **`docs/scoring-log.md`** — reasoning trail for every game in the catalog. Read examples before scoring your first game.

## What this project is in one paragraph

Every game gets twelve 0–10 scores across four "branches" (Thinking/Interaction/Luck/Experience) plus three meta axes (solo, fiddly, player-count vector). Similarity = weighted Euclidean distance under one of five "lenses" (Standard, Same weight class, Same feel, Same luck profile, Unweighted). Every game gets a static `/games/[slug]` SEO page with schema.org Game JSON-LD, a dynamic OG image, and editorial-prose generated from its scores. SEO is the V1 acquisition channel.

## Project state

| | Value |
|---|---|
| Live URL | https://yournextbg.com (HTTPS, Let's Encrypt) |
| Vercel project | `prebenhafnor-5589s-projects/yournextbg` |
| Supabase project | `gkickjaihbgapowsqwhx` |
| GitHub repo | `github.com/predbjorn/yournextbg` (currently **private**) |
| GitHub ↔ Vercel auto-deploy | **Not connected** (repo private). Manual deploy: `pnpm exec vercel --prod` |
| Catalog size | See `GAMES` in `src/data/games.ts` (started at 34, growing) |

## Key locations

| Path | Purpose | Modify? |
|---|---|---|
| `src/lib/scoring/` | Pure-functional engine: axes, lenses, similarity math | **NO** |
| `src/data/games.ts` | Seed catalog. The growth target. | **YES** — add games |
| `src/data/types.ts` | Schema for `Game`, `BggRef`, `PlayerCount` | NO — extending requires migration |
| `src/data/bgg-refs.ts` | BGG "Fans Also Like" snapshots from recommend.games | Optional, for new anchors |
| `src/components/comparator/` | Interactive comparator (client) | Yes, carefully |
| `src/components/game/` | Per-game page server components | Yes, carefully |
| `src/app/games/[slug]/` | Per-game SEO page, generated 1-per-scored-game | Yes |
| `src/app/opengraph-image.tsx` | Dynamic OG image (homepage) | Yes |
| `src/app/games/[slug]/opengraph-image.tsx` | Per-game OG image | Yes |
| `src/app/sitemap.ts`, `robots.ts` | SEO crawl surface | Yes |
| `src/app/icon.tsx`, `apple-icon.tsx` | Favicons | Yes |
| `src/lib/supabase/` | Client (browser/server/admin), middleware, types | Yes, carefully |
| `supabase/migrations/` | Database schema | NO — coordinate first |
| `scripts/seed-games.ts` | Catalog → Supabase upsert | NO |
| `scripts/supabase-health.ts` | Env + connectivity check | Yes |
| `docs/` | Handoff + scoring log | Yes |

## Commands

```bash
# dev
pnpm dev                          # http://localhost:3000 (auto-fallback if busy)

# verification — must pass before commit
pnpm exec tsc --noEmit
pnpm exec next build

# data
pnpm seed:games                   # upsert TS catalog → Supabase (idempotent)
pnpm supabase:health              # verify env + Supabase connectivity

# deploy (manual)
pnpm exec vercel --prod
```

**Node 22 required.** `.nvmrc` pinned. Run `nvm use` in fresh shells.

## Score vector order (LOAD-BEARING)

```
[weight, depth, density, interaction, conflict, negotiation, input, output, catchup, theme, engine, narrative]
    0      1       2          3           4          5          6       7       8       9      10       11
```

Never reorder. Anywhere.

## Conventions

- **Commits:** descriptive subject; body explains the why; include `Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>` footer on agent commits.
- **TypeScript:** strict mode on. No `any`. Prefer `as const` for fixed literals.
- **Tailwind 4:** CSS-first config in `src/app/globals.css` under `:root` and `@theme inline`. Brand colors live there.
- **All identifiers and labels are English.** Axis keys (`weight`, `depth`, `interaction`, `conflict`, etc.), branch keys (`thinking`, `interaction`, `luck`, `experience`), and lens keys are the canonical identifiers used throughout the codebase, DB column values, and JSON-LD. The matching `label` fields are user-facing display strings and may be re-worded for clarity — if you change a label, also update copy in `README.md`, `docs/scoring-handoff.md`, and any prose generators that reference it by name.
- **Branch + commit cadence:** small focused commits. For batched catalog additions, one commit per batch of 5–20 games is fine.

## Known issues / gotchas

- **BGG XML API is now Cloudflare-gated.** `boardgamegeek.com/xmlapi2/thing?id=…` returns **401 Unauthorized** to unauth'd requests, including from server-side curl with a polite UA. Use `bgg-refs.ts` cached snapshots where possible. **Do not assume the API is accessible.**
- **recommend.games:** still works at `https://recommend.games/api/games/{bggId}/similar/?num_games=10` but quality varies. For several high-rank games (Terraforming Mars, Gloomhaven, Spirit Island, Pandemic Legacy) the model returns broken/random neighbors — treat as a soft sanity check, not ground truth.
- **OG image rendering (satori):** every `<div>` with more than one child node MUST have explicit `display: flex | contents | none`. If you add layout to `*opengraph-image.tsx`, you'll hit this.
- **Next.js 16:** `params` is `Promise<…>`. Always `await params` before destructuring. RSC by default; mark client components with `"use client"`.
- **pnpm + Tailwind 4 native binary:** if `next build` errors with `tailwindcss-oxide.darwin-universal.node not found`, run `pnpm add -D @tailwindcss/oxide-darwin-arm64` (or the right arch).
- **Dev server port:** default 3000 is often occupied; Next auto-falls-back to 3001. Logs say which.
- **Auto-classifier blocks reading `.env.local`:** it contains the Supabase service role key. Don't try to `cat` it. Use grep extraction when scripting against env values.

## Adding games to the catalog

→ Read **`docs/scoring-handoff.md`** first. It's the authority. Workflow summary:

1. Pick a game (Priority 1 list at end of handoff)
2. Score per the rubric, anchored against in-catalog games
3. Pass the 5-point quality bar before adding
4. Insert into `src/data/games.ts` matching the `Game` type
5. Log per-axis reasoning in `docs/scoring-log.md`
6. `pnpm exec tsc --noEmit && pnpm exec next build` — both must pass
7. `pnpm seed:games` to sync Supabase
8. Commit + push (manual deploy until GH integration lands)

## When in doubt

- **Don't touch:** `src/lib/scoring/`, `src/data/types.ts`, `supabase/migrations/`, `scripts/seed-games.ts`, `next.config.ts`.
- **Ask in commit:** if you make a judgment call that future readers should know about, put it in the commit body or `docs/scoring-log.md`.
- **The README and the scoring handoff are the source of truth.** If they contradict each other, the README wins and the contradiction should be flagged.
