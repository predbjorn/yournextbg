"""AI policies for *First in the Field*.

Each policy chooses among engine-generated legal :class:`engine.Action` objects
for the opening action and for each chain step.  All decisions read the *redacted*
view (opponents' sealed claim strengths are hidden) for opponent info, so no bot
cheats on hidden information.

Policies
--------
- ``random``   — uniform over legal actions (baseline / invariant fuzzing).
- ``turtle``   — maximise the engine; NEVER initiate a Hall challenge.
- ``warlord``  — rush the Hall, contest aggressively, push the clock.
- ``comboist`` — prioritise building and firing long chains.
- ``greedy``   — one-ply heuristic: pick the action maximising a simple score
                 (medallions + progress toward leads + resources).  The yardstick.

``greedy`` uses a *heuristic* one-ply score (not full lookahead) exactly as the
handoff describes — fast enough for tens of thousands of games.
"""

from __future__ import annotations

import random

import cards as C
from engine import Action

# Attacker's guess at a hidden (sealed) rival garrison when sizing a challenge.
EST_SEALED = 3


# ---------------------------------------------------------------------------
def make_policy(strategy: str, seed: int):
    s = strategy.lower()
    if s == "random":
        return RandomPolicy(seed)
    if s == "turtle":
        return TurtlePolicy(seed)
    if s == "warlord":
        return WarlordPolicy(seed)
    if s == "comboist":
        return ComboistPolicy(seed)
    if s == "greedy":
        return GreedyPolicy(seed)
    if s == "pure_turtle":
        return PureTurtlePolicy(seed)
    raise ValueError(f"unknown strategy {strategy!r}")


# ---------------------------------------------------------------------------
class RandomPolicy:
    name = "random"

    def __init__(self, seed: int):
        self.rng = random.Random(seed)

    def choose_action(self, game, view, options):
        return self.rng.choice(options)

    def choose_chain(self, game, view, options):
        # options include a 'stop'; uniform choice (so ~half the time it stops)
        return self.rng.choice(options)


