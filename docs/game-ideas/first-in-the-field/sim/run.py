"""Simulation runner for *First in the Field*.

Plays many games for named configurations and dial-sweeps, writing per-game and
per-player CSVs that ``report.py`` turns into the balance report.

Usage
-----
    python3 run.py all      --games 10000            # full run (writes data/)
    python3 run.py all      --quick                  # fast (300 games/config)
    python3 run.py matchups --games 5000 --out data
    python3 run.py sweeps   --games 4000
    python3 run.py selftest                          # invariants on, asserts hard

Everything is deterministic in the per-game seed; seeds are logged in the CSV so
any odd game can be replayed (seed + config name fully determine the game).
"""

from __future__ import annotations

import argparse
import csv
import os
import time
from dataclasses import dataclass, field

import cards as C
from engine import Game, Dials
from ai import make_policy

ALL_FACTIONS = [f.id for f in C.FACTIONS]

# A "natural" faction for each archetype bot (handoff: map where natural).
NATURAL_FACTION = {
    "turtle": "systematist",
    "warlord": "sensationalist",
    "comboist": "polymath",
    "greedy": "collector",
    "random": "illustrator",
}


@dataclass
class Config:
    name: str
    n_players: int
    strategies: list              # length n_players (base order)
    factions: object = "rotate"   # 'rotate' | 'by_strategy' | list[faction_id]
    dials: dict = field(default_factory=dict)
    rotate_seats: bool = True

    def seated(self, seed: int):
        """Return (strategies, faction_objs) for this seed, rotating to cancel bias."""
        n = self.n_players
        strat = list(self.strategies)
        if self.factions == "by_strategy":
            facs = [NATURAL_FACTION[s] for s in strat]
        elif self.factions == "rotate":
            shift = seed % len(ALL_FACTIONS)
            rotated = ALL_FACTIONS[shift:] + ALL_FACTIONS[:shift]
            facs = rotated[:n]
        else:
            facs = list(self.factions)
        if self.rotate_seats:
            r = seed % n
            strat = strat[r:] + strat[:r]
            facs = facs[r:] + facs[:r]
        return strat, [C.FACTION_BY_ID[f] for f in facs]

    def build_dials(self) -> Dials:
        d = Dials(n_players=self.n_players)
        for k, v in self.dials.items():
            setattr(d, k, v)
        return d


# ---------------------------------------------------------------------------
# The standard battery of configurations.
# ---------------------------------------------------------------------------

def standard_configs() -> list:
    cfgs = []
    # greedy mirror at each player count, factions rotated -> measures FACTION balance
    for n in (2, 3, 4):
        cfgs.append(Config(f"greedy_mirror_{n}p", n, ["greedy"] * n, factions="rotate"))
    # archetype table -> measures STRATEGY balance + turtle viability, natural factions
    cfgs.append(Config("archetypes_4p",
                       4, ["turtle", "warlord", "comboist", "greedy"],
                       factions="by_strategy"))
    cfgs.append(Config("archetypes_3p",
                       3, ["turtle", "warlord", "greedy"], factions="by_strategy"))
    # turtle viability probes: 1 turtle vs greedy field (both faction modes)
    cfgs.append(Config("turtle_vs_greedy_2p", 2, ["turtle", "greedy"], factions="rotate"))
    cfgs.append(Config("turtle_vs_greedy_4p", 4,
                       ["turtle", "greedy", "greedy", "greedy"], factions="rotate"))
    # the strict probe for Q2: a turtle that NEVER touches the Hall at all
    cfgs.append(Config("pure_turtle_vs_greedy_4p", 4,
                       ["pure_turtle", "greedy", "greedy", "greedy"], factions="rotate"))
    # warlord probe: 1 warlord vs greedy field (does aggression overperform?)
    cfgs.append(Config("warlord_vs_greedy_4p", 4,
                       ["warlord", "greedy", "greedy", "greedy"], factions="rotate"))
    cfgs.append(Config("comboist_vs_greedy_4p", 4,
                       ["comboist", "greedy", "greedy", "greedy"], factions="rotate"))
    # full archetype mix with greedy filler
    cfgs.append(Config("mixed_4p", 4, ["turtle", "warlord", "comboist", "greedy"],
                       factions="rotate"))
    return cfgs


