# Faction rebalance — adopted (validated in sim)

`REPORT.md` flagged faction balance as the one high-confidence problem: in the
greedy mirror the **Collector** won ~1.5× its fair share while the **Polymath**
and **Systematist** sat at ~0.72–0.76×, a best-to-worst spread of **0.81×**
(at a 4-player table, roughly 40% vs 17%). The two "patient" factions were weak
because the levers they key off — tolls and Findings spoilage — turned out to be
weak in play.

This was a "turn the knob" fix, not a redesign. Three targeted changes were
prototyped, validated, and then **adopted as the default** — baked into the
faction powers in `cards.py` and reflected on the print-and-play cards
(`../first-in-the-field-cards.html`), the card list (`../first-in-the-field-cards.md`),
and the rulebook reference (`../first-in-the-field-rules.html`).

## The three changes

| Faction | Original first-draft power | Adopted power |
|---|---|---|
| **The Collector** | +1 Specimen on **every** Field action (also fired on a Survey — a compounding double-dip) | +1 Specimen **only when you activate** a Field card |
| **The Polymath** | once/turn ignore one toll (near-useless — tolls are cheap & rare) | once/turn ignore one toll **plus +1 Specimen per chain step** — rewards the long laps that are its whole identity |
| **The Systematist** | Findings never decay **+ +2 Specimen stockpile cap** (both near-inert — spoilage is low, Specimens are uncapped) | Findings never decay **+ +1 strength on your first claim each round** — a Hall hook so the patient builder can reach the contest |

## Why (validated before adoption)

A/B in the greedy mirror (8,000 games per player-count, factions+seats rotated),
strength index = win-rate ÷ fair-share (**1.00 = perfectly fair**):

| Faction | Before | After | Δ |
|---|---:|---:|---:|
| The Collector | 1.52× | 0.93× | −0.59 |
| The Illustrator | 1.01× | 1.10× | +0.09 |
| The Sensationalist | 1.00× | 0.96× | −0.04 |
| The Systematist | 0.76× | 1.06× | +0.30 |
| The Polymath | 0.71× | 0.94× | +0.24 |
| **spread (max − min)** | **0.81×** | **0.17×** | **−0.64** |

Confirmed again on the now-default (baked-in) game: every faction lands inside
**0.91×–1.12×**, spread **0.20×** — comfortably within the band you want for
asymmetric powers (no auto-picks, no traps).

## No collateral damage

Re-running the strategy probes with the rebalance showed game length, knockout
rate, turtle-death (`pure_turtle` ~3.4%), and — notably — the **combo line's
dominance** (`comboist` ~41%) all unchanged. That last point confirms the combo
over-performance is a **strategy/AI** matter, not faction-driven, so it is *not*
addressed here (it goes to human playtests, per `REPORT.md`).

## Reproduce / verify

```bash
python3 tune_factions.py 8000   # greedy mirror on the current default factions;
                                # prints the strength index + spread, exits non-zero
                                # if balance drifts outside the healthy band
```

> Caveat (unchanged): these are heuristic-bot numbers from the greedy mirror — the
> most trustworthy instrument here, but still a model. Confirm the direction with
> human games before locking the final wording on the cards.
