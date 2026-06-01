# Faction rebalance — proposed & validated in sim

`REPORT.md` flagged faction balance as the one high-confidence problem: in the
greedy mirror the **Collector** won ~1.5× its fair share while the **Polymath**
and **Systematist** sat at ~0.72–0.76×, a best-to-worst spread of **0.81×**
(at a 4-player table that is roughly 40% vs 17%). The two "patient" factions were
weak because the levers they key off — tolls and Findings spoilage — turned out
to be weak in play.

This is a "turn the knob" fix, not a redesign. Three targeted changes, each behind
an off-by-default dial in `engine.Dials` so the change is reversible and sweepable.

## The three changes

| Faction | Was | Proposed | Dial |
|---|---|---|---|
| **The Collector** | +1 Specimen on **every** Field action (also fires on a Survey — a compounding double-dip) | +1 Specimen **only on an activate**, not on a draft | `collector_activate_only` |
| **The Polymath** | once/turn ignore one toll (near-useless — tolls are cheap & rare) | **+1 Specimen per chain step** — rewards the long laps that are its whole identity (keeps the toll-ignore too) | `polymath_chain_specimen` |
| **The Systematist** | Findings never decay (wasted — spoilage is already low) | **+1 strength on your first claim each round** — a Hall hook so the patient builder can actually reach the contest | `systematist_first_claim_str` |

## Result (greedy mirror, 8,000 games per player-count, factions+seats rotated)

Strength index = win-rate ÷ fair-share; **1.00 = perfectly fair**.

| Faction | Before | After | Δ |
|---|---:|---:|---:|
| The Collector | 1.52× | 0.93× | −0.59 |
| The Illustrator | 1.01× | 1.10× | +0.09 |
| The Sensationalist | 1.00× | 0.96× | −0.04 |
| The Systematist | 0.76× | 1.06× | +0.30 |
| The Polymath | 0.71× | 0.94× | +0.24 |
| **spread (max − min)** | **0.81×** | **0.17×** | **−0.64** |

Every faction now lands inside **0.93×–1.10×** — comfortably within the band you
want for asymmetric powers (no auto-picks, no traps).

## No collateral damage

Re-running the strategy probes with the rebalance ON vs OFF (4,000 games each):

| Metric | Off | On |
|---|---|---|
| `comboist` vs 3 greedy | 41.1% | 41.0% |
| `pure_turtle` vs 3 greedy | 3.5% | 3.4% |
| avg rounds / knockout % (mixed) | 9.5 / 10.8% | 9.6 / 11.0% |

The faction tweaks leave game length, knockout rate, turtle-death, and — notably —
the **combo line's dominance** untouched. That last point confirms the combo
over-performance (`comboist` ~41%) is a **strategy/AI** matter, not faction-driven,
so it is correctly *not* addressed here (take it to human playtests, per `REPORT.md`).

## How to reproduce / adopt

```bash
python3 tune_factions.py 8000      # prints the before/after table above
```

The dials default **off**, so the committed default game (and `REPORT.md`) still
describes the original first-draft balance. To adopt the fix, either flip the three
dials in a `Config(dials={...})`, or bake the changes into `cards.py`
(Collector / Polymath / Systematist `powers`) and the matching handlers, then
regenerate `REPORT.md` to confirm the spread holds at the larger corpus.

> Caveat (unchanged): these are heuristic-bot numbers from the greedy mirror — the
> most trustworthy instrument here, but still a model. Confirm the direction with
> human games before locking the wording on the cards.
