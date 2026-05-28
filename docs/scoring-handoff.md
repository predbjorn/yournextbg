# Scoring Handoff — Batch-Add Agent

> **Mission:** Add high-quality 12-axis scores for new games to the yournextbg catalog without degrading engine recommendations.

This document is **self-contained**. Read it cold, then `README.md`, and you have everything you need to score the next batch.

---

## 1. Project context (60 seconds)

`yournextbg` is a board game recommender built on a **12-axis feature profile** (not collaborative filtering). The premise: feature-similarity in profile space predicts whether you'll like a game, even when no one has co-rated both games.

- **Live:** https://yournextbg.com
- **Repo:** https://github.com/predbjorn/yournextbg
- **Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind 4 · Supabase · Vercel
- **Catalog source of truth:** `src/data/games.ts` (your edit target)
- **Engine code:** `src/lib/scoring/` (do NOT modify)
- **Methodology essay:** [`README.md`](../README.md) — read this *first* if you haven't

The catalog currently holds **~215 games** scored manually against the rubric below. Every new game you add becomes (a) a statically-generated `/games/[slug]` SEO page, (b) a node in the recommendation graph, and (c) a candidate match for user-submitted shelves.

---

## 2. The 12-axis rubric (memorize this)

Every game gets twelve 0–10 scores in a **fixed order**, plus three meta axes.

**Score vector index (LOAD-BEARING — never reorder, anywhere):**

```
[weight, depth, density, interaction, conflict, negotiation, input, output, catchup, theme, engine, narrative]
    0       1       2        3            4          5          6       7        8       9      10       11
```

The four branches and their axes:

### 🧠 Thinking — cognition

**0 · Weight** — rules and concept overhead.
> Anchors: Patchwork=1 · Catan=3 · Wingspan=4 · Terraforming Mars=6 · Brass: Birmingham=8 · Through the Ages=9 · Twilight Imperium 4=10.
> BGG community weight × 2 is a useful first approximation but only that.

**1 · Depth** — meaningful decision-tree size. *Distinct from Weight.*
> Anchors: Snakes & Ladders=1 · Catan=4 · Wingspan=6 · Brass=10 · Chess=10 · Hive=9 *(weight 2 / depth 9 is the canonical "elegance" example)*.

**2 · Density** — meaningful choices per minute on your turn.
> Anchors: Ticket to Ride=3 · Catan=5 · Wingspan=6 · Brass=9 · Mage Knight=10 · Through the Ages=9.

### ⚔️ Interaction — multiplayer effect

**3 · Interaction** — do other players' actions disrupt your plans? Use this scale strictly:
> 1–2: multiplayer solitaire — opponents don't matter (Patchwork)
> 3–4: parallel play — same prompts, separate boards (Welcome To, Wingspan)
> 5–6: indirect mechanical interaction — catch-up, shared markets, watch-and-react (Quacks, Catan, Heat)
> 7–8: heavy contention — denial, blocking, shared spots (Brass, Barrage)
> 9–10: constant friction — every move ripples to everyone (Root, Sidereal Confluence, Diplomacy)

**4 · Conflict** — direct hostile actions. **Orthogonal to Interaction.**
> Anchors: Wingspan=0 · Sidereal Confluence=1 *(interaction 10, conflict 1 — everyone trades, no one attacks)* · Brass=5 · Barrage=7 · Root=9 *(9/9 with Interaction)* · Risk=10.

**5 · Negotiation** — does winning require *talking*?
> Anchors: Patchwork=0 · Catan=4 *(trading)* · Cosmic Encounter=9 · John Company 2E=10 · Blood on the Clocktower=10.

### 🎲 Luck — variance

**6 · Input** — luck *before* your decision (card draw, market refresh, setup). You plan around it.
> Anchors: Chess=0 · Brass=6 · Wingspan=7 · Terraforming Mars=9 *(huge card luck)*.

**7 · Output** — luck *after* your decision (combat dice, reveals). Can override your plans.
> Anchors: Brass=1 *(near-deterministic)* · Wingspan=1 · Catan=6 · Quacks=8 *(bag-draw explosion)* · Risk=9.
> **Engelstein's distinction is load-bearing.** Two games with identical "total luck" can score totally differently here.

**8 · Catch-up** — catch-up strength. High = strong rubber-band; low = runaway-leader risk.
> Anchors: Risk=2 *(runaway)* · Brass=6 · Power Grid=8 · Suburbia=8.

### 🎭 Experience

**9 · Theme** — pasted-on vs mechanically baked-in.
> Anchors: Tapestry=3 *(mechanics-driven despite strong art)* · Catan=5 · Brass=8 · Spirit Island=10 *(spirits feel like spirits because the mechanics enforce it)*.
> **This is not "do I like the theme."** It's whether the theme and mechanics are inseparable.

