"""Rules engine for *First in the Field* — headless, deterministic, self-checking.

Implements the full game from ``first-in-the-field-rules.html``: the three bands,
the chain/toll system, Findings spoilage, the Hall's open/sealed claims and
challenge resolution (with hidden information and Tactics), the Exhibition clock,
instant lead recomputation, the knockout, and close-scoring.

Every provisional value lives in :class:`Dials` so a designer can turn a knob and
re-run.  Interpretations of ambiguous rules are flagged with ``# ASSUMPTION`` and
collected in ``README.md``.

The engine is policy-driven: a :class:`Policy` (see ``ai.py``) is asked to pick
among engine-generated legal :class:`Action` objects for the opening action and
each chain step.  Tactic play during challenges is resolved by lightweight
heuristics (documented) so the policy surface stays small.
"""

from __future__ import annotations

import random
from dataclasses import dataclass, field, replace
from typing import Optional

import cards as C


# ---------------------------------------------------------------------------
# Dials — every provisional number, exposed for sweeps.
# ---------------------------------------------------------------------------

@dataclass
class Dials:
    n_players: int = 4
    findings_cap: int = 3
    field_row_size: int = 6
    start_specimens: int = 3
    start_tactics: int = 1
    toll_amount: int = 1
    clock_length: int = 9            # numbered spaces; CLOSE = clock_length + 1
    escalation_threshold: int = 5    # from this clock space, successful claims +1 extra
    extra_ratio_steps: int = 0       # global conversion improvement (in_per -= n), >=1 better
    build_cost_override: Optional[dict] = None   # {tier: cost} to override card costs
    deck_copies: Optional[dict] = None           # {tier: n}
    tactic_copies: int = C.TACTIC_COPIES
    # documented interpretation switches
    capture_garrison_mode: str = "excess"   # 'excess' (S-D) | 'full' (S)
    toll_on_paid_action: bool = False        # toll applies only to chained steps by default
    # --- proposed faction rebalance (off by default; see REBALANCE.md) ---
    collector_activate_only: bool = False    # Collector +1 Specimen only on activate, not survey
    polymath_chain_specimen: bool = False    # Polymath +1 Specimen per chain step (combo reward)
    systematist_first_claim_str: bool = False  # Systematist +1 str on first claim each round
    specimen_cap: Optional[int] = None       # None = stockpile freely (rulebook); int = hard cap
    study_lead_min_throughput: int = 1       # min last-turn Findings to hold the Study lead
    tactics_enabled: bool = True
    # safety backstops (guarantee termination)
    max_rounds: int = 40
    max_chain_steps: int = 40

    @property
    def close_space(self) -> int:
        return self.clock_length + 1

    def card_cost(self, card: C.Card) -> int:
        if self.build_cost_override and card.tier in self.build_cost_override:
            return self.build_cost_override[card.tier]
        return card.cost


# ---------------------------------------------------------------------------
# Actions
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class Action:
    kind: str                       # survey|field|study|hall|stop|pass
    card_id: Optional[str] = None
    node_id: Optional[str] = None
    spend: int = 0                  # specimens (study) or findings (hall) committed
    from_deck: bool = False         # Hired Guide: drafted off the top of the deck
    sealed: bool = False            # Hall: lodge a sealed claim

    def band(self) -> Optional[str]:
        if self.kind in ("survey", "field"):
            return C.FIELD
        if self.kind == "study":
            return C.STUDY
        if self.kind == "hall":
            return C.HALL
        return None


# ---------------------------------------------------------------------------
# Player & node state
# ---------------------------------------------------------------------------

@dataclass
class Player:
    idx: int
    faction: C.Faction
    strategy: str
    specimens: int = 0
    findings: int = 0
    standing: int = 0
    tableau: dict = field(default_factory=lambda: {C.FIELD: [], C.STUDY: [], C.HALL: []})
    hand: list = field(default_factory=list)   # tactic ids
    throughput_last: int = 0
    throughput_now: int = 0
    start_seat: int = 0
    # per-round / per-turn / per-game one-shot flags (reset by the engine)
    used_first_field_action: bool = False
    used_first_conv_round: bool = False
    used_first_conv_season: bool = False
    used_first_build_cheaper: bool = False
    used_polymath_toll: bool = False
    used_tollgate: bool = False
    used_borrowed_toll: bool = False
    used_first_claim_bonus: bool = False

    def has_passive(self, flag: str) -> bool:
        for band in C.BANDS:
            for cid in self.tableau[band]:
                if flag in C.CARD_BY_ID[cid].passives:
                    return True
        return False

    def has_faction(self, power: str) -> bool:
        return power in self.faction.powers

    def all_cards(self):
        for band in C.BANDS:
            for cid in self.tableau[band]:
                yield C.CARD_BY_ID[cid]


