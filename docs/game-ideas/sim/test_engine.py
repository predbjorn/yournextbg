"""Focused unit tests for the *First in the Field* rules engine.

Stdlib only — run directly (`python3 test_engine.py`) or under pytest. These pin
the mechanics that the balance numbers depend on (conversion ratios, capture
modes, tolls, spoilage, lead maths, knockout, clock). The fuzz/invariant pass
lives in `run.py selftest`.
"""

from __future__ import annotations

import cards as C
from engine import Game, Dials, Action, NodeState
from ai import make_policy


def new_game(n=2, factions=None, strategies=None, seed=0, **dials):
    factions = factions or ["collector"] * n
    strategies = strategies or ["greedy"] * n
    facs = [C.FACTION_BY_ID[f] for f in factions]
    pols = [make_policy(s, seed * 10 + i) for i, s in enumerate(strategies)]
    d = Dials(n_players=n)
    for k, v in dials.items():
        setattr(d, k, v)
    return Game(d, facs, strategies, pols, seed=seed, checks=False)


# --- deck / data -----------------------------------------------------------
def test_deck_composition():
    deck = C.build_engine_deck()
    assert len(deck) == 50, len(deck)
    by_band = {b: sum(1 for cid in deck if C.CARD_BY_ID[cid].band == b) for b in C.BANDS}
    assert by_band == {"field": 18, "study": 17, "hall": 15}, by_band
    assert len(C.build_tactic_deck()) == 16
    assert len(C.ENGINE_CARDS) == 26 and len(C.TACTICS) == 8 and len(C.FACTIONS) == 5


def test_starters_separate_from_deck():
    # every player owns one of each starter, and the deck still holds draftable copies
    g = new_game(n=4)
    for p in g.players:
        assert p.tableau["field"] == ["collecting_trip"]
        assert p.tableau["study"] == ["field_notes"]
        assert p.tableau["hall"] == ["present_a_paper"]
    # 3 copies of each Tier I remain available across row+deck
    pool = g.deck + g.row
    assert pool.count("collecting_trip") == 3


# --- conversions -----------------------------------------------------------
def test_conversion_ratios():
    g = new_game()
    p = g.players[0]
    # Field Notes: 2:1, cap 2 in -> feeding 4 still makes only 1 (eats 2)
    p.specimens, p.findings, p.throughput_now = 4, 0, 0
    g._do_study(p, Action("study", "field_notes", spend=4), is_chain=False)
    assert p.findings == 1 and p.specimens == 2, (p.findings, p.specimens)

    # Classify: 1:1 up to 4
    p.tableau["study"].append("classify")
    p.specimens, p.findings, p.throughput_now = 4, 0, 0
    g._do_study(p, Action("study", "classify", spend=4), is_chain=False)
    assert p.findings == 4 and p.specimens == 0

    # Dissection Bench: 3 -> 2
    p.tableau["study"].append("dissection_bench")
    p.specimens, p.findings, p.throughput_now = 3, 0, 0
    g._do_study(p, Action("study", "dissection_bench", spend=3), is_chain=False)
    assert p.findings == 2 and p.specimens == 0


def test_oneshot_1to1_consumed_once_per_round():
    g = new_game(factions=["illustrator", "collector"])
    p = g.players[0]  # Illustrator: first conversion 1:1 each round
    p.tableau["study"] = ["field_notes"]  # base 2:1
    p.specimens, p.findings, p.throughput_now = 4, 0, 0
    g._do_study(p, Action("study", "field_notes", spend=4), is_chain=False)
    # 1:1 this time -> feed min(4,cap2)=2 at 1:1 -> 2 findings
    assert p.findings == 2, p.findings
    assert p.used_first_conv_round
    p.specimens, p.findings, p.throughput_now = 4, 0, 0
    g._do_study(p, Action("study", "field_notes", spend=4), is_chain=False)
    assert p.findings == 1  # back to 2:1


# --- capture modes ---------------------------------------------------------
def _attack(mode):
    g = new_game(factions=["collector", "collector"], capture_garrison_mode=mode,
                 tactics_enabled=False)
    for p in g.players:
        p.hand = []
    g.nodes["botany"] = NodeState(owner=1, strength=2, sealed=False)
    p0 = g.players[0]
    p0.tableau["hall"].append("contested_genus")  # str = Findings, uncapped
    p0.findings = 5
    g._do_hall(p0, Action("hall", "contested_genus", "botany", spend=5), is_chain=False)
    return g.nodes["botany"]


def test_capture_excess_vs_full():
    n_excess = _attack("excess")
    assert n_excess.owner == 0 and n_excess.strength == 3, n_excess  # 5 - 2
    n_full = _attack("full")
    assert n_full.owner == 0 and n_full.strength == 5, n_full


def test_equal_strength_mutual_destruction():
    g = new_game(factions=["collector", "collector"], tactics_enabled=False)
    for p in g.players:
        p.hand = []
    g.nodes["botany"] = NodeState(owner=1, strength=3, sealed=False)
    p0 = g.players[0]
    p0.tableau["hall"].append("contested_genus")
    p0.findings = 3
    trig = g._do_hall(p0, Action("hall", "contested_genus", "botany", spend=3), is_chain=False)
    assert g.nodes["botany"].owner is None and g.nodes["botany"].strength == 0
    assert trig is None  # chain ends on a clash


