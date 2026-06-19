"""Faction balance check (greedy mirror).

The faction rebalance from REBALANCE.md is now baked into the default faction
powers in cards.py, so this is a *verifier*: it plays greedy-mirror matches
(every seat plays `greedy`; factions and seats rotated so only the faction
differs — the methodology REPORT.md uses) and prints each faction's strength
index (win-rate ÷ fair-share) and the max−min spread, then checks the spread is
inside a healthy band.

    python3 tune_factions.py [games_per_playercount]

Exit code is non-zero if the spread exceeds the threshold, so it can gate CI.
"""

from __future__ import annotations

import sys
import statistics
from collections import defaultdict

import cards as C
from engine import Game, Dials
from ai import make_policy

ALL = [f.id for f in C.FACTIONS]
NAME = {f.id: f.name for f in C.FACTIONS}
SPREAD_TARGET = 0.5     # max-min strength index should sit well under this


def strength_index(n_players, n_games):
    wins = defaultdict(float)
    games = defaultdict(int)
    fair = 100.0 / n_players
    for s in range(n_games):
        shift = s % len(ALL)
        fids = (ALL[shift:] + ALL[:shift])[:n_players]
        r = s % n_players
        fids = fids[r:] + fids[:r]
        facs = [C.FACTION_BY_ID[f] for f in fids]
        pols = [make_policy("greedy", s * 131 + i) for i in range(n_players)]
        m = Game(Dials(n_players=n_players), facs, ["greedy"] * n_players,
                 pols, seed=s, checks=False).play()
        for i in range(n_players):
            games[fids[i]] += 1
        if m.winner is not None and m.win_type != "tie":
            wins[fids[m.winner]] += 1
    return {f: (100.0 * wins[f] / games[f]) / fair for f in ALL if games[f]}


def main():
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    print(f"greedy mirror, {n} games per player-count (2p/3p/4p), factions+seats rotated\n")
    per_pc = {pc: strength_index(pc, n) for pc in (2, 3, 4)}
    agg = {f: statistics.mean(per_pc[pc][f] for pc in (2, 3, 4)) for f in ALL}
    spread = max(agg.values()) - min(agg.values())

    print(f"{'Faction':<20}{'2p':>7}{'3p':>7}{'4p':>7}{'mean':>8}")
    print("-" * 49)
    for f in sorted(ALL, key=lambda x: -agg[x]):
        flag = "  <- " + ("strong" if agg[f] >= 1.25 else "weak") if (agg[f] >= 1.25 or agg[f] <= 0.75) else ""
        print(f"{NAME[f]:<20}{per_pc[2][f]:>6.2f}x{per_pc[3][f]:>6.2f}x"
              f"{per_pc[4][f]:>6.2f}x{agg[f]:>7.2f}x{flag}")
    print("-" * 49)
    print(f"spread (max-min): {spread:.2f}x   (target < {SPREAD_TARGET}x)")
    ok = spread < SPREAD_TARGET and all(0.7 <= v <= 1.3 for v in agg.values())
    print("RESULT:", "BALANCED ✓" if ok else "OUT OF BAND ✗")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
