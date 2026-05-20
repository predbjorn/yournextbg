# Scoring Handoff — Batch-Add Agent

> **Mission:** Add 50–200 new games to the yournextbg catalog with high-quality 12-axis scores that don't degrade engine recommendations.

This document is **self-contained**. Read it cold, then `README.md`, and you have everything you need.

---

## 1. Project context (60 seconds)

`yournextbg` is a board game recommender built on a **12-axis feature profile** (not collaborative filtering). The premise: feature-similarity in profile space predicts whether you'll like a game, even when no one has co-rated both games.

- **Live:** https://yournextbg.com
- **Repo:** https://github.com/predbjorn/yournextbg
- **Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind 4 · Supabase · Vercel
- **Catalog source of truth:** `src/data/games.ts` (your edit target)
- **Engine code:** `src/lib/scoring/` (do NOT modify)
- **Methodology essay:** [`README.md`](../README.md) — read this *first*

Currently there are 34 games scored manually during methodology development. Every new game you add becomes (a) a statically-generated `/games/[slug]` SEO page, (b) a node in the recommendation graph, and (c) a candidate match for user-submitted shelves once auth ships.

---

## 2. The 12-axis rubric (memorize this)

Every game gets twelve 0–10 scores in a fixed order, plus three meta axes.

**Score vector index (LOAD-BEARING):**

```
[vekt, dybde, density, inter, konflikt, forhandl, input, output, innhente, tema, motor, narrativ]
   0      1       2       3       4         5        6       7        8        9     10      11
```

### 🧠 Tanke (cognition)

**0 · Vekt** — rules and concept overhead.
> Anchors: Patchwork=1 · Catan=3 · Wingspan=4 · Terraforming Mars=6 · Brass:Birmingham=8 · Through the Ages=9 · Twilight Imperium 4=10.
> BGG community weight × 2 is a useful first approximation but only that.

**1 · Dybde** — meaningful decision-tree size. *Distinct from Vekt.*
> Anchors: Snakes & Ladders=1 · Catan=4 · Wingspan=6 · Brass=10 · Chess=10 · Hive=9 *(vekt 2/dybde 9 is the canonical "elegance" example)*.

**2 · Density** — meaningful choices per minute on your turn.
> Anchors: Ticket to Ride=3 · Catan=5 · Wingspan=6 · Brass=9 · Mage Knight=10 · Through the Ages=9.

### ⚔️ Interaksjon (multiplayer effect)

**3 · Inter** — do other players' actions disrupt your plans? Use this scale strictly:
> 1–2: multiplayer solitaire — opponents don't matter (Patchwork)
> 3–4: parallel play — same prompts, separate boards (Welcome To, Wingspan)
> 5–6: indirect mechanical interaction — catch-up, shared markets, watch-and-react (Quacks, Catan, Heat)
> 7–8: heavy contention — denial, blocking, shared spots (Brass, Barrage)
> 9–10: constant friction — every move ripples to everyone (Root, Sidereal Confluence, Diplomacy)

**4 · Konflikt** — direct hostile actions. **Orthogonal to Inter.**
> Anchors: Wingspan=0 · Sidereal Confluence=1 *(interaction 10, conflict 1 — everyone trades, no one attacks)* · Brass=5 · Barrage=7 · Root=9 *(9/9 with Inter)* · Risk=10.

**5 · Forhandl** — does winning require *talking*?
> Anchors: Patchwork=0 · Catan=4 *(trading)* · Cosmic Encounter=9 · John Company 2E=10 · Blood on the Clocktower=10.

### 🎲 Flaks (variance)

**6 · Input-flaks** — luck *before* your decision (card draw, market refresh, setup). You plan around it.
> Anchors: Chess=0 · Brass=6 · Wingspan=7 · Terraforming Mars=9 *(huge card luck)*.

