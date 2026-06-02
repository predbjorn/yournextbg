# Demo UI refinement — design & decision log

Structured design review (multi-agent-brainstorming) for refining the playable
demo (`first-in-the-field.html`) toward **more engaging gameplay** by **reusing the
card colors / styling**.

## Understanding Lock (confirmed)

- **Target:** `docs/game-ideas/demo/first-in-the-field.html` (+ `engine.js`).
- **Goal A:** more engaging gameplay (today: flat text buttons, mono chips, instant
  state changes, text log).
- **Goal B:** reuse the print-and-play card palette/styling (`../first-in-the-field-cards.html`:
  parchment, gilt frames, wax-seal cost, band-colored labels, engraved SVG art) so
  in-game cards look band-coded and richer.
- **User choices:** card look = **Rich chips**; engagement focus = **Atmosphere & art + Clarity**.
- **Constraints:** no build / no deps (only the already-used Google Fonts); engine
  untouched (presentation-only); works offline (file://); desktop-first.

## Initial design (v0)

**A. Rich card chips (reuse card palette).** Band-coded header strip (Field/Study/
Hall/Tactic colors), faint parchment body, a **wax-seal cost badge** (reuse `.seal`
wax gradient), a small **engraved SVG icon** (reuse existing `a-*` symbols) in a tiny
gilt window, tier pips, one-line effect; full text + Latin binomial on hover. Gilt
hairline frame. Stays compact enough for the 6-card row and tableau.

**B. Atmosphere & art.** Parchment + double gilt frame on panels; engraved corner
ornaments + a compass rose in the header. Each band gets its colour wash + an
engraved band icon (fern / microscope / lectern) + temperature label. Resources as
engraved token glyphs; **medallions as gilt discs** ringed in the holder's player
colour with the band icon. Hall nodes keep engraved icons in gilt rings; ownership
shown by a player-coloured claim marker + strength (sealed enemy = wax "?"). Player
colours used consistently across medallions, node ownership, and the log.

**C. Clarity.** Prominent **whose-turn banner** (gold "Your turn" vs dimmed
"<Rival> is presenting…"); **legal-move hinting** (clickable cards/nodes get a gilt
hint outline, illegal ones dim; arming a Hall claim highlights valid target nodes);
**what-changed cues** (brief flash on a captured node / passed medallion / built
card, plus floating "+N" resource deltas); medallions show holder + criterion and
flash on pass; a **chain ribbon** (Field → Study → Hall) lighting the active step;
Findings shown as `n/cap` with an over-cap warning tint.

**D. Keep / guards.** Engine untouched (presentation only). No new deps; reuse fonts
+ inline SVG symbols. Self-check button stays. **YAGNI:** no sound, no new art beyond
existing symbols, motion limited to short *informative* transitions (no decorative
animation, per the de-prioritised "motion").

## Phase 2 — review synthesis (3 independent constrained agents)

The single biggest finding (raised by **Skeptic #1** and **Constraint Guardian #2**,
a BLOCKER): the demo's `render()` tears down and rebuilds the whole board via
`innerHTML` after *every* action and *every* AI step. Transient animations — the v0
"what-changed flashes," "floating +N deltas," and a stateful "chain ribbon" — would
be destroyed before they're seen, or flicker. Delivering them as specced forces a
rewrite of the exact render/flow the design promised to leave alone. **This kills
v0's motion-based clarity approach.**

Other high-value objections:
- **Skeptic #3 / User Advocate #7:** legal-move hint outlines that *re-derive*
  legality in the view will desync from the engine; board hints + a separate button
  list = redundant ping-pong.
- **Skeptic #4/#5 / UA #5:** rich chips inflate the 6-card row; the wax-seal **cost**
  badge is meaningless on tableau (activate) chips and free cards.
- **Skeptic #6 / CG #6 / UA #1/#2:** engine cards have **no art/plain-text** fields;
  the readable English ("Up to 4 Specimens → Findings at 1:1") and per-card art live
  only in the *print* file. `effLine` shorthand (`≤4s → 1/1 →Hall`) is cryptic, and
  "full text on hover" via `title` **fails on touch / is undiscoverable**.
- **UA #4 (HIGH):** red-green colorblind collision — Field=green/Hall=red and player
  colors include the *same* red & green; ownership is encoded in **color only**.
- **Skeptic #10:** medallions double-encoding band color + player color clash by
  construction. **Skeptic #12:** a fixed Field→Study→Hall ribbon mismodels the real
  Hall→Field loop-back topology.
- **CG #4 (BLOCKER):** under file:// the icons must be **inlined** (no cross-file
  fetch/external `<use>`); **CG #5:** dedup divergent symbol IDs (`a-coral` differs).
