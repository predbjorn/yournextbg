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

## Batch 03 — Priority-1 closeout (2026-05-21)

3 games added: Catan, Ticket to Ride, Azul. Catalog grows 54 → 57. Closes out the Priority-1 list from `scoring-handoff.md`. Skipped BGG 182028 (Through the Ages: A New Story of Civilization) — same game as in-catalog `through-the-ages` (BGG 25613), different edition; adding would duplicate.

---

## Catan (BGG 13)

**Scores:** [3, 4, 5, 5, 3, 4, 4, 6, 3, 5, 4, 1] · **Solo:** 0 · **Fiddly:** 3 · **Best:** [4P] · **Category:** filler

- Weight 3 / Depth 4 / Density 5 — all anchored directly in handoff doc.
- Interaction 5: anchored in handoff (5–6 "indirect mechanical" zone).
- Conflict 3: robber is direct hostility (steal + block) but mild compared to wargame anchors.
- Negotiation 4: anchored (Catan = 4, trading).
- Input 4: setup + dev-card draws.
- Output 6: anchored (Catan = 6, dice every turn).
- Catchup 3: weak rubber-band, runaway leader is canonical Catan complaint.
- Theme 5 / Engine 4 / Narrative 1 — all anchored.

Predicted closest: Welcome To, Quacks, Ticket to Ride (this batch). The trading layer separates it from pure tile-laying fillers.

---

## Ticket to Ride (BGG 9209)

**Scores:** [3, 4, 3, 6, 4, 0, 5, 0, 4, 4, 3, 2] · **Solo:** 0 · **Fiddly:** 2 · **Best:** [3P, 4P] · **Category:** filler

- Weight 3 / Density 3 — anchored.
- Depth 4: route optimization is the real game; simple but real.
- Interaction 6: route-blocking is the heart, brutal at 4–5P.
- Conflict 4: aggressive blocking is part of the meta.
- Negotiation 0: none.
- Input 5: ticket and face-up train-card draws.
- Output 0 · Catchup 4.
- Theme 4 · Engine 3 · Narrative 2.

Predicted closest: Catan, Welcome To. Same gateway cluster but with much higher interaction than Catan would suggest from weight alone.

---

## Azul (BGG 230802)

**Scores:** [2, 6, 5, 7, 3, 0, 4, 0, 4, 3, 3, 1] · **Solo:** 4 · **Fiddly:** 1 · **Best:** [2P, 4P] · **Category:** filler

- Weight 2: BGG 1.77, gateway.
- Depth 6: deceptively deep for its weight — drafting + spatial puzzle interact.
- Density 5.
- Interaction 7: drafting from shared factories means every pick reshapes everyone's options. High for a gateway.
- Conflict 3: forcing overflow tiles onto opponents is hostile.
- Negotiation 0.
- Input 4: tile-bag draws visible at factory refresh (input, not output).
- Output 0 · Catchup 4.
- Theme 3 (Tapestry anchor — pasted on).
- Engine 3 · Narrative 1.
- Fiddly 1: anchored in handoff (Azul = 1).

