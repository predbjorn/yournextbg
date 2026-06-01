# Three Planes — mechanical skeleton (theme-agnostic)

> Status: design draft. Mechanics locked end-to-end; theme not yet chosen.
> This lives in the repo as a board-game idea, not part of the recommender product.

## Design thesis

One game that holds **three different interaction temperatures at once**, won by
**leading planes** rather than hoarding victory points. Most games pick one
temperature — a Euro is cold, a wargame is hot. This game puts all three on the
same table so different players can lean into the part they like, while still
being forced to care about the others.

## The three planes (bands)

A single **shared board**, split into three horizontal bands. The Euro feel
survives full sharing because **feel comes from the *kind of contact* allowed,
not from physical separation.** Drafting *happens* on the shared board; the
engine you build from it sits in your **personal tableau**, untouchable.

```
┌─────────────────────────────────────────────┐
│  DRAFT BAND   (cold)                          │
│  shared card row + priority track             │
│  contact = "I claimed it first." Never removal│
├─────────────────────────────────────────────┤
│  WORK BAND    (warm)                          │
│  mostly open spots + a few PRIME exclusive    │
│  contact = blocking on the prime spots only   │
├─────────────────────────────────────────────┤
│  BATTLE BAND  (hot)                           │
│  shared contested map of 5–6 nodes            │
│  contact = attack, removal, hidden commitment │
└─────────────────────────────────────────────┘
        resources flow downward ↓
        battle outcomes reach back up ↑
```

**Rule of contact (enforced per band):**

| Band | Feel | Temp | Only form of interaction |
|---|---|---|---|
| Draft | pure Euro | cold | out-tempo (take first); **never** destroy → opportunity cost only |
| Work | Euro-with-friction | warm | block a prime spot; friction, no violence |
| Battle | wargame | hot | attack, removal, hidden commitment, bluff |

A player who wants the Euro experience lives in the top two bands and plays the
bottom band defensively. Shared board, three temperatures, no contradiction.

## Turn structure: one paid action → chain reactions

**Your turn = one action, in any band.** Fast and freeform.

Some actions carry a **trigger** that hands you a *free* follow-on action in the
band it points to — **if** you can pay that step's internal fuel. Chains cascade
until they run dry.

```
  pay 1 action  ┌──────────┐  trigger  ┌──────────┐  trigger  ┌──────────┐
  ───────────►  │  DRAFT   │ ────────► │  WORK    │ ────────► │  BATTLE  │
                └──────────┘  (if you  └──────────┘  (if you  └──────────┘
                              made the                made the      │
                              fuel)                   unit)         │ trigger
                                                                    ▼
                                            loops back to DRAFT (spoils)
```

A chain only flows as far as your **tableau actually produces the right fuel at
each step**. That *is* Euro engine-building — but the payoff lands in the hot
band. You spend one real action to light the fuse; the engine carries it.

### Worked example
> Action on **Draft**: take a card with a →Work trigger; placing it gives 2 Material.
> Trigger → free **Work**: spend Material at a spot, build a raider with a →Battle trigger.
> Trigger → free **Battle**: push the raider into a node; it lands Pressure → →Draft trigger.
> Trigger → free **Draft** grab: take a spoils card. No trigger → chain ends.
> One action, a full lap — but only an engine tuned to produce fuel on cue can do it.

### Two brakes (so it isn't runaway solitaire)
1. **Battle steps are interruptible.** The hot band runs on hidden commitment
   (defenders pre-position face-down). A chain that crashes into a defended node
   **fizzles** — the unit dies, the loop-back never fires. Over-extending
   telegraphs and invites punishment.
2. **Chains pay a toll through bands you don't lead.** Lead the band → free; don't
   lead it → extra fuel or a stall. Wires the lead tracks into combo potential
   every turn.

## Fuel economy

Three currencies, one per band, **escalating refinement**, converting **upward
through the stack with loss**:

| Tier | Currency | Band | Storage | = Temperature |
|---|---|---|---|---|
| 1 | **Material** | Draft | stores freely (stockpile) | cold — patient, plannable |
| 2 | **Power** | Work | capped (~3); use or lose | warm — mild pressure |
| 3 | **Pressure** | Battle | doesn't store; apply or lose | hot — use-it-now |

**The storage gradient *is* the temperature gradient.** The economy produces the
feel; feel isn't bolted on.

