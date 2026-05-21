# Scoring Log

Reasoning trail for catalog additions. Each entry documents the per-axis logic for one game.

See [`scoring-handoff.md`](./scoring-handoff.md) for the workflow + quality bar.

---

<!--
Template — copy and fill in:

## <Game name> (BGG <id>)

**Scores:** [V, D, De, In, K, F, Ip, O, Inn, T, M, N]
**Solo:** N · **Fiddly:** N · **Best:** [PCs]
**Category:** <category>

### Per-axis reasoning
- Vekt <n>: <anchor>. <justification>
- Dybde <n>: <anchor>. <justification>
- Density <n>: <anchor>. <justification>
- Inter <n>: <anchor>. <justification>
- Konflikt <n>: <anchor>. <justification>
- Forhandl <n>: <anchor>. <justification>
- Input <n>: <anchor>. <justification>
- Output <n>: <anchor>. <justification>
- Innhente <n>: <anchor>. <justification>
- Tema <n>: <anchor>. <justification>
- Motor <n>: <anchor>. <justification>
- Narrativ <n>: <anchor>. <justification>

### Calibration check
- Closest 3 in catalog (predicted): <game> (~X%), <game> (~Y%), <game> (~Z%)
- Sanity: <agree / investigate>

### BGG cross-check
- recommend.games top 3 for BGG <id>: <list>
- In our catalog: <list>

### Notes
<anything noteworthy: known controversies, edition splits, scoring tradeoffs you wrestled with>

---
-->

## Batch 01 — Priority-1 BGG top-25 (2026-05-20)

10 games added: Ark Nova, Gaia Project, Castles of Burgundy, Concordia, Wingspan, Everdell, Twilight Imperium 4, Gloomhaven, Pandemic Legacy S1, Spirit Island.

**Tool note:** BGG XML API now returns `401 Unauthorized` to all unauth'd requests (Cloudflare). recommend.games still works for sanity checks on strategy-game neighborhoods, but returns broken/random results for several high-rank games (Gloomhaven, Spirit Island, Pandemic Legacy) — likely a stale-model artifact. Where rec.games was unusable, neighborhood sanity was done against the in-catalog anchors only.

---

## Ark Nova (BGG 342942)

**Scores:** [7, 8, 7, 5, 3, 1, 6, 1, 4, 7, 9, 4]
**Solo:** 7 · **Fiddly:** 6 · **Best:** [1P, 2P]
**Category:** heavy-euro

### Per-axis reasoning
- Vekt 7: BGG weight 3.74. Anchor: heavier than TM (6), lighter than Brass (8). Card play + action-strength queue + zoo board is substantial but learnable in one session.
- Dybde 8: Multiple viable paths (animals, conservation projects, sponsors); action-card slot queue is a persistent puzzle. Less deep than Brass (10).
- Density 7: Each turn meaningful; downtime grows past 2P.
- Inter 5: Shared card row + final-scoring conservation create catch-and-react; no direct denial. Closer to TM (3) than Brass (10).
- Konflikt 3: Final-scoring scrambles confrontational; mid-game parallel.
- Forhandl 1: None.
- Input 6: Card market + animal draw; mitigated by open market.
- Output 1: Deterministic resolution.
- Innhente 4: No strong rubber-band; runaway possible if engine fires early.
- Tema 7: Zoo theme integrates into card abilities; not Spirit-Island-tight but well above Tapestry (3).
- Motor 9: Classic engine-builder — early animals unlock late-game multiplications.
- Narrativ 4: Some session arc as the zoo fills; not a story.

### Calibration check
- Predicted closest: Terraforming Mars, SETI, Beyond the Sun (all share card-engine + low conflict + deterministic + heavy theme cluster).
- Sanity: ✓ — designer Mathias Wigge explicitly positioned Ark Nova as "heavier than TM."

### BGG cross-check (recommend.games)
- Top 5 for 342942: SETI (in catalog), Underwater Cities, Wyrmspan, Lost Ruins of Arnak, Terraforming Mars (in catalog).
- Catalog overlap: SETI, TM — both should rank high. Matches predicted neighbors.

---

## Gaia Project (BGG 220308)

