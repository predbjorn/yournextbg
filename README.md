# yournextbg

> A board game recommendation engine built on a **12-axis profile**, not collaborative filtering. Find your next game based on what plays similarly at the table — not just what other people happen to own.

**Status:** Pre-launch. Methodology and prototype validated; scoring catalog being built.
**Live site:** [yournextbg.com](https://yournextbg.com) *(coming soon)*

---

## Why another recommender?

[BoardGameGeek](https://boardgamegeek.com)'s "Fans Also Like" is collaborative filtering: it surfaces games that *the same people* tend to rate highly. That works, but it has known failure modes:

- **Collection-bubble bias** — heavy euro fans co-rate other heavy euros highly, even when the *experience* at the table is very different.
- **Cold-start failure** — niche or new games don't have enough ratings to produce useful neighbors.
- **No explanation** — you find out which games other people liked. You don't find out *why* the games are similar or where they diverge.

`yournextbg` takes a **feature-based** approach: every game gets scored on 12 carefully chosen axes that, according to a literature review of design frameworks (MDA, Quantic Foundry's empirical motivation study, Engelstein's input/output randomness, Wehrlegig's design notes) and reviewer/forum debates over near-identical games (Brass: Birmingham vs Lancashire, Voidfall vs Eclipse, Wingspan vs the rest), are the dimensions that *actually predict* whether one player will love a game that another bounces off.

Once scored, two games can be compared by **weighted Euclidean distance** in 12-dimensional profile space. The result: you can find similar games even when no one has ever rated both of them, and you get a concrete answer to "why?" — the axes where they differ most.

## The 12 axes

Organized into 4 "branches" of a skill tree. Each axis is scored 0–10.

### 🧠 Tanke — *how much brainwork?*
| Axis | What it measures |
|---|---|
| **Vekt** | Rules and concept overhead. Hive is vekt 2 / dybde 9. |
| **Dybde** | Decision-tree size, independent of rules complexity. |
| **Density** | Meaningful choices per minute on your turn. |

### ⚔️ Interaksjon — *how multiplayer is the multiplayer?*
| Axis | What it measures |
|---|---|
| **Inter** | Do other players' actions disrupt your plans? Wingspan = 2, Brass = 9. |
| **Konflikt** | Direct hostile actions. *Orthogonal to interaction* — Sidereal Confluence is interaction 10 / konflikt 1. |
| **Forhandl** | Does winning require talking? John Company = 10, Wingspan = 0. |

### 🎲 Flaks — *where does luck live?*
| Axis | What it measures |
|---|---|
| **Input** | Luck *before* your decisions (card draws, market refresh). |
| **Output** | Luck *after* your decisions (combat dice, reveals). |
| **Innhente** | Catch-up strength. High = strong rubber-band; low = runaway-leader risk. |

### 🎭 Opplevelse — *how does it feel?*
| Axis | What it measures |
|---|---|
| **Tema** | Pasted-on vs mechanically baked-in. Tapestry = 3, Spirit Island = 10. |
| **Motor** | Engine/combo payoff arc. Race for the Galaxy = 10, Carcassonne = 2. |
| **Narrativ** | Does a session tell a story or repeat? Legacy games = 10, Catan = 1. |

Plus three **meta axes** that gate or contextualize rather than encode taste:
- **Solo** quality (0–10)
- **Fiddliness** (upkeep/bookkeeping, 0–10)
- **Player-count fit vector** (per-count score: 1P / 2P / 3P / 4P / 5+P)

## Lenses — how to compare

A single similarity metric doesn't fit all questions. `yournextbg` defines five lenses that re-weight the 12 axes for different purposes:

| Lens | Weights highest | When to use |
|---|---|---|
| **Standard** | Vekt ×2.0, Inter ×1.8, Output ×1.4 | Default. Research-backed gate axes. |
| **Tilsvarende vekt** | Vekt ×3.0, Dybde ×2.2 | "Find me something in the same complexity class." |
| **Samme opplevelse** | Inter ×2.5, Tema ×2.2, Narrativ ×2.0 | "I don't care about weight — find the same vibe." |
| **Samme flaks-profil** | Input/Output ×2.5 | "I love (or hate) dice — keep that the same." |
| **Uvektet** | All ×1.0 | Raw Euclidean. The original v1 engine. |

The math:

```
distance² = Σ wᵢ × (aᵢ − bᵢ)²
similarity = 1 − distance / maxDistance   ∈ [0, 1]
```

where `maxDistance = √(Σ wᵢ × 100)` — the distance produced if every axis differs by the maximum 10 points.

## How games get scored

Manually scoring 99,000+ games doesn't scale. The plan, in order:

1. **Editorial seed** — ~215 anchor games scored manually with rubric calibration (ongoing).
2. **LLM-assisted scoring** — Claude reads each rulebook + BGG description against the rubric and proposes scores. A human reviewer (you) approves or adjusts in a Next.js admin route. ~30–50 games/day reviewed once the prompt is stable.
3. **ML extrapolation** (later) — train a regressor on the editorial set + BGG features (mechanics, weight, designer) to bootstrap scores for the long tail, with confidence intervals.

All scores are stored in Postgres (Supabase) with full audit trail — who scored, when, why.

## Tech stack

- **Web:** Next.js 16 (App Router) + React 19 + TypeScript + Tailwind 4. SEO-first: every game gets a server-rendered page with `schema.org/Game` JSON-LD, Open Graph, and a slot in the sitemap.
- **Data:** Supabase (Postgres + Auth + Storage + Edge Functions). Free tier sufficient through V1.
- **Hosting:** Vercel (web) + Supabase (everything else).
- **BGG integration:** Server-side proxy to the BGG XML API2 with aggressive caching (game metadata is near-static; 30-day TTL is fine).
- **Mobile (V2):** Native Swift + Kotlin, generated from an OpenAPI spec.

## Project structure

```
yournextbg/
├── src/
│   ├── app/                  Next.js App Router (pages, layouts)
│   ├── data/                 Typed seed catalog + BGG refs
│   │   ├── games.ts
│   │   ├── bgg-refs.ts
│   │   └── types.ts
│   ├── lib/
│   │   └── scoring/          Pure-functional scoring engine
│   │       ├── axes.ts       12-axis definitions
│   │       ├── lenses.ts     Weight presets
│   │       └── similarity.ts Weighted Euclidean
│   └── components/           UI (radar, comparator, score panels)
├── scripts/                  LLM scoring pipeline, BGG sync
└── supabase/                 Migrations, seed
```

## Getting started

Requires Node 22 (see `.nvmrc`).

```bash
nvm use            # or install Node 22
pnpm install
pnpm dev           # http://localhost:3000
```

## Supabase setup (optional for V1 — app runs without it)

The auth and user-collection features need a Supabase project. The scoring
engine, comparator, and game pages all work without it.

1. **Copy env template:** `cp .env.example .env.local`
2. **Fill in keys** from
   [supabase.com/dashboard/project/_/settings/api](https://supabase.com/dashboard/project/_/settings/api):
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public)
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only, never commit)
3. **Apply the schema:** open the Supabase dashboard SQL editor and paste
   `supabase/migrations/0000_initial_schema.sql`. Sets up `games`,
   `collections`, `collection_items`, `bgg_cache` with RLS.
4. **Verify connection:** `pnpm supabase:health`
5. **Seed the catalog:** `pnpm seed:games` (upserts the full catalog)

### Schema overview

| Table | Purpose |
|---|---|
| `games` | Canonical scored catalog. Public read. |
| `collections` | User lists (Owned, Wishlist, Played, Custom). User-scoped RLS. |
| `collection_items` | Games in a list — by `game_id`, `bgg_id`, or free-form `manual_name`. |
| `bgg_cache` | Server-side cache of BGG XML API responses. |

## Contributing

Open for contributions on scoring data, methodology refinements, and UI improvements. Open an issue first to discuss scope. Score proposals should reference the calibration anchors in `src/data/games.ts`.

### Adding games to the catalog

If you (or an LLM agent) want to add games to the catalog, **read [`docs/scoring-handoff.md`](./docs/scoring-handoff.md) first**. It's a self-contained briefing: full rubric, calibration anchors, workflow per game, quality bar, common pitfalls, and a prioritized target list of ~25 BGG-top games not yet scored.

Logged reasoning per game lives in [`docs/scoring-log.md`](./docs/scoring-log.md).

Areas that especially welcome contributions:
- Scoring proposals for popular games (BGG top 200 prioritized)
- Translations / multilingual support
- Mobile clients (Swift, Kotlin)
- BGG XML API client improvements

## Sources & methodology references

The 12-axis rubric was distilled from a literature review covering:

- Hunicke, LeBlanc & Zubek — *MDA Framework: 8 Kinds of Fun* (2004)
- Quantic Foundry — *Board Game Motivation Profile v2* (40,000+ player survey)
- Geoff Engelstein — *Input vs Output Randomness*
- Mark Rosewater — *Timmy / Johnny / Spike psychographics*
- Erik Twice — Brass: Birmingham vs Lancashire analysis
- Reviewer/forum debates across Shut Up & Sit Down, Heavy Cardboard, BGG forums, r/boardgames

BGG "Fans Also Like" benchmark data sourced from [recommend.games](https://recommend.games) — Turi Create matrix-factorization recommender trained on public BGG ratings.

## License

MIT. See [LICENSE](./LICENSE).

---

*Not affiliated with BoardGameGeek. BGG is a trademark of BoardGameGeek, LLC.*
