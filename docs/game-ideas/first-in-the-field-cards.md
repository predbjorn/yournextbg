# First in the Field — full card list

> In-theme starter card list for the **First in the Field** treatment (Age-of-Wonder
> naturalist priority race) of the Three Planes skeleton. See `three-planes.md` for
> the mechanics this assumes. Numbers are first-pass and tunable.

## How to read a card

```
[ROW · TIER]  "Name"            COST: n Specimens to build into your tableau
ACTIVATE:  what a row-action does through this card
TRIGGER:   →Row   (fires a free chained step there if you can pay its fuel)
PASSIVE:   always-on modifier
```

- **Rows** map to bands: **Field** (Draft/cold) → **Study** (Work/warm) → **Hall**
  (Battle/hot).
- **Currencies:** Field makes **Specimens**; Study converts **Specimens → Findings**
  (Findings get *scooped*/decay if hoarded); Hall spends **Findings → claims**
  (str = the Acclaim/Pressure applied). **Standing** = Tempo.
- **Build-cost curve (default):** Tier I = 0 · Tier II = 2 · Tier III = 4 Specimens,
  unless a `COST` line overrides. Tier III appears only mid-game (gated by cost /
  row track).
- **Deck counts (suggested):** each Tier I design ×3, Tier II ×2, Tier III ×1
  (keystones are rare). Tactics live in a separate draw deck.

---

## FIELD row — produces Specimens (cold: generate & accelerate)

```
[FIELD · I]  "Collecting Trip"               [FIELD · I]  "Roadside Botanizing"
ACTIVATE: +2 Specimens                       ACTIVATE: +1 Specimen
TRIGGER:  →Study                             PASSIVE:  +1 Specimen on your first
PASSIVE:  —                                            Field action each round
  the self-fueling chain-starter               cheap drip; good early, fades late

[FIELD · I]  "Hired Guide"                   [FIELD · II]  "A Patron's Grant"   COST 2
ACTIVATE: +2 Specimens                       ACTIVATE: —
PASSIVE:  when you take a Field action,      PASSIVE:  +1 Specimen per Field action
          look at 2 row cards, draft 1         the Systematist's bread — recurring
  dig deeper into the row                      engine, no activation needed

[FIELD · II]  "Expedition Upriver"   COST 2  [FIELD · II]  "The Naturalist's Network"  COST 2
ACTIVATE: +4 Specimens                       ACTIVATE: +2 Specimens
TRIGGER:  →Study                             PASSIVE:  while you LEAD the Field,
PASSIVE:  —                                            +1 Specimen per Field action
  big fuel injection + reach                   lead-synergy: rewards holding the cold lead

[FIELD · III]  "The Grand Voyage"    COST 4  [FIELD · III]  "Royal Patronage"      COST 5
ACTIVATE: +6 Specimens                       ACTIVATE: —
TRIGGER:  →Study                             PASSIVE:  +2 Specimens per Field action;
PASSIVE:  —                                            counts double toward Field lead
  one-action full-fuel for a deep chain        turtle endgame: locks the cold lead

[FIELD · III]  "Rediscovered Cabinet"   COST 4
ACTIVATE: +3 Specimens, then draw a Tactic
PASSIVE:  your first build each round costs 1 less
  bridges the cold engine into the bluff layer
```

## STUDY row — converts Specimens → Findings (warm: convert & efficiency)

```
[STUDY · I]  "Field Notes"                   [STUDY · I]  "Pressing & Pinning"
ACTIVATE: 2 Specimens → 1 Finding            ACTIVATE: 3 Specimens → 1 Finding
TRIGGER:  —                                  TRIGGER:  →Hall
PASSIVE:  —                                  PASSIVE:  —
  the baseline 2:1 converter                   worse ratio, but cheap reach into the Hall

[STUDY · II]  "Classify"             COST 2  [STUDY · II]  "Dissection Bench"      COST 2
ACTIVATE: up to 4 Specimens → Findings 1:1   ACTIVATE: 3 Specimens → 2 Findings
TRIGGER:  →Hall                              TRIGGER:  —
PASSIVE:  —                                  PASSIVE:  —
  the combo spine: efficient + reaches up      best flat ratio at Tier II

[STUDY · II]  "Camera Lucida"        COST 2  [STUDY · II]  "Shared Microscope"     COST 3
ACTIVATE: —                                  ACTIVATE: up to 5 Specimens → Findings 1:1
TRIGGER:  —                                  TRIGGER:  →Hall
PASSIVE:  Findings cap +1; once/round your   PASSIVE:  usable only while you hold a PRIME
          first conversion is 1:1                      Study tool (microscope/engraver token)
  illustration: small, reliable efficiency     the contested warm friction — high throughput,
                                               but you must win/hold a prime spot

[STUDY · III]  "The Great Atlas"     COST 4  [STUDY · III]  "A Standardized System"   COST 5
ACTIVATE: —                                  ACTIVATE: —
TRIGGER:  —                                  PASSIVE:  ALL your conversions are 1:1;
PASSIVE:  Findings cap +2; first                       counts double toward Study lead
          classification each season is 1:1    Linnaean keystone: the turtle's warm engine
  the efficiency keystone

[STUDY · III]  "Engraver's Workshop"   COST 4
ACTIVATE: up to 4 Specimens → Findings 1:1
TRIGGER:  →Hall
PASSIVE:  your Findings don't decay this round (anti-scoop)
  lets a comboist bank a big chain through the warm band safely
```