**Scores:** [9, 10, 8, 6, 3, 1, 4, 0, 4, 5, 9, 3]
**Solo:** 8 · **Fiddly:** 8 · **Best:** [3P, 4P]
**Category:** heavy-euro

### Per-axis reasoning
- Vekt 9: BGG 4.39. Anchor: same class as Voidfall (9), TtA (9), Barrage (9). Faction asymmetry + tech + federations + planet types.
- Dybde 10: Many viable strategies per faction; depth is the selling point.
- Density 8: Turns relatively quick but loaded with implications.
- Inter 6: Area control + federation race + research racing; head-down enough to score below Brass (10) and Voidfall is 4 (more head-down). Sits in between.
- Konflikt 3: Indirect (positional). No direct attacks.
- Forhandl 1: None.
- Input 4: Some booster/setup luck.
- Output 0: Deterministic. Anchored with Voidfall (0).
- Innhente 4: Limited; runaway risk.
- Tema 5: Mechanics-driven. Factions have flavor but math dominates; below Voidfall (8) because faction theming is thinner.
- Motor 9: Strong engine-building; building placement unlocks income and tech compounds.
- Narrativ 3: No narrative.

### Calibration check
- Predicted closest: Voidfall (heavy + deterministic), SETI, Through the Ages (heavy engine).
- Sanity: ✓ — successor to Terra Mystica, same designer DNA.

### BGG cross-check
- rec.games top: Barrage (in catalog), Teotihuacan, Feast for Odin, Brass: Birmingham (in catalog).
- Catalog overlap: Barrage and Brass — both heavy-euro neighbors. ✓

---

## The Castles of Burgundy (BGG 84876)

**Scores:** [6, 8, 7, 4, 2, 0, 5, 0, 5, 3, 7, 2]
**Solo:** 7 · **Fiddly:** 4 · **Best:** [2P]
**Category:** heavy-euro

### Per-axis reasoning
- Vekt 6: BGG 2.99 but the system has more decision overhead than the BGG number suggests. Same as TM (6).
- Dybde 8: Iconic depth despite simple rules — classic "elegance" example like Hive but heavier.
- Density 7: Each turn = 2 dice, many micro-decisions per turn.
- Inter 4: Mostly head-down on personal board; some tile-market competition.
- Konflikt 2: Minor tile contention.
- Forhandl 0: None.
- Input 5: Dice rolled at start of YOUR turn = input (per Engelstein — known before decision). Higher than Brass (6 from card draws) feels wrong; calibrating closer to Wingspan (7) but Castles dice are less swingy than card draws because you always get 2 actions. 5.
- Output 0: Deterministic once decided.
- Innhente 5: No strong catch-up but pacing is uniform.
- Tema 3: Medieval feudal theme is pasted on. Matches Tapestry (3) anchor.
- Motor 7: Hex chains and bonuses compound nicely.
- Narrativ 2: Same arc each game.

### Calibration check
- Predicted closest: Concordia, Le Havre, Clans of Caledonia — point-salad euros with low conflict, low theme.
- Sanity: ✓ — classic Feld point-salad.

### BGG cross-check
- rec.games top: Trajan, Grand Austria Hotel, Tzolk'in, Concordia (in catalog).
- Overlap: Concordia (paired in this batch).

---

## Concordia (BGG 124361)

**Scores:** [5, 8, 6, 6, 2, 0, 3, 0, 5, 4, 7, 3]
**Solo:** 6 · **Fiddly:** 3 · **Best:** [3P, 4P]
**Category:** heavy-euro

### Per-axis reasoning
- Vekt 5: BGG 3.39. Lighter than TM (6), heavier than Wingspan (4).
- Dybde 8: Card-as-action with scoring-card endgame creates deep optimization.
- Density 6: One card per turn, but each play has lasting implications.
- Inter 6: Shared map + scoring-card competition. Higher than TM (3), lower than Brass (10).
- Konflikt 2: Building blocks city access; no attacks.
- Forhandl 0: None.
- Input 3: Card market refresh is minor luck.
- Output 0: Deterministic.
- Innhente 5: Tribune recycles hand; no rubber-band beyond that.
- Tema 4: Roman trade theme is fine, mechanics drive play.
- Motor 7: Build cards + network + resources — clean engine arc.
- Narrativ 3: Same arc each game.