### Baseline ratios (tunable — the main balance dial)
```
Draft step :  take a card → 2–3 Material (the card's printed yield)
Work step  :  Material → Power at 2:1 (the lossy refinement)
              Power → Unit: 1 Power = 1 unit, strength = Power spent
Battle step:  Unit deploys → Pressure = unit strength
              Pressure landed → 1 spoils card + 1 Tempo (loop-back)
```
Loosen ratios → swingier/faster; tighten → grindier/more Euro.

**The Euro game is improving these ratios.** Tableau cards tune conversions
(2:1 → 1:1), raise caps, add yield, add strength. Optimizing the machine over
rounds is the cold-band brain-burn.

### Tolls
Crossing a band you don't lead costs **+1 of that band's input currency**
(cross Work unled → +1 Material; cross Battle unled → +1 Power). Cheap tier,
real bite.

### Tempo (the loop-back currency)
Landing Pressure returns a spoils card **+ 1 Tempo**. Tempo sets draft order, or
is spent to **waive one toll** or **bump one ratio** for a turn. Battle pressure
literally buys cold-band efficiency — which is why ignoring the hot band slowly
strangles your engine.

### Lead = flow, not stock
- **Draft lead** = biggest tableau (total tier value of cards built).
- **Work lead** = highest Power **throughput last round** (produced, not hoarded).
- **Battle lead** = most Pressure currently **on the board**.

Two of three reward activity, keeping the game moving toward its end triggers.

## Battle resolution (hidden commitment)

The Battle band is **5–6 nodes**, each granting a **loop-back perk** when held:

| Node | Holding it gives |
|---|---|
| Cache | the spoils **card** on a loop-back |
| Beacon | **+1 Tempo** per loop-back |
| Toll-gate | **waive one toll** per turn |
| Forge | **bump one ratio** while held |
| (open) | landing pad only |

These nodes are also **the spots a chain's Battle step lands on**, so the turtle
who wants a full lap must punch through whatever garrison the warlord parks
there. The game crashes together at the nodes.

### Two ways into battle
- **Chain-raid** (the free Battle step): quick, blunt, known strength into the dark.
- **Assault** (your *paid* Battle action): commit unit **+ a face-down feint**;
  defender flips garrison **+ reserve**; both reveal **simultaneously**. The
  bluffy set-piece. (So a free chain-raid is powerful but crude — keeps chains
  from owning the hot band.)

### Resolution: attack Pressure S vs defense total D
| Outcome | Result |
|---|---|
| **S > D** | Node captured; defenders destroyed; your unit becomes garrison (presence). Excess S−D **lost**. Chain **continues** (loop-back fires). |
| **S = D** | Clash; both destroyed; node neutral. Chain **ends**. |
| **S < D** | Repelled; **your unit destroyed**; garrison survives (−S). Chain **ends**; defender gains 1 Tempo. |

### Garrisons: the warlord's perishable Power → durable presence
Defense is a **pre-investment**: spend Power to place a **face-down garrison**
(hidden strength) on earlier turns. Power doesn't keep (cap ~3), so converting it
into durable hidden defense + presence is exactly what the warlord should do. The
face-down strength is the **bluff** — attackers never know if they're over- or
under-committing.

Loop: **Work makes Power (perishable) → garrison nodes → attackers over-commit or
fizzle → Battle lead.**

### Ties back to
- **Conflict clock:** every resolved battle ticks a shared doomsday track →
  **fighting shortens the game.**
- **Ephemeral Pressure:** excess S lost → size attacks precisely → hot tempo.
- **Tempo:** successful defenses also pay Tempo, so turtling a node is income.

## Victory: lead 2 of 3, with an all-three knockout

- **Natural end:** after N rounds (cap ~6), whoever leads **the most bands** wins.
- **Knockout:** lead **all three bands at the start of a round** → **win instantly.**

The knockout is the engine. The table self-polices: the moment someone threatens
all three, everyone dogpiles to knock them off one. Catch-up *is* the others'
self-interest — no separate rubber-band needed.

### Three end-triggers (the length combo)
1. **Round cap** — guaranteed ceiling; rarely reached.
2. **Conflict clock** — every battle advances it; when full, current round is the
   last. **Players partly control timing.**
3. **Knockout** — instant early win.

The clock creates a **clock war**: the turtle wants a long game (engine matures);
the warlord wants it short (end before the engine snowballs). The battle plane
literally controls the clock.

### Making the knockout genuine but defendable
- **"Start of round" timing** gives the table one full round of warning to break it.
- **The conflict clock lowers the bar over time:** leadership perks grow as the
  clock advances, so late game a two-lead player can plausibly grab the third.
  The knockout goes live exactly at the climax.