# Dials to sweep, with values; reported against the failure-mode metrics.
SWEEPS = {
    "findings_cap": [2, 3, 4],
    "clock_length": [7, 9, 11],
    "escalation_threshold": [3, 5, 7],
    "toll_amount": [0, 1, 2],
    "extra_ratio_steps": [0, 1],
    "field_row_size": [4, 6, 8],
    "start_specimens": [1, 3, 5],
    "capture_garrison_mode": ["excess", "full"],
}


# ---------------------------------------------------------------------------
# Game -> flat metric rows
# ---------------------------------------------------------------------------

GAME_FIELDS = [
    "config", "seed", "n_players", "ended_by", "win_type", "tie_size",
    "winner_seat", "winner_strategy", "winner_faction",
    "rounds", "total_turns", "challenges", "successful_claims",
    "chained_turns", "chain_steps", "findings_spoiled", "findings_produced",
    "medallion_changes", "clock_final", "two_lead_reached", "two_lead_broken",
    "threat_game", "winner_medallions", "runnerup_medallions", "margin",
]

PLAYER_FIELDS = [
    "config", "seed", "n_players", "seat", "strategy", "faction",
    "won", "medallions", "standing", "collection", "findings",
    "challenges", "tableau_size",
]


def play_one(cfg: Config, seed: int, checks: bool):
    strat, facs = cfg.seated(seed)
    pols = [make_policy(s, seed * 131 + i) for i, s in enumerate(strat)]
    d = cfg.build_dials()
    g = Game(d, facs, strat, pols, seed=seed, checks=checks)
    m = g.play()
    return strat, facs, m


def game_row(cfg, seed, strat, facs, m):
    pp = m.per_player
    meds = sorted((pp[i]["medallions"] for i in pp), reverse=True)
    winner_meds = pp[m.winner]["medallions"] if m.winner is not None else 0
    runnerup = meds[1] if len(meds) > 1 else 0
    return {
        "config": cfg.name, "seed": seed, "n_players": cfg.n_players,
        "ended_by": m.ended_by, "win_type": m.win_type, "tie_size": m.tie_size,
        "winner_seat": pp[m.winner]["seat"] if m.winner is not None else -1,
        "winner_strategy": strat[m.winner] if m.winner is not None else "",
        "winner_faction": facs[m.winner].id if m.winner is not None else "",
        "rounds": m.rounds, "total_turns": m.total_turns,
        "challenges": m.challenges, "successful_claims": m.successful_claims,
        "chained_turns": m.chained_turns, "chain_steps": m.chain_steps,
        "findings_spoiled": m.findings_spoiled, "findings_produced": m.findings_produced,
        "medallion_changes": m.medallion_changes, "clock_final": m.clock_final,
        "two_lead_reached": int(m.two_lead_reached), "two_lead_broken": int(m.two_lead_broken),
        "threat_game": int(m.threat_game),
        "winner_medallions": winner_meds, "runnerup_medallions": runnerup,
        "margin": winner_meds - runnerup,
    }


def player_rows(cfg, seed, strat, facs, m):
    # Ties (<1% of games) are credited to nobody; tie frequency is reported
    # separately so it isn't silently folded into win rates.
    rows = []
    for i, pdata in m.per_player.items():
        won = 1.0 if (m.winner == i and m.win_type != "tie") else 0.0
        rows.append({
            "config": cfg.name, "seed": seed, "n_players": cfg.n_players,
            "seat": pdata["seat"], "strategy": pdata["strategy"], "faction": pdata["faction"],
            "won": won, "medallions": pdata["medallions"], "standing": pdata["standing"],
            "collection": pdata["collection"], "findings": pdata["findings"],
            "challenges": pdata["challenges"], "tableau_size": pdata["tableau_size"],
        })
    return rows


# ---------------------------------------------------------------------------
# Drivers
# ---------------------------------------------------------------------------