### Calibration check
- Predicted closest: Castles of Burgundy, Clans of Caledonia (in catalog), Le Havre.
- Sanity: ✓ — Mac Gerdts pickup-and-deliver classic.

### BGG cross-check
- rec.games top: Orléans, Hansa Teutonica, Yokohama, Clans of Caledonia (in catalog), Tzolk'in.
- Overlap: Clans of Caledonia. ✓

---

## Wingspan (BGG 266192)

**Scores:** [4, 6, 6, 4, 0, 0, 7, 1, 5, 7, 7, 5]
**Solo:** 6 · **Fiddly:** 5 · **Best:** [2P, 3P]
**Category:** heavy-euro

### Per-axis reasoning
- Vekt 4: Directly anchored in handoff doc.
- Dybde 6: Directly anchored.
- Density 6: Anchored.
- Inter 4: Anchored (parallel play, "same prompts separate boards" zone).
- Konflikt 0: Anchored.
- Forhandl 0: None.
- Input 7: Anchored (card-draw heavy).
- Output 1: Anchored.
- Innhente 5: No real catch-up; bonus cards equalize slightly.
- Tema 7: Birds feel like birds because abilities are differentiated. Higher than Tapestry (3).
- Motor 7: Anchored — tableau engine.
- Narrativ 5: Anchored.

### Calibration check
- Predicted closest: Ark Nova (same designer-pattern + card engine + low conflict), Welcome To (parallel play), TM.
- Sanity: ✓ — most cited "gateway-plus" engine builder.

### BGG cross-check
- rec.games top: Everdell (in catalog batch), Tapestry, PARKS, Cascadia, Earth, Ark Nova (in catalog batch).
- Overlap: Everdell and Ark Nova both added in this batch — engine should cluster them tightly. ✓

---

## Everdell (BGG 199792)

**Scores:** [5, 7, 6, 5, 1, 0, 6, 0, 5, 7, 7, 3]
**Solo:** 6 · **Fiddly:** 5 · **Best:** [2P, 3P]
**Category:** heavy-euro

### Per-axis reasoning
- Vekt 5: BGG 2.81. Between Wingspan (4) and TM (6).
- Dybde 7: Card synergies + season transitions + multiple paths.
- Density 6: Worker placement, moderate per-turn weight.
- Inter 5: Shared worker spots + shared card market.
- Konflikt 1: Minor placement blocking.
- Forhandl 0: None.
- Input 6: Card draw moderate.
- Output 0: Deterministic.
- Innhente 5: Asymmetric seasons; some catch-up.
- Tema 7: Forest critters with theme-driven abilities; gorgeous production reinforces.
- Motor 7: Tableau engine compounds.
- Narrativ 3: Seasonal arc only.

### Calibration check
- Predicted closest: Wingspan, Ark Nova, Concordia.
- Sanity: ✓ — frequent "if you like Wingspan, try…" pick.

### BGG cross-check
- rec.games top: PARKS, Isle of Cats, Meadow, Wyrmspan, Flamecraft, Wingspan (in catalog batch), Lost Ruins of Arnak.
- Overlap: Wingspan, plus Lost Ruins of Arnak is a likely later add. ✓

---

## Twilight Imperium: Fourth Edition (BGG 233078)

**Scores:** [10, 10, 5, 10, 8, 9, 5, 6, 3, 9, 7, 8]
**Solo:** 0 · **Fiddly:** 9 · **Best:** [6P]
**Category:** geek

### Per-axis reasoning
- Vekt 10: Anchored in handoff doc (TI4 = 10).
- Dybde 10: Massive strategy space + 17 base + 7 PoK factions.
- Density 5: Long turns + significant downtime drag per-turn density below the headline weight would suggest.
- Inter 10: Politics + trading + attacks + agenda phase — everything ripples to everyone.
- Konflikt 8: Direct combat is core; not 10 (Risk) because politics can substitute and combat is gated by movement/tech.
- Forhandl 9: Negotiation central. Below John Company (10) because non-binding rather than mechanically-enforced public discussion.
- Input 5: Strategy card selection + action cards + agendas — moderate.
- Output 6: Combat dice; significant but unit hit values predictable. Same class as Catan (6).
- Innhente 3: Strong runaway-leader risk (the "10-imperial-points-from-nowhere" problem aside).
- Tema 9: Galaxy feels alive — factions, politics, exploration. Below Spirit Island (10) — themes drive flavor more than enforce mechanics universally.
- Motor 7: Build tech/economy/fleet throughout. Real engine arc.
- Narrativ 8: Each game tells an epic non-persistent story.

