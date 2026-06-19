# Handoff — build a playtest simulator for *First in the Field*

> **For a fresh session.** Goal: write code that **plays the game against itself
> thousands of times** with simple AI players, then reports whether the design is
> balanced and which of the provisional numbers need tuning. You do **not** need
> any prior chat context — everything you need is in this repo. Read the rulebook
> first; it is the source of truth.

---

## One-line task

Build a headless simulation harness for the board game *First in the Field*,
run strategy match-ups and dial-sweeps, and produce a short balance report
flagging problems (with data) and suggested fixes.

## Where the authoritative design lives

All under `docs/game-ideas/first-in-the-field/`:

| File | What it is |
|---|---|
| `first-in-the-field-rules.html` | **The rulebook — source of truth.** Read it fully. |
| `first-in-the-field-cards.html` | All 39 card designs (data is in the `C=[…]` JS array near the bottom — easiest place to scrape exact text/numbers). |
| `first-in-the-field-board.html` | The board: bands, Hall nodes + perks, clock, Standing track. |
| `three-planes.md` | The theme-agnostic mechanical skeleton + design rationale (read the “stress-test” notes at the end). |

The card array in the HTML is the cleanest machine-readable source for card
stats — consider parsing it, or transcribe it into a `cards.py`/`cards.json`.

## The game in brief (implement from the rulebook, not this summary)

- **Players:** 2–4. **Win:** at the Exhibition’s close, lead the most of three
  bands; **or** hold all three Lead medallions at a round’s start → instant win.
- **Three bands / currencies (refine upward, store worse each step):**
  Field → **Specimens** (store freely) · Study → **Findings** (cap 3, spoil over
  cap at end of turn) · Hall → **Acclaim** (claim strength, never stored).
  **Standing** = tempo (sets priority; spend to waive a toll / bump a ratio).
- **Turn = one action in one band**, which may **chain** via the activated card’s
  trigger (pay the next step’s fuel + a **toll** of +1 input currency if you don’t
  lead that band). Chains run Field→Study→Hall→(loop back to Field). A repelled
  Hall step ends the chain.
- **Field:** *Survey* (draft a face-up card, pay build cost in Specimens) or
  *activate* a built Field card. **Field lead** = largest collection (total tier).
- **Study:** convert Specimens→Findings at a card’s ratio (base 2:1, best 1:1);
  two **prime tools** are exclusive (held until end of round). **Study lead** =
  most Findings produced last turn (throughput).
- **Hall:** *Present* (open claim, str = Findings spent, capped) or *Lodge* a
  face-down sealed claim (str = Findings+1). Challenge resolution **S vs D**:
  S>D capture (excess lost, loop-back perk + →Field chain), S=D both removed,
  S<D attacker fails (defender +1 Standing). **Hall lead** = most nodes held.
- **Clock:** +1 per resolved Hall challenge (and certain cards); from space 5,
  successful claims advance +1 extra; at **CLOSE**, finish the round, game ends.
- **Tactics:** one-shot hidden cards (Feint/Ambush/etc.) — model them.
- **Factions:** 5 asymmetric powers (Systematist/Sensationalist/Polymath/
  Collector/Illustrator) — see rulebook reference page.

> The rulebook deliberately left several things provisional. **Encode every such
> choice as a clearly-named, documented assumption** (see “open decisions” below).

## What to build

1. **A rules engine** — full game state + legal-action generation + resolution of
   actions, chains, tolls, spoilage, Hall challenges (with hidden-info handling),
   clock, lead recomputation, knockout/close checks, scoring. Deterministic given
   a seed.
2. **Card effects** — encode all ~50 engine cards + ~16 tactics + 5 factions.
   A small effect-DSL or per-card handler functions are both fine; favour
   something readable that a designer can tweak.
3. **AI players (policies)** — pluggable strategies (see below).
4. **A simulation runner** — play N games for given (player-count, strategy line-up,
   dial-set), with seeds; collect metrics; aggregate.
5. **A dial-sweep + report** — vary the provisional dials, summarise sensitivity,
   write a markdown balance report to `docs/game-ideas/first-in-the-field/sim/REPORT.md` (plus raw
   CSVs). Optional: simple plots if a plotting lib is available, else tables only.

## AI strategies to implement (start simple, then add one heuristic bot)

- `random` — legal random actions (baseline / sanity).
- `turtle` — maximise engine; **never** initiate a Hall challenge (tests whether a
  pure non-fighter can win — it shouldn’t).
- `warlord` — rush the Hall, contest aggressively, push the clock.
- `comboist` — prioritise building/firing long chains.
- `greedy` — one-ply heuristic: pick the action maximising a simple score
  (e.g. medallions held + progress toward leads). This is your “reasonable player”
  yardstick; balance conclusions should lean on `greedy` mirror-matches and mixed
  tables, using the archetype bots to probe specific failure modes.

Map strategies to factions where natural, but also test factions under `greedy`.

## Metrics to collect (per game → aggregate)

