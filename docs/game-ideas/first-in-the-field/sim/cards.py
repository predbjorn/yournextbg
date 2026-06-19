"""Card, Tactic and Faction definitions for *First in the Field*.

Transcribed from ``docs/game-ideas/first-in-the-field-cards.html`` (the ``C=[...]``
array) and cross-checked against ``first-in-the-field-cards.md`` and the rulebook.

The data here is deliberately *declarative*: each card carries structured fields
that ``engine.py`` interprets.  A handful of genuinely unique effects are encoded
as named flags (e.g. ``on_success_clock``) that the engine special-cases.  Every
interpretation that was not fully pinned down by the rulebook is recorded in
``README.md`` under "Open decisions".

Score/effect numbers are the rulebook's provisional defaults.  Anything a designer
might want to sweep lives in ``engine.Dials`` instead of here.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

# --- band / tier vocabulary ------------------------------------------------

FIELD, STUDY, HALL = "field", "study", "hall"
BANDS = (FIELD, STUDY, HALL)

# "total tier of built Field cards" -> tier value for the Field-lead collection.
TIER_VALUE = {1: 1, 2: 2, 3: 3}

# Deck copy counts: each Tier I design x3, Tier II x2, Tier III x1 (cards.md).
DEFAULT_COPIES = {1: 3, 2: 2, 3: 1}
# Tactics: 8 designs, rulebook says "~16 Tactic cards" => x2 each.
TACTIC_COPIES = 2


# --- engine cards ----------------------------------------------------------

@dataclass(frozen=True)
class Card:
    id: str
    name: str
    band: str               # field | study | hall
    tier: int               # 1 | 2 | 3
    cost: int               # build cost in Specimens
    trigger: Optional[str] = None      # band a successful activation chains into
    # Field activate: gain specimens
    spec: int = 0
    draw_tactic: int = 0
    # Study activate: convert specimens -> findings in batches of in_per -> out_per,
    # feeding at most max_in specimens.
    conv_in: int = 0
    conv_out: int = 0
    conv_max_in: int = 0
    requires_prime: Optional[str] = None   # 'microscope' | 'engraver'
    # Hall activate: spend findings -> claim of strength (findings_spent + str_bonus)
    is_hall_claim: bool = False
    str_bonus: int = 0
    str_cap: Optional[int] = None          # cap on findings spent (None = uncapped)
    sealed: bool = False                   # Lodge a Claim -> face-down garrison
    # passives (always-on flags the engine reads)
    passives: frozenset = frozenset()
    # passive magnitudes
    findings_cap_bonus: int = 0
    spec_per_field_action: int = 0
    # unique one-off hooks
    on_success_clock: int = 0              # extra clock ticks when a claim succeeds
    on_success_draw_tactic: int = 0

    @property
    def tier_value(self) -> int:
        return TIER_VALUE[self.tier]


# Passive flag vocabulary (documented in README):
#   spec_first_field_action   +1 Specimen on your first Field action each round
#   view2_draft1              peek 2 row cards, draft 1 (info only in sim)
#   lead_field_bonus          +1 Specimen per Field action while you lead the Field
#   field_lead_double         this card's tier counts double toward the Field lead
#   first_build_cheaper       your first build each round costs 1 less
#   first_conv_1to1_round     once a round your first conversion is 1:1
#   first_conv_1to1_season    once a game your first conversion is 1:1
#   all_conv_1to1             all your conversions are 1:1
#   study_lead_double         your last-turn throughput counts double for the Study lead
#   no_decay_round            your Findings do not spoil this round
#   standing_on_success       +1 Standing when this claim succeeds
#   reveal_bonus              your (open) claims reveal at +1
#   sealed_reveal_bonus_2     your sealed claims reveal at +2
#   hold_two_fields           you may hold a position in two fields at once (informational)
#   bank_on_excess            on a successful claim, bank 1 Finding from the excess

ENGINE_CARDS: list[Card] = [
    # ---- FIELD (9) ----
    Card("collecting_trip", "Collecting Trip", FIELD, 1, 0, trigger=STUDY, spec=2),
    Card("roadside_botanizing", "Roadside Botanizing", FIELD, 1, 0, spec=1,
         passives=frozenset({"spec_first_field_action"})),
    Card("hired_guide", "Hired Guide", FIELD, 1, 0, spec=2,
         passives=frozenset({"view2_draft1"})),
    Card("patrons_grant", "A Patron's Grant", FIELD, 2, 2, spec_per_field_action=1),
    Card("expedition_upriver", "Expedition Upriver", FIELD, 2, 2, trigger=STUDY, spec=4),
    Card("naturalists_network", "The Naturalist's Network", FIELD, 2, 2, spec=2,
         passives=frozenset({"lead_field_bonus"})),
    Card("grand_voyage", "The Grand Voyage", FIELD, 3, 4, trigger=STUDY, spec=6),
    Card("royal_patronage", "Royal Patronage", FIELD, 3, 5, spec_per_field_action=2,
         passives=frozenset({"field_lead_double"})),
    Card("rediscovered_cabinet", "Rediscovered Cabinet", FIELD, 3, 4, spec=3, draw_tactic=1,
         passives=frozenset({"first_build_cheaper"})),

    # ---- STUDY (9) ----
    Card("field_notes", "Field Notes", STUDY, 1, 0, conv_in=2, conv_out=1, conv_max_in=2),
    Card("pressing_pinning", "Pressing & Pinning", STUDY, 1, 0, trigger=HALL,
         conv_in=3, conv_out=1, conv_max_in=3),
    Card("classify", "Classify", STUDY, 2, 2, trigger=HALL,
         conv_in=1, conv_out=1, conv_max_in=4),
    Card("dissection_bench", "Dissection Bench", STUDY, 2, 2,
         conv_in=3, conv_out=2, conv_max_in=3),
    Card("camera_lucida", "Camera Lucida", STUDY, 2, 2, findings_cap_bonus=1,
         passives=frozenset({"first_conv_1to1_round"})),
    Card("shared_microscope", "Shared Microscope", STUDY, 2, 3,
         conv_in=1, conv_out=1, conv_max_in=5, requires_prime="microscope"),
    Card("great_atlas", "The Great Atlas", STUDY, 3, 4, findings_cap_bonus=2,
         passives=frozenset({"first_conv_1to1_season"})),
    Card("standardized_system", "A Standardized System", STUDY, 3, 5,
         passives=frozenset({"all_conv_1to1", "study_lead_double"})),
    Card("engravers_workshop", "Engraver's Workshop", STUDY, 3, 4, trigger=HALL,
         conv_in=1, conv_out=1, conv_max_in=4, requires_prime="engraver",
         passives=frozenset({"no_decay_round"})),

    # ---- HALL (8) ----
    Card("present_a_paper", "Present a Paper", HALL, 1, 0, trigger=FIELD,
         is_hall_claim=True, str_cap=3),
    Card("read_at_meeting", "Read at the Meeting", HALL, 1, 0,
         is_hall_claim=True, str_cap=2, passives=frozenset({"standing_on_success"})),
    Card("lodge_a_claim", "Lodge a Claim", HALL, 2, 2,
         is_hall_claim=True, sealed=True, str_bonus=1),
    Card("monograph", "Monograph", HALL, 2, 2, trigger=FIELD,
         is_hall_claim=True, passives=frozenset({"bank_on_excess"})),
    Card("contested_genus", "Contested Genus", HALL, 2, 3,
         is_hall_claim=True, passives=frozenset({"reveal_bonus"})),
    Card("definitive_revision", "The Definitive Revision", HALL, 3, 4, trigger=FIELD,
         is_hall_claim=True, str_bonus=2),
    Card("founding_fellow", "Founding Fellow", HALL, 3, 5,
         passives=frozenset({"sealed_reveal_bonus_2", "hold_two_fields"})),
    Card("sensational_discovery", "Sensational Discovery", HALL, 3, 4, trigger=FIELD,
         is_hall_claim=True, on_success_clock=1, on_success_draw_tactic=1),
]

CARD_BY_ID = {c.id: c for c in ENGINE_CARDS}

# Cards every player owns at setup, in their tableau (one of each band).
STARTING_CARD_IDS = ("collecting_trip", "field_notes", "present_a_paper")


# --- tactics ---------------------------------------------------------------

@dataclass(frozen=True)
class Tactic:
    id: str
    name: str
    kind: str          # mechanical role
    text: str


TACTICS: list[Tactic] = [
    Tactic("sensational_specimen", "A Sensational Specimen", "feint",
           "In a presentation, +2 to your side on reveal."),
    Tactic("prior_publication", "Prior Publication", "ambush",
           "When defending, discredit one challenging paper before the compare."),
    Tactic("whole_new_genus", "A Whole New Genus", "overrun",
           "If your claim succeeds, excess Acclaim carries to an adjacent field."),
    Tactic("anonymous_referee", "Anonymous Referee", "counter",
           "Cancel one Tactic an opponent just revealed."),
    Tactic("preemptive_letter", "Pre-emptive Letter", "defence",
           "When challenged, +1 defence for each band you lead."),
    Tactic("press_sensation", "Press Sensation", "tempo",
           "Gain +2 Standing now; advance the Exhibition clock +1."),
    Tactic("borrowed_type_specimen", "Borrowed Type Specimen", "toll",
           "Your next presentation this turn ignores the Hall toll."),
    Tactic("erratum", "Erratum", "recover",
           "After a failed claim, return the spent Findings to you."),
]

TACTIC_BY_ID = {t.id: t for t in TACTICS}


# --- factions --------------------------------------------------------------

@dataclass(frozen=True)
class Faction:
    id: str
    name: str
    archetype: str
    powers: frozenset
    text: str


# Faction powers reflect the rebalance validated in REBALANCE.md and adopted as
# the default (the original first-draft wording is noted there). The three changed
# factions: Collector (+1 on activate only, not survey), Polymath (+1 Specimen per
# chain step), Systematist (+1 str on its first claim each round).
FACTIONS: list[Faction] = [
    Faction("systematist", "The Systematist", "turtle",
            frozenset({"findings_never_decay", "first_claim_str_plus_1"}),
            "Your Findings never decay; +1 strength on your first claim each round."),
    Faction("sensationalist", "The Sensationalist", "warlord",
            frozenset({"contest_ticks_clock", "attack_occupied_plus_1"}),
            "Each claim you contest advances the clock +1; +1 str attacking an occupied field."),
    Faction("polymath", "The Polymath", "comboist",
            frozenset({"ignore_one_toll_per_turn", "specimen_per_chain_step"}),
            "Once per turn ignore one toll; +1 Specimen for each chain step you take."),
    Faction("collector", "The Collector", "drafter",
            frozenset({"spec_per_activate_plus_1", "peek_row"}),
            "+1 Specimen each time you activate a Field card; peek the row before drafting."),
    Faction("illustrator", "The Illustrator", "producer",
            frozenset({"first_conv_1to1_round", "findings_cap_plus_1"}),
            "Once a round your first conversion is 1:1; Findings cap +1."),
]

FACTION_BY_ID = {f.id: f for f in FACTIONS}


# --- Hall nodes ------------------------------------------------------------

@dataclass(frozen=True)
class Node:
    id: str
    name: str
    perk: str          # forge | cache | beacon | tollgate | open


NODES: list[Node] = [
    Node("botany", "Botany — the Grand Library", "forge"),
    Node("entomology", "Entomology — the Cabinet", "cache"),
    Node("ornithology", "Ornithology — the Rostrum", "beacon"),
    Node("geology", "Geology — the Journal", "tollgate"),
    Node("new_genus", "The New Genus", "open"),
]

NODE_BY_ID = {n.id: n for n in NODES}
NODE_IDS = [n.id for n in NODES]
# Adjacency for the Overrun tactic: the five nodes sit in a row.
NODE_ADJ = {
    "botany": ["entomology"],
    "entomology": ["botany", "ornithology"],
    "ornithology": ["entomology", "geology"],
    "geology": ["ornithology", "new_genus"],
    "new_genus": ["geology"],
}


def build_engine_deck(copies: Optional[dict] = None) -> list[str]:
    """Return a list of card ids (one per physical card) for the Field draw deck."""
    copies = copies or DEFAULT_COPIES
    deck: list[str] = []
    for c in ENGINE_CARDS:
        for _ in range(copies[c.tier]):
            deck.append(c.id)
    return deck


def build_tactic_deck(n_copies: int = TACTIC_COPIES) -> list[str]:
    deck: list[str] = []
    for t in TACTICS:
        for _ in range(n_copies):
            deck.append(t.id)
    return deck


if __name__ == "__main__":
    # quick self-description
    deck = build_engine_deck()
    by_band = {b: sum(1 for cid in deck if CARD_BY_ID[cid].band == b) for b in BANDS}
    print(f"engine cards: {len(ENGINE_CARDS)} designs, {len(deck)} physical "
          f"({by_band})")
    print(f"tactics: {len(TACTICS)} designs, {len(build_tactic_deck())} physical")
    print(f"factions: {len(FACTIONS)}  nodes: {len(NODES)}")
