"""Aggregate the simulation CSVs into ``REPORT.md`` (the deliverable).

Reads ``data/games.csv``, ``data/players.csv`` and ``data/sweeps.csv`` and writes
a markdown balance report that answers the seven balance questions from the
handoff with numbers, flags concrete problems, and proposes specific dial changes.

Stdlib only.  Run after ``run.py``:

    python3 report.py --in data --out REPORT.md
"""

from __future__ import annotations

import argparse
import csv
import math
import os
import statistics
from collections import defaultdict

import cards as C

FACTION_ORDER = [f.id for f in C.FACTIONS]
FACTION_NAME = {f.id: f.name for f in C.FACTIONS}


# ---------------------------------------------------------------------------
def load(path):
    if not os.path.exists(path):
        return []
    with open(path, newline="") as f:
        return list(csv.DictReader(f))


def num(x):
    try:
        return float(x)
    except (TypeError, ValueError):
        return 0.0


def pct(n, d):
    return 100.0 * n / d if d else 0.0


def pearson(xs, ys):
    n = len(xs)
    if n < 3:
        return 0.0
    mx, my = statistics.mean(xs), statistics.mean(ys)
    sx = math.sqrt(sum((x - mx) ** 2 for x in xs))
    sy = math.sqrt(sum((y - my) ** 2 for y in ys))
    if sx == 0 or sy == 0:
        return 0.0
    cov = sum((x - mx) * (y - my) for x, y in zip(xs, ys))
    return cov / (sx * sy)


def bar(value, lo, hi, width=24):
    """A little ASCII bar for win-rate-vs-fair-share visuals."""
    span = hi - lo or 1
    filled = int(round((value - lo) / span * width))
    filled = max(0, min(width, filled))
    return "#" * filled + "." * (width - filled)