Predicted closest: Splendor (this batch's drafting/optimization neighbor), Welcome To, Quacks. rec.games confirmed Azul lives in the same neighborhood as Splendor.

---

## Batch 04 — Priority 2 (2026-05-21)

6 games added: Speakeasy, Galactic Cruise, Luthier, Molly House, Arydia, Corps of Discovery. Catalog grows 57 → 63. Closes out the Priority-2 watchlist from `scoring-handoff.md`. These are all 2024–2025 titles with thinner public reasoning than the Priority-1 set; scored from rulebook/review knowledge + recommend.games cluster cross-check. BGG XML API is still 401-gated, so direct BGG metadata pulls are skipped.

---

## Speakeasy (BGG 375459)

**Scores:** [9, 9, 8, 7, 5, 3, 4, 1, 4, 8, 7, 5] · **Solo:** 7 · **Fiddly:** 9 · **Best:** [2P, 3P] · **Category:** heavy-euro

- Weight 9: Lacerda heavy (BGG community weight 4.5+). Same class as Voidfall (9), heavier than Brass (8).
- Depth 9: multi-step actions with deep alliance-and-bribe trees; not Brass-deep (10).
- Density 8: classic Lacerda — every action triggers 3-4 sub-effects.
- Interaction 7: gangster placement contests space; supply chain shared; alliance system pulls everyone into each other's plans. Heavier than TM (3), lighter than Brass (10).
- Conflict 5: rival families muscle each other off territory; structural rather than dice-combat. Brass-class.
- Negotiation 3: alliance-bidding is a real layer but constrained (not John Company 10).
- Input 4: card/event draw is modest.
- Output 1: deterministic resolution (Lacerda hallmark).
- Catchup 4: euro-balanced; weak rubber-band.
- Theme 8: prohibition NYC integrates into mechanics (heat, federal raids, families). Brass-class theme integration.
- Engine 7: action capability escalates; not pure engine (no Race-for-the-Galaxy eruption).
- Narrative 5: era progression with heat escalation but no story.

Predicted closest: Voidfall, Brass (in catalog), Through the Ages. rec.games cluster (Inventions, Sankoré, Shackleton Base, Shipyard 2E, Zhanguo, Stupor Mundi) is all heavy-euro and confirms the neighborhood — no direct catalog overlap from rec.games (the Lacerda/heavy-euro neighborhood is undercatalogued).

---

## Galactic Cruise (BGG 391137)

**Scores:** [7, 8, 7, 5, 2, 0, 5, 1, 4, 6, 8, 4] · **Solo:** 8 · **Fiddly:** 6 · **Best:** [2P, 3P] · **Category:** heavy-euro

- Weight 7: BGG ~3.8. Same class as Ark Nova (7), heavier than TM (6).
- Depth 8: meaningful path differentiation across departments and ship layout.
- Density 7: full hands of options per turn, classic worker-placement density.
- Interaction 5: shared worker spots + shared event tracks. TM-class (3) but with more contention because workers block. Lighter than Brass (10).
- Conflict 2: no direct attacks.
- Negotiation 0.
- Input 5: card draw + event variance.
- Output 1: deterministic.
- Catchup 4.
- Theme 6: charming cruise theme but mechanics are familiar worker-placement; not Sleeping-Gods-baked-in.
- Engine 8: clear engine arc as departments synergize; ramps hard.
- Narrative 4: cruise progresses across rounds but no story-arc.

Predicted closest: Ark Nova, TM, SETI (in catalog). rec.games cluster: Ezra and Nehemiah, Minos, Evacuation, Inventors/Scholars of South Tigris, Shackleton Base, Pampero, Inventions, Barcelona, Galileo Galilei — all medium-heavy worker placement euros. No direct catalog overlap from rec.games but my Standard-lens neighbors (Ark Nova, TM, SETI) should rank highly.

---

## Luthier (BGG 371330)

**Scores:** [6, 7, 6, 4, 1, 0, 5, 2, 5, 6, 7, 3] · **Solo:** 7 · **Fiddly:** 5 · **Best:** [2P, 3P] · **Category:** heavy-euro

- Weight 6: medium-heavy. Same class as TM (6), Castles of Burgundy (6), Concordia-adjacent (5).
- Depth 7: solid optimization puzzle with custom-die assignment.
- Density 6: clean turns.
- Interaction 4: shared market/commission slots; mostly parallel play. Wingspan-class (4).
- Conflict 1: trivial.
- Negotiation 0.
- Input 5: dice + card draw.
- Output 2: dice are assigned (input-luck primary); some output on commissions.
- Catchup 5: balanced.
- Theme 6: Renaissance instrument-crafting is novel but the mechanics could re-skin to any commission-fulfilment euro.
- Engine 7: capability escalation via apprentices + workshop upgrades.
- Narrative 3: minor session arc.

Predicted closest: Castles of Burgundy, Concordia, Ark Nova (lighter), SETI. rec.games cluster: Minos, Ostia, Skara Brae, Ezra & Nehemiah, Galactic Cruise (this batch ✓), House of Fado, Stupor Mundi, Inventors of South Tigris, Shackleton Base, Windmill Valley — medium-heavy euro. Within-batch overlap with Galactic Cruise expected.

---

## Molly House (BGG 359871)

**Scores:** [5, 7, 5, 8, 6, 7, 7, 5, 5, 9, 4, 7] · **Solo:** 0 · **Fiddly:** 6 · **Best:** [3P, 4P, 5P] · **Category:** geek

- Weight 5: BGG ~2.9. Concordia-class (5). Higher than its component count suggests because the indictment system is non-trivial.
- Depth 7: hand management + party-building + push-your-luck pivots. Wehrle-typical depth at moderate weight.
- Density 5: turns are quick but each one is a real pivot.
- Interaction 8: semi-coop with traitor potential. Everyone affects everyone via party-joining, denouncing, and indictments. Wehrle's signature emergent interaction — Brass-class without the economic chains.
- Conflict 6: denouncing is direct hostile action — players actively send each other to jail. More than Brass (5), less than Root (9).
- Negotiation 7: party participation and split decisions are negotiated openly; high but not John Company (10).
- Input 7: dice + card draw heavily. Push-your-luck reveals at parties.
- Output 5: dice rolls resolve some events; not all luck is pre-decision.
- Catchup 5: indictments rebalance leaders structurally.
- Theme 10: theme and mechanics are inseparable — secrecy, queer joy, betrayal, the Society itself. Spirit-Island-class theme integration.
- Engine 4: not really an engine game; capability stays fairly flat.
- Narrative 7: rounds escalate Society heat; clear arc within a session.

Predicted closest: Arcs, Root, John Company (in catalog). rec.games top neighbor: Oath (Wehrle) — confirms the cluster perfectly. The whole semi-coop-with-traitor space is well-represented by Arcs/Root/John Company in our catalog.

---

## Arydia: The Paths We Dare Tread (BGG 219650)

**Scores:** [7, 7, 5, 6, 0, 5, 6, 5, 5, 10, 5, 9] · **Solo:** 9 · **Fiddly:** 8 · **Best:** [1P, 2P] · **Category:** solo

- Weight 7: campaign-game weight. Same class as Sleeping Gods (7), Arkham LCG (7); lighter than Gloomhaven (8).
- Depth 7: deep across the campaign, individual sessions less so.
- Density 5: adventure-game pacing — exploration > turn density.
- Interaction 6: co-op coordination matters; party play.
- Conflict 0: pure co-op.
- Negotiation 5: party coordination, Gloomhaven-class (5).
- Input 6: encounter cards + map reveals.
- Output 5: card/dice combat has output luck.
- Catchup 5: scaling difficulty, balanced.
- Theme 10: full open-world fantasy world. Sleeping-Gods-class.
- Engine 5: per-character growth, not pure engine.
- Narrative 9: branching open-world narrative; Sleeping Gods anchor (9).

Predicted closest: Sleeping Gods, Tainted Grail, Earthborne Rangers, Arkham LCG (in catalog). rec.games cluster: Elder Scrolls BG, Stars of Akarios, Dragon Eclipse, Isofarian Guard, Agemonia, Aeon Trespass: Odyssey, Primal, STALKER, burncycle — sandbox/campaign solo-coop adventure. Strong overlap with our solo cluster expected.

---

## Corps of Discovery (BGG 396895)

**Scores:** [6, 6, 5, 6, 1, 5, 6, 4, 5, 9, 4, 8] · **Solo:** 8 · **Fiddly:** 7 · **Best:** [2P, 3P] · **Category:** solo

- Weight 6: medium. Lighter than Tainted Grail (7), heavier than Pandemic Legacy (4). Earthborne Rangers (6) class.
- Depth 6: scenario-driven; decisions exist but are constrained by the script.
- Density 5.
- Interaction 6: co-op coordination.
- Conflict 1: NPC hostility but no PvP.
- Negotiation 5: party coordination.
- Input 6: encounter cards + dice.
- Output 4: dice and event reveals on actions.
- Catchup 5.
- Theme 9: Lewis & Clark is unusual and well-evoked; not quite Spirit-Island-baked-in (10).
- Engine 4: scenario-based, no engine.
- Narrative 8: campaign with branching choices; less open-world than Arydia (9), more directed than Tainted Grail (10) suggests but similar magnitude.

Predicted closest: Earthborne Rangers, Tainted Grail, Pandemic Legacy, Arydia (this batch). rec.games returns weak data (small thematic games, mostly off-target) — confidence is lower here. Catalog neighbors should still cluster solidly in the campaign-coop space.

---

## Batch 05 — Priority 3 hub games (2026-05-21)

10 games added: Maracaibo, Great Western Trail, Underwater Cities, Paladins of the West Kingdom, Lisboa, On Mars, Kanban EV, Dune: Imperium, Food Chain Magnate, Age of Steam. Catalog grows 63 → 73.

Selection logic: recurring "fans also like" hubs across the Priority-1/2 rec.games clusters + three Lacerdas to anchor the Speakeasy neighborhood that batch 04 opened. BGG XML is still 401-gated; all scoring done from rulebook/review knowledge + recommend.games cluster signals.

Sub-clusters now well-represented in the catalog:
- **Lacerda heavy-euro:** Speakeasy + Lisboa + On Mars + Kanban EV
- **Pfister/Suchý/Garphill mid-weight euro:** Maracaibo + GWT + UWC + Paladins (these all cluster tightly via rec.games)
- **Splotter brutal economic:** Food Chain Magnate + Age of Steam (with Brass: Birmingham + Brass: Lancashire already in catalog as the bridge)
- **Deckbuilder hybrids:** Dune: Imperium + Lost Ruins of Arnak + Beyond the Sun

---

## Maracaibo (BGG 276025)

**Scores:** [7, 9, 6, 5, 2, 0, 6, 1, 4, 6, 8, 5] · **Solo:** 8 · **Fiddly:** 7 · **Best:** [2P, 3P, 4P] · **Category:** heavy-euro

- Weight 7: BGG 3.9. Same class as Ark Nova (7), GWT (7).
- Depth 9: Pfister-deep — multiple viable strategies (combat, quest, city influence). Class of Brass (10) / Through the Ages (10).
- Density 6.
- Interaction 5: alliance contention + shared spots on the rondel-loop board; TM-class (3) but slightly higher.
- Conflict 2: minimal direct combat.
- Negotiation 0.
- Input 6: card draw drives nation/quest variance.
- Output 1: deterministic.
- Catchup 4.
- Theme 6: pasted-on Caribbean, mechanics-first.
- Engine 8.
- Narrative 5: campaign mode adds session-to-session arc.

Predicted closest: GWT (this batch), Ark Nova, SETI, UWC (this batch). rec.games cluster (Praga, Marco Polo II, Teotihuacan, UWC ✓, Newton, Tekhenu, Boonlake, Paladins ✓, GWT ✓) is exactly the Pfister/Suchý/Garphill hub — this batch covers four of its members directly.

---

## Great Western Trail (BGG 193738)

**Scores:** [7, 9, 6, 5, 2, 0, 5, 1, 5, 7, 8, 4] · **Solo:** 8 · **Fiddly:** 6 · **Best:** [3P, 4P] · **Category:** heavy-euro

- Weight 7: BGG 3.7.
- Depth 9: extremely deep — engineer, building, cattle, KC delivery, all viable.
- Density 6.
- Interaction 5: shared buildings + hazards on the trail.
- Conflict 2: hazard blocking.
- Negotiation 0.
- Input 5: cattle market and card draw.
- Output 1.
- Catchup 5.
- Theme 7: cattle drive really feels like a cattle drive (Pfister hallmark). Higher than Maracaibo's pasted-on Caribbean.
- Engine 8: deck quality ramps hard, building chains compound.
- Narrative 4.

Predicted closest: Maracaibo (this batch), Ark Nova, UWC (this batch), Gaia Project (in catalog). rec.games returns Maracaibo, Mombasa, Marco Polo II, Teotihuacan, UWC ✓, Lorenzo, Gaia ✓, Marco Polo, Blackout, Hallertau — confirms the hub status.

---

## Underwater Cities (BGG 247763)

**Scores:** [7, 8, 6, 5, 2, 0, 6, 1, 4, 4, 8, 3] · **Solo:** 8 · **Fiddly:** 6 · **Best:** [2P, 3P] · **Category:** heavy-euro

- Weight 7: BGG 3.4.
- Depth 8: card-matching puzzle is deep, three eras of escalating capability.
- Density 6.
- Interaction 5: shared worker spots.
- Conflict 2.
- Negotiation 0.
- Input 6: card draw is the engine of variance.
- Output 1.
- Catchup 4.
- Theme 4: underwater cities mostly aesthetic. Tapestry-class pasted-on (3).
- Engine 8: clear three-era ramp.
- Narrative 3.

Predicted closest: Maracaibo, GWT, Paladins (all this batch), Ark Nova. rec.games: Praga, Maracaibo ✓, Newton, Pulsar, Coimbra, Paladins ✓, Teotihuacan, Marco Polo II, Lorenzo, Darwin's Journey.

---

## Paladins of the West Kingdom (BGG 266810)

**Scores:** [7, 8, 7, 4, 1, 0, 6, 1, 4, 5, 8, 3] · **Solo:** 7 · **Fiddly:** 7 · **Best:** [2P, 3P, 4P] · **Category:** heavy-euro

- Weight 7: BGG 3.8.
- Depth 8: optimization puzzle, depth from action chaining + worker color matching.
- Density 7: dense turns, lots packed in.
- Interaction 4: parallel-play heavy — Wingspan-class.
- Conflict 1.
- Negotiation 0.
- Input 6: paladin draw + worker market.
- Output 1.
- Catchup 4.
- Theme 5.
- Engine 8: ramp via paladins + workshops + suppression chain.
- Narrative 3.

Predicted closest: Maracaibo, UWC, GWT (all this batch), Ark Nova. rec.games: Viscounts (sibling), Maracaibo ✓, Teotihuacan, UWC ✓, Rajas, Praga, Coimbra, Tekhenu, Wayfarers, Altiplano.

---

## Lisboa (BGG 161533)

**Scores:** [9, 10, 8, 6, 3, 2, 5, 1, 4, 8, 8, 5] · **Solo:** 6 · **Fiddly:** 9 · **Best:** [3P, 4P] · **Category:** heavy-euro

- Weight 9: BGG 4.6. Same class as Voidfall (9), Speakeasy (9), Through the Ages (9).
- Depth 10: extremely deep — many viable engines (building, ships, royal court).
- Density 8: Lacerda multi-effect actions.
- Interaction 6: shared officials + market shifts. Heavier than TM (3), lighter than Brass (10). Slightly less than Speakeasy (7) — no alliance-bidding.
- Conflict 3: market manipulation as indirect hostility.
- Negotiation 2: minor.
- Input 5: card-driven officials reveal.
- Output 1: deterministic (Lacerda hallmark).
- Catchup 4.
- Theme 8: Lisbon rebuilding integrates into mechanics — royal favors, church, commerce. Brass-class.
- Engine 8.
- Narrative 5: era arc.

Predicted closest: Speakeasy, On Mars + Kanban EV (this batch), Voidfall (in catalog), Brass (in catalog). rec.games: Gallerist, Kanban EV ✓, Vinhos, On Mars ✓, Kanban, Trickerion, Carnegie, Weather Machine, CO2, Coffee Traders — Lacerda cluster.

---

## On Mars (BGG 184267)

**Scores:** [10, 10, 8, 6, 3, 2, 5, 1, 4, 7, 9, 5] · **Solo:** 8 · **Fiddly:** 9 · **Best:** [3P, 4P] · **Category:** heavy-euro

- Weight 10: BGG 4.7, heaviest Lacerda. Class of TI4 (10).
- Depth 10: massive decision tree — orbit vs. surface, contracts, factions.
- Density 8.
- Interaction 6: shared spots + contract competition. Lisboa-class.
- Conflict 3.
- Negotiation 2.
- Input 5.
- Output 1.
- Catchup 4.
- Theme 7: Mars colonization feels appropriate but is one layer of abstraction beyond Lisboa.
- Engine 9: massive engine through colony progression — class of TM (9).
- Narrative 5: era flips between orbit and Mars phases.

Predicted closest: Lisboa, Kanban EV, Speakeasy, Voidfall. rec.games: Kanban EV ✓, Lisboa ✓, Gallerist, Weather Machine, Trickerion, Vinhos, Kanban, Carnegie, Perseverance, Inventions.

---

## Kanban EV (BGG 284378)

**Scores:** [9, 10, 9, 7, 3, 2, 4, 1, 4, 8, 8, 5] · **Solo:** 8 · **Fiddly:** 9 · **Best:** [3P, 4P] · **Category:** heavy-euro

- Weight 9: BGG 4.6.
- Depth 10: tight efficiency puzzle.
- Density 9: highest density of the Lacerdas — every action triggers many effects.
- Interaction 7: highest in the Lacerda cluster because of the performance-review meeting (Sandra). Players are openly competing for evaluation.
- Conflict 3.
- Negotiation 2.
- Input 4: lowest input randomness of the Lacerdas.
- Output 1.
- Catchup 4.
- Theme 8: factory pressure feels real, Sandra is genuinely intimidating.
- Engine 8.
- Narrative 5.

Predicted closest: Lisboa, On Mars (this batch), Speakeasy. rec.games: Lisboa ✓, On Mars ✓, Gallerist, Vinhos, Carnegie, Weather Machine, Coffee Traders, Trickerion, Clinic, Darwin's Journey — pure Lacerda cluster.

---

## Dune: Imperium (BGG 316554)

**Scores:** [5, 7, 6, 7, 5, 2, 7, 4, 5, 7, 7, 4] · **Solo:** 8 · **Fiddly:** 5 · **Best:** [3P, 4P] · **Category:** geek

- Weight 5: BGG 3.0. Same class as Molly House (5) / Concordia (5). Genuinely mid-weight despite the deckbuilding label.
- Depth 7: meaningful deckbuilding + leader choices, but it's a tight game.
- Density 6.
- Interaction 7: shared worker spots, combat zone, intrigue cards interact. Heavier than typical euros — earns geek category.
- Conflict 5: combat is direct and decisive. Brass-class (5).
- Negotiation 2: minor.
- Input 7: card draw is heavy — you draw 5/round and they drive what you can do. TM-class (9) but a step lower.
- Output 4: combat reveal + intrigue card reveals.
- Catchup 5: intrigue cards as a rubber-band.
- Theme 7: Dune theme well-evoked through leader powers, Sardaukar, spice trade.
- Engine 7: deckbuilding engine arc.
- Narrative 4.

Predicted closest: Beyond the Sun (in catalog), Lost Ruins of Arnak (in catalog), Marvel Champions (in catalog). rec.games: Beyond the Sun ✓, LotR Duel for Middle-earth, Dwellings of Eldervale, Star Wars Deckbuilder, Radlands, Clank Catacombs, Lost Ruins of Arnak ✓ — strong signal, two direct catalog hits.

---

## Food Chain Magnate (BGG 175914)

**Scores:** [8, 10, 8, 10, 6, 0, 1, 0, 2, 7, 6, 4] · **Solo:** 0 · **Fiddly:** 7 · **Best:** [4P, 5P] · **Category:** geek

- Weight 8: BGG 4.2. Same class as Brass (8) / Caverna (8).
- Depth 10: extremely deep — multiple viable strategies + tight market manipulation. Brass-class.
- Density 8.
- Interaction 10: maximum economic friction — every move ripples to every player. Brass-Birmingham-class (10). The defining FCM trait.
- Conflict 6: undercutting, blocking, marketing wars. Aggressive but not direct attacks; higher than Brass (5) because price wars are explicitly hostile.
- Negotiation 0: no formal negotiation; markets resolve everything.
- Input 1: minimal randomness — initial scenario card and that's it. Chess-class (0).
- Output 0: fully deterministic.
- Catchup 2: weak — runaway leader is real if you nail the first marketing campaign. Risk-class (2).
- Theme 7: fast food and corporate hierarchy theme well-baked in.
- Engine 6: more positional/structural than engine — your corporate tree IS your power.
- Narrative 4: era of expansion within a session.

Predicted closest: Brass: Birmingham (in catalog), Brass: Lancashire (in catalog), Age of Steam (this batch). rec.games: Great Zimbabwe, Age of Steam ✓, Indonesia, Bus, 1830, Antiquity, Shikoku, Roads & Boats, Container, Dominant Species — Splotter / heavy economic / 18xx cluster.

---

## Age of Steam (BGG 4098)

**Scores:** [8, 9, 7, 9, 5, 2, 1, 0, 3, 6, 7, 3] · **Solo:** 3 · **Fiddly:** 6 · **Best:** [4P, 5P] · **Category:** geek

- Weight 8: BGG 3.9 but Wallace-brutal — community weight understates it for newcomers. Same class as Brass (8).
- Depth 9: deep but more constrained than Brass — turn structure is rigid.
- Density 7.
- Interaction 9: shared track network + share auction + delivery routes that interlock. Brass-class but just under (10).
- Conflict 5: aggressive blocking + undercutting deliveries; Brass-class.
- Negotiation 2: minor.
- Input 1: very low randomness — goods cubes refresh.
- Output 0: deterministic.
- Catchup 3: weak rubber-band; bankruptcy is real and unforgiving.
- Theme 6: rail theme functional, less narrative than Brass.
- Engine 7: locomotive upgrades + tile network.
- Narrative 3.

Predicted closest: Brass: Birmingham, Brass: Lancashire (both in catalog), Food Chain Magnate (this batch). rec.games: Great Zimbabwe, Indonesia, Bus, 1830, Brass: Lancashire ✓, Shikoku, 18Chesapeake, FCM ✓, 1860, 1846 — Brass is the direct catalog hit from the rec.games top 10.

---

## Batch 06 — README anchors + cluster tightening (2026-05-21)

10 games added: Teotihuacan, The Gallerist, Praga Caput Regni, Lorenzo il Magnifico, Race for the Galaxy, Puerto Rico, Tigris & Euphrates, Sidereal Confluence, Cosmic Encounter, Hive. Catalog grows 73 → 83.

Two-track selection:

1. **README calibration anchors now in catalog** (previously cited but un-scored): Race for the Galaxy (Motor 10), Hive (Vekt 2/Dybde 9 elegance), Sidereal Confluence (Inter 10/Konflikt 1), Cosmic Encounter (Forhandl 9). Users searching for those reference games will land directly, and the comparator now shows the anchor itself rather than guessing at its position.

2. **Cluster tightening** for the Pfister/Suchý/Garphill + Lacerda hubs batch 05 opened: Teotihuacan (5+ catalog hits in its rec.games top 10 now), The Gallerist (4th Lacerda — fills the Speakeasy neighborhood out), Praga, Lorenzo, plus old-school euros Puerto Rico + Tigris & Euphrates that recur as classic anchors.

---

## Teotihuacan: City of Gods (BGG 229853)

**Scores:** [7, 8, 6, 5, 2, 0, 5, 1, 4, 5, 8, 4] · **Solo:** 7 · **Fiddly:** 7 · **Best:** [3P, 4P] · **Category:** heavy-euro

- Weight 7: BGG 3.9. Same class as Maracaibo (7), Paladins (7).
- Depth 8: clean optimization puzzle, multiple paths.
- Density 6.
- Interaction 5: rondel contention + worker bumping. TM-class+ (3 + 2 for bumping).
- Conflict 2.
- Negotiation 0.
- Input 5: tile draw + ascension order.
- Output 1.
- Catchup 4.
- Theme 5: pre-Columbian flavor mostly aesthetic.
- Engine 8: dice growth + tech ramps hard.
- Narrative 4: three eras with eclipse phases.

Predicted closest: Maracaibo, Paladins, UWC, GWT (all in catalog). rec.games: Tekhenu, Maracaibo ✓, Praga ✓ (this batch), Marco Polo II, Lorenzo ✓ (this batch), Coimbra, Paladins ✓, Newton, UWC ✓, Bonfire — five catalog hits in top 10, hub status confirmed.

---

## The Gallerist (BGG 125153)

**Scores:** [9, 10, 8, 6, 3, 2, 4, 1, 4, 8, 8, 5] · **Solo:** 7 · **Fiddly:** 9 · **Best:** [3P, 4P] · **Category:** heavy-euro

- Weight 9: BGG 4.4. Lacerda heavy.
- Depth 10: extremely deep — art investment, gallery, plaza, hired help.
- Density 8.
- Interaction 6: kicked-worker mechanic creates ripples; shared art market. Lisboa-class.
- Conflict 3.
- Negotiation 2.
- Input 4: low randomness.
- Output 1: deterministic.
- Catchup 4.
- Theme 8: art-market theme well-evoked — discovering artists, buying low, hyping reputation.
- Engine 8.
- Narrative 5.

Predicted closest: Lisboa, On Mars, Kanban EV, Speakeasy (all in catalog). rec.games: Vinhos, Lisboa ✓, Kanban EV ✓, Kanban, Trickerion, On Mars ✓, CO2, Vinhos, Carnegie, Anachrony — three catalog hits in top 10, pure Lacerda cluster.

---

## Praga Caput Regni (BGG 308765)

**Scores:** [7, 8, 7, 5, 1, 0, 5, 1, 5, 5, 8, 3] · **Solo:** 7 · **Fiddly:** 6 · **Best:** [2P, 3P, 4P] · **Category:** heavy-euro

- Weight 7: BGG 4.0.
- Depth 8: action-wheel scarcity drives deep optimization.
- Density 7.
- Interaction 5: shared action wheel with shifting prices — everyone's choices reshape the price landscape.
- Conflict 1.
- Negotiation 0.
- Input 5.
- Output 1.
- Catchup 5.
- Theme 5.
- Engine 8: ramps via crane track + wall track + university.
- Narrative 3.

Predicted closest: Teotihuacan (this batch), Maracaibo, Paladins. rec.games: Darwin's Journey, Golem, Tekhenu, Boonlake, Tiletum, Newton, Maracaibo ✓, Cooper Island, Tawantinsuyu, Messina — Suchý/mid-weight cluster.

---

## Lorenzo il Magnifico (BGG 203993)

**Scores:** [6, 7, 6, 5, 1, 0, 6, 2, 5, 5, 7, 4] · **Solo:** 6 · **Fiddly:** 6 · **Best:** [3P, 4P] · **Category:** heavy-euro

- Weight 6: BGG 3.3. Same as Castles of Burgundy, TM.
- Depth 7: solid optimization, leader cards add variety.
- Density 6.
- Interaction 5: shared spots, dice value matters for bumping.
- Conflict 1.
- Negotiation 0.
- Input 6: dice + card market.
- Output 2: dice are assigned but value drives access.
- Catchup 5.
- Theme 5.
- Engine 7: development cards compound across epochs.
- Narrative 4: three epochs + Vatican reports.

Predicted closest: Castles of Burgundy (in catalog), Concordia (in catalog), Teotihuacan (this batch). rec.games: Marco Polo II, Coimbra, Grand Austria Hotel, Mombasa, Newton, Heaven & Ale, Marco Polo, Teotihuacan ✓ (this batch), Bora Bora, Pulsar — classic mid-weight euro hub.

---

## Race for the Galaxy (BGG 28143)

**Scores:** [4, 9, 8, 3, 0, 0, 7, 1, 3, 4, 10, 3] · **Solo:** 6 · **Fiddly:** 4 · **Best:** [2P, 3P, 4P] · **Category:** heavy-euro

- Weight 4: BGG 3.0 but iconography is a steep learning curve. Same class as Wingspan (4).
- Depth 9: massive engine choice space, Brass-near depth at half the rules weight.
- Density 8: simultaneous-decision pace is high.
- Interaction 3: multiplayer solitaire; "leech" actions are the only meaningful interaction.
- Conflict 0.
- Negotiation 0.
- Input 7: card draw is the engine of variance. TM-class (9) but a step lower.
- Output 1: deterministic.
- Catchup 3: leader can run away.
- Theme 4: text-on-cards, pasted-on.
- Engine 10: **README anchor** — eruptive late-game tableau payoff, the canonical Motor 10.
- Narrative 3: race arc but no story.

Predicted closest: TM, Wingspan, Splendor (all in catalog — engine-builders). rec.games: Glory to Rome, Innovation, Mottainai, Fairy Tale, Draft-a-Dragon, Netrunner, San Juan 2E, Res Arcana, Conflicting Kingdoms, The Dark — tableau/card cluster, no direct catalog overlap (this cluster is undercatalogued).

---

## Puerto Rico (BGG 3076)

**Scores:** [5, 8, 7, 8, 3, 1, 3, 0, 4, 4, 7, 3] · **Solo:** 0 · **Fiddly:** 4 · **Best:** [4P, 5P] · **Category:** geek

- Weight 5: BGG 3.3. Concordia-class (5).
- Depth 8: role selection cascades deeply — short rules, brutal decision space.
- Density 7.
- Interaction 8: classic Inter — your role choices give others free actions, ship slots are contested. Heavier than typical euros.
- Conflict 3: ship-slot blocking is hostile but indirect.
- Negotiation 1.
- Input 3: plantation tile draw.
- Output 0: fully deterministic.
- Catchup 4: weak rubber-band.
- Theme 4: colonization is functional but famously pasted-on; theme has been critiqued for years.
- Engine 7: building chains compound.
- Narrative 3.

Predicted closest: Concordia, Power Grid, Le Havre (all in catalog), Tigris & Euphrates (this batch). rec.games: Caylus, Princes of Florence, Saint Petersburg, Power Grid ✓, Goa, Power Grid Deluxe, Le Havre ✓, El Grande, Melodifestivalen, In the Year of the Dragon — old-school euros, two catalog hits.

---

## Tigris & Euphrates (BGG 42)

**Scores:** [6, 9, 6, 9, 7, 1, 3, 1, 4, 4, 5, 4] · **Solo:** 0 · **Fiddly:** 4 · **Best:** [3P, 4P] · **Category:** geek

- Weight 6: BGG 3.5.
- Depth 9: Knizia-deep — short ruleset, brutal decision space.
- Density 6.
- Interaction 9: tile placement constantly triggers conflicts; external and internal conflicts are core. Brass-adjacent but not at 10.
- Conflict 7: direct conflict resolution between kingdoms via tile commitment. Barrage-class (7).
- Negotiation 1.
- Input 3: tile draw.
- Output 1: deterministic resolution.
- Catchup 4.
- Theme 4: civilization flavor; mechanics-first Knizia abstract.
- Engine 5: scoring tracks build but not pure engine.
- Narrative 4: civilization rise/fall feel.

Predicted closest: Brass: Lancashire, Brass: Birmingham (in catalog), Puerto Rico (this batch), Inis (in catalog). rec.games: El Grande, Samurai, Through the Desert, Taj Mahal, Torres, Mexica, Bridges of Shangri-La, Stephenson's Rocket, Tikal, Steam — Knizia/area-control classics, no direct catalog overlap.

---

## Sidereal Confluence (BGG 202426)

**Scores:** [6, 8, 8, 10, 1, 10, 4, 0, 5, 4, 7, 4] · **Solo:** 0 · **Fiddly:** 7 · **Best:** [7P, 8P, 9P] · **Category:** social

- Weight 6: BGG 3.4 but real-time chaos elevates effective weight. Same as Tigris & Euphrates (6).
- Depth 8: huge optimization space, asymmetric races, but messy under time pressure.
- Density 8: continuous decisions during trading phase.
- Interaction 10: **README anchor** — every player trades with every other constantly. Root-class (10).
- Conflict 1: **README anchor** — no attacks, save for late-game sabotage by one race.
- Negotiation 10: pure-negotiation game, John-Company-class (10).
- Input 4: racial setup, modest card variance.
- Output 0.
- Catchup 5.
- Theme 4: aliens flavor, mechanics-driven.
- Engine 7: converter engines compound across rounds.
- Narrative 4: era arc through expansion.

Predicted closest: John Company (in catalog — only direct catalog match for the Inter 10/Negotiation 10 quadrant), Cosmic Encounter (this batch), BotC. rec.games returns mostly off-target (Sigil, Glory to Rome, New Frontiers, Sol, etc.) — this game is in its own niche, sparse catalog overlap expected and present.

---

## Cosmic Encounter (BGG 39463)

**Scores:** [3, 6, 5, 10, 7, 9, 7, 4, 5, 6, 3, 5] · **Solo:** 0 · **Fiddly:** 5 · **Best:** [4P, 5P, 6P] · **Category:** social

- Weight 3: BGG 2.55. Catan-class (3).
- Depth 6: power-driven, less optimization more politics.
- Density 5.
- Interaction 10: every encounter pulls in alliances; everyone's always involved.
- Conflict 7: direct attacks, planet capture. Barrage-class (7).
- Negotiation 9: **README anchor** — alliance-making is the core mechanic.
- Input 7: encounter card draw is the variance.
- Output 4: encounter reveal.
- Catchup 5.
- Theme 6: alien powers feel like alien powers — but heavily mechanics-driven.
- Engine 3.
- Narrative 5: each game tells a chaos story.

Predicted closest: John Company, BotC, Sidereal Confluence (this batch). rec.games returns near-noise — Cosmic Encounter is sui generis and rec.games doesn't model it well; relying on our category + Inter/Negotiation neighbors instead.

---

## Hive (BGG 2655)

**Scores:** [2, 9, 6, 10, 8, 0, 0, 0, 1, 2, 1, 0] · **Solo:** 0 · **Fiddly:** 0 · **Best:** [2P] · **Category:** filler

- Weight 2: **README anchor** — canonical "elegance" example (vekt 2 / dybde 9).
- Depth 9: **README anchor** — chess-class depth at weight 2.
- Density 6.
- Interaction 10: zero-sum 2P abstract; every move is direct response.
- Conflict 8: capture-the-queen surround mechanic is direct; not 10 because no piece elimination in base game.
- Negotiation 0.
- Input 0: zero randomness.
- Output 0: zero randomness.
- Catchup 1: no rubber-band, you can be losing the whole game (chess-class).
- Theme 2: abstract; insect theme is pure flavor.
- Engine 1: no engine.
- Narrative 0.

Predicted closest: no perfect catalog match. The Crew (in catalog, fiddly 1) shares the elegance/low-fiddly profile but is co-op. Welcome To (in catalog, fiddly 1) is parallel-play. Most catalog games will rank far. Hive may end up isolated in the Standard lens — that's correct for an abstract this distinctive. rec.games: Onitama, Quoridor, YINSH, Quarto, Abalone, Tak, Santorini, ZÈRTZ, Hnefatafl, DVONN — pure abstract 2P cluster, undercatalogued.

---

## Batch 07 — cluster fan-out (2026-05-21)

10 games added: Caylus, Saint Petersburg, Innovation, Res Arcana, Glory to Rome, Vinhos Deluxe, Carnegie, El Grande, Onitama, Santorini. Catalog grows 83 → 93.

Fans out across four tracks that batch 06 opened:
- **Old-school heavy euro:** Caylus + Saint Petersburg (paired with Puerto Rico/Le Havre/Power Grid)
- **RftG tableau cluster:** Innovation + Res Arcana + Glory to Rome (Race for the Galaxy now has real catalog neighbors)
- **Abstract 2P:** Onitama + Santorini (paired with Hive — first three-game abstract cluster in catalog)
- **Lacerda completion:** Vinhos Deluxe (the missing classic Lacerda) + Carnegie (Lacerda-adjacent Suchý-style)
- **Knizia/area-control:** El Grande (paired with Tigris & Euphrates)

Schema note: `category` and `categoryLabel` were removed from the `Game` type between batches; new entries here omit those fields. Section header comments in `games.ts` remain as code-structure hints only.

---

## Caylus (BGG 18602)

**Scores:** [7, 9, 6, 8, 3, 1, 2, 0, 4, 5, 7, 3] · **Solo:** 0 · **Fiddly:** 6 · **Best:** [3P, 4P]

- Weight 7: BGG 3.9.
- Depth 9: original worker placement; deep building/income optimization.
- Density 6.
- Interaction 8: provost manipulation + shared building actions are the heart of the game. Higher than typical euros — closer to Puerto Rico (8).
- Conflict 3: provost-blocking is structural hostility.
- Negotiation 1.
- Input 2: very low randomness, no card draw to speak of.
- Output 0: fully deterministic.
- Catchup 4.
- Theme 5.
- Engine 7: building chain compounds across rounds.
- Narrative 3.

Predicted closest: Puerto Rico, Power Grid, Le Havre (in catalog). rec.games: Goa, Princes of Florence, Puerto Rico ✓, In the Year of the Dragon, Le Havre ✓, Navegador, Tzolk'in, Notre Dame, Hansa Teutonica, Endeavor — two catalog hits in top 10.

---

## Saint Petersburg (BGG 9217)

**Scores:** [4, 7, 5, 7, 2, 0, 5, 0, 5, 3, 7, 2] · **Solo:** 0 · **Fiddly:** 3 · **Best:** [3P, 4P]

- Weight 4: BGG 2.5.
- Depth 7: tight market-timing optimization.
- Density 5.
- Interaction 7: shared card market with sniping; tighter than Splendor (5). Card-supply is contended directly.
- Conflict 2.
- Negotiation 0.
- Input 5: card market refresh drives turn-to-turn variance.
- Output 0.
- Catchup 5.
- Theme 3: pasted-on.
- Engine 7: economy compounds across phases.
- Narrative 2.

Predicted closest: Splendor, Concordia, Wingspan, Castles of Burgundy (in catalog). rec.games: Princes of Florence, Goa, San Juan, Notre Dame, Yspahan, San Juan 2E, Endeavor, Glen More, London, Pillars of the Earth — old-school euro, no direct catalog hits (cluster opportunity).

---

## Innovation (BGG 63888)

**Scores:** [5, 9, 8, 7, 5, 0, 8, 2, 5, 4, 9, 4] · **Solo:** 0 · **Fiddly:** 5 · **Best:** [2P, 3P]

- Weight 5: BGG 2.9 but icon density bumps effective complexity to Concordia-class.
- Depth 9: Chudyk-deep — dogma combos chain wildly. Class with Brass (10).
- Density 8: triggering combos per turn keeps you constantly making big choices.
- Interaction 7: shared/demand dogmas force other players to act; heavier than RftG (3).
- Conflict 5: "you steal" / "you transfer" dogmas are direct hostile actions.
- Negotiation 0.
- Input 8: card draw from age-piles is the game's variance engine. Heavier than RftG (7).
- Output 2.
- Catchup 5.
- Theme 4: civilization flavor on cards, mechanics-first.
- Engine 9: explosive late-age combos. Near-RftG (10) but capped by takeover possibility.
- Narrative 4: civilization era arc.

Predicted closest: Race for the Galaxy (in catalog — confirmed by rec.games), Glory to Rome (this batch), Through the Ages. rec.games: Glory to Rome ✓ (this batch), Impulse, Mottainai, Aegean Sea, RftG ✓, It's a Dog's Life, Urban Sprawl, Foolmania, Roll for the Galaxy, Moonsun — RftG and Glory to Rome both in top 10, cluster confirmed.

---

## Res Arcana (BGG 262712)

**Scores:** [4, 7, 7, 5, 2, 0, 4, 1, 4, 5, 8, 3] · **Solo:** 0 · **Fiddly:** 4 · **Best:** [2P, 3P]

- Weight 4: BGG 2.55.
- Depth 7: starting hand + deck assembly are deep — the puzzle is fixed-deck optimization.
- Density 7: tight 8-card decks make every turn a real choice.
- Interaction 5: shared monuments + places of power create sniping.
- Conflict 2: attack spells exist but rarely game-defining.
- Negotiation 0.
- Input 4: monument draw is limited variance.
- Output 1.
- Catchup 4.
- Theme 5: mage theme works through artifact identities.
- Engine 8: pure engine builder with explosive combo turns.
- Narrative 3.

Predicted closest: Race for the Galaxy, Splendor, Wingspan (in catalog), Innovation (this batch). rec.games: Paper Tales, Shards of Infinity, New Frontiers, It's a Wonderful World, Jump Drive, Imperial Settlers EotN, TM:AE, Radlands, Splendor Duel, Dale of Merchants — quick-deckbuilder cluster, no direct catalog hits but adjacent to RftG/Splendor.

---

## Glory to Rome (BGG 19857)

**Scores:** [5, 9, 7, 8, 5, 0, 7, 1, 4, 5, 8, 4] · **Solo:** 0 · **Fiddly:** 5 · **Best:** [3P, 4P]

- Weight 5: BGG 3.05.
- Depth 9: Chudyk-deep — the cards are everything, multi-use, deeply interactive.
- Density 7.
- Interaction 8: follow/lead mechanic + shared pool + steal effects make every turn affect everyone.
- Conflict 5: Legionary steals, Architect/Craftsman triggers cascade.
- Negotiation 0.
- Input 7: card draw from the deck drives variance.
- Output 1.
- Catchup 4.
- Theme 5.
- Engine 8: card combos accelerate brutally.
- Narrative 4.

Predicted closest: Innovation (this batch), Race for the Galaxy (in catalog). rec.games: Innovation ✓ (this batch), RftG ✓, Impulse, Hauntsville, Fleet, Lupus, Sidereal Confluence ✓ (in catalog), Archipelago, Hansa Teutonica, Keyflower — three catalog hits, RftG/Chudyk cluster confirmed.

---

## Vinhos: Deluxe Edition (BGG 175640)

**Scores:** [9, 10, 8, 6, 3, 2, 5, 1, 4, 8, 8, 5] · **Solo:** 7 · **Fiddly:** 9 · **Best:** [3P, 4P]

- Weight 9: BGG 4.4. Lacerda heavy, identical score profile to The Gallerist by design (both classic Lacerdas of similar weight, similar interaction footprint).
- Depth 10.
- Density 8.
- Interaction 6: shared market + fair-presentations contested. Lisboa/Gallerist-class.
- Conflict 3.
- Negotiation 2.
- Input 5.
- Output 1.
- Catchup 4.
- Theme 8: wine production well-evoked through regional differences and aging.
- Engine 8.
- Narrative 5.

Predicted closest: The Gallerist, Lisboa, Kanban EV, On Mars, Speakeasy (all in catalog). rec.games: Gallerist ✓, Lisboa ✓, Kanban, Kanban EV ✓, Trickerion, On Mars ✓, Carnegie ✓ (this batch), CO2, Coffee Traders, Clinic — five catalog hits in top 10, Lacerda cluster now densely populated.

---

## Carnegie (BGG 310873)

**Scores:** [8, 9, 7, 5, 2, 0, 4, 1, 4, 6, 8, 4] · **Solo:** 7 · **Fiddly:** 8 · **Best:** [2P, 3P, 4P]

- Weight 8: BGG 4.0 but the multi-effect action-loop bumps real weight up to Brass (8) / Caverna (8) class.
- Depth 9.
- Density 7.
- Interaction 5: shared spots + route contention. Lighter than Lacerdas because no overt social-pressure mechanics.
- Conflict 2.
- Negotiation 0.
- Input 4.
- Output 1.
- Catchup 4.
- Theme 6: industrialist empire-building works but is one layer of abstraction beyond what Lacerda achieves with similar themes.
- Engine 8: industrial growth ramps hard.
- Narrative 4.

Predicted closest: Caverna, Le Havre, Feast for Odin (in catalog), Vinhos Deluxe (this batch). rec.games: Darwin's Journey, Kanban EV ✓ (in catalog), Coffee Traders, Nucleum, Praga ✓ (in catalog), Boonlake, Golem, Messina 1347, Merv, GWT: Argentina — Suchý-Wallace mid-heavy cluster.

---

## El Grande (BGG 93)

**Scores:** [5, 8, 6, 9, 5, 1, 3, 0, 4, 5, 4, 4] · **Solo:** 0 · **Fiddly:** 4 · **Best:** [4P, 5P]

- Weight 5: BGG 3.05.
- Depth 8: deep area-control optimization at modest weight.
- Density 6.
- Interaction 9: area majority is constant contention; every Caballero placement matters to every other player.
- Conflict 5: aggressive Caballero placement, secret Castillo reveal.
- Negotiation 1.
- Input 3: card draw modest.
- Output 0: fully deterministic.
- Catchup 4.
- Theme 5.
- Engine 4: not an engine-builder.
- Narrative 4: three scoring rounds give an arc.

Predicted closest: Tigris & Euphrates, Puerto Rico (in catalog — both old-school high-Inter classics). rec.games: Samurai, Taj Mahal, Ra, Tikal, T&E ✓ (in catalog), Mexica, Amun-Re, Modern Art, Santiago, Through the Desert — Knizia-classic cluster, one catalog hit.

---

## Onitama (BGG 160477)

**Scores:** [2, 7, 7, 10, 7, 0, 2, 0, 2, 2, 1, 0] · **Solo:** 0 · **Fiddly:** 1 · **Best:** [2P]

- Weight 2: BGG 1.7. Same as Hive (2).
- Depth 7: tactical depth from card-rotation; less deep than Hive (9) because the move space is smaller.
- Density 7.
- Interaction 10: 2P abstract, every move responds.
- Conflict 7: capture mechanic + stone-vs-stream dual win condition. Less than Hive's queen-surround (8).
- Negotiation 0.
- Input 2: starting move cards are dealt randomly — minor variance per game.
- Output 0.
- Catchup 2.
- Theme 2.
- Engine 1.
- Narrative 0.

Predicted closest: Hive (in catalog), Santorini (this batch). rec.games: Santorini ✓ (this batch), Hive ✓ (in catalog), Quarto, Quoridor, Tak, Pentago, SHŌBU, YINSH, Hanamikoji, Battle Sheep — abstract 2P cluster, two catalog hits.

---

## Santorini (BGG 194655)

**Scores:** [2, 6, 6, 10, 5, 0, 0, 0, 2, 3, 1, 0] · **Solo:** 0 · **Fiddly:** 1 · **Best:** [2P]

- Weight 2: BGG 1.7.
- Depth 6: tactical but less deep than Hive/Onitama because the win condition is more constrained.
- Density 6.
- Interaction 10: 2P spatial puzzle, every move responds.
- Conflict 5: blocking is the main hostility; no capture in base game.
- Negotiation 0.
- Input 0: zero randomness in base game (god powers are pre-game variance).
- Output 0.
- Catchup 2.
- Theme 3: Greek towers theme integrates into the win-by-climbing condition lightly.
- Engine 1.
- Narrative 0.

Predicted closest: Onitama (this batch), Hive (in catalog). rec.games: Onitama ✓ (this batch), Hive ✓ (in catalog), Specter Ops, Raptor, Tak, Photosynthesis, YINSH, Mr. Jack, Quoridor, Mr. Jack in New York — abstract 2P cluster, two catalog hits.

---

## Batch 08 — Hub fan-out (2026-05-22)

10 games added: Carcassonne, Patchwork, 7 Wonders, 7 Wonders: Duel, Dominion, Lords of Waterdeep, Codenames, Stone Age, Pandemic, Tzolk'in.

**Strategy:** Priorities 1 + 2 are exhausted. This batch targets foundational hub games that anchor major clusters (tile-laying, drafting, deckbuilder, gateway-WP, co-op, party, 2P abstract-ish) and have very high search volume ("games like Carcassonne", "games like Pandemic" etc). These are SEO landing pages first, recommendation-graph hubs second.

---

## Carcassonne (BGG 822)

**Scores:** [2, 5, 4, 6, 4, 1, 8, 0, 5, 3, 2, 2] · **Solo:** 2 · **Fiddly:** 2 · **Best:** [2P, 3P]

- Weight 2: BGG 1.87. Anchor: Hive (2), one above Patchwork (1).
- Depth 5: Tile placement is accessible; meeple commitment + cooperation-via-shared-cities is real but shallow.
- Density 4: Mostly draw-and-place; the real choices are placement and whether to commit a meeple.
- Interaction 6: City-joining, road-sharing, blocking on farms — direct shared structures.
- Conflict 4: Joining opponent cities to steal scores is mildly hostile.
- Negotiation 1.
- Input 8: Tile draws drive the game; you plan around what you pull.
- Output 0: Deterministic after placement.
- Catchup 5.
- Theme 3: Medieval landscape is pasted-on.
- Engine 2: **Canonical Engine 2 anchor from the README.** No engine arc — just incremental scoring.
- Narrative 2.

Predicted closest: Ticket to Ride, Azul (in catalog — gateway tile-placement / pattern cluster). rec.games typically returns Catan, TtR, Settlers-likes for hub gateway games.

---

## Patchwork (BGG 163412)

**Scores:** [1, 6, 5, 1, 0, 0, 1, 0, 3, 5, 3, 1] · **Solo:** 2 · **Fiddly:** 1 · **Best:** [2P]

- Weight 1: **Canonical anchor — Patchwork is the rubric's "1".**
- Depth 6: Polyomino + time-track tempo is meaningfully deeper than the surface suggests; Rosenberg-elegant.
- Density 5: Three visible pieces means limited but pointed choices.
- Interaction 1: **Multiplayer solitaire** archetype. Only interaction is taking pieces from the shared circle.
- Conflict 0.
- Negotiation 0.
- Input 1: Piece order is fixed; the only variance is starting cursor position.
- Output 0.
- Catchup 3.
- Theme 5: Quilt theme is literally the mechanic.
- Engine 3: Button income is a small engine.
- Narrative 1.

Predicted closest: Hive, Azul, Welcome To (in catalog — light + low-interaction filler cluster). 2P-strict, so closest 2P-only neighbor is Hive.

---

## 7 Wonders (BGG 68448)

**Scores:** [3, 6, 7, 5, 4, 1, 5, 0, 4, 4, 5, 3] · **Solo:** 0 · **Fiddly:** 3 · **Best:** [4P, 5P]

- Weight 3: BGG 2.32. Drafting + symbol-soup is gateway-level.
- Depth 6: Real depth in drafting choices, but limited compared to long euros.
- Density 7: Simultaneous play packs every age tight.
- Interaction 5: Drafting + military with neighbors only — indirect catch-and-react, not full denial.
- Conflict 4: Military ages create per-age skirmishes; mild aggression.
- Negotiation 1.
- Input 5: Hand variance per age.
- Output 0.
- Catchup 4.
- Theme 4: Ancient civilizations are flavor on the cards.
- Engine 5: Science + symbol chains accelerate.
- Narrative 3: Three ages give a session arc.

Predicted closest: Splendor, Lost Ruins of Arnak, Cascadia (in catalog — gateway-midweight drafting/set-collection cluster). rec.games typical returns: 7W Duel ✓ (this batch), TtR, Splendor ✓, Carcassonne ✓ (this batch).

---

## 7 Wonders: Duel (BGG 173346)

**Scores:** [3, 8, 7, 9, 5, 0, 4, 0, 4, 4, 6, 3] · **Solo:** 0 · **Fiddly:** 3 · **Best:** [2P]

- Weight 3: BGG 2.22 — tighter than base 7W.
- Depth 8: 2P pyramid drafting with insta-win paths is genuinely deep — every visible card is leverage.
- Density 7.
- Interaction 9: Every card you take denies your opponent; 2P abstract-class.
- Conflict 5: Military track + science track are direct kill conditions.
- Negotiation 0.
- Input 4: Pyramid layout per age has some variance but most cards are visible.
- Output 0.
- Catchup 4: Military rebound is possible.
- Theme 4.
- Engine 6: Set-collection ramp.
- Narrative 3: Three ages.

Predicted closest: 7 Wonders (this batch), Hive, Onitama (in catalog — 2P heavy-interaction cluster).

---

## Dominion (BGG 36218)

**Scores:** [3, 8, 6, 4, 3, 0, 5, 1, 3, 1, 9, 2] · **Solo:** 2 · **Fiddly:** 3 · **Best:** [2P]

- Weight 3: BGG 2.36. Rules are simple; the depth lives in the kingdom you pick.
- Depth 8: Deckbuilder optimization is deep; the "right" buy ladder varies per setup.
- Density 6: Turns are quick once you internalize your deck.
- Interaction 4: Mostly parallel; attack cards bump it some.
- Conflict 3: Witch / Militia / Bureaucrat are confrontational; base game has them.
- Negotiation 0.
- Input 5: Shuffle order affects each turn meaningfully.
- Output 1.
- Catchup 3: Runaway is real once an engine fires.
- Theme 1: Pure abstraction with medieval flavor.
- Engine 9: **The original engine-builder** — entire game IS engine construction.
- Narrative 2.

Predicted closest: Race for the Galaxy, Res Arcana, Splendor (in catalog — engine-builder / quick-deckbuilder cluster). RftG and Dominion frequently co-occur in "card-engine" recs.

---

## Lords of Waterdeep (BGG 110327)

**Scores:** [3, 6, 6, 6, 3, 1, 6, 1, 4, 4, 4, 3] · **Solo:** 0 · **Fiddly:** 4 · **Best:** [4P, 5P]

- Weight 3: BGG 2.49. Approachable WP.
- Depth 6: Quest-selection + intrigue interplay is real, not deep.
- Density 6.
- Interaction 6: WP spot-denial + intrigue cards thrown at opponents. Mid-range.
- Conflict 3: Mandatory quests + take-that intrigue.
- Negotiation 1.
- Input 6: Quest deck + intrigue deck are major variance sources.
- Output 1.
- Catchup 4.
- Theme 4: D&D flavor pasted on a euro skeleton.
- Engine 4: Building income scales modestly.
- Narrative 3.

Predicted closest: Stone Age (this batch), Castles of Burgundy, Concordia (in catalog — gateway-midweight WP/euro cluster).

---

## Codenames (BGG 178900)

**Scores:** [1, 4, 5, 9, 3, 5, 7, 4, 4, 1, 0, 1] · **Solo:** 0 · **Fiddly:** 1 · **Best:** [6P, 7P, 8P]

- Weight 1: Trivial rules.
- Depth 4: Clue depth is real but bounded — no strategic tree, just mind-reading.
- Density 5: Cluegiver makes one dense choice; team makes guess decisions.
- Interaction 9: Fully cooperative inside a team + competitive across teams; every clue ripples.
- Conflict 3: Assassin reveals + opposing-team races feel adversarial.
- Negotiation 5: Team discussion before guesses is real talk-driven win condition. Below BotC (10).
- Input 7: Random word grid is the entire game-state variance.
- Output 4: Once a clue is given, team guess outcomes can blow up — they're decisions but uncertain.
- Catchup 4.
- Theme 1: Spy flavor is pure decoration.
- Engine 0.
- Narrative 1.

Predicted closest: Blood on the Clocktower, Cosmic Encounter (in catalog — social/party cluster). Far from everything else.

---

## Stone Age (BGG 34635)

**Scores:** [3, 5, 5, 5, 2, 0, 4, 5, 4, 5, 5, 3] · **Solo:** 0 · **Fiddly:** 4 · **Best:** [3P, 4P]

- Weight 3: BGG 2.42. Gateway WP.
- Depth 5: Engine assembly is real but shallow vs heavies.
- Density 5.
- Interaction 5: Spot competition; mild.
- Conflict 2.
- Negotiation 0.
- Input 4.
- Output 5: **Dice-rolling for resources** after worker placement is real output-luck — distinct from most modern WP.
- Catchup 4.
- Theme 5: Stone-age tribe theme is integrated through food upkeep + tools.
- Engine 5: Tools, agriculture, civilization cards build steadily.
- Narrative 3.

Predicted closest: Lords of Waterdeep (this batch), Castles of Burgundy, Concordia (in catalog — gateway-WP/euro cluster).

---

## Pandemic (BGG 30549)

**Scores:** [2, 6, 6, 8, 0, 2, 7, 4, 5, 7, 3, 5] · **Solo:** 6 · **Fiddly:** 3 · **Best:** [3P, 4P]

- Weight 2: BGG 2.42 but the actual play-feel is gateway-light because most rules are intuitive.
- Depth 6: Coordination optimization can be deep, especially as difficulty scales.
- Density 6.
- Interaction 8: Fully co-op; every move is a group decision.
- Conflict 0: Co-op.
- Negotiation 2: Action sequencing discussions, but not deal-cutting.
- Input 7: Card draws (infection + player) are the entire threat structure.
- Output 4: Epidemic shuffle timing creates real after-decision swings.
- Catchup 5.
- Theme 7: Disease theme is strongly evoked through outbreaks, cure mechanics, cubes.
- Engine 3: Role abilities are static, not engine-built.
- Narrative 5: "We're losing then we cure" arc is the entire point.

Predicted closest: Spirit Island, The Crew, Pandemic Legacy S1 (in catalog — co-op cluster). Sister to Legacy by definition.

---

## Tzolk'in: The Mayan Calendar (BGG 126163)

**Scores:** [6, 8, 7, 6, 2, 0, 3, 0, 4, 6, 7, 4] · **Solo:** 5 · **Fiddly:** 6 · **Best:** [3P, 4P]

- Weight 6: BGG 3.71. Gear mechanic adds real complexity.
- Depth 8: Worker-timing on rotating gears creates a deep planning puzzle.
- Density 7.
- Interaction 6: Spot denial on gears + temple racing.
- Conflict 2.
- Negotiation 0.
- Input 3: Building tile refresh is modest variance.
- Output 0: Fully deterministic.
- Catchup 4.
- Theme 6: Mayan calendar integrated into the literal gear visual.
- Engine 7: Tech tracks build steadily.
- Narrative 4: Food days create rhythm; temple-ascend final scoring gives an arc.

Predicted closest: Concordia, Castles of Burgundy, Lorenzo il Magnifico (in catalog — midweight engine/euro cluster). rec.games typically returns Marco Polo, Trickerion, Lorenzo, Anachrony for Tzolkin.

---

## Batch 09 — More hub fan-out (2026-05-22)

10 games added: Viticulture EE, Tapestry, Anachrony, Trickerion, Voyages of Marco Polo, Nemesis, Mansions of Madness 2E, Robinson Crusoe, Aeon's End, Jaipur.

**Strategy:** Extend the hub coverage from batch 08 into adjacent clusters that the engine couldn't otherwise reach well — Stonemaier civ (Tapestry, Viticulture), Mindclash heavy (Anachrony, Trickerion), dice-WP mid-euros (Marco Polo), co-op horror (Nemesis, Mansions), hard solo/co-op (Robinson Crusoe), co-op deckbuilder (Aeon's End), 2P card-game filler (Jaipur). Tapestry specifically locks in the README's **Theme 3 anchor**.

