# First in the Field — playtest simulator

A headless, deterministic self-play harness for the board game *First in the
Field*. It plays the game thousands of times with simple AI players, sweeps the
provisional dials, and writes a balance report.

The rulebook (`../first-in-the-field-rules.html`) is the source of truth; the
cards come from the `C=[…]` array in `../first-in-the-field-cards.html`; the board
(nodes, perks, clock, standing track) from `../first-in-the-field-board.html`.

## Layout

| File | What |
|---|---|
| `cards.py`  | All 39 cards (9 Field, 9 Study, 8 Hall, 8 Tactics, 5 Factions) + deck composition. Pure data + flags. |
| `engine.py` | `GameState`, legal-action generation, chains/tolls/spoilage, Hall challenges (hidden info + Tactics), clock, instant lead recompute, knockout/close, scoring. All dials in `Dials`. Runtime invariants. |
| `ai.py`     | Policies: `random`, `turtle`, `pure_turtle`, `warlord`, `comboist`, `greedy` (the yardstick). |
| `run.py`    | CLI: run named match-ups + dial-sweeps, emit CSV. |
| `report.py` | Aggregate CSV → `REPORT.md`. |
| `test_engine.py` | Unit tests for the mechanics (`python3 test_engine.py`). |
| `tune_factions.py` | Greedy-mirror faction balance check (gates on the spread). |
| `REPORT.md` | **The deliverable** — generated balance findings. |
| `REBALANCE.md` | The adopted faction rebalance: changes, before/after, why. |
| `data/`     | Generated CSVs (`games.csv`, `players.csv`, `sweeps.csv`). |

> **Faction balance note:** three faction powers were rebalanced after the first
> full run (Collector, Polymath, Systematist) and are now the default — see
> `REBALANCE.md`. `REPORT.md` reflects the post-rebalance game.

## How to run

Requires **Python 3** (standard library only — no third-party deps). From this
directory:

```bash
# fast sanity pass (~300 games/config, ~40s) then report
python3 run.py all --quick
python3 report.py --in data --out REPORT.md

# the full run used for the committed REPORT.md (≈10k games/config; a few minutes)
python3 run.py all --games 10000
python3 report.py

# invariants ON across many seeds/line-ups; asserts hard (used in CI / pre-commit)
python3 run.py selftest

# individual pieces
python3 run.py matchups --games 5000      # only the named match-ups
python3 run.py sweeps   --games 4000      # only the dial sweeps
python3 cards.py                          # print deck composition
```

Every game is fully determined by `(config name, seed)`. Seeds are written to the
CSV, so any surprising game can be replayed by constructing that `Config` and
`Game(..., seed=that_seed)`.

### Turning a knob

Every provisional number is a field on `engine.Dials`. To answer "what if the
clock were 7?", either add it to a `Config(dials={...})` or extend the `SWEEPS`
dict in `run.py`. Nothing about the rules is hard-coded around a specific value.

## What the bots are

- **`random`** — uniform over legal actions. Baseline + invariant fuzzer.
- **`turtle`** — engine-first; **never initiates a Hall challenge** (but will claim
  *empty* nodes). Tests whether a non-fighter wins (it should not).
- **`pure_turtle`** — never takes **any** Hall action at all. The strict "ignore
  the Hall" test.
- **`warlord`** — funds aggression (lean Study economy for ammunition), holds
  nodes with garrisons, and attacks rivals — especially the medallion leader.
- **`comboist`** — builds a trigger in every row and fires long Field→Study→Hall
  laps.
- **`greedy`** — one-ply **heuristic** score (medallions + progress toward each
  lead + resources). Not full lookahead — exactly the "reasonable player" the
  handoff describes. **Balance conclusions lean on `greedy` mirror-matches**; the
  archetypes are failure-mode probes.

Bots read a **redacted view**: opponents' *sealed* (lodged) claim strengths are
hidden; an attacker sizing a challenge assumes a hidden garrison ≈ `EST_SEALED`.
No bot cheats on hidden information.