- **UA #8/#9/#10/#12:** Hall modal never states the compare/tie rule; spoilage is
  invisible/punishing; band/lead/medallion vocabulary drifts; faction powers/clock
  "escalating" unexplained.

## Resolutions → revised design (v1)

| # | Objection(s) | Disposition | Resolution in v1 |
|---|---|---|---|
| R1 | Skeptic #1/#2/#14/#16, CG #2, UA #6/#11 (motion vs full-rebuild render) | **ACCEPT** | **Descope transient motion.** Clarity via *render-survivable, state-derived* cues only: a persistent "last-changed" marker (captured node / passed medallion) stored in UI state and re-drawn each render; no floating deltas/flashes. Matches the user's de-prioritisation of motion and removes the blocker. `render()` stays (fine for a turn-based ~20-element board with no continuous animation). |
| R2 | Skeptic #3, UA #7 | **ACCEPT** | Board hinting is driven **from the same legal-action list the buttons already use** (no re-derivation → no desync). Labeled action buttons stay the authoritative menu; board hints are a subtle echo. |
| R3 | Skeptic #4/#5, UA #5, Skeptic #17 | **ACCEPT** | Chip sizing budget (~120px). Band-colour **header bar** + tier as **Roman I/II/III** (drops the invisible/overloaded "pips"). Wax **cost seal only on draftable Field-row chips with cost>0** — never on tableau/activate chips. |
| R4 | Skeptic #6, CG #6, UA #1/#2 | **ACCEPT** | Add a **presentation-only** `cardId → {icon, plainEffect, flavor}` map in the HTML (transcribed from the print file). Chips show **plain-English** effect; **click-to-expand** detail popover (touch-safe) replaces hover-only `title`. Engine still untouched (D4 holds — this is UI data). |
| R5 | CG #4/#3/#5 | **ACCEPT** | Inline the needed `<symbol>`s into the demo `<defs>`, **dedup IDs**; same-document `<use>` only. No fetch/external refs. |
| R6 | Skeptic #8 | **ACCEPT** | Whose-turn **banner + board-dim live OUTSIDE the re-rendered containers**, toggled by the turn loop (render never wipes them). |
| R7 | UA #4, Skeptic #10 | **ACCEPT** | **Non-colour channel everywhere:** each player gets a glyph/initial badge (not colour alone) on medallions, node ownership, opponent panels, log. Medallion = gilt disc with the **band icon**; holder shown as a separate small player badge (band vs holder no longer fight on one disc). Bands identified by **icon + label**, not hue alone. |
| R8 | Skeptic #12 | **ACCEPT** | Replace the fixed pipeline with an **accurate step-trail** of bands visited this turn (handles Hall→Field loop-backs), current band lit. |
| R9 | UA #8/#9 (+ partial Skeptic #11) | **ACCEPT** | Hall modal states the **compare/tie rule** + defines toll/fuel in plain words. Persistent **at/over-cap Findings tint** + a **forewarning** when a conversion would overflow the cap. (No flashy warning — a static tint, so Skeptic #11's "dead UI" risk is avoided.) |
| R10 | UA #10/#12 | **ACCEPT (light)** | Unify "lead a band = hold its medallion" wording; show **your faction power** persistently in the You panel; one-line help on "escalating". |
| R11 | CG #1/#11, Skeptic #14 (perf) | **ACCEPT-by-avoidance** | No continuous animation ⇒ full-rebuild render is adequate at this scale. No render rewrite needed. |
| R12 | Skeptic #9 (sealed owner "info leak") | **REJECT** | Per the rules a Lodged claim's **owner is public** (the marker is placed openly on the node); only its **strength** is sealed. The UI already hides strength (`"?"`). Showing the owner's colour/glyph is correct, not a leak. |
| R13 | Skeptic #15, CG #9 (fonts fall back offline) | **REJECT (out of scope)** | Pre-existing; both source artifacts already load Google Fonts. Bundling font files conflicts with the no-new-assets footprint and is unrelated to "reuse card colours / engagement." Documented; the game still plays fully offline (serif fallback). |

Decisions D1–D4 from v0 stand, amended by R3/R4 (cost seal scoped to draftable
chips; plain-text+icon map added as UI data, engine still untouched). D2 is
**sharpened**: "motion only to aid clarity" → "**no transient motion; clarity is
state-derived and render-survivable.**"

## Phase 3 — Arbitration