---

## Viticulture: Essential Edition (BGG 183394)

**Scores:** [3, 6, 6, 5, 2, 1, 6, 1, 4, 7, 6, 3] · **Solo:** 6 · **Fiddly:** 5 · **Best:** [3P, 4P]

- Weight 3: BGG 2.93. Mid-gateway WP.
- Depth 6: Wine-making engine + seasonal WP gives real layered decisions; not deep-euro tier.
- Density 6.
- Interaction 5: Bonus-action slots and shared visitor row create real spot-denial tension.
- Conflict 2.
- Negotiation 1.
- Input 6: Visitor card deck is the dominant variance — card draw matters a lot.
- Output 1.
- Catchup 4.
- Theme 7: Vineyard cycle (plant → harvest → age → fulfill) tracks the real process beautifully.
- Engine 6.
- Narrative 3.

Predicted closest: Wingspan, Lost Ruins of Arnak, Concordia (in catalog — Stonemaier / gateway-mid cluster). rec.games typically: Wingspan ✓, Everdell ✓, Scythe ✓.

---

## Tapestry (BGG 286096)

**Scores:** [3, 6, 6, 4, 2, 0, 7, 3, 5, 3, 8, 3] · **Solo:** 7 · **Fiddly:** 5 · **Best:** [3P, 4P]

