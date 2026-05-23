# yournextbg v1 — Coordination Plan

> **For Claude:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` when implementing any sibling plan. This document is the index + reconciliation, not an implementable plan itself.

**Goal:** Ship yournextbg v1 (web) with auth + user shelves + ratings + recommendations using the new Cardstock design, then ship native iOS + Android in v2.

**Architecture:** Supabase (Postgres + Auth + Storage + Edge Functions) as the data plane. Next.js 16 on Vercel as the web app. Native apps (SwiftUI, Compose) consume an OpenAPI-spec'd edge-function surface in v2.

**Tech Stack:** Next.js 16, React 19, Tailwind 4, TypeScript, Supabase JS SDK, Supabase Edge Functions (Deno), pgvector, PostHog, Sentry, GitHub Actions, Vercel.

---

## Index

| Plan | File | Status |
|---|---|---|
| 01 — Backend (Supabase) | `2026-05-23-01-backend-supabase.md` | Ready to execute |
| 02 — Web (Next.js v1) | `2026-05-23-02-web-nextjs.md` | Ready to execute |
| 03 — iOS (SwiftUI, v2) | `2026-05-23-03-ios-swiftui.md` | Outline; flesh out closer to start |
| 04 — Android (Compose, v2) | `2026-05-23-04-android-compose.md` | Outline; flesh out closer to start |

---

## Reconciliation: grill decisions vs project reality

The interview produced 15 architectural decisions assuming a greenfield project. Several were already made in the live codebase. This table is the truth post-reconciliation.

| # | Topic | Grill answer | Project reality | Final |
|---|---|---|---|---|
| 1 | Backend topology | Supabase + edge functions | Supabase project `gkickjaihbgapowsqwhx` exists; schema has games/collections/collection_items/bgg_cache | **Supabase + edge functions** (as grilled) |
| 2 | Recommender placement | Hybrid: server picks, client re-ranks | Engine lives in `src/lib/scoring/` as pure functions, runs client-side today | **Hybrid** — add pgvector candidate-selection RPC; keep `src/lib/scoring/` as client re-rank |
| 3 | Native stack | SwiftUI + Compose + Next.js | README commits "Native Swift + Kotlin, generated from an OpenAPI spec" | **As grilled** |
| 4 | Repo strategy | Monorepo `/web /ios /android /supabase` | Currently single Next.js repo with `src/`, `supabase/`, `scripts/` | **Add `/ios`, `/android`, `/contract` siblings when v2 begins**; web stays at root for now to avoid disrupting Vercel |
| 5 | BGG sync | On-demand + pg_cron | BGG XML API was Cloudflare-401-gated; **API keys arriving** make authenticated server-side fetch viable. | **Restored in v1**, gated on API keys landing. Same on-demand + pg_cron architecture from the grill. Unscored imports get a "pending scoring" state (see §BGG strategy below). |
| 6 | Catalog | CSV import + Studio | TS file at `src/data/games.ts` + `pnpm seed:games` idempotent upsert | **Keep TS pattern**; CSV unnecessary |
| 7 | API types | Hybrid: Supabase auto + OpenAPI for edge fns | TS types hand-written in `src/data/types.ts` and `src/lib/scoring/`; no auto-gen yet | **Add `supabase gen types typescript` step + OpenAPI for v2** — not strictly needed for web v1 |
| 8 | Images | Self-host with resize | No image pipeline yet; design uses placeholder `BoxCover` | **Build the resize-on-import edge function** |
| 9 | Web host | Vercel | Vercel project `prebenhafnor-5589s-projects/yournextbg`, manual deploy, live | **Vercel**, set up GitHub auto-deploy when repo goes public or via Vercel Git integration with a deploy token |
| 10 | Observability | PostHog + Sentry + Supabase logs | Nothing installed | **As grilled** |
| 11 | Monetization | Free v1 | Free | **Free v1** |
| 12 | CI/CD | GHA + Vercel + fastlane | No GHA yet; manual `pnpm exec vercel --prod` | **Add GHA for web checks + Supabase migration deploy.** fastlane is v2-only |
| 13 | Push | Skip v1 | Not implemented | **Skip** |
| 14 | Sequencing | Web first, native week 4 | README says mobile is V2 (post-v1-launch) | **Adjusted: web is v1, native is v2 (not parallel within v1)**. Closer to README intent |
| 15 | Realtime/offline | Neither | Not implemented | **Neither** |

**Rating-scale reconciliation (new conflict surfaced during reading):** the design handoff specifies a 5-point rating scale (★1–★5 + "not played") for the engine's anchor weights. The current schema has `collection_items.user_rating integer check (1..10)` — BGG's scale. Plan 01 migrates to 1–5 since no users have data yet.

**Branch/lens label reconciliation:**
- Code keys are canonical and don't change: `thinking/interaction/luck/experience` (branches), `standard/weight/feel/luck/equal` (lenses).
- Display labels in `BRANCHES` map and lens `label` field already match the design ("Thinking", "Same weight class", etc.). The design's "Thought" terminology is non-canonical and should be updated to "Thinking" in the new screens.

---

## BGG strategy

**Where things stand:** BGG's XML API has been returning 401 to unauthenticated traffic (Cloudflare). Preben is acquiring official API keys, which restores legitimate authenticated server-side access. v1 ships with BGG sync working.

**Architecture (mirrors what the grill produced):**
- Profile screen: BGG-username field + "Sync collection" button + "Auto-sync hourly" toggle.
- Home / Shelf: "↻ Re-sync BGG" button in the header.
- Server: a `bgg-sync` edge function calls the BGG XML API with the auth header from secrets, parses the user's owned + wishlist collections, upserts into `collection_items`, returns counts to the client. Same code path is invoked by `pg_cron` for users with auto-sync on.
- Rating import: BGG personal ratings normalized 9-10→★5, 8→★4, 6-7→★3, 4-5→★2, 1-3→★1 (per the design's helper text), user can override per-game.

**The unscored-games problem (the actual elephant):**
Catalog is ~215 curated games; an average BGG user's collection is 50-300 games. Most synced games won't be in the catalog. Resolution:

- BGG sync inserts unscored games into `games` with `score_status = 'unscored'` and a placeholder for the 12-axis vector (or `null`).
- These appear on the user's shelf with a **"pending scoring"** badge.
- They do NOT participate in the recommender (no vector → excluded from `similar_games` / `profile_candidates`).
- They DO appear in the user's owned/wishlist counts and stats.
- Catalog growth is human-driven via the existing Claude-Code-assisted workflow (`docs/scoring-handoff.md`). When Preben scores a game, `score_status` flips to `editorial` and it enters the recommender for everyone.
- Heuristic-prioritization helper: a query that ranks unscored games by how many users have them on shelves — the most-imported unscored games are the highest-value to score next.

**Why we didn't build an LLM scoring pipeline:** Decision earlier in planning — Preben prefers to drive Claude Code interactively rather than have a server-side LLM auto-score. Keeps editorial control tight; no Anthropic-API cost; no admin review UI to maintain. Score throughput is bounded by Preben's time, not by infrastructure. Re-evaluate post-launch if catalog-coverage friction becomes the dominant complaint.

---

## Sequencing (Gantt)

```
Week 1 — Backend foundations
  ├── pgvector + axes_vec column migration
  ├── rating-scale migration (1..10 → 1..5)
  ├── score_status column on games (editorial | unscored)
  ├── Supabase Storage bucket for covers
  └── First edge function: similar_games(anchor_id, lens)