**10 · Engine** — engine/combo payoff arc per session.
> Anchors: Carcassonne=2 · Catan=4 · Wingspan=7 · Terraforming Mars=9 · Race for the Galaxy=10 *(eruptive late-game)*.

**11 · Narrative** — does a session tell a story?
> Anchors: Catan=1 · Brass=4 *(era flip)* · Wingspan=5 · Sleeping Gods=9 · Pandemic Legacy=10.

### Meta axes (separate from the 12, same Game object)

- **Solo** (0–10): quality of solo mode. 0 = none/janky, 10 = designed-for-solo (Spirit Island, Mage Knight).
- **Fiddly** (0–10): upkeep/bookkeeping overhead. ISS Vanguard=9, Azul=1.
- **Player count vector**: `{ best: ["3P"], good: ["2P", "4P"], bad: ["1P", "5+P"] }`.

---

## 3. Calibration anchors (in-catalog references)

Read the full set in `src/data/games.ts`. These are the load-bearing reference points to anchor against:

| Game | Weight | Depth | Interaction | Conflict | Input | Output | Theme | Engine | Notes |
|---|---|---|---|---|---|---|---|---|---|
| Brass: Birmingham | 8 | 10 | 10 | 5 | 6 | 1 | 8 | 7 | Heavy + super interactive + near-deterministic |
| Voidfall | 9 | 10 | 4 | 4 | 5 | 0 | 8 | 10 | Heavy + deterministic + head-down |
| Barrage | 9 | 9 | 10 | 7 | 5 | 1 | 9 | 7 | Action-denial, runaway risk |
| Terraforming Mars | 6 | 7 | 3 | 3 | 9 | 2 | 6 | 9 | Card-luck engine, multiplayer-solitaire-ish |
| Through the Ages | 9 | 10 | 7 | 6 | 7 | 3 | 8 | 10 | Civ arc with military |
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

BGG XML API requires an `Authorization: Bearer …` header. The project token lives in `.env.local` as `BGG_API_KEY` (and on the server as a Supabase secret). Server-side fetches:

```bash
source .env.local
curl -A "$BGG_USER_AGENT" \
  -H "Authorization: Bearer $BGG_API_KEY" \
  "https://boardgamegeek.com/xmlapi2/thing?id=<BGG_ID>&stats=1"
```

The token is shared across the project — do **not** publish it or commit it. The BGG website itself (HTML) also still loads fine in a browser if you'd rather copy metadata by eye.

Pull out: official name, year, designer, min/max players, playtime, BGG mechanics, BGG community weight (1–5).

### Step 2 · Read primary sources

In priority order:

1. **Rulebook PDF** — usually on the publisher's site or BGG "Files" tab. Mechanics live here.
2. **BGG description + designer notes** — the "Description" tab on the BGG page.
3. **One top review** — Heavy Cardboard (heavy euros), SU&SD (vibe), Quackalope (production), No Pun Included (design analysis). Focus on **how the game feels at the table**, not what's in the box.
4. **The "Fans Also Like" cross-check** — `https://recommend.games/api/games/<BGG_ID>/similar/?num_games=10` (still works; results quality varies — treat as soft sanity check).

### Step 3 · Propose scores per axis

