# First in the Field — playable demo

A real, playable browser demo of *First in the Field* — **you vs AI**, **full
rules**. Open it and play one naturalist against 1–3 AI rivals.

## How to run

**Just open `first-in-the-field.html` in any modern browser** (double-click it, or
drag it into a tab). No build step, no server, no install — it loads `engine.js`
from the same folder.

If your browser blocks the local `engine.js` load (rare, some locked-down setups),
serve the folder instead:

```bash
cd docs/game-ideas/demo
python3 -m http.server 8765       # then open http://localhost:8765/first-in-the-field.html
```

## Files

| File | What |
|---|---|
| `first-in-the-field.html` | The UI (board, interaction, log) + styling. |
| `engine.js` | The rules engine + AI — a JS port of `../sim/engine.py` + `../sim/ai.py`. Also runs under Node: `node engine.js` runs an 800-game self-check. |

## How to play

1. **Start screen** — pick player count (2–4), your faction, the opponents'
   personality (greedy / warlord / comboist / turtle / a mix), and an optional seed.
2. On **your turn**, the action panel lists every legal move. Take **one action**
   in one band:
   - **Field** — *Survey* a face-up card into your tableau (pay Specimens), or
     *activate* a built Field card for Specimens.
   - **Study** — *convert* Specimens → Findings (cap 3; spoils over cap at turn's end).
   - **Hall** — *Present* or *Lodge* a claim at one of five nodes (a small dialog
     lets you choose how many Findings to spend, and whether to reveal a Tactic).
3. If your action has a **→trigger**, you may take a **free chained step** in the
   next band (pay its fuel + a toll if you don't lead that band) — or stop. Chaining
   Field → Study → Hall in one turn is the heart of the game.
4. **Win** by leading the most of three bands when the Exhibition clock closes —
   or by holding **all three** Lead medallions at the start of a round (knockout).

The right column shows your tableau, hand, the rivals, and a running **Record** of
everything that happens. The top bar shows the clock, the three medallions, and who
holds each.

## Reading the board — planes at a glance

Everything is colour-and-symbol coded by **plane** so you can see, at a glance, *where*
each thing acts:

| Plane | Glyph | Colour |
|---|---|---|
| **Field** (collect Specimens) | fern | green |
| **Study** (convert → Findings) | microscope | teal |
| **Hall** (claim the nodes) | lectern | red |
| **Tactic** (an interrupt — *not* a plane) | lozenge | purple |

- **Every card shows its home plane**, plus — if it can **chain a bonus action** into the
  next plane — a smaller **▸ marker** for that plane. (e.g. *Collecting Trip* shows
  **Field ▸ Study**; *Present a Paper* shows **Hall ▸ Field**.) The ▸ marker is a property
  of the *card*; whether you can actually take that step this turn depends on having the
  fuel + toll, which the glowing legal moves and the live **chain trail** tell you.
- The same glyph+colour repeats **everywhere**: band headers, the **Lead medallions**, the
  **chain trail**, and a coloured **stripe on each action button** (so you can see which
  plane a move acts in before you click).
- **Plane colour lives on the furniture; player colour lives on the tokens.** A node's
  *owner* is shown by a player-coloured ring + the player's shape badge (●▲■◆); the node's
  *plane* is the Hall around it. The two never share a slot, so colour-blind play is safe
  and plane↔player colours never collide.
- **Click any card** (in the row, your tableau, your hand, or a Tactic) to see the **full
  engraved card** — the same art, frame, rules and flavour as the print-and-play deck —
  with its plane markers called out at the top.
- A small **legend** on the start screen names the four glyphs.

## Rules fidelity

`engine.js` is a faithful port of the simulator's canonical engine, including the
adopted faction rebalance (see `../sim/REBALANCE.md`) — Collector +1 Specimen on
activate only, Polymath +1 Specimen per chain step, Systematist +1 strength on its
first claim each round. It is rules-correct but not bit-identical to the Python
engine (different RNG). The **Run rules self-check** button (start screen) auto-plays
hundreds of games and asserts the core invariants (resources never negative, every
game terminates, one-or-zero leader per band).

### Interaction choices (v1)

- **Your offensive Tactics** (e.g. *A Sensational Specimen*) are offered in the Hall
  dialog when you challenge. **Defensive Tactics** auto-fire optimally on your behalf
  when a rival challenges a node you hold (and are announced in the Record) — this
  keeps AI turns from interrupting you for input. AI rivals use the same Tactic
  heuristics as the simulator.
- **Tolls** are paid automatically (free waivers first — Toll-gate node / Polymath —
  then the currency, then 1 Standing only if needed), and logged.
- **Study conversions** feed the maximum sensible Specimens.

These match the documented assumptions in `../sim/README.md`. Pass-and-play,
networked multiplayer, and save/restore are out of scope for this first demo.

## Relationship to the simulator

This demo is the human-facing front end; `../sim/` is the headless balance harness
(10k-game self-play, dial sweeps, `REPORT.md`). Both share the same rules and the
same rebalanced faction powers, so the game you play here is the game the balance
report describes.