---

## Open decisions & assumptions (the rulebook is provisional)

Every choice the rulebook left open is encoded as a named, documented dial or
flag. Defaults are the rulebook's stated values.

1. **Deck composition.** Engine deck = each Tier I design ×3, Tier II ×2, Tier III
   ×1 (per `first-in-the-field-cards.md` and the `PIP` map in the cards HTML) →
   **50 physical cards**. Tactics ×2 per design → **16**. The three starting cards
   (*Collecting Trip*, *Field Notes*, *Present a Paper*) are **separate per-player
   components**, *not* removed from the draw deck (so all three copies of each
   remain draftable). Dials: `deck_copies`, `tactic_copies`.

2. **Tier III build costs** (rulebook says "4–5"). Used the per-card costs printed
   in the card array: Field — Grand Voyage 4, Royal Patronage 5, Rediscovered
   Cabinet 4; Study — Great Atlas 4, Standardized System 5, Engraver's Workshop 4;
   Hall — Definitive Revision 4, Founding Fellow 5, Sensational Discovery 4.
   Override with `build_cost_override = {tier: cost}`.

3. **Tolls apply to chained (free) steps only**, not the opening paid action
   (`toll_on_paid_action=False`). Toll = +1 Specimen to cross **into the Study**
   unled, +1 Finding to cross **into the Hall** unled (`toll_amount=1`). The
   loop-back **into the Field** pays no toll (the rulebook names only Study/Hall
   tolls; the Field is cold). Waiver priority when a toll is due: Geology
   *Toll-gate* node (once/turn) → Polymath faction (once/turn) → *Borrowed Type
   Specimen* tactic (Hall only) → pay the currency → spend 1 Standing.

4. **Study lead / "throughput".** Findings produced *during* a turn accumulate;
   at end of turn they are committed to `throughput_last`. The Study lead reads
   last-turn throughput (so it is stable within a turn; a turn with no conversion
   → 0). It requires ≥1 (`study_lead_min_throughput`); ties → unowned. *A
   Standardized System* doubles its holder's throughput for the lead.

5. **Captured-node garrison strength** (rulebook: "you take the node … excess S−D
   is lost; yours stands as the new garrison" — ambiguous). Default
   `capture_garrison_mode='excess'`: new strength = **S − D** (continuous with the
   S=D mutual-destruction case, and it keeps the Hall lead churning — anti-snowball).
   Alternative `'full'`: new strength = **S**. The sweep reports both.

6. **The clock.** Starts on space 1; **CLOSE** when the marker reaches
   `clock_length + 1` (default 10). A **resolved challenge** (attacking a
   rival-held node, any outcome) ticks +1. **Uncontested** claims do *not* tick the
   base clock. **Escalation** (clock ≥ `escalation_threshold`, default 5): every
   **successful** claim (an uncontested claim that stands, or a won challenge)
   ticks **+1 extra**. Plus: Sensationalist +1 per contest, *Sensational Discovery*
   +1 on success, *Press Sensation* +1. Reaching CLOSE finishes the current round,
   then ends the game.

7. **Knockout** is checked **only at a round start** (rulebook). Hold all three
   medallions then → instant win.

8. **Field lead** = Σ tier value (I=1, II=2, III=3) of built Field cards; *Royal
   Patronage* counts double. Tie-break: fewer cards, else unowned.
   **Per-Field-action Specimen passives** (*Patron's Grant* +1, *Royal Patronage*
   +2, Collector +1, *Roadside Botanizing* first-action +1, *Naturalist's Network*
   +1 while leading) fire on **both Survey and Activate** — a Survey *is* a Field
   action. (Interpretation: a drafting turn still earns the recurring engine.)

9. **Hall claim strength.** Open claim S = Findings spent (+ card bonus; capped for
   *Present a Paper* ≤3, *Read at the Meeting* ≤2). *Lodge a Claim* (sealed) S =
   Findings + 1. A claim needs strength ≥1 to found or contest a node (a 0-strength
   open claim fizzles). Presenting on a node you already hold reinforces it
   (strength = max(old, new)).

10. **Prime tools** (Microscope, Engraver). *Shared Microscope* requires the
    Microscope; *Engraver's Workshop* requires the Engraver (the rulebook ties only
    *Shared Microscope* to "a prime tool" explicitly — we assigned *Engraver's
    Workshop* → Engraver so both tokens are live and contested). First user claims
    the token until end of round; while held, rivals cannot activate a card
    requiring it.

