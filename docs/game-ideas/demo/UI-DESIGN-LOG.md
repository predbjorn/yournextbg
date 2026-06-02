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