- Weight 3: BGG 2.85.
- Depth 6: Pick-a-track optimization is real but not deeply contested.
- Density 6.
- Interaction 4: Mostly parallel civ-building; only the explore track creates light bumping.
- Conflict 2.
- Negotiation 0.
- Input 7: Tapestry cards + civilization power asymmetry are huge per-game variance.
- Output 3: Income tile draws can swing.
- Catchup 5.
- Theme 3: **Rubric anchor.** Beautiful art and civ-flavor on a mechanically-driven skeleton — the canonical "theme is not what I like, theme is what's baked in" example.
- Engine 8: Track jumps fire mid-late game.
- Narrative 3.

Predicted closest: Wingspan, Scythe, Viticulture (this batch) — Stonemaier cluster.

---

## Anachrony (BGG 230050)

**Scores:** [8, 8, 7, 5, 3, 0, 5, 1, 4, 8, 8, 5] · **Solo:** 7 · **Fiddly:** 8 · **Best:** [3P, 4P]

- Weight 8: BGG 4.21. Between Brass (8) and Voidfall (9).
- Depth 8.
- Density 7.
- Inter 5: Capital city WP + impact zones have spot denial; not in Brass-class.
- Conflict 3.
- Negotiation 0.
- Input 5.
- Output 1.
- Catchup 4.
- Theme 8: Time-loop loans, exosuits, factions all feel mechanically baked.
- Engine 8: Tech tree + suit progression ramp hard.
- Narrative 5: Cataclysm event gives a session arc.