### Calibration check
- Predicted closest: Rebellion (in catalog — both galactic, hidden info, hours-long), WotR (in catalog — epic asymmetric narrative), Root (heavy interaction + political + asymmetric).
- Sanity: ✓ — these are the right neighbors for a 4X-political epic.

### BGG cross-check
- rec.games top: Forbidden Stars, Rebellion (in catalog), Game of Thrones BG 2E, Rex, Chaos in the Old World, WotR (in catalog).
- Overlap: Rebellion, WotR — both should rank in top-5. ✓

---

## Gloomhaven (BGG 174430)

**Scores:** [8, 9, 7, 8, 1, 5, 6, 7, 4, 8, 6, 10]
**Solo:** 7 · **Fiddly:** 9 · **Best:** [2P, 3P]
**Category:** solo

### Per-axis reasoning
- Vekt 8: Heavy rules — class abilities, attack modifiers, scenario rules, persistent state. Heavier than TM (6), lighter than TtA (9).
- Dybde 9: Each scenario is a deep tactical puzzle of card-burning, sequencing, positioning. Many viable class builds.
- Density 7: Top/bottom action selection + card burn + positioning makes turns dense; downtime grows at 4P.
- Inter 8: Co-op — positioning, enemy management, healing are tightly coupled. Higher than Sleeping Gods (8) is a tie; both heavy-coupling co-ops.
- Konflikt 1: Co-op only — no PvP. The 1 represents in-character griefing potential.
- Forhandl 5: Can't show hands openly (initiative is secret) but tables discuss heavily. Lower than The Crew (8) where signaling IS the game.
- Input 6: Modifier deck + monster spawn cards + scenario cards.
- Output 7: Attack modifier flipped AFTER attack declared — textbook output randomness. Crits and nulls swing combats.
- Innhente 4: No player-to-player catch-up. Difficulty scales but within-scenario weak.
- Tema 8: Mercenary band feel; class abilities feel class-specific. Above Brass (8) at par.
- Motor 6: XP/gold/items between scenarios + initiative/energy within. Moderate.
- Narrativ 10: Persistent legacy-style campaign with branching, retirement, world unlock. Anchored alongside Pandemic Legacy.

### Calibration check
- Predicted closest: Arkham LCG (in catalog — campaign + story + character persistence), Sleeping Gods (open-world co-op), ISS Vanguard.
- Sanity: ✓ — the canonical campaign-coop neighbors.

### BGG cross-check
- rec.games returned broken results (Gloomhaven spinoffs + random trivia games) — model artifact. Calibration done against catalog anchors only.

---

## Pandemic Legacy: Season 1 (BGG 161936)

**Scores:** [4, 6, 5, 9, 0, 7, 6, 1, 3, 8, 4, 10]
**Solo:** 4 · **Fiddly:** 5 · **Best:** [2P, 3P, 4P]
**Category:** solo

### Per-axis reasoning
- Vekt 4: Base Pandemic + legacy additions. Heavier than Welcome To (2), lighter than TM (6).
- Dybde 6: Decent decisions but co-op quarterback problem flattens the decision tree across players.
- Density 5: Quick turns (4 actions); moderate per-turn weight.
- Inter 9: Pure co-op — every move matters to everyone. Same as Spirit Island (9).
- Konflikt 0: No conflict.
- Forhandl 7: Heavy discussion required; open hands keep this below The Crew (8) where signaling is hidden.
- Input 6: Infection draws + player card draws — significant.
- Output 1: Deterministic resolution.
- Innhente 3: Game gets harder, not catch-uppier.
- Tema 8: Disease theme integrates with mechanics; legacy persistence makes it personal.
- Motor 4: Cures + character improvements provide some build-up but largely tactical.
- Narrativ 10: Anchored in handoff (Pandemic Legacy = 10).