## HALL row — Findings → claims & presence (hot: force & presence)

```
[HALL · I]  "Present a Paper"                [HALL · I]  "Read at the Meeting"
ACTIVATE: Findings → claim, str=Findings(≤3) ACTIVATE: Findings → claim, str=Findings(≤2)
TRIGGER:  →Field (acclaim funds next trip)   TRIGGER:  —
PASSIVE:  —                                  PASSIVE:  +1 Standing on a successful claim
  the raider — fires the loop-back             small, but pays Tempo for showing up

[HALL · II]  "Lodge a Claim"         COST 2  [HALL · II]  "Monograph"               COST 2
ACTIVATE: Findings → sealed claim            ACTIVATE: Findings → claim, str=Findings
          (garrison), str=Findings +1        TRIGGER:  →Field
TRIGGER:  —                                  PASSIVE:  excess Acclaim isn't fully lost
PASSIVE:  —                                            (bank 1 Finding)
  the warlord's wall: hidden defense           softens the "ephemeral Pressure" sting

[HALL · II]  "Contested Genus"       COST 3  [HALL · III]  "The Definitive Revision"  COST 4
ACTIVATE: Findings → claim, str=Findings     ACTIVATE: Findings → claim, str=Findings +2
TRIGGER:  —                                  TRIGGER:  →Field
PASSIVE:  your claims reveal at +1 (bluff)   PASSIVE:  —
  pushes your attack/defense maths             the knockout-enabling big strike

[HALL · III]  "Founding Fellow"      COST 5  [HALL · III]  "Sensational Discovery"   COST 4
ACTIVATE: —                                  ACTIVATE: Findings → claim, str=Findings;
PASSIVE:  your sealed claims reveal at +2;             on success, advance the Exhibition
          you may hold a position in TWO              clock +1 EXTRA and draw a Tactic
          fields at once                     TRIGGER:  →Field
  warlord endgame: dominate the Hall           the Sensationalist's clock-burner
```

## TACTICS — one-shot, held face-down in hand (the bluff fuel)

```
"A Sensational Specimen"  (Feint)   — in a presentation, +2 to your side on reveal.
"Prior Publication"       (Ambush)  — when defending, reveal: discredit one challenging
                                      paper BEFORE the compare ("I published first").
"A Whole New Genus"       (Overrun) — if your claim succeeds, excess Acclaim carries to
                                      an adjacent field.
"Anonymous Referee"                 — cancel one Tactic an opponent just revealed.
"Pre-emptive Letter"                — play when challenged: +1 defense per field you lead.
"Press Sensation"                   — gain +2 Standing now; advance the Exhibition clock +1.
"Borrowed Type Specimen"            — your next presentation this turn ignores the Hall toll.
"Erratum"                           — after a failed claim, return the spent Findings to you.
```

## FACTION POWERS — one per player (asymmetric start)

- **The Systematist** *(turtle)* — your Findings never decay; +2 Specimen stockpile cap.
  Built to win the long game from the cold/warm bands.
- **The Sensationalist** *(warlord)* — each claim you *contest* advances the Exhibition
  clock +1; +1 str when attacking an occupied field. Burns the season down.
- **The Polymath** *(comboist)* — once per turn, ignore one toll when a chain crosses a
  band you don't lead. Enables the full-lap knockout lunge.
- **The Collector** *(Draft-lean)* — +1 Specimen on every Field action; peek the top of
  the Field row before drafting.
- **The Illustrator** *(Work-lean)* — once/round your first conversion is 1:1; Findings
  cap +1.

## Setup / tuning notes

- **Field row display:** N face-up cards; Tier III gated by build-cost so it surfaces
  mid-game. Refill from a tiered deck (I-heavy bottom, III-light).
- **Prime Study tools:** a couple of tokens (microscope, engraver) sit on prime Work
  spots; holding one unlocks the "Shared Microscope"-class cards — the warm-band
  blocking friction.
- **Balance dials:** the Tier-II conversion ratios (`Classify` 1:1 vs `Field Notes`
  2:1) and the str caps on Tier-I Hall cards are the first knobs to turn if chains
  feel too long or the Hall too swingy.
- **Open question:** whether Tactics are drafted from the Field row (competing with
  engine cards) or drawn from a side deck via effects. Drafting them from the row makes
  the cold band hotter (you can deny a rival's bluff fuel) — likely the better choice.