Predicted closest: Voidfall, Beyond the Sun, Gaia Project (in catalog — heavy-euro space/sci-fi cluster). Mindclash design DNA.

---

## Trickerion: Legends of Illusion (BGG 165722)

**Scores:** [7, 8, 7, 7, 4, 1, 4, 1, 4, 9, 7, 5] · **Solo:** 6 · **Fiddly:** 8 · **Best:** [3P, 4P]

- Weight 7: BGG 3.96.
- Depth 8.
- Density 7.
- Inter 7: Action order priority on the WP track + shared performance city spots are heavily contested.
- Conflict 4: Dark Alley aggressive actions; performance order denial.
- Negotiation 1.
- Input 4.
- Output 1.
- Catchup 4.
- Theme 9: Magicians, assistants, trick performance — fully mechanically baked.
- Engine 7.
- Narrative 5.

Predicted closest: Lisboa, Vinhos Deluxe, Anachrony (this batch) — heavy WP cluster. rec.games typically: Anachrony, Yokohama, Voyages of Marco Polo.

---

## The Voyages of Marco Polo (BGG 171623)

**Scores:** [5, 7, 6, 6, 2, 0, 7, 1, 5, 6, 6, 4] · **Solo:** 5 · **Fiddly:** 5 · **Best:** [3P, 4P]

- Weight 5: BGG 3.10. Real mid-weight.
- Depth 7.
- Density 6.
- Inter 6: Spot denial scales with dice; asymmetric characters create reactive play.
- Conflict 2.
- Negotiation 0.
- Input 7: Dice rolling for action strength is core variance.
- Output 1: Once dice are rolled, downstream is deterministic.
- Catchup 5: Black dice buy-in for losing players.
- Theme 6: Silk Road merchant routes are well-integrated.
- Engine 6.
- Narrative 4: Eastward route gives an arc.

Predicted closest: Concordia, Tzolk'in (batch 08), Castles of Burgundy (in catalog).