### Calibration check
- Predicted closest: Sleeping Gods (narrative co-op), Spirit Island (heavy co-op), Arkham LCG.
- Sanity: ✓

### BGG cross-check
- rec.games results broken (trivia/party games dominate) — model artifact. Calibration via anchors only.

---

## Spirit Island (BGG 162886)

**Scores:** [7, 9, 8, 9, 0, 7, 5, 2, 4, 10, 9, 5]
**Solo:** 10 · **Fiddly:** 6 · **Best:** [1P, 2P]
**Category:** solo

### Per-axis reasoning
- Vekt 7: Heavy rules — power cards + fear track + blight + invader phases + spirit variability. Heavier than Wingspan (4), lighter than Brass (8).
- Dybde 9: Complex turn puzzle; many spirits + adversaries.
- Density 8: Power play sequencing + fear generation + invader prediction creates real brain-burn.
- Inter 9: Pure co-op; spirits coordinate or lose.
- Konflikt 0: Vs-AI co-op.
- Forhandl 7: Discussion-heavy; quarterback prone.
- Input 5: Card draws + invader exploration; mostly deterministic frame.
- Output 2: Encounter card variance; otherwise rule-driven.
- Innhente 4: Tension throughout; no rubber-band.
- Tema 10: Anchored in handoff doc. Spirits feel like spirits because mechanics enforce it.
- Motor 9: Each spirit has a unique energy/cards/range engine arc.
- Narrativ 5: Each game tells a story but no persistent campaign.

### Calibration check
- Predicted closest: Mage Knight (in catalog — solo-major puzzle), Arkham LCG, Sleeping Gods.
- Sanity: ✓ — solo champion of the catalog.

### BGG cross-check
- rec.games returned broken results — model artifact. Calibration via anchors only.

---

## Batch 02 — Priority-1 continuation (2026-05-21)

10 games added: Lost Ruins of Arnak, Power Grid, Agricola, Caverna, A Feast for Odin, Brass: Lancashire, Eclipse: Second Dawn, Cascadia, Splendor, Marvel Champions.

Catalog grows 44 → 54. rec.games neighborhoods were usable for all 10 this batch.

---

## Lost Ruins of Arnak (BGG 312484)

**Scores:** [5, 7, 6, 5, 2, 0, 6, 2, 5, 6, 7, 3] · **Solo:** 7 · **Fiddly:** 5 · **Best:** [2P, 3P] · **Category:** heavy-euro

- Vekt 5: BGG 2.88. Between Wingspan (4) and TM (6).
- Dybde 7: WP + deckbuilder + exploration creates multiple paths.
- Density 6: turns moderately weighty.
- Inter 5: shared worker spots + card market + exploration tile competition.
- Konflikt 2 · Forhandl 0.
- Input 6: card draws + exploration reveal + market refresh.
- Output 2: minor encounter dice.
- Innhente 5: research track ladder; no rubber-band.
- Tema 6: Indiana-Jones feel integrates fine.
- Motor 7: deckbuilder side compounds nicely.
- Narrativ 3.

Predicted closest: Everdell, Wingspan, Ark Nova. rec.games: Paladins of WK, Architects of WK, Everdell (✓), Viscounts of WK, White Castle. Catalog overlap: Everdell. ✓

---

## Power Grid (BGG 2651)

**Scores:** [6, 8, 6, 8, 4, 2, 4, 0, 8, 5, 6, 3] · **Solo:** 0 · **Fiddly:** 5 · **Best:** [4P, 5P] · **Category:** heavy-euro

- Vekt 6: same class as TM (6).
- Dybde 8: bidding + resource timing + turn-order manipulation is deep.
- Density 6: post-auction turns are quick.
- Inter 8: auction + shared resource market + city placement contention. Very interactive.
- Konflikt 4: blocking only.
- Forhandl 2: bidding interaction.
- Input 4: plant-market shuffle.
- Output 0: deterministic.
- Innhente 8: anchored in handoff doc (Power Grid = 8).
- Tema 5 · Motor 6 · Narrativ 3.