**Arbiter review of the revised design (v1) + this log:**
- The one BLOCKER (R1/CG#2) is resolved by descoping transient motion — which also
  *better matches* the user's stated preference (atmosphere + clarity over motion),
  so it's a strict improvement, not a compromise.
- All HIGH/BLOCKER objections are ACCEPTED and addressed (R1–R9), or REJECTED with
  explicit, rules-grounded rationale (R12 sealed-owner; R13 offline fonts).
- No unresolved objection remains. Engine immutability (D4) is preserved — every
  addition is presentation-layer data/markup.
- Scope is bounded (YAGNI honoured): no sound, no new art beyond inlined existing
  symbols, no networked/save features, no render-loop rewrite.

**Disposition: APPROVED** (v1). Cleared for implementation.

## Exit criteria
- [x] Understanding Lock completed & confirmed
- [x] All reviewer agents invoked (Skeptic, Constraint Guardian, User Advocate)
- [x] All objections resolved or explicitly rejected (R1–R13)
- [x] Decision Log complete
- [x] Arbiter declared the design acceptable → **APPROVED**

---

# Round 2 — full card designs + a plane-marker system

Second structured review (multi-agent-brainstorming). User request, verbatim:
"do the full card designs too. Would be nice to use the symbols to be able to
recognize which plane they work in (there already are symbols, but they need a
bit more of a distinct color so they are recognizable). They need to be on the
cards when the cards can be used in that plane or on the card, if it has a bonus
action there! That goes for everywhere on the board… Also, are there any other
things that should be represented like that for less cognitive load?"

## Understanding Lock (confirmed against the code)

- **Planes = bands:** Field (collect Specimens) · Study (Specimens→Findings) ·
  Hall (spend Findings → claim nodes). A card is *activated* in its **home plane**.
- A card with a chain **`trigger`** (engine.js card data) grants a free **bonus
  action** in the next plane (Field→Study, Study→Hall, Hall→Field loop-back). In
  the engine that `trigger` field **is** "a bonus action in another plane" — so
  "used in that plane **or** has a bonus action there" = **home band + trigger target**.
- Goal A: in-game cards should look like the **full print-and-play card**
  (`../first-in-the-field-cards.html`). Goal B: a **distinct-colour plane symbol**
  on each card (home plane + any bonus plane) and **everywhere on the board**.
  Goal C: recommend more such markers to cut cognitive load.
- Constraints (unchanged): no build / no deps beyond the linked Google Fonts;
  file://; engine untouched; `render()` rebuilds innerHTML each action/AI step
  (no transient motion); desktop-first; player identity already = colour + glyph ●▲■◆.

## Phase 2 — review synthesis (3 constrained agents)

Two **root errors** were caught (both BLOCKER):
1. **Skeptic #2:** "marker when a card can be *used* in a plane" is unimplementable —
   ~9 cards are **passive-only** (never appear in `legalInitial`/`_*Options`).
   **Skeptic #1:** `trigger` is **not** the only cross-plane effect — node loop-back
   perks (`_loopbackPerks`, engine.js:490) feed Field (Cache→+1 Specimen) / Standing
   (Beacon). So the v0 marrker premise was both under- and over-inclusive.
2. **UA #1:** a `trigger` only *attempts* a chain (the engine grants the step only
   if you have the fuel and can pay/waive the toll). A permanent "bonus-plane" marker
   would tell the player "you can act here now" when they usually can't — the exact
   misleading-marker failure the request is trying to kill.

Plus: **UA core-tension** (user praised the muted look; "distinct colour" must not
mean saturation) and **Skeptic #4/#3** (plane-green≈player-green p2, plane-red≈player-red
p1; shifting Study to azure fights the print deck's hard-coded `#2b5563`); **CG #2**
(full card ×6 on the board, rebuilt in the AI loop = paint storm) with **CG #4** (one
popover instance is fine); **CG #1/Skeptic #7** (symbol dedup is **7 IDs**, not 1 —
`a-fern/beetle/bird/nautilus/coral/microscope/lectern` all already in the demo, three
with divergent bodies); **CG #5** (full-card rules would be a **third** transcription of
already-disagreeing rules text).

## Resolutions → revised design (v1)