---

## Nemesis (BGG 167355)

**Scores:** [5, 6, 6, 9, 7, 4, 8, 8, 4, 10, 2, 9] · **Solo:** 7 · **Fiddly:** 7 · **Best:** [4P, 5P]

- Weight 5: BGG 3.65.
- Depth 6.
- Density 6.
- Interaction 9: Semi-co-op with hidden agendas means every action ripples; shared map is everything.
- Conflict 7: PvP within the co-op shell is endemic; aliens add direct combat.
- Negotiation 4: Real alliance deal-making.
- Input 8: Encounter deck + intruder bag.
- Output 8: Combat dice + intruder reveals can wipe a turn.
- Catchup 4.
- Theme 10: Alien (1979) incarnate; the mechanics produce the film's pacing.
- Engine 2.
- Narrative 9: Session-as-movie is the entire pitch.

Predicted closest: Mansions of Madness (this batch), Tainted Grail, ISS Vanguard (in catalog — co-op narrative horror cluster).

---

## Mansions of Madness: Second Edition (BGG 205059)

**Scores:** [3, 5, 5, 7, 0, 2, 8, 6, 4, 9, 2, 9] · **Solo:** 7 · **Fiddly:** 5 · **Best:** [2P, 3P]

- Weight 3: BGG 2.84. App handles most chrome — felt-weight is gateway.
- Depth 5.
- Density 5.
- Inter 7: Pure co-op coordination.
- Conflict 0.
- Negotiation 2.
- Input 8: App reveals scenarios, monsters spawn unpredictably.
- Output 6: Combat dice + horror checks have real after-decision swing.
- Catchup 4.
- Theme 9: Lovecraft horror saturates everything.
- Engine 2.
- Narrative 9: Scenario story arc per session.

Predicted closest: Nemesis (this batch), Tainted Grail, ISS Vanguard, Sleeping Gods (in catalog — narrative co-op cluster).

---

## Robinson Crusoe: Adventures on the Cursed Island (BGG 121921)

**Scores:** [6, 7, 6, 8, 0, 3, 8, 8, 4, 9, 2, 7] · **Solo:** 8 · **Fiddly:** 7 · **Best:** [1P, 2P]

- Weight 6: BGG 3.78. Heavier than most co-ops because the action-strength + event interplay is genuinely fiddly.
- Depth 7.
- Density 6.
- Inter 8: Tight co-op coordination; role abilities matter.
- Conflict 0.
- Negotiation 3.
- Input 8: Event deck + adventure deck flood the table with surprises.
- Output 8: Action dice + adventure deck failures are punishing — distinct after-decision luck.
- Catchup 4.
- Theme 9: Castaway survival is mechanically inseparable.
- Engine 2.
- Narrative 7: Per-scenario story arc.

Predicted closest: Spirit Island, Sleeping Gods, Pandemic Legacy S1 (in catalog — hard co-op cluster).

---

## Aeon's End (BGG 191189)

**Scores:** [3, 7, 6, 7, 0, 2, 6, 4, 4, 6, 8, 4] · **Solo:** 8 · **Fiddly:** 4 · **Best:** [1P, 2P]

- Weight 3: BGG 2.79.
- Depth 7.
- Density 6.
- Inter 7: Co-op timing on the (random) turn order is the entire puzzle.
- Conflict 0.
- Negotiation 2.
- Input 6: Nemesis deck + market reveals.
- Output 4: **Random turn order** is the signature variance after deck-building decisions.
- Catchup 4.
- Theme 6: Breach-mage theming is fine but mechanics-first.
- Engine 8: Deckbuilder, no shuffling (used cards stay in order) is a real engine twist.
- Narrative 4.

Predicted closest: Spirit Island, Marvel Champions, Dominion (batch 08 — co-op deckbuilder/co-op cluster).

---

## Jaipur (BGG 54043)

**Scores:** [1, 5, 5, 7, 2, 0, 6, 2, 4, 3, 2, 2] · **Solo:** 0 · **Fiddly:** 1 · **Best:** [2P]

- Weight 1: BGG 1.49. Very light.
- Depth 5: Bonus-token timing is surprisingly tight.
- Density 5.
- Inter 7: 2P card-game where opponent reads matter; reactive market.
- Conflict 2: Camel-grabbing denial is the only hostility.
- Negotiation 0.
- Input 6: Market refresh and draw variance.
- Output 2: Bonus token reveal has minor variance.
- Catchup 4.
- Theme 3.
- Engine 2.
- Narrative 2.

Predicted closest: Patchwork, Hive, Welcome To (in catalog — light filler + 2P-strict cluster).

---

## Batch 10 — README anchors + more hub fan-out (2026-05-22)

10 games added: Suburbia, Roll for the Galaxy, It's a Wonderful World, Five Tribes, Castles of Mad King Ludwig, Eldritch Horror, Just One, Wavelength, Pulsar 2849, King of Tokyo.

**Strategy:** Suburbia is the README's **Catchup 8 anchor** and was missing — locking it in. The rest fill obvious clusters the engine couldn't reach: dice-engine builder (Roll for the Galaxy), quick drafter (Wonderful World), mancala (Five Tribes), light tile-laying (Castles), Lovecraft hub (Eldritch Horror), top party games (Just One, Wavelength), heavy dice-draft (Pulsar 2849), and dice-fighting filler (King of Tokyo).

---

## Suburbia (BGG 123260)

**Scores:** [3, 6, 6, 5, 2, 0, 6, 1, 8, 5, 7, 3] · **Solo:** 5 · **Fiddly:** 6 · **Best:** [2P, 3P]

- Weight 3: BGG 2.69. Mid-light.
- Depth 6: Tile-adjacency optimization is real but bounded.
- Density 6.
- Inter 5: Shared tile market + goal contention.
- Conflict 2.
- Negotiation 0.
- Input 6: Tile market draw is variance.
- Output 1.
- Catchup 8: **README anchor.** Income/reputation penalties scale with population, taxing leaders into rubber-band.
- Theme 5.
- Engine 7: City income compounds.
- Narrative 3.

Predicted closest: Castles of Mad King Ludwig (this batch), Castles of Burgundy, Concordia (in catalog — tile/euro cluster).

---

## Roll for the Galaxy (BGG 132531)

**Scores:** [3, 7, 7, 4, 1, 0, 7, 4, 3, 4, 9, 3] · **Solo:** 5 · **Fiddly:** 4 · **Best:** [2P, 3P, 4P]

- Weight 3: BGG 2.91. Lighter than RftG once internalized.
- Depth 7.
- Density 7.
- Inter 4: Shared phase selection from RftG carries over but the dice randomization makes it more parallel.
- Conflict 1.
- Negotiation 0.
- Input 7: Dice rolling is the variance layer.
- Output 4: **Phase selection after dice roll** can blow up your plan if no opponent picks the phase you need.
- Catchup 3.
- Theme 4.
- Engine 9: Same explosive engine arc as RftG.
- Narrative 3.

Predicted closest: Race for the Galaxy (in catalog — sister game), Splendor, Dominion (batch 08 — engine-builder cluster).

---

## It's a Wonderful World (BGG 271324)

**Scores:** [2, 5, 6, 4, 2, 0, 5, 0, 3, 4, 7, 3] · **Solo:** 6 · **Fiddly:** 4 · **Best:** [3P, 4P]

- Weight 2: BGG 2.20.
- Depth 5.
- Density 6: Simultaneous play keeps tempo high.
- Inter 4: 7W-style drafting, light watch-and-react.
- Conflict 2.
- Negotiation 0.
- Input 5.
- Output 0: Production resolves deterministically.
- Catchup 3.
- Theme 4: Atompunk post-apoc flavor.
- Engine 7: Scheduled production tableau builds steadily.
- Narrative 3.

Predicted closest: 7 Wonders (batch 08), Splendor, Race for the Galaxy (in catalog — quick drafter / engine-builder cluster).

---

## Five Tribes (BGG 157354)

**Scores:** [3, 7, 6, 6, 3, 0, 6, 1, 4, 4, 4, 3] · **Solo:** 0 · **Fiddly:** 5 · **Best:** [2P, 3P]

- Weight 3: BGG 2.81.
- Depth 7: Mancala pickup-and-place is a deep tactical puzzle.
- Density 6.
- Inter 6: Turn-order bidding + tile-grabbing creates spot-denial; every move closes off opponent moves.
- Conflict 3: Assassin tile is direct removal.
- Negotiation 0.
- Input 6: Tile setup + Djinn deck variance.
- Output 1.
- Catchup 4.
- Theme 4.
- Engine 4.
- Narrative 3.

Predicted closest: Tigris & Euphrates, El Grande, Concordia (in catalog — tactical mid-euro cluster).

---

## Castles of Mad King Ludwig (BGG 155426)

**Scores:** [3, 6, 6, 5, 2, 0, 7, 1, 5, 4, 5, 3] · **Solo:** 6 · **Fiddly:** 5 · **Best:** [3P, 4P]

- Weight 3: BGG 2.65.
- Depth 6.
- Density 6.
- Inter 5: Master Builder room-pricing creates real indirect contention — you set prices for opponents' purchases.
- Conflict 2.
- Negotiation 0.
- Input 7: Room draw + bonus card variance.
- Output 1.
- Catchup 5.
- Theme 4.
- Engine 5.
- Narrative 3.

Predicted closest: Suburbia (this batch), Castles of Burgundy, Concordia (in catalog).

---

## Eldritch Horror (BGG 146021)

**Scores:** [4, 5, 5, 7, 0, 2, 8, 7, 4, 9, 2, 8] · **Solo:** 7 · **Fiddly:** 8 · **Best:** [2P, 3P]

- Weight 4: BGG 3.40.
- Depth 5.
- Density 5: Big map, but each player turn is moderate.
- Inter 7: Pure co-op coordination across continents.
- Conflict 0.
- Negotiation 2.
- Input 8: Mystery deck + encounter decks + ancient one variance.
- Output 7: Combat dice are the iconic moment of pain.
- Catchup 4.
- Theme 9: World-tour Lovecraft.
- Engine 2.
- Narrative 8: Mystery completion arc per session.

Predicted closest: Arkham LCG, Mansions of Madness (batch 09), Sleeping Gods (in catalog — Lovecraft / narrative co-op cluster).

---

## Just One (BGG 254640)

**Scores:** [1, 2, 4, 9, 0, 2, 8, 3, 4, 1, 0, 1] · **Solo:** 0 · **Fiddly:** 1 · **Best:** [5P, 6P, 7P]

- Weight 1: Trivial.
- Depth 2.
- Density 4: One dense decision per round, otherwise idle.
- Inter 9: Word elimination is communal — every other player's clue matters.
- Conflict 0: Pure co-op.
- Negotiation 2.
- Input 8: Random word draw.
- Output 3: Reveals can collide (matching clues cancel).
- Catchup 4.
- Theme 1.
- Engine 0.
- Narrative 1.

Predicted closest: Codenames (batch 08), Welcome To (in catalog — light party cluster).

---

## Wavelength (BGG 262543)

**Scores:** [1, 3, 4, 9, 2, 6, 7, 4, 5, 1, 0, 1] · **Solo:** 0 · **Fiddly:** 1 · **Best:** [6P, 7P, 8P]

- Weight 1: Trivial.
- Depth 3.
- Density 4.
- Inter 9: Team mind-reading.
- Conflict 2: Team competition.
- Negotiation 6: Group discussion of dial position is the entire game; below BotC (10) but above Catan (4).
- Input 7: Spectrum cards + dial position variance.
- Output 4.
- Catchup 5.
- Theme 1.
- Engine 0.
- Narrative 1.

Predicted closest: Just One (this batch), Codenames (batch 08), Cosmic Encounter (in catalog — party / social cluster).

---

## Pulsar 2849 (BGG 199561)

**Scores:** [5, 8, 7, 6, 2, 0, 6, 1, 6, 5, 7, 3] · **Solo:** 0 · **Fiddly:** 6 · **Best:** [3P, 4P]

- Weight 5: BGG 3.55.
- Depth 8: Dice-drafting + tech tree is a deep optimization puzzle.
- Density 7.
- Inter 6: Dice draft + map placement create real contention.
- Conflict 2.
- Negotiation 0.
- Input 6: Dice rolling is the central variance.
- Output 1.
- Catchup 6: Slow-dice priority and dice-floor protect trailing players.
- Theme 5.
- Engine 7: Tech-card power-up arc.
- Narrative 3.

Predicted closest: Tzolk'in (batch 08), Voyages of Marco Polo (batch 09), Lorenzo il Magnifico (in catalog — dice-WP / mid-euro cluster).

---

## King of Tokyo (BGG 70323)

**Scores:** [1, 3, 4, 8, 8, 1, 4, 8, 4, 6, 3, 3] · **Solo:** 0 · **Fiddly:** 2 · **Best:** [4P, 5P]

- Weight 1: BGG 1.49. Trivial.
- Depth 3.
- Density 4.
- Inter 8: You're either in Tokyo (attacking everyone) or out (taking attacks from one).
- Conflict 8: Yahtzee-with-attacks; constant direct violence.
- Negotiation 1.
- Input 4: Card market.
- Output 8: Dice rolls drive every attack/heal.
- Catchup 4.
- Theme 6: Kaiju attacks Tokyo is mechanically baked.
- Engine 3: Card buys add powers.
- Narrative 3.

Predicted closest: Quacks (in catalog — push-your-luck dice), Heat, Cosmic Encounter (in catalog — high-conflict filler cluster).

---

