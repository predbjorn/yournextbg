"""A/B the proposed faction rebalance against the default game.

Runs greedy-mirror matches (every seat plays `greedy`; factions and seats
rotated so only the faction differs — the same methodology REPORT.md uses for
faction balance) with the rebalance dials OFF, then ON, and prints the faction
strength index (win-rate ÷ fair-share) before and after.

    python3 tune_factions.py [games_per_playercount]
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

REBALANCE = dict(
    collector_activate_only=True,
    polymath_chain_specimen=True,
    systematist_first_claim_str=True,
)


def strength_index(n_players, n_games, dials_override):
    """Mean (win-rate ÷ fair-share) per faction over a greedy mirror."""
    wins = defaultdict(float)
    games = defaultdict(int)
    fair = 100.0 / n_players
    for s in range(n_games):
        shift = s % len(ALL)
        fids = (ALL[shift:] + ALL[:shift])[:n_players]
        r = s % n_players
        fids = fids[r:] + fids[:r]                  # rotate seats too
        facs = [C.FACTION_BY_ID[f] for f in fids]
        strat = ["greedy"] * n_players
        pols = [make_policy("greedy", s * 131 + i) for i in range(n_players)]
        d = Dials(n_players=n_players)
        for k, v in dials_override.items():
            setattr(d, k, v)
        m = Game(d, facs, strat, pols, seed=s, checks=False).play()
        for i in range(n_players):
            games[fids[i]] += 1
        if m.winner is not None and m.win_type != "tie":
            wins[fids[m.winner]] += 1
    return {f: (100.0 * wins[f] / games[f]) / fair for f in ALL if games[f]}


def aggregate(n_games, dials_override):
    per_pc = [strength_index(n, n_games, dials_override) for n in (2, 3, 4)]
    return {f: statistics.mean(pc[f] for pc in per_pc) for f in ALL}


def main():
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    print(f"greedy mirror, {n} games per player-count (2p/3p/4p), factions+seats rotated\n")
    base = aggregate(n, {})
    fixed = aggregate(n, REBALANCE)

    def spread(d):
        return max(d.values()) - min(d.values())

    print(f"{'Faction':<18}{'before':>9}{'after':>9}{'Δ':>9}")
    print("-" * 45)
    for f in sorted(ALL, key=lambda x: -base[x]):
        print(f"{NAME[f]:<18}{base[f]:>8.2f}x{fixed[f]:>8.2f}x{fixed[f]-base[f]:>+8.2f}")
    print("-" * 45)
    print(f"{'spread (max-min)':<18}{spread(base):>8.2f}x{spread(fixed):>8.2f}x"
          f"{spread(fixed)-spread(base):>+8.2f}")
    print(f"\nRebalance dials: {REBALANCE}")
    print("Target: every faction within ~0.85x-1.15x; spread well under 0.5x.")


if __name__ == "__main__":
    main()