**7 · Output-flaks** — luck *after* your decision (combat dice, reveals). Can override your plans.
> Anchors: Brass=1 *(near-deterministic)* · Wingspan=1 · Catan=6 · Quacks=8 *(bag-draw explosion)* · Risk=9.
> **Engelstein's distinction is load-bearing.** Two games with identical "total luck" can score totally differently here.

**8 · Innhente** — catch-up strength. High = strong rubber-band; low = runaway-leader risk.
> Anchors: Risk=2 *(runaway)* · Brass=6 · Power Grid=8 · Suburbia=8.

### 🎭 Opplevelse (experience)

**9 · Tema** — pasted-on vs mechanically baked-in.
> Anchors: Tapestry=3 *(mechanics-driven despite strong art)* · Catan=5 · Brass=8 · Spirit Island=10 *(spirits feel like spirits because the mechanics enforce it)*.
> **This is not "do I like the theme."** It's whether the theme and mechanics are inseparable.

**10 · Motor** — engine/combo payoff arc per session.
> Anchors: Carcassonne=2 · Catan=4 · Wingspan=7 · Terraforming Mars=9 · Race for the Galaxy=10 *(eruptive late-game)*.

**11 · Narrativ** — does a session tell a story?
> Anchors: Catan=1 · Brass=4 *(era flip)* · Wingspan=5 · Sleeping Gods=9 · Pandemic Legacy=10.

### Meta axes (separate from the 12 in scoring; same Game object)

- **Solo** (0–10): quality of solo mode. 0=none/janky, 10=designed-for-solo (Spirit Island, Mage Knight).
- **Fiddly** (0–10): upkeep/bookkeeping overhead. ISS Vanguard=9, Azul=1.
- **Player count vector**: `{ best: ["3P"], good: ["2P", "4P"], bad: ["1P", "5+P"] }`.

---

## 3. Calibration anchors (in-catalog references)

Read the full list in `src/data/games.ts`. These are the load-bearing reference points:

| Game | Vekt | Dybde | Inter | Konflikt | Input | Output | Tema | Motor | Notes |
|---|---|---|---|---|---|---|---|---|---|
| Brass: Birmingham | 8 | 10 | 10 | 5 | 6 | 1 | 8 | 7 | Heavy + super interactive + near-deterministic |
| Voidfall | 9 | 10 | 4 | 4 | 5 | 0 | 8 | 10 | Heavy + deterministic + head-down |
| Barrage | 9 | 9 | 10 | 7 | 5 | 1 | 9 | 7 | Action-denial, runaway risk |
| Terraforming Mars | 6 | 7 | 3 | 3 | 9 | 2 | 6 | 9 | Card-luck engine, multiplayer solitaire-ish |
| Through the Ages | 9 | 10 | 7 | 6 | 7 | 3 | 8 | 10 | Civ-arc with military |
| Root | 7 | 9 | 10 | 9 | 6 | 4 | 9 | 6 | Hard rule-asymmetry, max conflict |
| Quacks of Quedlinburg | 3 | 5 | 5 | 2 | 6 | 8 | 7 | 7 | Watch-and-react, push-your-luck |
| Welcome To... | 2 | 5 | 4 | 2 | 7 | 1 | 6 | 6 | Parallel play, flip-and-write |
| Sleeping Gods | 7 | 7 | 8 | 0 | 6 | 4 | 10 | 5 | Co-op narrative, no conflict |
| War of the Ring 2E | 9 | 10 | 10 | 9 | 7 | 5 | 10 | 4 | 2P epic asymmetric narrative |
| Mage Knight Ultimate | 9 | 10 | 10 | 4 | 2 | 7 | 3 | 8 | Solo efficiency puzzle, massive combos |

**When scoring a new game, find 2–3 of these that feel similar in different ways and compare axis-by-axis.**

---

## 4. Workflow per game (8 steps)

### Step 1 · Identify BGG metadata

Use the BGG XML API server-side (works with a polite User-Agent — never use WebFetch from a browser context, BGG Cloudflare-blocks bots):

```bash
curl -A "yournextbg/0.1 (+https://yournextbg.com)" \
  "https://boardgamegeek.com/xmlapi2/thing?id=<BGG_ID>&stats=1"
```