- **Win rate** by strategy and by faction (look for >~60% or <~40% outliers).
- **Game length:** rounds, total turns; **% ending by clock-close vs knockout**.
- **Pace driver:** correlation between Hall-aggression and game length (aggression
  *should* shorten games).
- **Turtle viability:** win rate of `turtle` vs others (target: clearly < fair share).
- **Runaway/snowball:** how often a 2-medallion lead converts to a win without the
  table breaking it; lead-medallion churn (how often medallions change hands).
- **First-player / priority advantage** by seat.
- **Economy health:** avg Findings spoiled/turn, avg chain length, % turns that
  chain, Specimen/Finding/Standing curves over the game.
- **Decisiveness:** margin of victory (medallions held by winner vs runner-up),
  frequency of ties / tie-break invocations.

## Balance questions the report must answer

1. Is there a dominant strategy or faction?
2. Can a pure **turtle** win by ignoring the Hall? (must be ~no)
3. Do games **end in a reasonable spread** (proxy for 45–75 min ≈ a target round
   count you define), and does the clock actually bind?
4. Are **knockouts** real but defendable (they happen sometimes, but a 2-lead is
   usually broken)?
5. Is there a strong **first-player advantage**?
6. Does the **Findings cap / 2:1 ratio** create meaningful tension or just feel-bad
   spoilage?
7. Which **dials**, when nudged, most change the above (sensitivity ranking)?

## Provisional dials to expose as config + sweep

Make these parameters (don’t hard-code), with the rulebook values as defaults:

- Findings **cap** (default 3) and **base conversion ratio** (2:1).
- Card **build costs** (Tier I/II/III = 0 / 2 / 4–5).
- Clock **length to CLOSE** (≈9) and **escalation threshold** (5).
- **Field row size** (6), starting Specimens (3), starting hand/Tactics (1).
- **Toll** amount (1), Standing-spend effects.
- Player count (2/3/4).

Sweep a few values each (e.g. cap ∈ {2,3,4}, clock ∈ {7,9,11}) and report which
swings the failure-mode metrics.

## Suggested architecture & tech

- **Python 3, standard library only** (optional: `matplotlib`/`pandas` if present,
  but keep a no-deps fallback). Pure-Python keeps it portable and fast enough for
  thousands of games.
- Layout under `docs/game-ideas/first-in-the-field/sim/`:
  ```
  sim/
    cards.py        # card definitions (parsed/transcribed) + effect handlers
    engine.py       # GameState, action generation, resolution, scoring
    ai.py           # strategy policies
    run.py          # CLI: run matchups / sweeps, emit CSV
    report.py       # aggregate CSV -> REPORT.md (+ optional plots)
    README.md       # how to run, and the assumptions log
    REPORT.md       # generated balance findings (the deliverable to read)
  ```
- Deterministic RNG seeded per game; log seeds so any odd game is reproducible.
- Aim for ≥10k games per config in the final run; keep a fast `--quick` mode.

## Deliverables & acceptance criteria

- [ ] Engine plays legal complete games headlessly without crashing across seeds.
- [ ] All cards/tactics/factions implemented (or explicitly stubbed in the log).
- [ ] At least the 5 strategies above, runnable in any seat combination.
- [ ] `run.py` produces per-game CSV; `report.py` produces `REPORT.md`.
- [ ] `REPORT.md` answers the 7 balance questions **with numbers**, lists concrete
      problems, and proposes specific dial changes (e.g. “turtle wins 47% in 2p —
      raise toll to 2 or add a Hall-presence requirement; see sweep table 3”).
- [ ] `README.md` documents how to run and **every assumption** you had to make.
- [ ] Commit to branch `claude/three-plane-game-mechanics-jGx8M` (or a child
      branch); do **not** open a PR unless asked.

## Open decisions you must make and record in `sim/README.md`

The rulebook is provisional; pin these down explicitly and note them:

- Exact **build-cost** for each Tier III (rulebook says “4–5”).
- How **“throughput” (Study lead)** is tracked turn-to-turn, and what happens on a
  turn with no conversion.
- Whether **Tactics are drafted from the Field row or drawn from a side deck** (the
  design left this open; rulebook leans side-deck/effects — implement that, but
  make it switchable, it’s a balance lever).
- Precise **AI policy** for hidden-info bluffing (Lodge strength choice, when to
  bluff, when to spend Tactics) — keep simple but documented.
- **Tie-break** order at the close (rulebook: medallions → Standing → collection →
  Findings) and what an unowned (tied) medallion means for “most medallions”.
- Any card whose text is ambiguous in code — log the interpretation you chose.

## First steps

1. Read `first-in-the-field-rules.html` end to end.
2. Scrape the `C=[…]` card array from `first-in-the-field-cards.html` into data.
3. Stand up `GameState` + a `random` bot that can finish a game; assert invariants
   (resources never negative, game always terminates, exactly one/zero leader per
   band).
4. Add `greedy` + archetype bots; run a small batch; eyeball sanity.
5. Scale up, sweep dials, write `REPORT.md`.

Keep the engine and the dials cleanly separated — the whole point is to turn knobs
and re-run, so a designer can ask “what if the clock were 7?” and get an answer in
one command.