# ---------------------------------------------------------------------------
class HeuristicPolicy:
    """Shared one-ply heuristic scoring; subclasses tune weights / filters."""

    name = "heuristic"
    # weights
    W_MED = 3.0
    W_LEADPROG = 0.8
    W_FINDINGS = 0.22
    W_SPEC = 0.05
    W_STANDING = 0.25
    W_TIER = 0.18
    W_NODE = 1.1
    W_TAKE_LEAD = 0.9
    W_DENY = 0.7
    W_CHAIN = 0.25
    W_TRIGGER_BUILD = 0.2
    ATTACK_MARGIN = 1     # require attack_str >= D_est + margin to attack
    ALLOW_ATTACK = True
    STOP_THRESHOLD = 0.05

    def __init__(self, seed: int):
        self.rng = random.Random(seed)

    # -- optional per-turn hook -------------------------------------------
    def start_turn(self, game, view):
        pass

    # -- public choices ----------------------------------------------------
    def choose_action(self, game, view, options):
        me = game.players[view["me"]]
        scored = [(self._score(game, view, me, a), self.rng.random(), a) for a in options]
        scored = [s for s in scored if s[0] is not None]
        if not scored:
            return options[0]
        scored.sort(reverse=True)
        return scored[0][2]

    def choose_chain(self, game, view, options):
        me = game.players[view["me"]]
        best = None
        best_score = self.STOP_THRESHOLD
        for a in options:
            if a.kind == "stop":
                continue
            sc = self._score(game, view, me, a)
            if sc is None:
                continue
            jitter = self.rng.random() * 1e-6
            if sc + jitter > best_score:
                best_score = sc + jitter
                best = a
        return best if best is not None else Action("stop")

    # -- scoring -----------------------------------------------------------
    def _best_opponent_collection(self, game, me):
        return max((game.field_collection(p) for p in game.players if p.idx != me.idx),
                   default=0)

    def _best_opponent_throughput(self, game, me):
        return max((p.throughput_last for p in game.players if p.idx != me.idx), default=0)

    def _my_nodes(self, game, me):
        return sum(1 for n in game.nodes.values() if n.owner == me.idx)

    def _best_opponent_nodes(self, game, me):
        best, who = 0, None
        for p in game.players:
            if p.idx == me.idx:
                continue
            k = sum(1 for n in game.nodes.values() if n.owner == p.idx)
            if k > best:
                best, who = k, p.idx
        return best, who

    def _opp_medallion_leader(self, game, me):
        for p in game.players:
            if p.idx != me.idx and game.medallions_held(p.idx) >= 2:
                return p.idx
        return None

    def _node_defense_estimate(self, game, view, nid):
        nv = view["nodes"][nid]
        if nv["owner"] is None:
            return None
        if nv["strength"] is None:        # hidden sealed rival garrison
            return EST_SEALED
        return nv["strength"]

    def _score(self, game, view, me, a):
        if a.kind == "pass" or a.kind == "stop":
            return 0.0
        if a.kind == "survey":
            return self._score_survey(game, me, a)
        if a.kind == "field":
            return self._score_field(game, me, a)
        if a.kind == "study":
            return self._score_study(game, me, a)
        if a.kind == "hall":
            return self._score_hall(game, view, me, a)
        return 0.0

    def _score_survey(self, game, me, a):
        card = C.CARD_BY_ID[a.card_id]
        v = 0.45 * card.tier_value
        # would building it take/extend the Field lead?
        after = game.field_collection(me) + card.tier_value * (2 if "field_lead_double" in card.passives else 1)
        if card.band == C.FIELD:
            best_opp = self._best_opponent_collection(game, me)
            if after > best_opp and game.leads[C.FIELD] != me.idx:
                v += self.W_TAKE_LEAD
        if card.trigger:
            v += self.W_TRIGGER_BUILD
        # value engine breadth a touch
        v += self.W_TIER * card.tier_value
        return v

    def _score_field(self, game, me, a):
        card = C.CARD_BY_ID[a.card_id]
        gain = card.spec + game._field_action_bonus(me)
        v = self.W_SPEC * gain
        if card.trigger == C.STUDY and self._can_convert(game, me):
            v += self.W_CHAIN
        if card.draw_tactic:
            v += 0.3
        return v

    def _can_convert(self, game, me):
        for cid in set(me.tableau[C.STUDY]):
            cc = C.CARD_BY_ID[cid]
            if cc.conv_max_in > 0:
                return True
        return False

    def _can_present(self, game, me):
        for cid in set(me.tableau[C.HALL]):
            if C.CARD_BY_ID[cid].is_hall_claim:
                return True
        return False

    def _score_study(self, game, me, a):
        card = C.CARD_BY_ID[a.card_id]
        in_per = game._effective_in_per(me, card)
        feed = min(a.spend, me.specimens, card.conv_max_in)
        batches = feed // in_per if in_per else 0
        produced = batches * card.conv_out
        if produced <= 0:
            return None
        v = self.W_FINDINGS * produced
        # taking the Study lead (throughput)
        if produced > self._best_opponent_throughput(game, me) and game.leads[C.STUDY] != me.idx:
            v += self.W_TAKE_LEAD
        if card.trigger == C.HALL and self._can_present(game, me):
            v += self.W_CHAIN
        return v

    def _score_hall(self, game, view, me, a):
        card = C.CARD_BY_ID[a.card_id]
        node = view["nodes"][a.node_id]
        my_nodes = self._my_nodes(game, me)
        d_est = self._node_defense_estimate(game, view, a.node_id)
        attack_str = a.spend + card.str_bonus
        if game.players[me.idx].has_faction("attack_occupied_plus_1") and \
                node["owner"] is not None and node["owner"] != me.idx:
            attack_str += 1

        if node["owner"] == me.idx:
            return 0.08  # reinforce: minor
        if node["owner"] is None:
            v = self.W_NODE
            if my_nodes + 1 > self._best_opponent_nodes(game, me)[0] and game.leads[C.HALL] != me.idx:
                v += self.W_TAKE_LEAD
            v -= 0.04 * a.spend          # mild cost of spending findings
            # knockout reach: 3rd medallion
            if game.medallions_held(me.idx) == 2 and game.leads[C.HALL] != me.idx:
                v += 4.0
            return v
        # rival node => challenge
        if not self.ALLOW_ATTACK:
            return None
        if d_est is None:
            return None
        if attack_str < d_est + self.ATTACK_MARGIN:
            return None
        v = self.W_NODE
        opp_leader = self._opp_medallion_leader(game, me)
        best_opp_nodes, who = self._best_opponent_nodes(game, me)
        # taking the Hall lead
        if my_nodes + 1 > best_opp_nodes and game.leads[C.HALL] != me.idx:
            v += self.W_TAKE_LEAD
        # denying a 2-medallion opponent
        if node["owner"] == opp_leader:
            v += self.W_DENY + 1.0
        v -= 0.04 * a.spend
        if game.medallions_held(me.idx) == 2 and game.leads[C.HALL] != me.idx:
            v += 4.0
        return v