## Cards (theme-agnostic)

Every card is a **permanent engine piece** sorted into one of three tableau rows
(Draft / Work / Battle), mirroring the bands. Drafting = choosing which lane to
feed and which triggers/modifiers to buy.

### Anatomy
```
┌─────────────────────────────────┐
│ [BAND · TIER]            «name»  │
│ ACTIVATE: what it does on that   │
│           band's action          │
│ TRIGGER:  →Band  (or none)       │
│ PASSIVE:  always-on modifier     │
└─────────────────────────────────┘
```
- **Band** — which row it joins / what action activates it.
- **Tier (I–III)** — engine value + gate. *Draft lead = total tableau tier value.*
- **Activate** — the band's core verb:
  - Draft → produce **Material**
  - Work → convert **Material → Power** at the card's ratio
  - Battle → spend **Power → unit / garrison**
- **Trigger** — optional `→Band`; fires a free chained step. Combo glue, priced for it.
- **Passive** — optional economy modifier (better ratio, cap, yield, strength, toll discount). The Euro layer.

### Effect vocabulary by band
- **Draft (cold — generate & accelerate):** +N Material on draft; +1 Material per
  Draft action; draft-2-keep-1 / dig deeper; +tableau-tier for lead; trigger →Work.
- **Work (warm — convert & efficiency):** convert X Material→Power at a ratio;
  +Power cap; once/round first conversion 1:1; toll discount; trigger →Battle.
- **Battle (hot — force & presence):** Power→unit (str = Power, capped);
  Power→garrison (str = Power+1); units +1 str; garrisons reveal +1; bank 1 excess
  Pressure; trigger →Draft.

### Two card types
- **Engine cards** — permanent, public, join a tableau row. The bulk.
- **Tactic cards** — one-shot, held **face-down in hand**; the **feints/reserves**
  the battle bluff needs. Never join the tableau. E.g. *Feint* (+2 on reveal),
  *Ambush* (destroy an attacker before compare), *Overrun* (excess Pressure carries
  to an adjacent node).

### Sample statlines (no theme)
```
[DRAFT · I]                    [WORK · II]                    [BATTLE · I]
ACTIVATE: +2 Material          ACTIVATE: ≤4 Material → Power    ACTIVATE: Power → unit,
TRIGGER:  →Work                          at 1:1                          str = Power (max 3)
PASSIVE:  —                    TRIGGER:  →Battle               TRIGGER:  →Draft
  self-fueling chain-starter   PASSIVE:  —                     PASSIVE:  —
                                 combo spine                     the raider — fires loop

[DRAFT · II]                   [WORK · III]                   [BATTLE · II]
ACTIVATE: +3 Material          ACTIVATE: —                     ACTIVATE: Power → garrison,
TRIGGER:  —                    TRIGGER:  —                              str = Power +1
PASSIVE:  +1 Material every    PASSIVE:  Power cap +2;          TRIGGER:  —
          Draft action                   1st conversion/rnd     PASSIVE:  garrisons reveal +1
  the turtle's engine                    is 1:1                   the warlord's wall
                                 efficiency keystone

[TACTIC · Feint] (one-shot)               [TACTIC · Ambush] (one-shot)
Play face-down in an assault.             Play when defending. On reveal:
On reveal: +2 to your side.               destroy one attacking unit before compare.
```

### The three identities fall out of draft choices
- **Turtle** — Draft + Work cards, →Work/→Draft triggers, ratio passives → a
  self-looping cold/warm engine. Leads Draft + Work; touches Battle to defend.
- **Warlord** — Battle garrison cards + hoarded Tactics → perishable Power into
  walls and bluffs. Leads Battle; ticks the clock.
- **Comboist** — a trigger in each row → the rare full-lap engine that enables the
  **knockout lunge**.

All three compete for the **same shared card row**, so drafting is the first
interaction — the warlord can snipe the turtle's ratio keystone. The cold band has
teeth.

## Open / next

- Full starter card list (~30–40 cards, tier curve) — not yet drafted.
- Theme — not yet chosen. (Note: the "hot band" only needs to be *zero-sum
  destructive interaction*; it can be reframed as non-combat conflict — debate,
  contest, market — for non-warlike themes.)
- Stress-test for degenerate strategies (pure-turtle ignoring Battle, infinite
  chains, knockout kingmaking).
```
```