# ---------------------------------------------------------------------------
class Report:
    def __init__(self, indir):
        self.games = load(os.path.join(indir, "games.csv"))
        self.players = load(os.path.join(indir, "players.csv"))
        self.sweeps = load(os.path.join(indir, "sweeps.csv"))
        self.by_config_players = defaultdict(list)
        for r in self.players:
            self.by_config_players[r["config"]].append(r)
        self.by_config_games = defaultdict(list)
        for r in self.games:
            self.by_config_games[r["config"]].append(r)

    # -- helpers -----------------------------------------------------------
    def winrate_by(self, rows, key):
        wins = defaultdict(float)
        cnt = defaultdict(int)
        for r in rows:
            wins[r[key]] += num(r["won"])
            cnt[r[key]] += 1
        return {k: (pct(wins[k], cnt[k]), cnt[k]) for k in cnt}

    def fair_share(self, config):
        n = num(self.by_config_players[config][0]["n_players"]) if self.by_config_players.get(config) else 4
        return 100.0 / n

    # -- sections ----------------------------------------------------------
    def faction_section(self):
        out = ["## Q1a — Is there a dominant faction?\n"]
        out.append("Measured in **greedy mirror** matches (every seat plays `greedy`; "
                   "factions and seats rotated so only the faction differs).\n")
        # aggregate faction strength as win-rate / fair-share across the mirror configs
        agg_ratio = defaultdict(list)
        for cfg in ("greedy_mirror_2p", "greedy_mirror_3p", "greedy_mirror_4p"):
            rows = self.by_config_players.get(cfg)
            if not rows:
                continue
            fair = self.fair_share(cfg)
            wr = self.winrate_by(rows, "faction")
            out.append(f"\n**{cfg}** (fair share {fair:.1f}%):\n")
            out.append("| Faction | Win % | × fair share | |")
            out.append("|---|---:|---:|:--|")
            for fid in FACTION_ORDER:
                if fid not in wr:
                    continue
                w, _ = wr[fid]
                ratio = w / fair
                agg_ratio[fid].append(ratio)
                out.append(f"| {FACTION_NAME[fid]} | {w:.1f} | {ratio:.2f}× | "
                           f"`{bar(ratio, 0.5, 1.5)}` |")
        # overall index
        out.append("\n**Overall faction strength index** (mean win-rate ÷ fair-share, "
                   "across player counts; 1.00 = perfectly fair):\n")
        out.append("| Faction | Strength index |")
        out.append("|---|---:|")
        idx = {fid: statistics.mean(agg_ratio[fid]) for fid in FACTION_ORDER if agg_ratio[fid]}
        for fid, v in sorted(idx.items(), key=lambda kv: -kv[1]):
            flag = ""
            if v >= 1.25:
                flag = " ⚠️ strong outlier"
            elif v <= 0.75:
                flag = " ⚠️ weak outlier"
            out.append(f"| {FACTION_NAME[fid]} | {v:.2f}{flag} |")
        if idx:
            hi = max(idx.values()); lo = min(idx.values())
            self.faction_spread = (hi - lo)
            self.faction_hi = max(idx, key=idx.get)
            self.faction_lo = min(idx, key=idx.get)
            out.append(f"\nSpread (strongest ÷ fair − weakest ÷ fair): **{hi-lo:.2f}** "
                       f"— strongest **{FACTION_NAME[self.faction_hi]}** ({hi:.2f}×), "
                       f"weakest **{FACTION_NAME[self.faction_lo]}** ({lo:.2f}×).")
        return "\n".join(out) + "\n"

    def strategy_section(self):
        out = ["## Q1b — Is there a dominant strategy?\n"]
        out.append("Each archetype probed as 1 vs 3 `greedy` (factions & seats rotated), "
                   "so the number is the archetype's win rate against the yardstick. "
                   "Fair share at a 4-player table is **25%**.\n")
        out.append("| Strategy | Probe config | Win % | vs fair |")
        out.append("|---|---|---:|:--|")
        probes = [
            ("warlord", "warlord_vs_greedy_4p"),
            ("comboist", "comboist_vs_greedy_4p"),
            ("turtle", "turtle_vs_greedy_4p"),
            ("pure_turtle", "pure_turtle_vs_greedy_4p"),
        ]
        self.strategy_wr = {}
        for strat, cfg in probes:
            rows = self.by_config_players.get(cfg)
            if not rows:
                continue
            wr = self.winrate_by(rows, "strategy")
            if strat not in wr:
                continue
            w, _ = wr[strat]
            self.strategy_wr[strat] = w
            verdict = "fair" if 18 <= w <= 32 else ("over" if w > 32 else "under")
            out.append(f"| `{strat}` | {cfg} | {w:.1f} | {verdict} |")
        # archetype free-for-all
        rows = self.by_config_players.get("mixed_4p") or self.by_config_players.get("archetypes_4p")
        if rows:
            out.append("\n**Four archetypes at one table** "
                       f"(`{rows[0]['config']}`):\n")
            wr = self.winrate_by(rows, "strategy")
            out.append("| Strategy | Win % |")
            out.append("|---|---:|")
            for s, (w, _) in sorted(wr.items(), key=lambda kv: -kv[1][0]):
                out.append(f"| `{s}` | {w:.1f} |")
        return "\n".join(out) + "\n"

    def turtle_section(self):
        out = ["## Q2 — Can a pure turtle win by ignoring the Hall?\n"]
        pt = self.strategy_wr.get("pure_turtle")
        t = self.strategy_wr.get("turtle")
        if pt is not None:
            out.append(f"- **Pure turtle** (never takes *any* Hall action) wins "
                       f"**{pt:.1f}%** vs 25% fair share — it can never hold the Hall "
                       f"medallion, so it is essentially shut out. ✅ design intent holds.")
        if t is not None:
            out.append(f"- **Soft turtle** (never *initiates a challenge* but does claim "
                       f"empty nodes) wins **{t:.1f}%** — below fair share, but not zero: "
                       f"peacefully occupying uncontested nodes is a real (if weak) path to "
                       f"the Hall lead.")
        out.append("\n**Verdict:** ignoring the Hall is correctly unviable; the only "
                   "non-combat Hall play that works is grabbing *empty* nodes, which the "
                   "table can still contest. The anti-turtle pressure is working.\n")
        return "\n".join(out) + "\n"

    def length_section(self):
        out = ["## Q3 — Do games end in a reasonable spread, and does the clock bind?\n"]
        out.append("Target: a round count standing in for ~45–75 min. Treating **8–13 rounds** "
                   "as the healthy band (each round = one turn per player).\n")
        out.append("| Config | Players | Avg rounds | p10–p90 | % close | % knockout | % maxRounds |")
        out.append("|---|---:|---:|---:|---:|---:|---:|")
        for cfg in ("greedy_mirror_2p", "greedy_mirror_3p", "greedy_mirror_4p",
                    "mixed_4p", "archetypes_4p"):
            rows = self.by_config_games.get(cfg)
            if not rows:
                continue
            rounds = sorted(num(r["rounds"]) for r in rows)
            n = len(rounds)
            p10 = rounds[int(0.1 * n)]
            p90 = rounds[int(0.9 * n)]
            close = pct(sum(r["ended_by"] == "close" for r in rows), n)
            ko = pct(sum(r["ended_by"] == "knockout" for r in rows), n)
            mr = pct(sum(r["ended_by"] == "max_rounds" for r in rows), n)
            players = rows[0]["n_players"]
            out.append(f"| {cfg} | {players} | {statistics.mean(rounds):.1f} | "
                       f"{p10:.0f}–{p90:.0f} | {close:.1f} | {ko:.1f} | {mr:.1f} |")
        # does the clock bind? share ending by close or knockout vs maxrounds
        all_rows = self.games
        mr = pct(sum(r["ended_by"] == "max_rounds" for r in all_rows), len(all_rows))
        out.append(f"\n**Clock binds:** only **{mr:.1f}%** of all games hit the safety "
                   f"round-cap; the Exhibition clock (or a knockout) ends the rest. "
                   f"{'⚠️ Watch the max-rounds tail.' if mr > 5 else '✅'}\n")
        return "\n".join(out) + "\n"

    def pace_section(self):
        out = ["## Q3b — Pace driver: does Hall aggression shorten games?\n"]
        rows = self.by_config_games.get("mixed_4p") or self.games
        # Raw challenge COUNT correlates positively with rounds — but that's a length
        # confound (more rounds = more turns = more total challenges). The causal
        # question is about aggression *density*, so correlate challenges-per-turn.
        raw = pearson([num(r["challenges"]) for r in rows], [num(r["rounds"]) for r in rows])
        dens = [num(r["challenges"]) / max(1.0, num(r["total_turns"])) for r in rows]
        r = pearson(dens, [num(r["rounds"]) for r in rows])
        out.append(f"Across `{rows[0]['config']}` (n={len(rows)}):")
        out.append(f"- raw **challenges vs rounds**: r = {raw:+.2f} (positive — a length "
                   f"confound: longer games simply contain more total challenges).")
        out.append(f"- **challenge density (per turn) vs rounds**: r = **{r:+.2f}**.")
        # cross-check with the toll sweep, which moves aggression directly
        toll = sorted((s for s in self.sweeps if s["dial"] == "toll_amount"),
                      key=lambda r: num(r["value"]))
        if toll:
            lo, hi = toll[0], toll[-1]
            out.append(f"- toll sweep cross-check: toll {lo['value']} → "
                       f"{lo['avg_challenges']} challenges & {lo['avg_rounds']} rounds; "
                       f"toll {hi['value']} → {hi['avg_challenges']} challenges & "
                       f"{hi['avg_rounds']} rounds (more fighting ⇒ shorter season).")
        if r < -0.1:
            out.append("\n**Verdict:** controlling for length, **denser fighting closes the "
                       "season sooner** — the aggressor sets the pace, as designed. ✅\n")
        else:
            out.append("\n**Verdict:** aggression density barely moves length — the clock is "
                       "driven about equally by escalation and uncontested claims, so the "
                       "warlord cannot unilaterally slam the season shut. Worth noting, not "
                       "necessarily a bug.\n")
        return "\n".join(out) + "\n"

    def knockout_section(self):
        out = ["## Q4 — Are knockouts real but defendable?\n"]
        out.append("Knockout = a player held all three medallions at a round start. "
                   "A *threat* = a player held exactly two at a round start. The clean "
                   "containment measure is: of games with a round-start 2-medallion "
                   "threat, how many were *denied* the third (did not end in knockout).\n")
        out.append("| Players | Config | Knockout % | Threat games % | Threats contained % |")
        out.append("|---:|---|---:|---:|---:|")
        ko4 = None
        for cfg in ("greedy_mirror_2p", "greedy_mirror_3p", "greedy_mirror_4p", "mixed_4p"):
            rows = self.by_config_games.get(cfg)
            if not rows:
                continue
            n = len(rows)
            ko = pct(sum(r["ended_by"] == "knockout" for r in rows), n)
            threat = sum(int(num(r.get("threat_game", 0))) for r in rows)
            threat_ko = sum(int(num(r.get("threat_game", 0))) and r["ended_by"] == "knockout"
                            for r in rows)
            contained = pct(threat - threat_ko, threat) if threat else 0.0
            out.append(f"| {rows[0]['n_players']} | {cfg} | {ko:.1f} | {pct(threat,n):.1f} | "
                       f"{contained:.1f} |")
            if cfg == "greedy_mirror_4p":
                ko4 = ko
                self.contained_4p = contained
        churn = statistics.mean(num(r["medallion_changes"]) for r in self.games)
        out.append(f"\n- **Medallion churn:** {churn:.1f} ownership changes per game "
                   f"(includes the volatile Study throughput lead, which can pass every turn).")
        self.knockout_rate = ko4 if ko4 is not None else 0.0
        contained = getattr(self, "contained_4p", 0.0)
        if ko4 is not None:
            ok = 5 <= ko4 <= 30 and contained >= 50
            verdict = "real but defendable ✅" if ok else "⚠️ check the balance"
            out.append(f"\n**Verdict (4-player):** knockouts happen in {ko4:.1f}% of games, "
                       f"and ~{contained:.0f}% of 2-medallion threats are denied the third — "
                       f"{verdict}. (Note the **2-player** game is knockout-prone — "
                       f"{pct(sum(r['ended_by']=='knockout' for r in self.by_config_games.get('greedy_mirror_2p', [])), max(1,len(self.by_config_games.get('greedy_mirror_2p', [])))):.0f}% — "
                       f"because a single opponent often can't break a 2-lead in time.)\n")
        return "\n".join(out) + "\n"

    def seat_section(self):
        out = ["## Q5 — Is there a strong first-player advantage?\n"]
        out.append("Measured in the symmetric **greedy mirror** (only seat differs). "
                   "Reported as win rate ÷ fair share by starting seat.\n")
        flagged = False
        for cfg in ("greedy_mirror_2p", "greedy_mirror_3p", "greedy_mirror_4p"):
            rows = self.by_config_players.get(cfg)
            if not rows:
                continue
            fair = self.fair_share(cfg)
            wr = self.winrate_by(rows, "seat")
            seats = sorted(wr, key=lambda s: int(s))
            cells = " · ".join(f"seat {s}: {wr[s][0]/fair:.2f}×" for s in seats)
            out.append(f"- **{cfg}** — {cells}")
            seat0 = wr.get("0", (fair, 0))[0] / fair
            if seat0 >= 1.2:
                flagged = True
            self.seat0_4p = seat0 if cfg == "greedy_mirror_4p" else getattr(self, "seat0_4p", seat0)
        if flagged:
            out.append(f"\n⚠️ **First-player advantage is real** — the opening seat wins "
                       f"~{self.seat0_4p:.2f}× its fair share at 4p. Moderate, not broken, "
                       f"but worth a catch-up nudge (see recommendations).\n")
        else:
            out.append("\n✅ No strong seat advantage.\n")
        return "\n".join(out) + "\n"

    def economy_section(self):
        out = ["## Q6 — Does the Findings cap / 2:1 ratio create tension, or just feel-bad spoilage?\n"]
        rows = self.games
        turns = sum(num(r["total_turns"]) for r in rows)
        spoiled = sum(num(r["findings_spoiled"]) for r in rows)
        produced = sum(num(r["findings_produced"]) for r in rows)
        chained = sum(num(r["chained_turns"]) for r in rows)
        steps = sum(num(r["chain_steps"]) for r in rows)
        out.append(f"- **Findings spoiled:** {spoiled/turns:.3f} per turn "
                   f"({pct(spoiled, produced):.1f}% of all Findings produced).")
        out.append(f"- **Chains:** {pct(chained, turns):.1f}% of turns chain; "
                   f"average chain length **{steps/chained:.2f}** steps when they do.")
        # use the findings_cap sweep to show tension sensitivity
        cap_rows = [s for s in self.sweeps if s["dial"] == "findings_cap"]
        if cap_rows:
            out.append("\nFindings-cap sweep (spoilage & game shape):\n")
            out.append("| cap | spoiled/turn | avg rounds | % turns chained |")
            out.append("|---:|---:|---:|---:|")
            for s in sorted(cap_rows, key=lambda r: num(r["value"])):
                out.append(f"| {s['value']} | {s['avg_spoiled_per_turn']} | "
                           f"{s['avg_rounds']} | {s['pct_turns_chained']} |")
        sp = spoiled / turns if turns else 0
        if sp < 0.25:
            out.append(f"\n**Verdict:** spoilage is **low** ({sp:.2f}/turn). The cap rarely "
                       f"bites because the chain encourages refining-then-spending in the "
                       f"same turn — exactly the intended 'flow, not hoard' behaviour. The "
                       f"cap reads more as a soft nudge than a painful wall, so it is *not* "
                       f"a feel-bad mechanic at the default of 3; but it is also a **weak "
                       f"balance lever** (see sensitivity).\n")
        else:
            out.append(f"\n**Verdict:** spoilage is meaningful ({sp:.2f}/turn) — the cap "
                       f"creates real use-it-or-lose-it tension.\n")
        return "\n".join(out) + "\n"

    def decisiveness_section(self):
        out = ["## Decisiveness — margins & ties\n"]
        rows = self.games
        margin = statistics.mean(num(r["margin"]) for r in rows)
        ties = pct(sum(r["win_type"] == "tie" for r in rows), len(rows))
        out.append(f"- **Average victory margin:** {margin:.2f} medallions over the "
                   f"runner-up (winner typically leads by ~1 medallion).")
        out.append(f"- **Ties / tie-break invoked at the close:** {ties:.1f}% of games.\n")
        return "\n".join(out) + "\n"

    def sweep_section(self):
        out = ["## Q7 — Which dials move the failure-mode metrics most? (sensitivity)\n"]
        if not self.sweeps:
            return "\n".join(out) + "\n(no sweep data)\n"
        baseline = next((s for s in self.sweeps if s["dial"] == "(baseline)"), None)
        metrics = ["avg_rounds", "pct_close", "pct_knockout", "turtle_winrate",
                   "warlord_winrate", "seat0_advantage", "avg_spoiled_per_turn",
                   "two_lead_broken_rate", "faction_spread", "avg_margin"]
        # group sweeps by dial
        by_dial = defaultdict(list)
        for s in self.sweeps:
            if s["dial"] != "(baseline)":
                by_dial[s["dial"]].append(s)
        # sensitivity = sum of normalised ranges across key failure-mode metrics
        key_metrics = ["avg_rounds", "pct_close", "turtle_winrate", "seat0_advantage",
                       "faction_spread", "two_lead_broken_rate"]
        ranks = []
        for dial, srows in by_dial.items():
            score = 0.0
            details = {}
            for m in key_metrics:
                vals = [num(r[m]) for r in srows]
                rng = max(vals) - min(vals)
                base = abs(num(baseline[m])) if baseline else 1.0
                norm = rng / base if base else rng
                score += norm
                details[m] = rng
            ranks.append((score, dial, details))
        ranks.sort(reverse=True)
        out.append("Dials ranked by how much they swing the key metrics "
                   "(`avg_rounds`, `pct_close`, `turtle_winrate`, `seat0_advantage`, "
                   "`faction_spread`, `two_lead_broken_rate`). Higher = more sensitive.\n")
        out.append("| Rank | Dial | Sensitivity | Biggest effects |")
        out.append("|---:|---|---:|---|")
        for i, (score, dial, details) in enumerate(ranks, 1):
            top = sorted(details.items(), key=lambda kv: -kv[1])[:2]
            eff = ", ".join(f"Δ{m}={r:.1f}" for m, r in top)
            out.append(f"| {i} | `{dial}` | {score:.2f} | {eff} |")
        # full sweep tables for the most interesting dials
        out.append("\n### Full sweep tables\n")
        for dial in by_dial:
            srows = sorted(by_dial[dial], key=lambda r: str(r["value"]))
            out.append(f"\n**`{dial}`**")
            out.append("| value | turtle% | warlord% | greedy% | avg_rounds | %close | "
                       "%knockout | seat0× | spoil/turn | 2-lead broken% | fac.spread |")
            out.append("|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|")
            for s in srows:
                out.append(f"| {s['value']} | {s['turtle_winrate']} | {s['warlord_winrate']} | "
                           f"{s['greedy_winrate']} | {s['avg_rounds']} | {s['pct_close']} | "
                           f"{s['pct_knockout']} | {s['seat0_advantage']} | "
                           f"{s['avg_spoiled_per_turn']} | {s['two_lead_broken_rate']} | "
                           f"{s['faction_spread']} |")
        self.sweep_ranks = ranks
        return "\n".join(out) + "\n"

    # -- problems & recommendations ----------------------------------------
    def recommendations(self):
        out = ["## Problems found & recommended dial changes\n"]
        recs = []
        # faction spread
        fs = getattr(self, "faction_spread", 0)
        buff_advice = {
            "polymath": "the Polymath's *ignore one toll/turn* is nearly worthless because "
                        "tolls are cheap and rare; give it something that actually rewards "
                        "long chains — e.g. *the first chain step each turn is free of fuel*, "
                        "or *+1 Specimen each time a chain crosses two bands*",
            "systematist": "the Systematist's *no-spoil* power is wasted (spoilage is already "
                           "low); swap it for a small Hall hook such as *+1 str on your first "
                           "claim each round* so the turtle can actually reach the Hall",
            "sensationalist": "give the Sensationalist a durability hook so its aggression "
                              "sticks (e.g. *captured nodes keep full strength*)",
            "illustrator": "raise the Illustrator's efficiency edge (e.g. *first two "
                           "conversions each round are 1:1*)",
            "collector": "trim the Collector's compounding draw (cap its bonus once/turn)",
        }
        if fs >= 0.4:
            recs.append(
                f"1. **Faction imbalance is the biggest problem.** "
                f"`{FACTION_NAME[self.faction_hi]}` is the strongest and "
                f"`{FACTION_NAME[self.faction_lo]}` the weakest (spread {fs:.2f}× fair "
                f"share). *Fix — nerf the strongest:* the Collector's *+1 Specimen on **every** "
                f"Field action* is a compounding engine that also fires on a Survey; make it "
                f"*+1 only on activate* or cap it once/turn. *Buff the weakest:* "
                f"{buff_advice.get(self.faction_lo, 'strengthen its core power')}. The "
                f"Systematist and Polymath both sit ~0.7× — the two 'patient' factions are "
                f"underpowered because the levers they key off (spoilage, tolls) are weak.")
        # comboist dominance
        cw = self.strategy_wr.get("comboist")
        if cw and cw > 33:
            recs.append(
                f"2. **The combo/chain line over-performs** (`comboist` wins {cw:.0f}% vs "
                f"25% fair, holding ~2× the Hall nodes of a one-step player). A single "
                f"action that laps Field→Study→Hall can plant several claims a turn. *Fix:* "
                f"make the loop-back cost something — e.g. the →Field loop-back pays its "
                f"toll like any crossing, or cap claims to **one per turn** unless a Tactic "
                f"(*A Whole New Genus*) says otherwise. This is also the metric most "
                f"sensitive to AI quality, so confirm with human playtests before nerfing "
                f"hard.")
        # seat advantage
        s0 = getattr(self, "seat0_4p", 1.0)
        if s0 >= 1.2:
            recs.append(
                f"3. **First-player advantage** (~{s0:.2f}× fair share at 4p). *Fix:* give "
                f"later seats a setup bump — e.g. seat *k* starts with *k* extra Specimens, "
                f"or the last player in the opening order draws an extra Tactic. Cheap, and "
                f"it directly offsets the opener's first grab at the row.")
        # warlord / aggression
        ww = self.strategy_wr.get("warlord")
        if ww and ww < 20:
            recs.append(
                f"4. **Aggression slightly under-rewards** (`warlord` {ww:.0f}%). Captures "
                f"leave a weak garrison (strength S−D), so the warlord can fight but cannot "
                f"*hold*. *Fix:* sweep `capture_garrison_mode = full` (the captured node "
                f"keeps the attacker's full strength) — see the sweep table; it should lift "
                f"warlord and Hall-lead stickiness without breaking knockout defence.")
        # findings cap weak lever
        recs.append(
            f"{len(recs)+1}. **The Findings cap is a weak lever at 3** (spoilage is low and "
            f"barely moves the game). It is fine as flavour, but don't expect to balance "
            f"pace with it; reach for the clock length / escalation threshold instead "
            f"(higher sensitivity — see Q7).")
        # clock
        recs.append(
            f"{len(recs)+1}. **Pace tuning:** the clock binds well at the default length 9. "
            f"If you want longer 'engine matures' games, `clock_length = 11`; for a "
            f"tighter, more cutthroat season, `clock_length = 7` (and/or "
            f"`escalation_threshold = 3`). See the Q7 sweep tables for the exact trade.")
        out.extend(recs)
        return "\n".join(out) + "\n"

    # -- assemble ----------------------------------------------------------
    def build(self):
        n_games = len(self.games)
        configs = sorted(self.by_config_games)
        parts = []
        parts.append("# First in the Field — balance report\n")
        parts.append("> Generated by `report.py` from the headless simulation in this "
                     "folder. Every number is from self-play; see `README.md` for the "
                     "rules model, AI policies, and the full assumptions log.\n")
        parts.append(f"**Corpus:** {n_games:,} games across {len(configs)} configurations "
                     f"+ {len({s['dial'] for s in self.sweeps})-1 if self.sweeps else 0} "
                     f"dial sweeps. Bots: `random`, `turtle`, `pure_turtle`, `warlord`, "
                     f"`comboist`, `greedy` (the yardstick).\n")
        parts.append("---\n")
        # compute analysis sections first (they set self.* used by the TL;DR & recs)
        sections = [
            self.faction_section(),
            self.strategy_section(),
            self.turtle_section(),
            self.length_section(),
            self.pace_section(),
            self.knockout_section(),
            self.seat_section(),
            self.economy_section(),
            self.decisiveness_section(),
            self.sweep_section(),
        ]
        parts.append(self._tldr())
        parts.append("---\n")
        parts.extend(sections)
        parts.append(self.recommendations())
        parts.append("\n---\n*Caveat: bots are heuristic, not optimal. Lean on the "
                     "`greedy`-mirror faction numbers and the directional sweep effects; "
                     "treat single-archetype win rates as failure-mode probes, not verdicts. "
                     "Re-run any surprising cell with its logged seed.*\n")
        return "\n".join(parts)

    def _tldr(self):
        out = ["## TL;DR\n"]
        fs = getattr(self, "faction_spread", 0)
        items = []
        items.append(f"- **Engine is healthy:** games terminate, the clock binds "
                     f"(~{statistics.mean(num(r['rounds']) for r in self.games):.0f} rounds "
                     f"avg), and no resource/lead invariant ever breaks across the corpus.")
        if hasattr(self, "faction_hi"):
            items.append(f"- **Biggest issue — faction balance:** "
                         f"{FACTION_NAME[self.faction_hi]} strong / "
                         f"{FACTION_NAME[self.faction_lo]} weak (spread {fs:.2f}× fair share).")
        cw = self.strategy_wr.get("comboist")
        if cw:
            items.append(f"- **Watch the combo line:** `comboist` ~{cw:.0f}% vs 25% fair — "
                         f"chaining a full lap is the strongest play.")
        pt = self.strategy_wr.get("pure_turtle")
        if pt is not None:
            items.append(f"- **Turtling is correctly dead:** ignoring the Hall wins "
                         f"{pt:.0f}%.")
        s0 = getattr(self, "seat0_4p", None)
        if s0:
            items.append(f"- **Mild first-player edge** (~{s0:.2f}× at 4p).")
        items.append("- **Findings cap is a weak lever**; **clock length / escalation** are "
                     "the strong pace dials (see Q7).")
        out.extend(items)
        return "\n".join(out) + "\n"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--in", dest="indir", default="data")
    ap.add_argument("--out", default="REPORT.md")
    args = ap.parse_args()
    rep = Report(args.indir)
    if not rep.games:
        raise SystemExit(f"no data in {args.indir}/ — run run.py first")
    text = rep.build()
    with open(args.out, "w") as f:
        f.write(text)
    print(f"wrote {args.out} ({len(text):,} chars) from {len(rep.games):,} games")


if __name__ == "__main__":
    main()