# --- tolls -----------------------------------------------------------------
def test_toll_on_chain_step():
    g = new_game(factions=["collector", "collector"])
    p0 = g.players[0]
    p0.specimens = 5
    assert g.leads["study"] != 0          # P0 does not lead the Study
    assert g._pay_toll(p0, "study", is_chain=True) and p0.specimens == 4
    # no toll on the opening (paid) action by default
    p0.specimens = 5
    assert g._pay_toll(p0, "study", is_chain=False) and p0.specimens == 5


def test_polymath_waives_one_toll_per_turn():
    g = new_game(factions=["polymath", "collector"])
    p0 = g.players[0]
    p0.specimens = 5
    p0.used_polymath_toll = False
    assert g._pay_toll(p0, "study", is_chain=True) and p0.specimens == 5  # waived free
    assert g._pay_toll(p0, "study", is_chain=True) and p0.specimens == 4  # 2nd pays


# --- spoilage --------------------------------------------------------------
def test_findings_spoil_at_cap():
    g = new_game(factions=["collector", "collector"])
    p0 = g.players[0]
    p0.findings = 6
    g._end_turn(p0)
    assert p0.findings == 3 and g.m.findings_spoiled >= 3


def test_systematist_never_spoils():
    g = new_game(factions=["systematist", "collector"])
    p0 = g.players[0]
    p0.findings = 6
    g._end_turn(p0)
    assert p0.findings == 6


# --- leads -----------------------------------------------------------------
def test_field_collection_and_double():
    g = new_game(factions=["collector", "collector"])
    p0 = g.players[0]
    assert g.field_collection(p0) == 1            # one Tier-I starter
    p0.tableau["field"].append("royal_patronage")  # Tier III, counts double => +6
    assert g.field_collection(p0) == 7


def test_hall_lead_tiebreak_by_strength():
    g = new_game()
    g.nodes["botany"] = NodeState(0, 5, False)
    g.nodes["entomology"] = NodeState(1, 3, False)
    assert g.leads_hall() == 0          # tie on count (1 each) -> higher strength wins


def test_study_lead_needs_throughput():
    g = new_game()
    for p in g.players:
        p.throughput_last = 0
    assert g.leads_study() is None       # nobody produced -> unowned
    g.players[1].throughput_last = 3
    assert g.leads_study() == 1


# --- knockout / clock ------------------------------------------------------
def test_knockout_detection():
    g = new_game()
    g.leads = {"field": 0, "study": 0, "hall": 0}
    assert g._knockout_winner() == 0
    g.leads = {"field": 0, "study": 1, "hall": 0}
    assert g._knockout_winner() is None


def test_challenge_ticks_clock():
    g = new_game(factions=["collector", "collector"], tactics_enabled=False)
    for p in g.players:
        p.hand = []
    g.nodes["botany"] = NodeState(1, 1, False)
    p0 = g.players[0]
    p0.tableau["hall"].append("contested_genus")
    p0.findings = 3
    c0 = g.clock
    g._do_hall(p0, Action("hall", "contested_genus", "botany", spend=3), is_chain=False)
    assert g.clock == c0 + 1            # one resolved challenge below escalation


def test_escalation_extra_tick():
    g = new_game(factions=["collector", "collector"], tactics_enabled=False,
                 escalation_threshold=1)
    for p in g.players:
        p.hand = []
    p0 = g.players[0]
    p0.tableau["hall"].append("contested_genus")
    p0.findings = 3
    c0 = g.clock                         # clock starts at 1 >= threshold 1
    # present on an EMPTY node -> successful uncontested claim -> escalation +1 only
    g._do_hall(p0, Action("hall", "contested_genus", "botany", spend=3), is_chain=False)
    assert g.nodes["botany"].owner == 0
    assert g.clock == c0 + 1, g.clock


# --- claim validity --------------------------------------------------------
def test_zero_strength_claim_fizzles():
    g = new_game(factions=["collector", "collector"])
    p0 = g.players[0]
    p0.findings = 0
    g._do_hall(p0, Action("hall", "present_a_paper", "botany", spend=0), is_chain=False)
    assert g.nodes["botany"].owner is None


# --- integration: pure turtle never holds a Hall node ----------------------
def test_pure_turtle_holds_no_nodes():
    for seed in range(40):
        g = new_game(n=4, factions=["systematist", "collector", "illustrator", "sensationalist"],
                     strategies=["pure_turtle", "greedy", "greedy", "greedy"], seed=seed)
        g.play()
        held = sum(1 for nd in g.nodes.values() if nd.owner == 0)
        assert held == 0, f"pure_turtle held {held} nodes (seed {seed})"


def test_games_terminate_with_winner():
    for seed in range(60):
        g = new_game(n=4, strategies=["turtle", "warlord", "comboist", "greedy"],
                     factions=["systematist", "sensationalist", "polymath", "collector"],
                     seed=seed, checks=True)
        m = g.play()
        assert m.winner is not None
        assert m.rounds <= g.d.max_rounds


# --- runner ---------------------------------------------------------------
def _run_all():
    tests = [v for k, v in sorted(globals().items())
             if k.startswith("test_") and callable(v)]
    passed = 0
    for t in tests:
        t()
        print(f"  ok  {t.__name__}")
        passed += 1
    print(f"\n{passed}/{len(tests)} tests passed")


if __name__ == "__main__":
    _run_all()