Predicted closest: Concordia, Castles of Burgundy. rec.games top: Acquire, Steam, Age of Steam, Puerto Rico, 1830 — older economic classics; no catalog overlap yet, but the engine should still cluster it near other interactive economic euros.

---

## Agricola (BGG 31260)

**Scores:** [7, 9, 7, 7, 3, 0, 6, 0, 4, 7, 6, 3] · **Solo:** 7 · **Fiddly:** 7 · **Best:** [3P, 4P] · **Category:** heavy-euro

- Vekt 7: BGG 3.62. Slightly lighter than Le Havre (8) in catalog.
- Dybde 9: famously deep card-driven worker placement.
- Density 7: WP turns dense.
- Inter 7: blocking workers is core — higher than Le Havre (5).
- Konflikt 3 · Forhandl 0.
- Input 6: occupation/minor-improvement hands are luck of the draw.
- Output 0.
- Innhente 4: feeding pressure mildly equalizing.
- Tema 7: farming feels like farming.
- Motor 6 · Narrativ 3.

Predicted closest: Le Havre (in catalog), Caverna (this batch), Feast for Odin (this batch). rec.games confirms: Le Havre, Ora et Labora, Feast for Odin, Fields of Arle. ✓

---

## Caverna: The Cave Farmers (BGG 102794)

**Scores:** [8, 9, 6, 6, 3, 0, 4, 0, 5, 7, 7, 3] · **Solo:** 7 · **Fiddly:** 8 · **Best:** [3P] · **Category:** heavy-euro

- Vekt 8: BGG 3.84 — heavier than Agricola (7) via bigger building catalog and dwarf races.
- Dybde 9: huge option space.
- Density 6: longer turns / more downtime than Agricola.
- Inter 6: more action spaces than Agricola → less forced contention.
- Konflikt 3: weapons exist but soft.
- Forhandl 0.
- Input 4: no occupation cards — less random than Agricola.
- Output 0 · Innhente 5.
- Tema 7 · Motor 7 · Narrativ 3.

Predicted closest: Agricola, Le Havre, Feast for Odin. rec.games confirms tight cluster: Feast for Odin, Fields of Arle, Le Havre, Ora et Labora, Clans of Caledonia (✓). ✓

---

## A Feast for Odin (BGG 177736)

**Scores:** [9, 10, 6, 5, 2, 0, 5, 2, 4, 7, 7, 4] · **Solo:** 8 · **Fiddly:** 9 · **Best:** [2P, 3P, 4P] · **Category:** heavy-euro

- Vekt 9: BGG 3.97. Same class as Voidfall/Gaia (9).
- Dybde 10: gigantic action board, many strategies. Famous for AP.
- Density 6: long turns dilute density.
- Inter 5: shared action board with blocking but plenty of options to dodge.
- Konflikt 2: raiding is solo-feeling.
- Forhandl 0.
- Input 5: card draws (occupation/weapon/exploration).
- Output 2: minor.
- Innhente 4 · Tema 7 · Motor 7 · Narrativ 4.

Predicted closest: Caverna, Agricola, Le Havre. rec.games: Fields of Arle, Caverna (✓ this batch), Hallertau, Glass Road, Clans of Caledonia (✓). ✓

---

## Brass: Lancashire (BGG 28720)

**Scores:** [8, 10, 9, 10, 5, 2, 6, 1, 5, 7, 7, 4] · **Solo:** 4 · **Fiddly:** 6 · **Best:** [3P, 4P] · **Category:** geek

- Mostly tracks Birmingham (`brass-birmingham`) with deliberate small diffs:
  - Forhandl 2 (vs Bham 3): no beer-borrowing.
  - Innhente 5 (vs Bham 6): less forgiving of mistakes.
  - Tema 7 (vs Bham 8): no beer culture aspect — purer abstraction.
- Vekt 8 / Dybde 10 / Density 9 / Inter 10 / Konflikt 5 / Input 6 / Output 1 / Motor 7 / Narrativ 4.

Predicted closest: Brass: Birmingham (in catalog) — should rank near the top, possibly #1. rec.games: Age of Steam, Steam, Great Zimbabwe, Barrage (✓), Food Chain Magnate, Mombasa. Catalog overlap: Barrage. ✓