def run_matchups(configs, n_games, out_dir, seed_base, checks):
    os.makedirs(out_dir, exist_ok=True)
    gpath = os.path.join(out_dir, "games.csv")
    ppath = os.path.join(out_dir, "players.csv")
    t0 = time.time()
    with open(gpath, "w", newline="") as gf, open(ppath, "w", newline="") as pf:
        gw = csv.DictWriter(gf, fieldnames=GAME_FIELDS)
        pw = csv.DictWriter(pf, fieldnames=PLAYER_FIELDS)
        gw.writeheader()
        pw.writeheader()
        for cfg in configs:
            for k in range(n_games):
                seed = seed_base + k
                strat, facs, m = play_one(cfg, seed, checks)
                gw.writerow(game_row(cfg, seed, strat, facs, m))
                for r in player_rows(cfg, seed, strat, facs, m):
                    pw.writerow(r)
            print(f"  [{cfg.name}] {n_games} games "
                  f"({time.time()-t0:.1f}s elapsed)")
    print(f"matchups -> {gpath}, {ppath}")


def run_sweeps(n_games, out_dir, seed_base, checks):
    """For each dial value, run a fixed probe lineup and aggregate failure-mode metrics."""
    os.makedirs(out_dir, exist_ok=True)
    spath = os.path.join(out_dir, "sweeps.csv")
    fields = [
        "dial", "value", "config",
        "turtle_winrate", "warlord_winrate", "greedy_winrate",
        "avg_rounds", "pct_close", "pct_knockout", "pct_maxrounds",
        "avg_challenges", "two_lead_broken_rate", "avg_margin",
        "avg_spoiled_per_turn", "pct_turns_chained", "avg_chain_len",
        "faction_spread", "seat0_advantage",
    ]
    # probe lineup: turtle + warlord + greedy + greedy, factions rotated so the
    # sweep is about the dial, not the faction.
    base = Config("sweep_probe", 4, ["turtle", "warlord", "greedy", "greedy"],
                  factions="rotate")
    t0 = time.time()
    with open(spath, "w", newline="") as sf:
        sw = csv.DictWriter(sf, fieldnames=fields)
        sw.writeheader()
        # baseline row (defaults)
        sw.writerow(_sweep_agg("(baseline)", "default", base, {}, n_games, seed_base, checks))
        for dial, values in SWEEPS.items():
            for v in values:
                row = _sweep_agg(dial, v, base, {dial: v}, n_games, seed_base, checks)
                sw.writerow(row)
            print(f"  swept {dial} ({time.time()-t0:.1f}s)")
    print(f"sweeps -> {spath}")