Week 2 — Web auth + shelf + BGG sync
  ├── Cardstock design tokens migration
  ├── Login screen (Supabase Auth: email/pw + magic link + Google + Apple)
  ├── bgg-sync edge function (uses BGG_API_KEY from secrets)
  ├── Home / My Shelf screen (incl. ↻ Re-sync BGG button + pending-scoring badge)
  └── PostHog + Sentry wired up

Week 3 — Web rate + recommendations
  ├── Rate flow screen (5-point)
  ├── Recommendations screen (profile mode)
  ├── Image-resize edge function + cover backfill
  └── pg_cron auto-sync job (hourly, opt-in via user_prefs)

Week 4 — Web comparison-lens + game-detail
  ├── Cardstock-redesigned Comparison Lens (replace existing comparator)
  ├── Cardstock-redesigned Game detail (replace existing game page)
  └── Profile / Settings screen

Week 5 — Web polish + launch prep
  ├── Mobile-web pass on all screens
  ├── GHA CI (tsc + build + tests)
  ├── PostHog event taxonomy + dashboards
  ├── Sentry release tracking
  └── Production deploy + smoke test

Week 6 — v1 launch (yournextbg.com)

—— v2 begins after v1 launch settles (~2-4 weeks of usage data) ——

Week 8-15 — Native v2
  ├── OpenAPI spec from edge functions
  ├── iOS (SwiftUI) — 4 weeks
  ├── Android (Compose) — 4 weeks, parallel with iOS once OpenAPI stable
  └── Beta via TestFlight + Play Internal