## Batch 11 — Feld, legacy sequels, war hubs, fillers (2026-05-22)

10 games added: Yokohama, Trajan, Pandemic Legacy S2, Frosthaven, Hegemony, Memoir '44, Pax Pamir 2E, Cartographers, Lost Cities, Sushi Go Party!.

**Strategy:** Sister games to top hubs (Frosthaven for Gloomhaven, PL:S2 for PL:S1), Feld-classic gap (Trajan, Yokohama), modern hot heavy (Hegemony 2023), foundational hex wargame (Memoir '44), Wehrle 2-3-4P politico (Pax Pamir 2E), flip-and-write gateway (Cartographers), and 2P/party fillers (Lost Cities, Sushi Go Party!).

---

## Yokohama (BGG 196340)

**Scores:** [5, 7, 6, 6, 2, 0, 5, 1, 4, 5, 7, 3] · **Solo:** 0 · **Fiddly:** 6 · **Best:** [3P, 4P]

- Weight 5: BGG 3.28.
- Depth 7: Multi-area WP with assistant chains is layered.
- Density 6.
- Inter 6: Shared spots + chain-build creates real contention; pieces stay placed and matter for opponents.
- Conflict 2.
- Negotiation 0.
- Input 5.
- Output 1.
- Catchup 4.
- Theme 5: Meiji-era Yokohama trade.
- Engine 7.
- Narrative 3.

Predicted closest: Concordia, Castles of Burgundy, Tzolk'in (batch 08), Lorenzo (in catalog — midweight euro cluster).

---

## Trajan (BGG 102680)

**Scores:** [6, 8, 7, 5, 3, 0, 5, 1, 4, 4, 7, 4] · **Solo:** 0 · **Fiddly:** 7 · **Best:** [3P, 4P]

- Weight 6: BGG 3.74. Genuinely heavy Feld.
- Depth 8: Mancala-wheel timing forces deep multi-turn planning.
- Density 7.
- Inter 5: Shared forum tiles + senate cards; not heavy denial.
- Conflict 3: Military invasion sub-track has direct combat.
- Negotiation 0.
- Input 5.
- Output 1.
- Catchup 4.
- Theme 4: Roman flavor, mechanics-first Feld.
- Engine 7.
- Narrative 4.

Predicted closest: Tzolk'in (batch 08), Lorenzo il Magnifico, Castles of Burgundy (in catalog — point-salad euro cluster).

---

## Pandemic Legacy: Season 2 (BGG 221107)

**Scores:** [3, 7, 6, 8, 0, 3, 7, 4, 5, 8, 3, 10] · **Solo:** 4 · **Fiddly:** 6 · **Best:** [2P, 3P, 4P]

- Weight 3: BGG 2.86. Slightly more rules than S1.
- Depth 7.
- Density 6.
- Inter 8.
- Conflict 0.
- Negotiation 3.
- Input 7.
- Output 4.
- Catchup 5.
- Theme 8: Post-apocalypse haven flavor lands well.
- Engine 3.
- Narrative 10: Same legacy/storytelling tier as S1.

Predicted closest: Pandemic Legacy S1, Pandemic (batch 08), Spirit Island (in catalog — co-op legacy cluster).

---

## Frosthaven (BGG 295770)

**Scores:** [7, 9, 7, 8, 0, 2, 6, 4, 4, 8, 7, 9] · **Solo:** 7 · **Fiddly:** 9 · **Best:** [1P, 2P]

- Weight 7: BGG 4.10. Heavier than Gloomhaven (7) — more upkeep, more systems.
- Depth 9.
- Density 7.
- Inter 8.
- Conflict 0: Co-op vs scenario.
- Negotiation 2.
- Input 6.
- Output 4: Modifier deck swings.
- Catchup 4.
- Theme 8.
- Engine 7: Build-progression across a long campaign.
- Narrative 9.

Predicted closest: Gloomhaven, Earthborne Rangers, ISS Vanguard (in catalog — heavy campaign co-op cluster).

---

## Hegemony: Lead Your Class to Victory (BGG 321608)

**Scores:** [7, 9, 7, 10, 7, 4, 4, 1, 5, 10, 4, 6] · **Solo:** 4 · **Fiddly:** 8 · **Best:** [4P]

- Weight 7: BGG 4.10.
- Depth 9: Asymmetric class strategies with policy-flipping is genuinely deep.
- Density 7.
- Interaction 10: **Constant friction** — every class action ripples to every other. Strikes, taxation, immigration, layoffs all interact.
- Conflict 7: Strikes, layoffs, lawsuits are direct hostile actions.
- Negotiation 4: Real bargaining over wage negotiation and policy votes.
- Input 4.
- Output 1.
- Catchup 5: Class roles have built-in catch-up via policy levers.
- Theme 10: Class warfare mechanics literally ARE the politics.
- Engine 4.
- Narrative 6: Election cycle + policy-track arc.

Predicted closest: John Company, Brass: Birmingham, Root (in catalog — asymmetric heavy-interaction cluster).

---

## Memoir '44 (BGG 10630)

**Scores:** [2, 6, 6, 9, 9, 0, 5, 8, 4, 8, 1, 5] · **Solo:** 3 · **Fiddly:** 4 · **Best:** [2P]

- Weight 2: BGG 2.10. Borg Command-and-Colors is accessible.
- Depth 6: Tactical depth from card-driven sectoring.
- Density 6.
- Interaction 9: 2P direct combat.
- Conflict 9: WW2 tactical wargame.
- Negotiation 0.
- Input 5: Command card draws drive your sectors.
- Output 8: **Dice-driven combat** — Borg's signature output-luck.
- Catchup 4.
- Theme 8: WW2 unit/terrain composition matters.
- Engine 1.
- Narrative 5: Battle arc per scenario.

Predicted closest: War of the Ring, Star Wars: Rebellion, Twilight Struggle (in catalog — 2P war cluster). Far from euros.

---

## Pax Pamir: Second Edition (BGG 256960)

**Scores:** [6, 9, 7, 10, 7, 4, 5, 1, 5, 10, 4, 7] · **Solo:** 7 · **Fiddly:** 6 · **Best:** [4P]

- Weight 6: BGG 3.71.
- Depth 9: Loyalty-flipping coalition play is deeply strategic.
- Density 7.
- Interaction 10: Every play affects the coalition state; kingmaker concerns are real and intentional.
- Conflict 7: Betrayal and elimination are core.
- Negotiation 4: Real coalition pressure even without explicit deals.
- Input 5.
- Output 1.
- Catchup 5: Era flips reset positions.
- Theme 10: 19th-c Great Game / Afghan tribal politics is the mechanics.
- Engine 4.
- Narrative 7: Era flips create a session arc.

Predicted closest: Root, John Company, Inis (in catalog — Wehrle / heavy-interaction asymmetric cluster).

---

## Cartographers (BGG 263918)

**Scores:** [2, 5, 5, 3, 2, 0, 8, 0, 4, 4, 3, 2] · **Solo:** 7 · **Fiddly:** 2 · **Best:** [1P, 2P, 3P, 4P]

- Weight 2: BGG 1.84.
- Depth 5: Polyomino + scoring-card optimization is real.
- Density 5.
- Inter 3: Mostly parallel; only ambush cards inject interaction.
- Conflict 2: Ambushes from opponents reshape your map.
- Negotiation 0.
- Input 8: Card draws are the entire game-state.
- Output 0.
- Catchup 4.
- Theme 4: Cartographer flavor pasted on grid.
- Engine 3.
- Narrative 2.

Predicted closest: Welcome To, Cascadia, Splendor (in catalog — flip-and-write / parallel-play cluster).

---

## Lost Cities (BGG 50)

**Scores:** [2, 6, 5, 5, 2, 0, 7, 1, 3, 3, 2, 2] · **Solo:** 0 · **Fiddly:** 1 · **Best:** [2P]

- Weight 2: BGG 1.65.
- Depth 6: Knizia's tight commit-or-fold tension.
- Density 5.
- Inter 5: 2P card game with shared discard piles.
- Conflict 2: Discard denial is real but limited.
- Negotiation 0.
- Input 7: Card draw drives every turn.
- Output 1.
- Catchup 3.
- Theme 3.
- Engine 2.
- Narrative 2.

Predicted closest: Jaipur (batch 09), Patchwork, Hive (in catalog — 2P light filler cluster).

---

## Sushi Go Party! (BGG 192291)

**Scores:** [1, 4, 5, 5, 2, 0, 6, 1, 4, 3, 4, 1] · **Solo:** 0 · **Fiddly:** 1 · **Best:** [4P, 5P, 6P]

- Weight 1: BGG 1.41.
- Depth 4: Drafting depth limited by small card pool.
- Density 5: Pass-and-pick.
- Inter 5: 7W-style drafting interaction.
- Conflict 2.
- Negotiation 0.
- Input 6: Deck shuffle each round.
- Output 1.
- Catchup 4.
- Theme 3.
- Engine 4: Within-round set collection.
- Narrative 1.

Predicted closest: 7 Wonders (batch 08), It's a Wonderful World (batch 10), Welcome To (in catalog — drafting filler cluster).

---

## Batch 12 — Social deduction, 2P war, co-op deckbuilders, 2024 hits (2026-05-22)

10 games added: Avalon, Secret Hitler, Decrypto, The Crew: Mission Deep Sea, Undaunted: Normandy, Watergate, Clank! Catacombs, Slay the Spire: The Board Game, Daybreak, Endeavor: Deep Sea.

**Strategy:** Three social-deduction hubs (Avalon, Secret Hitler, Decrypto) — Codenames already pulled the word-association traffic but the hidden-role cluster was bare. Two crunchy 2P historicals (Undaunted, Watergate). Two deckbuilder hubs the catalog was missing (Clank! Catacombs as the dungeon-PYL anchor, Slay the Spire as the hot 2024 co-op). Daybreak and Endeavor: Deep Sea cover 2023-2024 hot releases that already generate search volume. The Crew: Mission Deep Sea slots in next to The Crew.

---

## The Resistance: Avalon (BGG 128882)

**Scores:** [2, 5, 4, 10, 5, 9, 3, 2, 5, 5, 0, 4] · **Solo:** 0 · **Fiddly:** 2 · **Best:** [5P, 6P, 7P, 8P]

- Weight 2: BGG 1.81.
- Depth 5: Deduction depth across multiple rounds is real but bounded.
- Density 4.
- Inter 10: Hidden roles + voting → every action is loaded.
- Conflict 5: Mission failure / accusation drama is hostile but bloodless.
- Negotiation 9: Talking is the entire game.
- Input 3: Hidden role draws are setup.
- Output 2: Mission card reveals.
- Catchup 5.
- Theme 5: Arthurian flavor light.
- Engine 0.
- Narrative 4.

Predicted closest: Secret Hitler (this batch), Blood on the Clocktower, Feed the Kraken (in catalog — hidden-role cluster).

---

## Secret Hitler (BGG 188834)

**Scores:** [2, 5, 4, 10, 6, 9, 4, 2, 5, 7, 0, 5] · **Solo:** 0 · **Fiddly:** 2 · **Best:** [7P, 8P, 9P]

- Weight 2: BGG 1.74.
- Depth 5.
- Density 4.
- Inter 10.
- Conflict 6: Public executions, presidential powers escalate.
- Negotiation 9.
- Input 4: Role + policy deck variance.
- Output 2.
- Catchup 5.
- Theme 7: Weimar/Nazi flavor is mechanically baked into the chaos-rising trajectory — distinct from Avalon's bolt-on theme.
- Engine 0.
- Narrative 5.

Predicted closest: Avalon (this batch), BotC, Feed the Kraken (in catalog — hidden-role cluster).

---

## Decrypto (BGG 225901)

**Scores:** [2, 5, 5, 9, 4, 4, 7, 3, 4, 4, 0, 2] · **Solo:** 0 · **Fiddly:** 2 · **Best:** [4P, 6P, 8P]

- Weight 2: BGG 1.81.
- Depth 5: Code-cracking deepens over rounds as your team's clues accumulate.
- Density 5.
- Inter 9: Team-vs-team mind-reading.
- Conflict 4: Opposing team tries to intercept your codes.
- Negotiation 4: Team discussion before clues.
- Input 7: Random keyword card.
- Output 3.
- Catchup 4.
- Theme 4: Spy flavor.
- Engine 0.
- Narrative 2.

Predicted closest: Codenames (batch 08), Just One, Wavelength (batch 10 — party cluster).

---

## The Crew: Mission Deep Sea (BGG 324856)

**Scores:** [2, 7, 6, 8, 0, 3, 7, 1, 5, 4, 1, 3] · **Solo:** 0 · **Fiddly:** 2 · **Best:** [3P, 4P]

- Weight 2: BGG 2.10.
- Depth 7: Task-card variability deepens the puzzle vs the original Crew's fixed missions.
- Density 6.
- Inter 8.
- Conflict 0.
- Negotiation 3: Limited-communication signaling.
- Input 7: Hand deal is the only randomness.
- Output 1.
- Catchup 5.
- Theme 4.
- Engine 1.
- Narrative 3.

Predicted closest: The Crew, Spirit Island, Pandemic (batch 08) — co-op cluster, especially trick-taking sister.

---

## Undaunted: Normandy (BGG 268864)

**Scores:** [3, 8, 7, 9, 8, 0, 6, 4, 4, 7, 5, 5] · **Solo:** 0 · **Fiddly:** 3 · **Best:** [2P]

- Weight 3: BGG 2.65.
- Depth 8: Deckbuilder + tactical map combination is layered.
- Density 7.
- Inter 9: 2P direct combat.
- Conflict 8.
- Negotiation 0.
- Input 6: Card draw + initiative.
- Output 4: Initiative roll + combat dice.
- Catchup 4.
- Theme 7: WW2 squad attrition is real — losing cards = losing personnel.
- Engine 5: Deck-building during play.
- Narrative 5: Campaign scenarios.

Predicted closest: Memoir '44 (batch 11), Watergate (this batch), Twilight Struggle (in catalog — 2P war / card-driven cluster).

---

## Watergate (BGG 274364)

**Scores:** [3, 7, 6, 10, 6, 0, 5, 1, 5, 8, 2, 7] · **Solo:** 0 · **Fiddly:** 3 · **Best:** [2P]

- Weight 3: BGG 2.34.
- Depth 7: Asymmetric tug-of-war is tight.
- Density 6.
- Inter 10: 2P direct opposition on every card.
- Conflict 6: Tug-of-war on tracks, evidence captures.
- Negotiation 0.
- Input 5: Card hand variance.
- Output 1: Mostly deterministic.
- Catchup 5: Lagging side gets stronger cards.
- Theme 8: Nixon-vs-Post is mechanically embedded — evidence chains feel like investigation.
- Engine 2.
- Narrative 7: Investigation arc per session.

Predicted closest: Twilight Struggle, Undaunted (this batch), War of the Ring (in catalog — 2P historical cluster).

---

## Clank! Catacombs (BGG 365717)

**Scores:** [3, 6, 5, 6, 4, 0, 7, 6, 4, 6, 7, 5] · **Solo:** 0 · **Fiddly:** 4 · **Best:** [3P, 4P]

- Weight 3: Approachable deckbuilder + map race.
- Depth 6: Push-your-luck timing on dungeon depth.
- Density 5.
- Inter 6: Cube-bag draws are shared; opponents' clank affects everyone.
- Conflict 4: Dragon attacks pulled from a shared cube bag with your clank tokens.
- Negotiation 0.
- Input 7: Bag draws + card row.
- Output 6: **Dragon attack draws** can wipe a turn — clear output-luck distinction.
- Catchup 4.
- Theme 6: Dungeon heist works.
- Engine 7: Deckbuilder ramp.
- Narrative 5.

Predicted closest: Dominion (batch 08), Aeon's End (batch 09), Quacks (in catalog — push-your-luck / deckbuilder cluster).

---

## Slay the Spire: The Board Game (BGG 338960)

**Scores:** [4, 8, 6, 6, 0, 2, 6, 5, 4, 8, 9, 5] · **Solo:** 8 · **Fiddly:** 5 · **Best:** [1P, 2P]

- Weight 4.
- Depth 8: Deckbuilder + relic combo space is deep.
- Density 6.
- Inter 6: Co-op coordination is real but each player resolves their own combat.
- Conflict 0.
- Negotiation 2.
- Input 6: Card draws + encounter deck.
- Output 5: Enemy intents revealed but card draw variance hits hard.
- Catchup 4.
- Theme 8: Direct adaptation of the video game's combat feel.
- Engine 9: Pure deckbuilder.
- Narrative 5: Campaign progression.

Predicted closest: Aeon's End (batch 09), Marvel Champions, Dune Imperium (in catalog — co-op / deckbuilder cluster). Solo-first design like Mage Knight.

---

## Daybreak (BGG 369546)

**Scores:** [3, 7, 6, 8, 0, 3, 6, 3, 4, 10, 6, 5] · **Solo:** 7 · **Fiddly:** 6 · **Best:** [2P, 3P, 4P]

- Weight 3: BGG 2.62.
- Depth 7: Project-chain optimization is real, multi-region dependencies.
- Density 6.
- Inter 8.
- Conflict 0.
- Negotiation 3: Co-op deal-making over crisis cards.
- Input 6.
- Output 3: Crisis dice + climate roll.
- Catchup 4.
- Theme 10: Climate-policy mechanics ARE the game — Spirit-Island-class theme integration.
- Engine 6: Project trees compound across rounds.
- Narrative 5.

Predicted closest: Pandemic, Pandemic Legacy S1, Spirit Island (in catalog — Leacock-DNA co-op cluster).

---

## Endeavor: Deep Sea (BGG 367966)

**Scores:** [4, 7, 6, 6, 3, 0, 5, 1, 4, 6, 6, 3] · **Solo:** 7 · **Fiddly:** 5 · **Best:** [3P, 4P]

- Weight 4: BGG 2.83.
- Depth 7: Building-driven action economy.
- Density 6.
- Inter 6: Shared dive sites + action-card competition.
- Conflict 3.
- Negotiation 0.
- Input 5.
- Output 1.
- Catchup 4.
- Theme 6: Marine biology / exploration is well-themed.
- Engine 6.
- Narrative 3.

Predicted closest: Concordia, Lost Ruins of Arnak, Viticulture (batch 09 — mid-euro exploration cluster).

---

## Batch 13 — Chudyk hub, asymmetric 4X, micro-fillers, Lacerda 2024 (2026-05-22)

10 games added: Mottainai, Cthulhu Wars, Architects of the West Kingdom, Forbidden Island, Sushi Go!, Love Letter, Skull, Ra, Imperial Struggle, Inventions: Evolution of Ideas.

**Strategy:** Fill Chudyk cluster (Mottainai), asymmetric 4X (Cthulhu Wars), Garphill (Architects pairs with the existing Paladins of the West Kingdom), top micro-fillers (Skull, Love Letter, Sushi Go!), Knizia auction class (Ra), 2P heavy historical (Imperial Struggle, TS successor), and the brand-new Lacerda 2024 (Inventions). Forbidden Island as light Pandemic-DNA co-op.

---

## Mottainai (BGG 174041)

**Scores:** [5, 9, 7, 8, 4, 0, 7, 1, 3, 4, 8, 4] · **Solo:** 0 · **Fiddly:** 5 · **Best:** [3P, 4P]

- Weight 5: BGG 3.21. Chudyk-dense.
- Depth 9: Cards-as-everything in Chudyk's house style.
- Density 7.
- Inter 8: Same Glory-to-Rome follow-lead structure.
- Conflict 4.
- Negotiation 0.
- Input 7: Card hand variance.
- Output 1.
- Catchup 3.
- Theme 4: Japanese temple monks; less integrated than Glory.
- Engine 8.
- Narrative 4.

Predicted closest: Glory to Rome, Innovation, Race for the Galaxy (in catalog — Chudyk/engine cluster).

---

## Cthulhu Wars (BGG 139976)

**Scores:** [7, 7, 7, 10, 9, 3, 4, 5, 4, 10, 4, 6] · **Solo:** 3 · **Fiddly:** 8 · **Best:** [4P, 5P]

- Weight 7: BGG 3.87.
- Depth 7: Asymmetric faction depth.
- Density 7.
- Inter 10: Direct combat 4X with strong asymmetry — Root-class friction.
- Conflict 9.
- Negotiation 3: Alliances form organically.
- Input 4.
- Output 5: Combat dice swing fights.
- Catchup 4.
- Theme 10: Lovecraft made manifest — each faction plays like its god.
- Engine 4: Power-buying ramp.
- Narrative 6: Awaken-the-old-ones session arc.

Predicted closest: Root, Inis, Blood Rage (in catalog — asymmetric area-control combat cluster).

---

## Architects of the West Kingdom (BGG 236457)

**Scores:** [3, 6, 6, 7, 4, 0, 5, 1, 5, 6, 5, 3] · **Solo:** 6 · **Fiddly:** 4 · **Best:** [3P, 4P]

- Weight 3: BGG 2.65.
- Depth 6.
- Density 6.
- Inter 7: **Worker-capture** mechanic — you can arrest opponents' workers off shared spots. Distinctive direct interaction.
- Conflict 4: Capture + black-market actions.
- Negotiation 0.
- Input 5.
- Output 1.
- Catchup 5.
- Theme 6: Medieval cathedral building + conscience track lands.
- Engine 5.
- Narrative 3.

Predicted closest: Paladins of the West Kingdom, Lords of Waterdeep (batch 08), Stone Age (batch 08 — Garphill / mid-WP cluster).

---

## Forbidden Island (BGG 65244)

**Scores:** [2, 4, 5, 8, 0, 2, 7, 3, 5, 6, 2, 4] · **Solo:** 5 · **Fiddly:** 3 · **Best:** [2P, 3P, 4P]

- Weight 2: BGG 1.74. Pandemic-light.
- Depth 4: Tighter and shallower than Pandemic.
- Density 5.
- Inter 8.
- Conflict 0.
- Negotiation 2.
- Input 7.
- Output 3: Sinking tile reveals + treasure card luck.
- Catchup 5.
- Theme 6: Sinking island works as a tension-source.
- Engine 2.
- Narrative 4.

Predicted closest: Pandemic, The Crew, Spirit Island (in catalog — co-op cluster, especially Leacock-DNA).

---

## Sushi Go! (BGG 133473)

**Scores:** [1, 3, 5, 5, 2, 0, 6, 1, 4, 3, 4, 1] · **Solo:** 0 · **Fiddly:** 1 · **Best:** [4P, 5P]

- Weight 1: BGG 1.18.
- Depth 3: Shallower than the Party version due to smaller card pool.
- Density 5.
- Inter 5.
- Conflict 2.
- Negotiation 0.
- Input 6.
- Output 1.
- Catchup 4.
- Theme 3.
- Engine 4.
- Narrative 1.

Predicted closest: Sushi Go Party!, 7 Wonders, It's a Wonderful World (batch 10 — drafter cluster).

---

## Love Letter (BGG 129622)

**Scores:** [1, 4, 5, 7, 4, 0, 7, 3, 4, 3, 0, 1] · **Solo:** 0 · **Fiddly:** 1 · **Best:** [3P, 4P]

- Weight 1: BGG 1.20.
- Depth 4: Surprisingly tight 16-card deduction.
- Density 5.
- Inter 7.
- Conflict 4: Direct elimination via Guard/Baron.
- Negotiation 0.
- Input 7: Card draws drive everything.
- Output 3.
- Catchup 4.
- Theme 3.
- Engine 0.
- Narrative 1.

Predicted closest: Skull (this batch), Jaipur (batch 09), Welcome To (in catalog — light filler cluster).

---

## Skull (BGG 92415)

**Scores:** [1, 4, 4, 9, 4, 6, 1, 4, 4, 2, 0, 1] · **Solo:** 0 · **Fiddly:** 1 · **Best:** [4P, 5P, 6P]

- Weight 1: BGG 1.16.
- Depth 4: Pure-bluff depth is real but bounded.
- Density 4.
- Inter 9: Constant table-reading.
- Conflict 4: Eliminating opponent disks.
- Negotiation 6: Table-talk is the game.
- Input 1: **Zero card draws** — pure mind game.
- Output 4.
- Catchup 4.
- Theme 2.
- Engine 0.
- Narrative 1.

Predicted closest: BotC, Cosmic Encounter, Avalon (batch 12 — bluff/social cluster). Distinct because no randomness.

---

## Ra (BGG 12)

**Scores:** [3, 6, 5, 8, 3, 2, 5, 1, 5, 4, 2, 3] · **Solo:** 0 · **Fiddly:** 3 · **Best:** [3P, 4P]

- Weight 3: BGG 2.55.
- Depth 6: Knizia's tight push-your-luck auction.
- Density 5.
- Inter 8: Auction interaction is constant.
- Conflict 3: Bid sniping.
- Negotiation 2.
- Input 5: Tile draw.
- Output 1.
- Catchup 5: Sun tile rotation evens out positions.
- Theme 4.
- Engine 2.
- Narrative 3: Three-epoch arc.

Predicted closest: El Grande, Tigris & Euphrates, Modern Art (in catalog — Knizia / classic-euro cluster).

---

## Imperial Struggle (BGG 257499)

**Scores:** [7, 10, 7, 10, 7, 0, 4, 1, 5, 9, 5, 8] · **Solo:** 0 · **Fiddly:** 6 · **Best:** [2P]

- Weight 7: BGG 4.05. Heavier than Twilight Struggle.
- Depth 10: 18th-century Britain vs France competition is deeply strategic.
- Density 7.
- Inter 10: 2P direct opposition.
- Conflict 7: Wars + investments + flashpoints.
- Negotiation 0.
- Input 4: Some event-tile variance.
- Output 1: Mostly deterministic.
- Catchup 5.
- Theme 9: Mercantile colonial competition deeply integrated.
- Engine 5: Investment buildup compounds.
- Narrative 8: Era arc with peace/war alternation.

Predicted closest: Twilight Struggle, Watergate (batch 12), War of the Ring (in catalog — 2P historical cluster). Direct sister to TS.

---

## Inventions: Evolution of Ideas (BGG 376728)

**Scores:** [9, 10, 8, 7, 3, 1, 4, 1, 4, 8, 9, 6] · **Solo:** 7 · **Fiddly:** 9 · **Best:** [2P, 3P]

- Weight 9: BGG 4.5. Top of Lacerda's weight range.
- Depth 10.
- Density 8.
- Inter 7: Idea-influence + tech-tree contention.
- Conflict 3.
- Negotiation 1.
- Input 4.
- Output 1.
- Catchup 4.
- Theme 8: History of inventions integrated through tech-tree progression — concept emerges through play.
- Engine 9.
- Narrative 6: Era progression arc.

Predicted closest: Lisboa, On Mars, Kanban EV, Vinhos Deluxe (in catalog — Lacerda heavy cluster).

---