def _sweep_agg(dial, value, base, dials_override, n_games, seed_base, checks):
    cfg = Config(base.name, base.n_players, base.strategies,
                 factions=base.factions, dials=dict(dials_override))
    wins = {"turtle": 0.0, "warlord": 0.0, "greedy": 0.0}
    counts = {"turtle": 0, "warlord": 0, "greedy": 0}
    n_close = n_ko = n_mr = 0
    sum_rounds = sum_chal = sum_margin = 0
    two_reached = two_broken = 0
    sum_spoiled = sum_turns = sum_chained = sum_chainsteps = 0
    fac_wins = {f: 0 for f in ALL_FACTIONS}
    fac_games = {f: 0 for f in ALL_FACTIONS}
    seat_wins = {}
    seat_games = {}
    ngames = 0
    for k in range(n_games):
        seed = seed_base + k
        strat, facs, m = play_one(cfg, seed, checks)
        ngames += 1
        n_close += m.ended_by == "close"
        n_ko += m.ended_by == "knockout"
        n_mr += m.ended_by == "max_rounds"
        sum_rounds += m.rounds
        sum_chal += m.challenges
        sum_spoiled += m.findings_spoiled
        sum_turns += m.total_turns
        sum_chained += m.chained_turns
        sum_chainsteps += m.chain_steps
        two_reached += m.two_lead_reached
        two_broken += m.two_lead_broken
        pp = m.per_player
        meds = sorted((pp[i]["medallions"] for i in pp), reverse=True)
        sum_margin += (meds[0] - meds[1]) if len(meds) > 1 else meds[0]
        for i in pp:
            counts[strat[i]] = counts.get(strat[i], 0) + 1
            fac_games[facs[i].id] += 1
            seat_games[pp[i]["seat"]] = seat_games.get(pp[i]["seat"], 0) + 1
        if m.winner is not None and m.win_type != "tie":
            wins[strat[m.winner]] = wins.get(strat[m.winner], 0) + 1
            fac_wins[facs[m.winner].id] += 1
            sw = pp[m.winner]["seat"]
            seat_wins[sw] = seat_wins.get(sw, 0) + 1

    def wr(s):
        return round(100 * wins.get(s, 0) / counts[s], 2) if counts.get(s) else 0.0
    # faction spread = max-min faction win rate (pp), seat0 advantage = seat0 wr / fair
    fac_rates = [100 * fac_wins[f] / fac_games[f] for f in ALL_FACTIONS if fac_games[f]]
    fac_spread = round(max(fac_rates) - min(fac_rates), 1) if fac_rates else 0.0
    fair = 100.0 / base.n_players
    seat0 = round((100 * seat_wins.get(0, 0) / seat_games.get(0, 1)) / fair, 2)
    return {
        "dial": dial, "value": value, "config": base.name,
        "turtle_winrate": wr("turtle"), "warlord_winrate": wr("warlord"),
        "greedy_winrate": wr("greedy"),
        "avg_rounds": round(sum_rounds / ngames, 2),
        "pct_close": round(100 * n_close / ngames, 1),
        "pct_knockout": round(100 * n_ko / ngames, 1),
        "pct_maxrounds": round(100 * n_mr / ngames, 1),
        "avg_challenges": round(sum_chal / ngames, 2),
        "two_lead_broken_rate": round(100 * two_broken / max(1, two_reached), 1),
        "avg_margin": round(sum_margin / ngames, 3),
        "avg_spoiled_per_turn": round(sum_spoiled / max(1, sum_turns), 3),
        "pct_turns_chained": round(100 * sum_chained / max(1, sum_turns), 1),
        "avg_chain_len": round(sum_chainsteps / max(1, sum_chained), 2),
        "faction_spread": fac_spread,
        "seat0_advantage": seat0,
    }


def run_selftest(n_games=500):
    """Run with invariants ON across many seeds and lineups; assert clean termination."""
    lineups = [
        Config("st_random", 4, ["random"] * 4, factions="rotate"),
        Config("st_greedy", 4, ["greedy"] * 4, factions="rotate"),
        Config("st_mixed", 4, ["turtle", "warlord", "comboist", "greedy"], factions="rotate"),
        Config("st_2p", 2, ["greedy", "greedy"], factions="rotate"),
        Config("st_3p", 3, ["turtle", "warlord", "greedy"], factions="by_strategy"),
    ]
    total = 0
    t0 = time.time()
    for cfg in lineups:
        for k in range(n_games):
            _, _, m = play_one(cfg, k, checks=True)
            assert m.winner is not None, f"no winner: {cfg.name} seed {k}"
            assert m.rounds <= Dials().max_rounds
            total += 1
    print(f"selftest OK: {total} games, invariants held ({time.time()-t0:.1f}s)")


# ---------------------------------------------------------------------------
def main():
    ap = argparse.ArgumentParser(description="First in the Field — simulation runner")
    ap.add_argument("mode", choices=["all", "matchups", "sweeps", "selftest"])
    ap.add_argument("--games", type=int, default=10000, help="games per config")
    ap.add_argument("--quick", action="store_true", help="300 games per config")
    ap.add_argument("--out", default="data", help="output directory")
    ap.add_argument("--seed-base", type=int, default=1)
    ap.add_argument("--check", action="store_true", help="run with invariants on (slower)")
    args = ap.parse_args()

    n = 300 if args.quick else args.games
    checks = args.check

    if args.mode == "selftest":
        run_selftest()
        return
    if args.mode in ("all", "matchups"):
        run_matchups(standard_configs(), n, args.out, args.seed_base, checks)
    if args.mode in ("all", "sweeps"):
        # sweeps are heavier (probe x many dial values); use fewer games unless overridden
        sweep_n = n if args.games != 10000 or args.quick else 4000
        run_sweeps(sweep_n, args.out, args.seed_base, checks)


if __name__ == "__main__":
    main()