Pull out: official name, year, designer, min/max players, playtime, BGG mechanics, BGG community weight (1–5).

### Step 2 · Read primary sources

In priority order:

1. **Rulebook PDF** — usually on the publisher's site or BGG "Files" tab. Mechanics live here.
2. **BGG description + designer notes** — the "Description" tab on the BGG page.
3. **One top review** — Heavy Cardboard (heavy euros), SU&SD (vibe), Quackalope (production), No Pun Included (design analysis). Focus on **how the game feels at the table**, not what's in the box.
4. **The "Fans Also Like" cross-check** — `https://recommend.games/api/games/<BGG_ID>/similar/?num_games=10`

### Step 3 · Propose scores per axis

For each of the 12 axes, write out:
1. Which calibration anchor(s) you're using as reference
2. Proposed score with one-sentence justification
3. (Mind the [Pitfalls](#6-pitfalls-do-not-skip-this-section) — they catch most rookie errors)

### Step 4 · Sanity check

Mental similarity check:

1. Pick **3 known games this should be close to**. Compare Euclidean distance against your proposed score (or just rank them mentally). The expected neighbors should rank high.
2. Pick **3 known games this should be FAR from**. Verify distance is large.
3. Cross-check against `recommend.games` top 10 for this BGG id — if any of their picks are already in your catalog, your engine should also rank them highly.

If sanity check fails, **revisit the scores** rather than forcing the entry.

### Step 5 · Add to `src/data/games.ts`

Add a new entry to the `GAMES` array. Follow the `Game` type from `src/data/types.ts`:

```typescript
{
  id: "ark-nova",                          // kebab-case, unique, URL-safe
  slug: "ark-nova",                        // usually same as id
  name: "Ark Nova",                        // human display name
  category: "heavy-euro",                  // "owned" | "heavy-euro" | "geek" | "social" | "filler" | "2p-epic" | "solo"
  categoryLabel: "Heavy Euro · 23",        // breadcrumb shown on cards
  bggId: 342942,                           // BGG numeric id (strongly preferred)
  scores: [7, 8, 7, 5, 3, 1, 6, 1, 4, 7, 9, 4],  // 12-tuple in correct order
  solo: 7,                                  // 0-10
  fiddly: 6,                                // 0-10
  playerCount: {
    best: ["1P", "2P"],
    good: ["3P", "4P"],
    bad: ["5+P"],
  },
  signature: "Card-driven zoo-builder · slower than TM",  // ≤60 chars
}
```

**ID/slug rules:**
- Lowercase kebab-case
- No version numbers unless ambiguous (`brass-birmingham` not `brass-birmingham-2018`)
- For multiple editions, suffix distinctly (`mage-knight-ultimate`, `gloomhaven-jaws-of-the-lion`)
- Special chars (`:`, `&`, `'`, accents) removed; spaces → hyphens

**Category guide:**
- `heavy-euro` — weight ≥ 3.5 BGG, mostly head-down strategy (Voidfall, SETI, Barrage)
- `geek` — weight 2.5–4.0 with heavy interaction (Root, Arcs, Brass)
- `social` — hidden-role, party-strategy, ≥5 players (BotC, Avalon)
- `filler` — ≤30 min, low weight (Cat in the Box, Welcome To, Quacks)
- `2p-epic` — designed for 2P, ≥2 hours (War of the Ring, Twilight Struggle)
- `solo` — solo-first or solo-major (Mage Knight, Sleeping Gods, Arkham LCG)
- `owned` — reserved for what Preben already physically owns; **don't use for new entries**

### Step 6 · Verify build

```bash
pnpm exec tsc --noEmit          # type check
pnpm exec next build            # production build (auto-generates new /games/[slug])
```

If build fails, your entry is malformed. Common errors:
- `scores` array has wrong length (must be 12)
- Invalid category string
- Duplicate `id`

### Step 7 · Seed Supabase

```bash
pnpm seed:games
```

This upserts by `id` — safe to run repeatedly. Requires `.env.local` with Supabase keys (should already be present).

### Step 8 · Commit + push

Commit per-batch (5–20 games):

```bash
git checkout -b scoring/batch-XX                       # optional; main is fine for solo work
git add src/data/games.ts docs/scoring-log.md
git commit -m "Add N games: <comma-separated names>"
git push
```

Vercel auto-deploys on push to main once GitHub integration is connected. Otherwise: `pnpm exec vercel --prod` to deploy.

---

## 5. Quality bar — MUST PASS

Before committing, every game must pass **all five**:

1. **Calibration test** — for each axis, you can name a similar-magnitude in-catalog game and explain why.
2. **Score range plausibility** — no axis at 0 or 10 unless it really is the extreme case.
3. **Neighbor sanity** — the top-5 most-similar games (using the Standard lens) "feel right" to someone who has played the game.
4. **Type-checks pass.**
5. **Production build succeeds.**

If you can't pass all five, **skip the game** and document why in the log.

---

## 6. Pitfalls (do NOT skip this section)

1. **Confusing Inter with Konflikt.** Inter = "do other players affect my plans?". Konflikt = "do other players attack me directly?". Sidereal Confluence: Inter 10, Konflikt 1. Root: 10/9.
2. **Output ≠ Input randomness.** Engelstein. Output = luck AFTER decision (combat dice). Input = luck BEFORE (card draw). Two games with identical "total luck" can score totally differently here.
3. **Vekt ≠ Dybde.** Vekt = rules complexity. Dybde = decision-tree size. Hive: vekt 2 / dybde 9.
4. **Tema is not "is the theme good?"** Tema = is the theme baked into the mechanics? Tapestry: strong theme, pasted-on (3). Spirit Island: 10.
5. **Motor is independent of game weight.** Race for the Galaxy: medium weight, Motor 10. Catan: medium weight, Motor 4.
6. **"Multiplayer solitaire" is not a slur, it's a score.** A 3 on Inter is a legitimate experience some players love. Don't be punitive — score what *is*, not what you prefer.
7. **Player counts: don't trust the box.** Check BGG community polls ("Best with N", "Recommended with N") — these are far more accurate than the box range.
8. **Don't anchor only on weight.** Two heavy games can be radically different on Interaksjon/Tema/Motor. The point of the rubric is to disambiguate within weight class.
9. **Solo score isn't whether the game *has* a solo mode.** It's whether the solo mode is *good*. Voidfall's automa is 9. Wingspan's Automa is 6. A game with no solo mode is 0.
10. **Don't score from a single review.** Triangulate from rulebook + ≥1 review + BGG description. Reviewers have biases (Tom Vasel loves dice; SU&SD loves interaction).

---

## 7. First batch — recommended targets (in priority order)

### Priority 1 — BGG top 25 high search-volume games

Each is a high-value SEO page because "games like X" is a real Google query.

| BGG ID | Game |
|---:|---|
| 174430 | Gloomhaven |
| 161936 | Pandemic Legacy: Season 1 |
| 162886 | Spirit Island |
| 342942 | Ark Nova |
| 220308 | Gaia Project |
| 233078 | Twilight Imperium: Fourth Edition |
| 84876  | The Castles of Burgundy |
| 124361 | Concordia |
| 266192 | Wingspan |
| 199792 | Everdell |
| 312484 | Lost Ruins of Arnak |
| 295947 | Cascadia |
| 285774 | Marvel Champions: The Card Game |
| 28720  | Brass: Lancashire |
| 246900 | Eclipse: Second Dawn for the Galaxy |
| 2651   | Power Grid |
| 31260  | Agricola |
| 102794 | Caverna: The Cave Farmers |
| 182028 | Through the Ages: A New Story of Civilization |
| 177736 | A Feast for Odin |
| 148228 | Splendor |
| 13     | Catan |
| 9209   | Ticket to Ride |
| 230802 | Azul |
| 12333  | *(already in catalog: Twilight Struggle)* |

### Priority 2 — Games in current watchlist (per the v1 catalog)

- Speakeasy (Vital Lacerda)
- Galactic Cruise (2025 GOTY winner)
- Luthier
- Molly House (Cole Wehrle)
- Arydia: The Paths We Dare Tread
- Corps of Discovery

### Priority 3 — Notable BGG titles that frequently appear in "fans also like"

Look at the recommend.games similar-list for the priority-1 games — anything that appears in 3+ of them is a hub game and worth scoring.

---

## 8. Working log

Maintain `docs/scoring-log.md` as you go. Per-game entry:

```markdown
## Ark Nova (BGG 342942)

**Scores:** [7, 8, 7, 5, 3, 1, 6, 1, 4, 7, 9, 4]
**Solo:** 7 · **Fiddly:** 6 · **Best:** [1P, 2P]
**Category:** heavy-euro

### Per-axis reasoning
- Vekt 7: BGG community weight 3.74. Anchor: heavier than TM (6) but lighter than Brass (8). Card play + action card strength meter + zoo board is substantial but learnable in one session.
- Dybde 8: Multiple viable paths (animals, conservation, sponsors), action-strength queue creates persistent puzzle. Less deep than Brass (10).
- Density 7: Each turn is meaningful but downtime grows past 2P.
- Inter 5: Shared card row + final-scoring conservation projects create catch-and-react, but no direct denial. Closer to Terraforming Mars (3) than Brass (10).
- Konflikt 3: Final-scoring scrambles are confrontational; mid-game is parallel.
- Forhandl 1: No negotiation.
- Input 6: Card market luck + animal card draw. Mitigated by open market.
- Output 1: Deterministic resolution.
- Innhente 4: No strong rubber-band; runaway is possible if engine fires early.
- Tema 7: Zoo theme integrates well into the card abilities; designer Mathias Wigge interviewed about this.
- Motor 9: Classic engine-builder — early animal placements unlock late-game multiplications.
- Narrativ 4: Some session arc as the zoo fills, but not a story.

### Calibration check
- Closest 3 in catalog (predicted): Terraforming Mars (~83%), SETI (~80%), Beyond the Sun (~75%)
- Sanity: ✓ — designer explicitly positioned Ark Nova as "heavier than TM"

### BGG cross-check (recommend.games)
- Top 3 for BGG 342942: <fetch and list>
- In our catalog: <list>
```

---

## 9. Tools available

**Use:**
- BGG XML API: `https://boardgamegeek.com/xmlapi2/thing?id={id}&stats=1`
- recommend.games similarity: `https://recommend.games/api/games/{id}/similar/?num_games=10`
- The existing engine code (READ-ONLY): `src/lib/scoring/`
- Seed pipeline: `pnpm seed:games`
- Health check: `pnpm supabase:health`

**Do NOT modify:**
- `src/lib/scoring/` (engine math)
- `src/data/types.ts` (Game schema — extending this requires migration)
- `scripts/seed-games.ts` (seed pipeline)
- `supabase/migrations/` (database schema)
- Anything in `src/app/` unless explicitly fixing a routing bug

**Modify freely:**
- `src/data/games.ts` (add entries)
- `src/data/bgg-refs.ts` (optional: snapshot recommend.games results for new anchors)
- `docs/scoring-log.md` (your reasoning log)

---

## 10. Definition of done

- ≥ 50 new games added (target: 100+)
- Every game passes the [Quality bar](#5-quality-bar--must-pass)
- `pnpm exec tsc --noEmit` exits 0
- `pnpm exec next build` exits 0
- `pnpm seed:games` exits 0
- Working log written and committed to `docs/scoring-log.md`
- Commit(s) pushed to `main` (or PR opened against `main`)

---

*If anything in this document is ambiguous or contradicts the live methodology essay in [`README.md`](../README.md), the README wins. Flag the contradiction in your log so we can fix it.*