```

This is more conservative than the grill's "native week 4" because (a) BGG removal means we have less product to ship in v1 (web alone is enough), and (b) the README is right that mobile should be informed by v1 usage data.

---

## Shared conventions

These apply across all sibling plans.

### Score vector order (LOAD-BEARING — never reorder)
```
[weight, depth, density, interaction, conflict, negotiation, input, output, catchup, theme, engine, narrative]
   0       1      2          3            4          5          6       7       8       9      10        11
```

### Branch + lens keys
- Branches: `thinking | interaction | luck | experience`
- Lenses: `standard | weight | feel | luck | equal`
- These keys appear in code, DB column values, OpenAPI enums, and analytics events. Identical everywhere.

### Display labels
- Use `BRANCHES[branch].label` for branch display strings; never hard-code "Thinking" etc.
- Use `LENSES[lens].label` for lens display strings.
- This lets a future label rename be a one-line change.

### Cardstock design tokens
- Defined in `design/design_handoff_yournextbg/prod-system.jsx` as `LIGHT_TOKENS` / `DARK_TOKENS`.
- Web port lives in `src/app/globals.css` under `:root` and `:root[data-theme="dark"]` using CSS custom properties.
- Native ports translate each token to the platform's idiom (SwiftUI `Color`, Compose `Color`).

### Naming
- Files: kebab-case for web, PascalCase for Swift/Kotlin types, camelCase for functions/variables across all.
- Migrations: `NNNN_short_description.sql` matching the existing `0000_initial_schema.sql` pattern.
- Edge functions: kebab-case directory names under `supabase/functions/`.

### Commit format
Per `CLAUDE.md`: descriptive subject, body explains the why, agent commits get `Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>`.

### Verification before commit (web)
```bash
pnpm exec tsc --noEmit
pnpm exec next build
```
Both must pass.

---

## Risks + open questions

| # | Risk | Mitigation |
|---|---|---|
| 1 | BGG API keys delayed or revoked | bgg-sync edge function is feature-flagged; without keys, Profile shows "Connect BGG (coming soon)" and Shelf shows the manual-add affordance only. No code rewrite needed to fall back. |
| 2 | Most BGG-imported games are unscored | Pending-scoring badge + exclusion from recommender (plan 01 §score_status). Catalog growth via `docs/scoring-handoff.md`. Track most-imported-unscored as the scoring priority signal. |
| 3 | Cardstock migration disrupts live SEO pages during transition | Plan 02 §migration-order ships Cardstock tokens as additive first, swaps components per-route, leaves SEO pages live throughout. |
| 4 | Vercel auto-deploy currently broken (repo private) | Plan 02 §week-5 addresses. |
| 5 | Image-resize edge function exceeds Supabase free tier on backfill | Plan 01 §image-backfill addresses with batched runs. |

### Open questions for Preben

1. **Cardstock fully replaces current visual design?** Plan 02 assumes yes. If you want incremental adoption, scope changes meaningfully.
2. **Native v2 timing.** Plan written assumes "after v1 launch settles." Bring forward if you have an iOS dev ready.
3. **BGG-sync feature flag default.** Ship BGG sync ON when keys land (recommended) vs. behind a hidden flag for a beta cohort first?

---

## How to use these plans

1. Read this coordination doc first.
2. Sibling plans (01–04) are independent once preconditions are met; backend (01) blocks web (02) only on the specific tasks marked `[blocked-by: 01-task-N]`.
3. Each sibling plan has its own task list. Execute with `superpowers:executing-plans` task-by-task.
4. When a plan's tasks complete, mark the plan done and run an end-to-end smoke test of the affected platform before moving to the next.