---

## Eclipse: Second Dawn for the Galaxy (BGG 246900)

**Scores:** [7, 9, 6, 8, 7, 3, 5, 6, 4, 7, 9, 6] · **Solo:** 4 · **Fiddly:** 8 · **Best:** [4P] · **Category:** geek

- Vekt 7: BGG 3.79. Same class as Scythe (7), much lighter than TI4 (10).
- Dybde 9: tech tree + ship customization deep.
- Density 6: downtime grows past 4P.
- Inter 8: shared galaxy, war, interception.
- Konflikt 7: combat is core; less than TI4 (8) due to no politics layer.
- Forhandl 3: informal diplomacy.
- Input 5: hex draw on exploration.
- Output 6: combat dice. Same class as Catan (6).
- Innhente 4 · Tema 7 · Motor 9 · Narrativ 6.

Predicted closest: TI4, Scythe (in catalog), Rebellion (in catalog). rec.games: Clash of Cultures, Beyond the Sun, Civ ANew Dawn, Kemet, Forbidden Stars. No direct catalog overlap from rec.games, but TI4 should dominate the Standard-lens neighbors.

---

## Cascadia (BGG 295947)

**Scores:** [2, 5, 5, 3, 0, 0, 6, 0, 6, 5, 4, 1] · **Solo:** 7 · **Fiddly:** 2 · **Best:** [2P] · **Category:** filler

- Vekt 2: SdJ 2022. Welcome To anchor.
- Dybde 5: scoring cards add modest variety.
- Density 5: sparse decisions per turn.
- Inter 3: shared tile+animal pool, mild contention. Parallel-play zone.
- Konflikt 0 · Forhandl 0.
- Input 6: tile/animal draw is the variance.
- Output 0.
- Innhente 6: short game, runaway hard.
- Tema 5 · Motor 4 · Narrativ 1.

Predicted closest: Welcome To, Wingspan. rec.games: Calico, Isle of Cats, Azul: Summer Pavilion, Cartographers, Sagrada — all tile/spatial puzzles. Cluster checks out.

---

## Splendor (BGG 148228)

**Scores:** [2, 5, 5, 5, 1, 0, 4, 0, 6, 3, 8, 1] · **Solo:** 5 · **Fiddly:** 2 · **Best:** [2P, 3P] · **Category:** filler

- Vekt 2: gateway.
- Dybde 5: simple but optimization exists.
- Density 5: one action per turn, fast pace.
- Inter 5: gem-pool contention + card sniping. Higher than Wingspan (4) because contested-by-default.
- Konflikt 1 · Forhandl 0.
- Input 4: noble + card-row refresh.
- Output 0 · Innhente 6.
- Tema 3: pasted-on.
- Motor 8: pure engine builder — cards → discounts → more cards.
- Narrativ 1.

Predicted closest: Welcome To, Quacks (light engine), Cat in the Box (filler). rec.games: Century: Spice Road, Century: Golem, Azul, Stone Age, Jaipur. Cluster checks out (gateway/quick).

---

## Marvel Champions (BGG 285774)

**Scores:** [4, 7, 6, 7, 0, 5, 6, 4, 4, 8, 6, 4] · **Solo:** 9 · **Fiddly:** 5 · **Best:** [1P, 2P] · **Category:** solo

- Vekt 4: card game, but lots of card interactions to track.
- Dybde 7: deckbuilding outside game + tactical hero turn inside.
- Density 6: heroes have real options per turn.
- Inter 7: co-op coordination matters; threat distribution.
- Konflikt 0 (co-op).
- Forhandl 5: discussion, lighter than Pandemic (7).
- Input 6: card draw heavy.
- Output 4: encounter reveals + occasional dice swing.
- Innhente 4 · Tema 8: heroes feel like the heroes.
- Motor 6: per-game board-state ramp.
- Narrativ 4: scenarios but no persistent campaign.

Predicted closest: Arkham LCG (in catalog), Earthborne Rangers. rec.games confirms LCG cluster: LotR LCG, Arkham LCG (✓), Bloodborne BG, Marvel United, Final Girl. ✓

---