11. **`Engraver's Workshop` "Findings do not decay this round"** is implemented as
    a persistent no-decay while the card is built (treated as an always-on passive,
    not a one-round trigger). The Systematist's "Findings never decay" is likewise
    always-on.

12. **Specimen storage.** The rulebook says Specimens "stockpile freely", so the
    default `specimen_cap=None` (uncapped). The original Systematist's *"+2 Specimen
    stockpile cap"* was therefore inert (a contradiction with the storage rule) —
    which is exactly why the adopted rebalance replaced it with a *+1 strength on
    your first claim each round* hook (see `REBALANCE.md`).

13. **Tactics.** Modelled as a **side deck** (the rulebook-leaning option), *not*
    drafted from the Field row. Each player starts with `start_tactics=1`; more
    arrive via *Rediscovered Cabinet* / *Sensational Discovery*. Whether to draft
    Tactics from the row instead is a noted balance lever, not yet a switch.
    Tactic **play** is resolved by documented heuristics (not policy choices), to
    keep the AI surface small:
    - *A Sensational Specimen* (Feint, +2): attacker plays it on a contested
      presentation when warlord/comboist/greedy and holding it.
    - Defender plays, in priority: *Prior Publication* (Ambush — negate an attack
      that would otherwise land) → *Pre-emptive Letter* (+1 per band led, if it
      flips the result) → Feint (+2, if it flips).
    - *Pre-emptive Letter* "+1 per **field** you lead" is read as **+1 per band
      medallion held** (max 3).
    - *A Whole New Genus* (Overrun): on a capture with excess, spill to an adjacent
      node if the excess captures it.
    - *Erratum*: auto-recovers spent Findings on a failed attack.
    - *Press Sensation*: warlord plays it at turn start to push the clock.
    - *Anonymous Referee* (cross-cancel a revealed Tactic): **not implemented in
      v1** — a documented simplification (low impact: ~1 tactic/player and rare).

14. **`Hired Guide`** ("view 2, draft 1") = the option to also draft the top card
    of the deck. **Collector's "peek the row"** has no mechanical effect in the sim
    (the bots already see the row). Both flagged.

15. **Lead recomputation.** Field and Hall leads recompute after every action;
    the Study lead updates at end of turn (throughput). Medallions pass instantly.

16. **Close tie-break.** Most medallions → Standing → collection → Findings.
    Unbroken ties (<1% of games) are credited to nobody in win-rate stats; tie
    frequency is reported separately rather than folded into win rates.

17. **Determinism & termination.** One `random.Random(seed)` per game. Safety
    backstops `max_rounds=40` and `max_chain_steps=40` guarantee termination; both
    are rarely hit and the max-rounds rate is reported (a high rate would itself be
    a finding — the clock failing to bind).

### Known simplifications (kept deliberately small)

- Tactic interplay is heuristic, single-tactic-per-side, no *Anonymous Referee*
  cross-cancel (see 13). Tactics are scarce, so the aggregate effect on balance is
  modest.
- `greedy` scores one ply heuristically (no game-tree search); it under-uses long
  chains relative to `comboist`, which is *why* the combo line looks strong — read
  that result as "chaining is the highest-tempo line", and confirm with humans.
- The Collector's row-peek and Hired Guide's deep-look are info-only edges that a
  full-information bot can't exploit, so they are under-valued here.