# ---------------------------------------------------------------------------
class GreedyPolicy(HeuristicPolicy):
    name = "greedy"


# ---------------------------------------------------------------------------
class TurtlePolicy(HeuristicPolicy):
    """Maximise the engine; never initiate a Hall challenge (peaceful claims OK)."""
    name = "turtle"
    ALLOW_ATTACK = False
    W_TIER = 0.5            # value building the engine more
    W_FINDINGS = 0.2
    W_NODE = 0.7            # still claims empty nodes, but engine-first

    def _score_hall(self, game, view, me, a):
        node = view["nodes"][a.node_id]
        # never attack a rival-held node
        if node["owner"] is not None and node["owner"] != me.idx:
            return None
        return super()._score_hall(game, view, me, a)


class PureTurtlePolicy(HeuristicPolicy):
    """The degenerate test case: a pure engine-builder that NEVER touches the Hall.

    It cannot tick the clock, gain Standing from claims, or hold any Hall node, so
    it can never hold the Hall medallion.  Used to answer "can ignoring the Hall
    win?" — the design says it must not.
    """
    name = "pure_turtle"
    W_TIER = 0.5

    def _score(self, game, view, me, a):
        if a.kind == "hall":
            return None       # refuse every Hall action
        return super()._score(game, view, me, a)


# ---------------------------------------------------------------------------
class WarlordPolicy(HeuristicPolicy):
    """Rush the Hall; contest aggressively; push the clock.

    A competent warlord funds its aggression: it builds a lean Study economy for
    ammunition (Findings), holds nodes with garrisons, and attacks rivals — above
    all the medallion/ Hall leader — to deny and to claim the Hall lead.  It does
    not hoard Hall cards (you only need a couple); the bottleneck is Findings.
    """
    name = "warlord"
    W_NODE = 1.7
    W_TAKE_LEAD = 1.6
    W_DENY = 1.6
    W_TIER = 0.08            # don't over-value engine breadth
    W_TRIGGER_BUILD = 0.1
    ATTACK_MARGIN = 0        # attack on even odds (attack_str >= D_est)
    W_FINDINGS = 0.5         # Findings are ammunition

    def start_turn(self, game, view):
        me = game.players[view["me"]]
        # push the season toward CLOSE with Press Sensation when it's available
        if "press_sensation" in me.hand and game.clock < game.d.close_space - 1:
            game.play_tempo_tactic(me)

    def _converters(self, me):
        return sum(1 for cid in me.tableau[C.STUDY] if C.CARD_BY_ID[cid].conv_max_in > 0)

    def _hall_claimers(self, me):
        return sum(1 for cid in me.tableau[C.HALL] if C.CARD_BY_ID[cid].is_hall_claim)

    def _score_survey(self, game, me, a):
        card = C.CARD_BY_ID[a.card_id]
        v = super()._score_survey(game, me, a)
        if card.band == C.STUDY and card.conv_max_in > 0:
            v += 0.9 if self._converters(me) < 2 else 0.2   # build ammunition first
        if card.band == C.HALL and card.is_hall_claim:
            # one strong opener + one garrison is plenty; stop hoarding Hall cards
            n = self._hall_claimers(me)
            if card.sealed and not any(C.CARD_BY_ID[c].sealed for c in me.tableau[C.HALL]):
                v += 1.0                                     # want a Lodge (garrison)
            elif card.str_bonus > 0 and n < 2:
                v += 0.8                                     # a bigger striker
            else:
                v -= 0.6                                     # redundant Hall card
        if card.band == C.FIELD:
            v -= 0.2
        return v


# ---------------------------------------------------------------------------
class ComboistPolicy(HeuristicPolicy):
    """Build a trigger in every row; fire long chains."""
    name = "comboist"
    W_CHAIN = 0.7
    W_TRIGGER_BUILD = 0.9
    STOP_THRESHOLD = -0.5    # keep the chain going even at slim marginal value

    def _score_survey(self, game, me, a):
        card = C.CARD_BY_ID[a.card_id]
        v = super()._score_survey(game, me, a)
        if card.trigger:
            v += 0.8                     # crave triggers
        # value covering a row that has no trigger yet
        have_trigger = any(C.CARD_BY_ID[cid].trigger for cid in me.tableau[card.band])
        if card.trigger and not have_trigger:
            v += 0.6
        return v