For each of the 12 axes, write out:
1. Which calibration anchor(s) you're using as reference
2. Proposed score with one-sentence justification
3. Mind the [Pitfalls](#6-pitfalls-do-not-skip-this-section) — they catch most rookie errors

### Step 4 · Sanity check

Mental similarity check:

1. Pick **3 known games this should be close to**. Compare Euclidean distance against your proposed score (or just rank them mentally). The expected neighbors should rank high.
2. Pick **3 known games this should be FAR from**. Verify distance is large.
3. Cross-check against `recommend.games` top 10 for this BGG id — if any of their picks are already in your catalog, your engine should also rank them highly.

If the sanity check fails, **revisit the scores** rather than forcing the entry.

### Step 5 · Add to `src/data/games.ts`

Add a new entry to the `GAMES` array. Follow the `Game` type from `src/data/types.ts`:

```typescript
{
  id: "ark-nova",                          // kebab-case, unique, URL-safe
  slug: "ark-nova",                        // usually same as id
  name: "Ark Nova",                        // human display name
  bggId: 342942,                           // BGG numeric id (strongly preferred)
  scores: [7, 8, 7, 5, 3, 1, 6, 1, 4, 7, 9, 4],  // 12-tuple in canonical order
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

**No `category` field.** Categories used to be a manual per-game label. They're now **derived facets** computed from the 12 scores + `playerCount` in `src/lib/facets.ts`:

- `WeightClass` — `filler / gateway / mid / heavy / brain-burner` (from `weight` axis)
- `PlayerFit` — `solo / 2p / 3-4p / 5+p` (from `playerCount`)
- `StyleTag` — `engine-builder / high-interaction / negotiation / dice-luck / co-op / two-player-duel` (from axis rules)

You don't need to set anything for categories — they fall out automatically.

### Step 6 · Verify build

```bash
pnpm exec tsc --noEmit          # type check
pnpm exec next build            # production build (auto-generates new /games/[slug])
```

If build fails, your entry is malformed. Common errors:
- `scores` array has wrong length (must be 12)
- Duplicate `id`
- Missing required field (consult `src/data/types.ts`)

### Step 7 · Seed Supabase

```bash
pnpm seed:games
```

Idempotent — upserts by `id`. Safe to run repeatedly. Requires `.env.local` with Supabase keys.

### Step 8 · Commit + push

Commit per-batch (5–20 games):

```bash
git add src/data/games.ts docs/scoring-log.md
git commit -m "Add N games: <comma-separated names>"
git push
```

Vercel auto-deploys on push to main once GitHub integration is connected. Otherwise: `pnpm exec vercel --prod` to deploy manually.

---

## 4a. Scoring with Claude Code (the actual workflow)

The steps above describe the work; in practice, Claude Code is the right tool to drive it. Open Claude Code in this repo and prompt along these lines:

> Score **[GAME NAME]** (BGG **[ID]**) for the yournextbg catalog.
>
> 1. Read `docs/scoring-handoff.md` for the rubric and the 10 pitfalls if you don't have them in context.
> 2. Read 3–5 in-catalog anchors I suspect this is close to: **[list 3-5 game ids from `src/data/games.ts`]**.
> 3. Fetch the BGG metadata (XML API with `Authorization: Bearer ${BGG_API_KEY}`), the rulebook PDF from the publisher's site, and one written review.
> 4. Propose the 12 axis scores + solo + fiddly + playerCount.
> 5. Run the sanity check from §4 step 4 mentally.
> 6. Output a `Game` object matching `src/data/types.ts` and the per-axis reasoning in the `scoring-log.md` format.
> 7. Do NOT commit. I'll review your reasoning before pasting in.

**What Claude is good at vs. not:**

| Good at | Not great at |
|---|---|
| Parsing rulebook structure | Knowing the "vibe" of a game at the table |
| Applying the rubric mechanically | Tema (theme integration) when the design is subtle |
| Surfacing axis-by-axis comparisons to anchors | Interaction nuance when the rulebook hides it |
| Catching obvious pitfall errors (e.g. confusing Weight with Depth) | Knowing whether the meta is solved vs. fresh |

**Always review per-axis reasoning before pasting.** Watch the 10 Pitfalls in §6 — those are exactly the errors Claude is most likely to make.

**If you disagree with a score:** edit the number in the proposed object, but also update the reasoning in the log so future-you understands the override.

---

## 5. Quality bar — MUST PASS

Before committing, every game must pass **all five**:

1. **Calibration test** — for each axis, you can name a similar-magnitude in-catalog game and explain why.
2. **Score range plausibility** — no axis at 0 or 10 unless it really is the extreme case.
3. **Neighbor sanity** — the top-5 most-similar games (under the Standard lens) "feel right" to someone who has played the game.
4. **Type-checks pass.**
5. **Production build succeeds.**

If you can't pass all five, **skip the game** and document why in the log.

---

## 6. Pitfalls (do NOT skip this section)

1. **Confusing Interaction with Conflict.** Interaction = "do other players affect my plans?". Conflict = "do other players attack me directly?". Sidereal Confluence: Interaction 10, Conflict 1. Root: 10/9.
2. **Output ≠ Input randomness.** Engelstein. Output = luck AFTER decision (combat dice). Input = luck BEFORE (card draw). Two games with identical "total luck" can score totally differently here.
3. **Weight ≠ Depth.** Weight = rules complexity. Depth = decision-tree size. Hive: weight 2 / depth 9.
4. **Theme is not "is the theme good?"** Theme = is the theme baked into the mechanics? Tapestry: strong theme, pasted-on (3). Spirit Island: 10.
5. **Engine is independent of game weight.** Race for the Galaxy: medium weight, Engine 10. Catan: medium weight, Engine 4.
6. **"Multiplayer solitaire" is not a slur, it's a score.** A 3 on Interaction is a legitimate experience some players love. Don't be punitive — score what *is*, not what you prefer.
7. **Player counts: don't trust the box.** Check BGG community polls ("Best with N", "Recommended with N") — these are far more accurate than the box range.
8. **Don't anchor only on weight.** Two heavy games can be radically different on Interaction/Theme/Engine. The point of the rubric is to disambiguate within weight class.
9. **Solo score isn't whether the game *has* a solo mode.** It's whether the solo mode is *good*. Voidfall's automa is 9. Wingspan's Automa is 6. A game with no solo mode is 0.
10. **Don't score from a single review.** Triangulate from rulebook + ≥1 review + BGG description. Reviewers have biases (Tom Vasel loves dice; SU&SD loves interaction).

---

## 7. Picking the next batch

With ~215 games already in the catalog, the "BGG top 25" first-pass is mostly done. To pick what to score next, use these heuristics in order:

1. **Hub games.** Look at the recommend.games top-10 for already-scored games. Any game that appears as a neighbor of **3+ catalog games but isn't yet scored** is a hub — score it next. Hubs improve recommendation density disproportionately.
2. **High BGG search volume not yet scored.** SEO upside: every game-detail page is its own static SEO surface. "games like [X]" is a real Google query for popular X.
3. **Watchlist titles** — Preben's own to-play list (Speakeasy, Galactic Cruise, Luthier, Molly House, Arydia, Corps of Discovery, etc.). High personal value + likely interesting to similar tastes.
4. **Coverage gaps in feature space.** If the catalog has no game at `weight ≥ 8` + `output ≥ 7` (heavy + dice-driven), find one. Diversity of anchors matters more than quantity past 200 games.

To find gaps quickly, run an ad-hoc check in Claude Code:
> List the regions of 12-dimensional profile space where the catalog has fewer than 3 games within Euclidean distance 1.5 of each other. Suggest 5 BGG-popular games that would fill those gaps.

---

## 8. Working log

Maintain `docs/scoring-log.md` as you go. Per-game entry:

```markdown
## <Game name> (BGG <id>)

**Scores:** [W, D, De, In, Co, Ne, Ip, Op, Cu, Th, En, Na]
**Solo:** N · **Fiddly:** N · **Best:** [PCs]

### Per-axis reasoning
- Weight <n>: <anchor>. <justification>
- Depth <n>: <anchor>. <justification>
- Density <n>: <anchor>. <justification>
- Interaction <n>: <anchor>. <justification>
- Conflict <n>: <anchor>. <justification>
- Negotiation <n>: <anchor>. <justification>
- Input <n>: <anchor>. <justification>
- Output <n>: <anchor>. <justification>
- Catch-up <n>: <anchor>. <justification>
- Theme <n>: <anchor>. <justification>
- Engine <n>: <anchor>. <justification>
- Narrative <n>: <anchor>. <justification>

### Calibration check
- Closest 3 in catalog (predicted): <game> (~X%), <game> (~Y%), <game> (~Z%)
- Sanity: <agree / investigate>

### BGG cross-check
- recommend.games top 3 for BGG <id>: <list>
- In our catalog: <list>

### Notes
<anything noteworthy: known controversies, edition splits, scoring tradeoffs>

---
```

Header abbreviations: W=Weight, D=Depth, De=Density, In=Interaction, Co=Conflict, Ne=Negotiation, Ip=Input, Op=Output, Cu=Catch-up, Th=Theme, En=Engine, Na=Narrative.

---

## 9. Tools available

**Use:**
- BGG XML API: `https://boardgamegeek.com/xmlapi2/thing?id={id}&stats=1` — requires `Authorization: Bearer ${BGG_API_KEY}`. The token is provisioned and lives in `.env.local`.
- recommend.games similarity: `https://recommend.games/api/games/{id}/similar/?num_games=10` — public, still works.
- The existing engine code (READ-ONLY): `src/lib/scoring/`
- Derived facets: `src/lib/facets.ts` (read-only — categories fall out of scores automatically)
- Seed pipeline: `pnpm seed:games`
- Health check: `pnpm supabase:health`

**Do NOT modify:**
- `src/lib/scoring/` (engine math)
- `src/lib/facets.ts` (changing facet rules requires methodology discussion first)
- `src/data/types.ts` (Game schema — extending requires DB migration)
- `scripts/seed-games.ts` (seed pipeline)
- `supabase/migrations/` (database schema)
- Anything in `src/app/` unless explicitly fixing a routing bug

**Modify freely:**
- `src/data/games.ts` (add entries)
- `src/data/bgg-refs.ts` (optional: snapshot recommend.games results for new anchors)
- `docs/scoring-log.md` (your reasoning log)

---

## 10. Definition of done (per batch)

- ≥ 5 new games added (target: 10–20 per batch)
- Every game passes the [Quality bar](#5-quality-bar--must-pass)
- `pnpm exec tsc --noEmit` exits 0
- `pnpm exec next build` exits 0
- `pnpm seed:games` exits 0
- Working log written and committed to `docs/scoring-log.md`
- Commit(s) pushed to `main`

---

*If anything in this document is ambiguous or contradicts the live methodology essay in [`README.md`](../README.md), the README wins. Flag the contradiction in your log so we can fix it.*