| # | Objection(s) | Disposition | Resolution |
|---|---|---|---|
| R2-1 | Skeptic #2 ("used" undefined), Skeptic #1 (trigger ≠ only cross-plane) | **ACCEPT** | Card marker = **home band** (always; a passive card still belongs to its band) + **bonus marker iff `trigger`** (the one cross-plane *action*). Node loop-back perks are node properties → **excluded** from the card-marker system (kept in perk text + the Record). |
| R2-2 | UA #1 (must not read "legal now") | **ACCEPT** | Bonus marker is a **static** card property (small, outlined, leading ▸), **never** lit with the gold `.legal` glow. The live `#chaintrail` + legal glow remain the *only* "act here now" cue. |
| R2-3 | Skeptic #3/#4, UA #2, UA core-tension | **ACCEPT** | **Keep canonical band hues** (`#3f6b43`/`#2b5563`/`#8a3030`) — recognizability from **colouring the glyph itself** (was white) + always glyph+hue, **not** saturation. **Discipline:** plane hue → *chrome* (band frames, marker glyphs, card stripe, trail, medallion icon); player hue → *tokens* (owner rings, ●▲■◆ badges, holders). Never tint a token with a plane hue. |
| R2-4 | UA #3 (find-blue ≈ player-blue), Skeptic #10 (gold overloaded) | **ACCEPT (light)** | **Don't brighten resources.** Keep muted pips aligned spec→Field-green / find→Study-teal at existing desaturation; Standing stays gold **with its inset border** vs the gilt chrome. |
| R2-5 | CG #2 (paint storm), CG #4 (popover OK), UA #5 (sidebar) | **ACCEPT** | **Full print card = the click popover only** (one instance, never in render()/AI loop). **Row (6) = richer mini-cards** within the chip budget: plane home-glyph + small art window (1 extra `<use>` + 1 radial gradient; no `::before/::after`, ≤1 frame shadow) + name + effect + ▸bonus + cost seal. **Tableau/hand = compact chips** (home glyph recoloured in the existing header slot + ▸bonus, CSS only). |
| R2-6 | CG #1, Skeptic #7 (7-ID dedup) | **ACCEPT** | Inline **only missing** art symbols (~27: card art + tactic art + `orn-corner`); the demo's existing 7 are **not** re-added → zero duplicate IDs. Full-card art for those 7 reuses the demo's engravings (minor fidelity tradeoff, documented). |
| R2-7 | CG #5 (third transcription) | **ACCEPT** | Popover rules **reuse `META[cid].e`** (already in the demo) + a derived "chains → {Plane}" line from `CARD.trigger` + derived cost/tier. **No new rules prose.** |
| R2-8 | CG #3 (perf), Skeptic #8 (stripe redundant mid-chain) | **ACCEPT** | Cards/medallions/headers use `<use>` (bounded). **Action buttons use a CSS plane stripe + plane-coloured kicker** (no extra `<use>`); most value on the **initial** menu (3 planes), subdued in the one-plane chain step. Chain trail uses small `<use>` glyphs (≤3). |
| R2-9 | Skeptic #9, UA #6 (toll currency ≠ destination plane) | **ACCEPT (skip marker)** | **No toll plane-badge.** Keep inline toll **cost text**, shown only when actually due this step. |
| R2-10 | UA #7 ("everywhere" vs Tactics), Skeptic #13 (no 4th purple) | **ACCEPT** | Tactics get a **distinct non-plane glyph** (purple lozenge, reusing `--tactic`) + one legend line "Tactics aren't tied to a plane." System reads complete without faking a plane. |
| R2-11 | UA #7 (teaching) | **ACCEPT** | Add a compact **plane legend** on the start screen: Field·fern, Study·microscope, Hall·lectern, Tactic·lozenge (not a plane), and the home vs ▸bonus convention. |
| R2-12 | Skeptic #5 (glyph distinctness) | **ACCEPT** | Plane vocabulary = **exactly** {fern, microscope, lectern}; node **discipline** glyphs (coral/nautilus/beetle/…) are a *separate* vocabulary, never reused as plane cues. |
| R2-13 | Skeptic #11 (narrow wrap) | **ACCEPT (light)** | Desktop-first; row keeps `flex-wrap` → a 2×3 wrap on narrow widths is accepted/documented. |
| R2-14 | Skeptic #6 (px port + overflow) | **ACCEPT** | Full card authored at a fixed px scale; modal centers and caps height with internal scroll so an 88mm-equivalent card never overflows. |
| R2-15 | D-list: node-perk markers; conversion-dialog colours | **REJECT** | Little truthful cross-plane content (UA #8); the Study path has no dialog (Skeptic). Both add a competing colour signal → dropped. |

## Phase 3 — Arbitration

- The two BLOCKERs are fixed at the **root**: the marker rule is redefined off the
  engine's actual structure (home band + `trigger`), and the bonus marker is made a
  static property that can never masquerade as a legal-now cue.
- The colour system is re-grounded on the user's **real** preference (antique/muted):
  distinctness via **coloured glyph + placement**, not saturation — which dissolves
  every plane↔player collision the reviewers raised, without a palette war with the
  print deck.
- "Full card designs" are delivered where they're cheap and high-impact (the popover)
  and *previewed* on the board within the render budget.
- All BLOCKER/HIGH objections ACCEPTED & addressed or (R2-15) REJECTED with rationale.
  Engine untouched; no new deps; no transient motion; colorblind-safe (plane = glyph+hue,
  player = ●▲■◆+hue, never colour alone).

**Disposition: APPROVED** (v1). Cleared for implementation.

## Exit criteria (Round 2)
- [x] Understanding Lock completed & confirmed
- [x] All reviewer agents invoked (Skeptic, Constraint Guardian, User Advocate)
- [x] All objections resolved or explicitly rejected (R2-1…R2-15)
- [x] Decision Log complete
- [x] Arbiter declared the design acceptable → **APPROVED**