@dataclass
class NodeState:
    owner: Optional[int] = None
    strength: int = 0
    sealed: bool = False


# ---------------------------------------------------------------------------
# Metrics gathered per game
# ---------------------------------------------------------------------------

@dataclass
class Metrics:
    rounds: int = 0
    total_turns: int = 0
    challenges: int = 0
    successful_claims: int = 0
    chained_turns: int = 0
    chain_steps: int = 0
    findings_spoiled: int = 0
    findings_produced: int = 0
    medallion_changes: int = 0
    clock_final: int = 0
    ended_by: str = ""            # knockout|close|max_rounds
    winner: Optional[int] = None
    win_type: str = ""            # knockout|close|tie
    tie_size: int = 1
    # per-player aggregates filled at end
    per_player: dict = field(default_factory=dict)
    # aggression per player (challenges initiated)
    aggression: dict = field(default_factory=dict)
    # whether a 2-medallion lead was reached, and broken before game end
    two_lead_reached: bool = False
    two_lead_broken: bool = False
    # round-start threat: someone began a round holding exactly 2 medallions
    # (a stable knockout threat, unlike the mid-action two_lead_reached churn)
    threat_game: bool = False


# ---------------------------------------------------------------------------
# The game
# ---------------------------------------------------------------------------

class Game:
    def __init__(self, dials: Dials, factions: list, strategies: list,
                 policies: list, seed: int, checks: bool = True):
        assert len(factions) == len(strategies) == len(policies) == dials.n_players
        self.d = dials
        self.rng = random.Random(seed)
        self.seed = seed
        self.checks = checks
        self.players = [
            Player(idx=i, faction=factions[i], strategy=strategies[i])
            for i in range(dials.n_players)
        ]
        self.policies = policies
        self.nodes = {nid: NodeState() for nid in C.NODE_IDS}
        self.clock = 1
        self.leads = {C.FIELD: None, C.STUDY: None, C.HALL: None}
        self.prime = {"microscope": None, "engraver": None}
        self.round = 0
        self.m = Metrics()
        self.log_enabled = False
        self.events: list = []
        self._setup()

    # -- logging ------------------------------------------------------------
    def log(self, msg: str):
        if self.log_enabled:
            self.events.append(msg)

    # -- setup --------------------------------------------------------------
    def _setup(self):
        self.deck = C.build_engine_deck(self.d.deck_copies)
        self.rng.shuffle(self.deck)
        self.tactic_deck = C.build_tactic_deck(self.d.tactic_copies)
        self.rng.shuffle(self.tactic_deck)
        self.row = [self._draw_card() for _ in range(self.d.field_row_size)]
        self.row = [c for c in self.row if c is not None]
        order = list(range(self.d.n_players))
        self.rng.shuffle(order)
        self.priority = order
        for seat, idx in enumerate(order):
            p = self.players[idx]
            p.start_seat = seat
            p.specimens = self.d.start_specimens
            for cid in C.STARTING_CARD_IDS:
                p.tableau[C.CARD_BY_ID[cid].band].append(cid)
            for _ in range(self.d.start_tactics):
                t = self._draw_tactic()
                if t:
                    p.hand.append(t)
        self._recompute_leads()

    def _draw_card(self) -> Optional[str]:
        if not self.deck:
            return None
        return self.deck.pop()

    def _draw_tactic(self) -> Optional[str]:
        if not self.d.tactics_enabled or not self.tactic_deck:
            return None
        return self.tactic_deck.pop()

    # -- derived quantities -------------------------------------------------
    def specimen_cap(self, p: Player) -> Optional[int]:
        if self.d.specimen_cap is None:
            return None
        cap = self.d.specimen_cap
        if p.has_faction("specimen_cap_plus_2"):
            cap += 2
        return cap

    def findings_cap(self, p: Player) -> int:
        cap = self.d.findings_cap
        for c in p.all_cards():
            cap += c.findings_cap_bonus
        if p.has_faction("findings_cap_plus_1"):
            cap += 1
        return cap

    def field_collection(self, p: Player) -> int:
        total = 0
        for cid in p.tableau[C.FIELD]:
            card = C.CARD_BY_ID[cid]
            v = card.tier_value
            if "field_lead_double" in card.passives:
                v *= 2
            total += v
        return total

    def leads_field(self) -> Optional[int]:
        scores = [(self.field_collection(p), -len(p.tableau[C.FIELD]), p.idx)
                  for p in self.players]
        return self._argmax_unique(scores, min_value=1)

    def leads_study(self) -> Optional[int]:
        def tp(p):
            v = p.throughput_last
            if p.has_passive("study_lead_double"):
                v *= 2
            return v
        scores = [(tp(p), 0, p.idx) for p in self.players]
        return self._argmax_unique(scores, min_value=self.d.study_lead_min_throughput)

    def leads_hall(self) -> Optional[int]:
        def nodes_held(idx):
            return sum(1 for n in self.nodes.values() if n.owner == idx)

        def strength_held(idx):
            return sum(n.strength for n in self.nodes.values() if n.owner == idx)
        scores = [(nodes_held(p.idx), strength_held(p.idx), p.idx) for p in self.players]
        return self._argmax_unique(scores, min_value=1)

    @staticmethod
    def _argmax_unique(scores, min_value):
        """scores: list of (primary, tiebreak, idx). Returns idx of unique best, else None."""
        scores = sorted(scores, reverse=True)
        best = scores[0]
        if best[0] < min_value:
            return None
        # unique on (primary, tiebreak)?
        if len(scores) > 1 and scores[1][0] == best[0] and scores[1][1] == best[1]:
            return None
        return best[2]

    def _recompute_leads(self):
        new = {
            C.FIELD: self.leads_field(),
            C.STUDY: self.leads_study(),
            C.HALL: self.leads_hall(),
        }
        for band in C.BANDS:
            if new[band] != self.leads[band]:
                self.m.medallion_changes += 1
        self.leads = new
        # runaway tracking
        for p in self.players:
            held = sum(1 for b in C.BANDS if self.leads[b] == p.idx)
            if held >= 2:
                self.m.two_lead_reached = True

    def medallions_held(self, idx) -> int:
        return sum(1 for b in C.BANDS if self.leads[b] == idx)

    # -- views (hidden information) ----------------------------------------
    def view_for(self, idx: int) -> dict:
        """A redacted snapshot: opponents' sealed claim strengths are hidden."""
        nodes = {}
        for nid, n in self.nodes.items():
            if n.owner is not None and n.owner != idx and n.sealed:
                nodes[nid] = {"owner": n.owner, "strength": None, "sealed": True}
            else:
                nodes[nid] = {"owner": n.owner, "strength": n.strength, "sealed": n.sealed}
        return {
            "me": idx,
            "clock": self.clock,
            "close_space": self.d.close_space,
            "leads": dict(self.leads),
            "nodes": nodes,
            "round": self.round,
            "players": [
                {
                    "idx": p.idx,
                    "specimens": p.specimens,
                    "findings": p.findings,
                    "standing": p.standing,
                    "tableau": {b: list(p.tableau[b]) for b in C.BANDS},
                    "throughput_last": p.throughput_last,
                    "collection": self.field_collection(p),
                    "medallions": self.medallions_held(p.idx),
                    "hand_size": len(p.hand),
                    "hand": list(p.hand) if p.idx == idx else None,
                    "strategy": p.strategy,
                }
                for p in self.players
            ],
        }

    # -- main loop ----------------------------------------------------------
    def play(self) -> Metrics:
        while True:
            self.round += 1
            self._start_round()
            # knockout check at round start
            ko = self._knockout_winner()
            if ko is not None:
                self.m.ended_by = "knockout"
                self.m.win_type = "knockout"
                self.m.winner = ko
                break
            if any(self.medallions_held(p.idx) == 2 for p in self.players):
                self.m.threat_game = True
            for idx in self.priority:
                self._take_turn(self.players[idx])
                self.m.total_turns += 1
            self.m.rounds += 1
            if self.clock >= self.d.close_space:
                self.m.ended_by = "close"
                break
            if self.round >= self.d.max_rounds:
                self.m.ended_by = "max_rounds"
                break
        self._finalize()
        return self.m

    def _knockout_winner(self) -> Optional[int]:
        for p in self.players:
            if self.medallions_held(p.idx) == 3:
                return p.idx
        return None

    def _start_round(self):
        # priority by Standing desc; ties keep previous order
        prev = {idx: pos for pos, idx in enumerate(self.priority)}
        self.priority = sorted(
            range(self.d.n_players),
            key=lambda i: (-self.players[i].standing, prev[i]),
        )
        # release prime tools, reset per-round flags
        self.prime = {"microscope": None, "engraver": None}
        for p in self.players:
            p.used_first_field_action = False
            p.used_first_conv_round = False
            p.used_first_build_cheaper = False
            p.used_first_claim_bonus = False

    # -- a turn -------------------------------------------------------------
    def _take_turn(self, p: Player):
        p.throughput_now = 0
        p.used_polymath_toll = False
        p.used_tollgate = False
        p.used_borrowed_toll = False
        pol = self.policies[p.idx]
        if hasattr(pol, "start_turn"):
            pol.start_turn(self, self.view_for(p.idx))
        options = self._legal_initial(p)
        if not options:
            options = [Action("pass")]
        act = pol.choose_action(self, self.view_for(p.idx), options)
        chained = self._execute(p, act, is_chain=False)
        steps = 0
        while chained is not None and steps < self.d.max_chain_steps:
            band = chained
            opts = self._legal_chain(p, band)
            opts_with_stop = opts + [Action("stop")]
            choice = pol.choose_chain(self, self.view_for(p.idx), opts_with_stop)
            if choice is None or choice.kind == "stop" or not opts:
                break
            self.m.chain_steps += 1
            steps += 1
            if steps == 1:
                self.m.chained_turns += 1
            if self.d.polymath_chain_specimen and p.faction.id == "polymath":
                self._gain_specimens(p, 1)   # proposed buff: reward long laps
            chained = self._execute(p, choice, is_chain=True)
        self._end_turn(p)
        self._recompute_leads()
        if self.checks:
            self._check_invariants()

    def _end_turn(self, p: Player):
        # Findings spoilage
        no_decay = p.has_faction("findings_never_decay") or p.has_passive("no_decay_round")
        if not no_decay:
            cap = self.findings_cap(p)
            if p.findings > cap:
                spoiled = p.findings - cap
                self.m.findings_spoiled += spoiled
                p.findings = cap
        # finalize throughput for the Study lead
        p.throughput_last = p.throughput_now

    # -- legal action generation -------------------------------------------
    def _legal_initial(self, p: Player) -> list:
        out = []
        out += self._field_options(p)
        out += self._study_options(p)
        out += self._hall_options(p)
        return out

    def _legal_chain(self, p: Player, band: str) -> list:
        if band == C.FIELD:
            return self._field_options(p)
        if band == C.STUDY:
            return self._study_options(p, chain=True)
        if band == C.HALL:
            return self._hall_options(p, chain=True)
        return []

    def _field_options(self, p: Player) -> list:
        out = []
        # survey each distinct affordable row card
        seen = set()
        for cid in self.row:
            if cid in seen:
                continue
            seen.add(cid)
            if self._build_cost(p, C.CARD_BY_ID[cid]) <= p.specimens:
                out.append(Action("survey", card_id=cid))
        # Hired Guide: draft off the top of the deck too
        if self.deck and p.has_passive("view2_draft1"):
            top = self.deck[-1]
            if self._build_cost(p, C.CARD_BY_ID[top]) <= p.specimens:
                out.append(Action("survey", card_id=top, from_deck=True))
        # activate each distinct built field card
        for cid in set(p.tableau[C.FIELD]):
            out.append(Action("field", card_id=cid))
        return out

    def _study_options(self, p: Player, chain: bool = False) -> list:
        out = []
        toll = self._toll_due(p, C.STUDY, chain)
        for cid in set(p.tableau[C.STUDY]):
            card = C.CARD_BY_ID[cid]
            if card.conv_max_in <= 0:
                continue
            if card.requires_prime and not self._prime_available(p, card.requires_prime):
                continue
            in_per = self._effective_in_per(p, card)
            need = in_per + (toll if toll else 0)
            if p.specimens >= need:
                feed = min(p.specimens - (toll or 0), card.conv_max_in)
                out.append(Action("study", card_id=cid, spend=feed))
        return out

    def _hall_options(self, p: Player, chain: bool = False) -> list:
        out = []
        toll = self._toll_due(p, C.HALL, chain)
        avail = p.findings - (toll or 0)
        if avail < 0:
            return out
        for cid in set(p.tableau[C.HALL]):
            card = C.CARD_BY_ID[cid]
            if not card.is_hall_claim:
                continue
            for nid in C.NODE_IDS:
                node = self.nodes[nid]
                # may target empty, own, or rival nodes; lodging only on empty/own
                if card.sealed and node.owner is not None and node.owner != p.idx:
                    continue
                spend = avail if card.str_cap is None else min(avail, card.str_cap)
                spend = max(0, spend)
                strength = spend + card.str_bonus
                # a claim must have strength >= 1 to mean anything (sealed always does,
                # since str = Findings + 1)
                if not card.sealed and strength < 1:
                    continue
                out.append(Action("hall", card_id=cid, node_id=nid, spend=spend,
                                   sealed=card.sealed))
        return out

    # -- helpers for costs / tolls / ratios --------------------------------
    def _build_cost(self, p: Player, card: C.Card) -> int:
        cost = self.d.card_cost(card)
        if cost > 0 and p.has_passive("first_build_cheaper") and not p.used_first_build_cheaper:
            cost = max(0, cost - 1)
        return cost

    def _toll_due(self, p: Player, band: str, is_chain: bool) -> int:
        if not is_chain and not self.d.toll_on_paid_action:
            return 0
        if self.leads[band] == p.idx:
            return 0
        return self.d.toll_amount

    def _try_waive_toll(self, p: Player, band: str) -> bool:
        """Free waivers (no resource cost). Returns True if the toll is waived."""
        if any(n.owner == p.idx for nid, n in self.nodes.items()
               if C.NODE_BY_ID[nid].perk == "tollgate") and not p.used_tollgate:
            p.used_tollgate = True
            return True
        if p.has_faction("ignore_one_toll_per_turn") and not p.used_polymath_toll:
            p.used_polymath_toll = True
            return True
        if band == C.HALL and p.used_borrowed_toll:
            return True
        return False

    def _pay_toll(self, p: Player, band: str, is_chain: bool) -> bool:
        toll = self._toll_due(p, band, is_chain)
        if toll <= 0:
            return True
        if self._try_waive_toll(p, band):
            return True
        currency = "specimens" if band == C.STUDY else "findings"
        have = getattr(p, currency)
        if have >= toll:
            setattr(p, currency, have - toll)
            return True
        # spend Standing to waive if possible
        if p.standing >= 1:
            p.standing -= 1
            return True
        return False

    def _effective_in_per(self, p: Player, card: C.Card, allow_oneshot: bool = True) -> int:
        in_per = card.conv_in - self.d.extra_ratio_steps
        if p.has_passive("all_conv_1to1"):
            return 1
        if allow_oneshot:
            # one-shot 1:1 sources
            has_round = (p.has_passive("first_conv_1to1_round")
                         or p.has_faction("first_conv_1to1_round"))
            has_season = p.has_passive("first_conv_1to1_season")
            if has_round and not p.used_first_conv_round:
                return 1
            if has_season and not p.used_first_conv_season:
                return 1
        # Forge node: bump one ratio while held (applied automatically if it helps)
        if any(n.owner == p.idx for nid, n in self.nodes.items()
               if C.NODE_BY_ID[nid].perk == "forge"):
            in_per -= 1
        return max(1, in_per)

    def _consume_oneshot_ratio(self, p: Player):
        has_round = (p.has_passive("first_conv_1to1_round")
                     or p.has_faction("first_conv_1to1_round"))
        has_season = p.has_passive("first_conv_1to1_season")
        if has_round and not p.used_first_conv_round:
            p.used_first_conv_round = True
        elif has_season and not p.used_first_conv_season:
            p.used_first_conv_season = True

    def _prime_available(self, p: Player, tool: str) -> bool:
        owner = self.prime[tool]
        return owner is None or owner == p.idx

    # -- execution ----------------------------------------------------------
    def _execute(self, p: Player, act: Action, is_chain: bool) -> Optional[str]:
        """Resolve an action. Returns the band to chain into, or None."""
        if act.kind == "pass":
            return None
        if act.kind == "survey":
            return self._do_survey(p, act)
        if act.kind == "field":
            return self._do_field_activate(p, act)
        if act.kind == "study":
            return self._do_study(p, act, is_chain)
        if act.kind == "hall":
            return self._do_hall(p, act, is_chain)
        return None

    def _field_action_bonus(self, p: Player, is_survey: bool = False) -> int:
        bonus = 0
        for c in p.all_cards():
            bonus += c.spec_per_field_action
        if p.has_faction("spec_per_field_action_plus_1"):
            # proposed nerf: the Collector's +1 fires only on activate, not on a draft
            if not (is_survey and self.d.collector_activate_only):
                bonus += 1
        if not p.used_first_field_action and p.has_passive("spec_first_field_action"):
            bonus += 1
        if self.leads[C.FIELD] == p.idx and p.has_passive("lead_field_bonus"):
            bonus += 1
        return bonus

    def _gain_specimens(self, p: Player, n: int):
        p.specimens += n
        cap = self.specimen_cap(p)
        if cap is not None and p.specimens > cap:
            p.specimens = cap

    def _do_survey(self, p: Player, act: Action) -> Optional[str]:
        card = C.CARD_BY_ID[act.card_id]
        cost = self._build_cost(p, card)
        if cost > 0 and p.has_passive("first_build_cheaper"):
            p.used_first_build_cheaper = True
        p.specimens -= cost
        assert p.specimens >= 0
        p.tableau[card.band].append(card.id)
        # remove from row / deck and refill
        if act.from_deck:
            if self.deck and self.deck[-1] == act.card_id:
                self.deck.pop()
        else:
            self.row.remove(act.card_id)
            nc = self._draw_card()
            if nc is not None:
                self.row.append(nc)
        # a Survey is a Field action: per-action bonuses apply
        self._gain_specimens(p, self._field_action_bonus(p, is_survey=True))
        p.used_first_field_action = True
        # surveying does not itself chain (the drafted card isn't "activated")
        return None

    def _do_field_activate(self, p: Player, act: Action) -> Optional[str]:
        card = C.CARD_BY_ID[act.card_id]
        gain = card.spec + self._field_action_bonus(p)
        self._gain_specimens(p, gain)
        p.used_first_field_action = True
        if card.draw_tactic:
            for _ in range(card.draw_tactic):
                t = self._draw_tactic()
                if t:
                    p.hand.append(t)
        return card.trigger

    def _do_study(self, p: Player, act: Action, is_chain: bool) -> Optional[str]:
        card = C.CARD_BY_ID[act.card_id]
        if not self._pay_toll(p, C.STUDY, is_chain):
            return None
        # claim a prime tool if required
        if card.requires_prime:
            if not self._prime_available(p, card.requires_prime):
                return None
            self.prime[card.requires_prime] = p.idx
        in_per = self._effective_in_per(p, card)
        # consume one-shot 1:1 if it was the reason in_per==1
        if in_per == 1 and card.conv_in > 1 and not p.has_passive("all_conv_1to1") \
                and not any(n.owner == p.idx for nid, n in self.nodes.items()
                            if C.NODE_BY_ID[nid].perk == "forge"):
            self._consume_oneshot_ratio(p)
        feed = min(act.spend, p.specimens, card.conv_max_in)
        batches = feed // in_per
        if batches <= 0:
            return card.trigger
        consumed = batches * in_per
        produced = batches * card.conv_out
        p.specimens -= consumed
        p.findings += produced
        p.throughput_now += produced
        self.m.findings_produced += produced
        assert p.specimens >= 0
        return card.trigger

    def _do_hall(self, p: Player, act: Action, is_chain: bool) -> Optional[str]:
        card = C.CARD_BY_ID[act.card_id]
        node = self.nodes[act.node_id]
        if not self._pay_toll(p, C.HALL, is_chain):
            return None
        spend = min(act.spend, p.findings)
        if card.str_cap is not None:
            spend = min(spend, card.str_cap)
        spend = max(0, spend)
        p.findings -= spend
        assert p.findings >= 0
        base_str = spend + card.str_bonus
        # proposed buff: Systematist gets +1 str on its first claim each round (a Hall
        # hook for the patient builder, since its no-spoil power is near-useless)
        if self.d.systematist_first_claim_str and p.faction.id == "systematist" \
                and not p.used_first_claim_bonus:
            base_str += 1
            p.used_first_claim_bonus = True
        # attacker feint (offensive tactic)
        base_str += self._maybe_attacker_tactics(p, card, node)

        rival = node.owner is not None and node.owner != p.idx
        if not rival:
            return self._resolve_uncontested(p, card, act.node_id, base_str, spend)
        return self._resolve_challenge(p, card, act.node_id, base_str, spend)

    # -- Hall: uncontested claim -------------------------------------------
    def _resolve_uncontested(self, p, card, nid, strength, spend) -> Optional[str]:
        node = self.nodes[nid]
        if strength < 1:
            # a strength-0 open claim founds nothing; the action simply fizzles
            return card.trigger if card.trigger != C.FIELD else None
        if node.owner == p.idx:
            node.strength = max(node.strength, strength)
        else:
            node.owner = p.idx
            node.strength = strength
        node.sealed = card.sealed
        self.m.successful_claims += 1
        self._on_claim_success(p, card)
        # clock: uncontested claims tick only via escalation / card / tactics
        self._tick_clock_for_claim(p, card, success=True, contested=False)
        self._recompute_leads()
        # loop-back perks + trigger only if there is a Field trigger
        if card.trigger == C.FIELD:
            self._loopback_perks(p)
            return C.FIELD
        return card.trigger

    # -- Hall: challenge ----------------------------------------------------
    def _resolve_challenge(self, p, card, nid, attack_str, spend) -> Optional[str]:
        node = self.nodes[nid]
        defender = self.players[node.owner]
        self.m.challenges += 1
        self.m.aggression[p.idx] = self.m.aggression.get(p.idx, 0) + 1
        if p.has_faction("attack_occupied_plus_1"):
            attack_str += 1

        # defender reveal strength + reveal bonuses
        defend_str = node.strength
        if node.sealed:
            if defender.has_passive("sealed_reveal_bonus_2"):
                defend_str += 2
        if defender.has_passive("reveal_bonus") and not node.sealed:
            defend_str += 1

        ambush = False
        if self.d.tactics_enabled:
            defend_str, ambush = self._maybe_defender_tactics(defender, p, defend_str, attack_str)

        # clock ticks for a resolved challenge (always +1), + Sensationalist
        self._tick_clock_for_claim(p, card, success=None, contested=True)

        if ambush:
            # attacker discredited before compare; defender holds
            self._fail_attack(p, card, spend, defender, gain_standing=True)
            self._recompute_leads()
            return None

        if attack_str > defend_str:
            self._capture(p, card, nid, attack_str, defend_str, spend)
            self._on_claim_success(p, card)
            self._tick_escalation(p, success=True)
            self._recompute_leads()
            if card.trigger == C.FIELD:
                self._loopback_perks(p)
                return C.FIELD
            return card.trigger
        elif attack_str == defend_str:
            node.owner = None
            node.strength = 0
            node.sealed = False
            self._recompute_leads()
            return None  # chain ends
        else:
            self._fail_attack(p, card, spend, defender, gain_standing=True)
            self._recompute_leads()
            return None

    def _capture(self, p, card, nid, attack_str, defend_str, spend):
        node = self.nodes[nid]
        excess = attack_str - defend_str
        if self.d.capture_garrison_mode == "full":
            new_strength = attack_str
        else:  # 'excess'
            new_strength = max(1, excess)
        node.owner = p.idx
        node.strength = new_strength
        node.sealed = False
        self.m.successful_claims += 1
        # Monograph banks 1 Finding from the excess
        if "bank_on_excess" in card.passives and excess > 0:
            p.findings += 1
        # Overrun tactic: spill excess to an adjacent field
        self._maybe_overrun(p, nid, excess)

    def _fail_attack(self, p, card, spend, defender, gain_standing):
        # Erratum: recover the spent Findings
        if self.d.tactics_enabled and "erratum" in p.hand and spend > 0:
            p.hand.remove("erratum")
            p.findings += spend
        if gain_standing:
            defender.standing += 1

    def _on_claim_success(self, p, card):
        if "standing_on_success" in card.passives:
            p.standing += 1
        if card.on_success_clock:        # e.g. Sensational Discovery (+1 on success)
            self._tick_clock(card.on_success_clock)
        if card.on_success_draw_tactic:
            for _ in range(card.on_success_draw_tactic):
                t = self._draw_tactic()
                if t:
                    p.hand.append(t)

    def _loopback_perks(self, p):
        # Cache (Entomology): draw a spoils specimen; Beacon (Ornithology): +1 Standing
        for nid, n in self.nodes.items():
            if n.owner != p.idx:
                continue
            perk = C.NODE_BY_ID[nid].perk
            if perk == "cache":
                self._gain_specimens(p, 1)
            elif perk == "beacon":
                p.standing += 1

    # -- clock --------------------------------------------------------------
    def _tick_clock(self, n=1):
        self.clock += n

    def _tick_clock_for_claim(self, p, card, success, contested):
        if contested:
            self._tick_clock(1)
            if p.has_faction("contest_ticks_clock"):
                self._tick_clock(1)
        # card-driven on-success clock ticks are handled in _on_claim_success (fires
        # for both contested captures and uncontested claims, no double count).
        if not contested and success:
            self._tick_escalation(p, success=True)

    def _tick_escalation(self, p, success):
        if success and self.clock >= self.d.escalation_threshold:
            self._tick_clock(1)

    # -- tactics (heuristic) -----------------------------------------------
    def _maybe_attacker_tactics(self, p, card, node) -> int:
        if not self.d.tactics_enabled:
            return 0
        bonus = 0
        rival = node.owner is not None and node.owner != p.idx
        # Feint: spend on a contested presentation to push the compare
        if rival and "sensational_specimen" in p.hand:
            # warlord/comboist more eager; use when it plausibly helps
            if self.players[p.idx].strategy in ("warlord", "comboist", "greedy"):
                p.hand.remove("sensational_specimen")
                bonus += 2
        return bonus

    def _maybe_defender_tactics(self, defender, attacker, defend_str, attack_str):
        """Returns (new_defend_str, ambush_used)."""
        # Prior Publication (ambush): negate the attack entirely if it would land
        if "prior_publication" in defender.hand and attack_str > defend_str:
            defender.hand.remove("prior_publication")
            return defend_str, True
        # Pre-emptive Letter: +1 per band led; play if it flips the outcome
        if "preemptive_letter" in defender.hand and attack_str > defend_str:
            led = self.medallions_held(defender.idx)
            if defend_str + led >= attack_str:
                defender.hand.remove("preemptive_letter")
                return defend_str + led, False
        # Feint on defence: +2 if it flips or ties favourably
        if "sensational_specimen" in defender.hand and attack_str > defend_str \
                and defend_str + 2 >= attack_str:
            defender.hand.remove("sensational_specimen")
            return defend_str + 2, False
        return defend_str, False

    def _maybe_overrun(self, p, nid, excess):
        if not self.d.tactics_enabled or excess <= 0:
            return
        if "whole_new_genus" not in p.hand:
            return
        # carry excess to an adjacent field if it captures something
        for adj in C.NODE_ADJ[nid]:
            n = self.nodes[adj]
            if n.owner is None or (n.owner != p.idx and n.strength < excess):
                p.hand.remove("whole_new_genus")
                if n.owner is None:
                    n.owner, n.strength, n.sealed = p.idx, max(1, excess), False
                else:
                    n.owner, n.strength, n.sealed = p.idx, max(1, excess - n.strength), False
                self.m.successful_claims += 1
                return

    def play_tempo_tactic(self, p: Player) -> bool:
        """Press Sensation: +2 Standing, clock +1. Called by policies wanting tempo."""
        if self.d.tactics_enabled and "press_sensation" in p.hand:
            p.hand.remove("press_sensation")
            p.standing += 2
            self._tick_clock(1)
            return True
        return False

    # -- end of game --------------------------------------------------------
    def _finalize(self):
        self.m.clock_final = self.clock
        if self.m.winner is None:
            # close scoring: most medallions; tie-break standing, collection, findings
            def key(p):
                return (self.medallions_held(p.idx), p.standing,
                        self.field_collection(p), p.findings)
            ranked = sorted(self.players, key=key, reverse=True)
            top = ranked[0]
            tied = [p for p in self.players if key(p) == key(top)]
            if len(tied) == 1:
                self.m.winner = top.idx
                self.m.win_type = "close"
            else:
                self.m.winner = min(t.idx for t in tied)
                self.m.win_type = "tie"
                self.m.tie_size = len(tied)
        # was a 2-lead broken before the winner took it? (snowball proxy)
        winner_meds = self.medallions_held(self.m.winner)
        if self.m.two_lead_reached and winner_meds < 3 and self.m.win_type != "knockout":
            # someone reached 2 but nobody knocked out -> the lead was contained
            self.m.two_lead_broken = True
        self.m.per_player = {
            p.idx: {
                "strategy": p.strategy,
                "faction": p.faction.id,
                "seat": p.start_seat,
                "medallions": self.medallions_held(p.idx),
                "standing": p.standing,
                "collection": self.field_collection(p),
                "findings": p.findings,
                "specimens": p.specimens,
                "tableau_size": sum(len(p.tableau[b]) for b in C.BANDS),
                "challenges": self.m.aggression.get(p.idx, 0),
            }
            for p in self.players
        }

    # -- invariants ---------------------------------------------------------
    def _check_invariants(self):
        for p in self.players:
            assert p.specimens >= 0, f"negative specimens p{p.idx}"
            assert p.findings >= 0, f"negative findings p{p.idx}"
            assert p.standing >= 0, f"negative standing p{p.idx}"
            cap = self.specimen_cap(p)
            if cap is not None:
                assert p.specimens <= cap, f"specimen cap exceeded p{p.idx}"
        # at most one holder per band
        for b in C.BANDS:
            holder = self.leads[b]
            assert holder is None or 0 <= holder < self.d.n_players
        # node ownership consistent
        for nid, n in self.nodes.items():
            if n.owner is None:
                assert n.strength == 0, f"empty node {nid} has strength"
            else:
                assert n.strength >= 1, f"held node {nid} has no strength"


def quick_describe():
    d = Dials(n_players=4)
    print(f"close_space={d.close_space} escalation={d.escalation_threshold}")


if __name__ == "__main__":
    quick_describe()
