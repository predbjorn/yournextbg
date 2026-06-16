/* First in the Field — browser/Node rules engine (JS port of ../sim/engine.py).
 *
 * Faithful to the Python engine and its documented assumptions (see
 * ../sim/README.md), including the ADOPTED faction rebalance (../sim/REBALANCE.md):
 * Collector +1 Specimen on activate only, Polymath +1 Specimen per chain step,
 * Systematist +1 strength on its first claim each round.
 *
 * The turn is exposed as steps (legalInitial / applyAction / legalChain /
 * finishTurn) so the UI can drive a human turn, while `aiTakeTurn` drives a bot.
 * Pure logic — no DOM. Runs under Node for the self-check (`node engine.js`).
 */
(function (root) {
  "use strict";

  const FIELD = "field", STUDY = "study", HALL = "hall";
  const BANDS = [FIELD, STUDY, HALL];
  const TIER_VALUE = { 1: 1, 2: 2, 3: 3 };
  const DEFAULT_COPIES = { 1: 3, 2: 2, 3: 1 };
  const TACTIC_COPIES = 2;
  const EST_SEALED = 3;

  // ---- card data (transcribed from ../sim/cards.py) ----
  // band, tier, cost; trigger; spec/drawTactic (Field); conv{in,out,maxIn},
  // requiresPrime (Study); claim/strBonus/strCap/sealed (Hall); passives[];
  // findingsCapBonus; specPerField; onSuccessClock; onSuccessDrawTactic.
  const C = (o) => Object.assign({
    trigger: null, spec: 0, drawTactic: 0, convIn: 0, convOut: 0, convMaxIn: 0,
    requiresPrime: null, claim: false, strBonus: 0, strCap: null, sealed: false,
    passives: [], findingsCapBonus: 0, specPerField: 0, onSuccessClock: 0,
    onSuccessDrawTactic: 0,
  }, o);

  const CARDS = [
    // FIELD (9)
    C({ id: "collecting_trip", name: "Collecting Trip", band: FIELD, tier: 1, cost: 0, trigger: STUDY, spec: 2 }),
    C({ id: "roadside_botanizing", name: "Roadside Botanizing", band: FIELD, tier: 1, cost: 0, spec: 1, passives: ["spec_first_field_action"] }),
    C({ id: "hired_guide", name: "Hired Guide", band: FIELD, tier: 1, cost: 0, spec: 2, passives: ["view2_draft1"] }),
    C({ id: "patrons_grant", name: "A Patron's Grant", band: FIELD, tier: 2, cost: 2, specPerField: 1 }),
    C({ id: "expedition_upriver", name: "Expedition Upriver", band: FIELD, tier: 2, cost: 2, trigger: STUDY, spec: 4 }),
    C({ id: "naturalists_network", name: "The Naturalist's Network", band: FIELD, tier: 2, cost: 2, spec: 2, passives: ["lead_field_bonus"] }),
    C({ id: "grand_voyage", name: "The Grand Voyage", band: FIELD, tier: 3, cost: 4, trigger: STUDY, spec: 6 }),
    C({ id: "royal_patronage", name: "Royal Patronage", band: FIELD, tier: 3, cost: 5, specPerField: 2, passives: ["field_lead_double"] }),
    C({ id: "rediscovered_cabinet", name: "Rediscovered Cabinet", band: FIELD, tier: 3, cost: 4, spec: 3, drawTactic: 1, passives: ["first_build_cheaper"] }),
    // STUDY (9)
    C({ id: "field_notes", name: "Field Notes", band: STUDY, tier: 1, cost: 0, convIn: 2, convOut: 1, convMaxIn: 2 }),
    C({ id: "pressing_pinning", name: "Pressing & Pinning", band: STUDY, tier: 1, cost: 0, trigger: HALL, convIn: 3, convOut: 1, convMaxIn: 3 }),
    C({ id: "classify", name: "Classify", band: STUDY, tier: 2, cost: 2, trigger: HALL, convIn: 1, convOut: 1, convMaxIn: 4 }),
    C({ id: "dissection_bench", name: "Dissection Bench", band: STUDY, tier: 2, cost: 2, convIn: 3, convOut: 2, convMaxIn: 3 }),
    C({ id: "camera_lucida", name: "Camera Lucida", band: STUDY, tier: 2, cost: 2, findingsCapBonus: 1, passives: ["first_conv_1to1_round"] }),
    C({ id: "shared_microscope", name: "Shared Microscope", band: STUDY, tier: 2, cost: 3, convIn: 1, convOut: 1, convMaxIn: 5, requiresPrime: "microscope" }),
    C({ id: "great_atlas", name: "The Great Atlas", band: STUDY, tier: 3, cost: 4, findingsCapBonus: 2, passives: ["first_conv_1to1_season"] }),
    C({ id: "standardized_system", name: "A Standardized System", band: STUDY, tier: 3, cost: 5, passives: ["all_conv_1to1", "study_lead_double"] }),
    C({ id: "engravers_workshop", name: "Engraver's Workshop", band: STUDY, tier: 3, cost: 4, trigger: HALL, convIn: 1, convOut: 1, convMaxIn: 4, requiresPrime: "engraver", passives: ["no_decay_round"] }),
    // HALL (8)
    C({ id: "present_a_paper", name: "Present a Paper", band: HALL, tier: 1, cost: 0, trigger: FIELD, claim: true, strCap: 3 }),
    C({ id: "read_at_meeting", name: "Read at the Meeting", band: HALL, tier: 1, cost: 0, claim: true, strCap: 2, passives: ["standing_on_success"] }),
    C({ id: "lodge_a_claim", name: "Lodge a Claim", band: HALL, tier: 2, cost: 2, claim: true, sealed: true, strBonus: 1 }),
    C({ id: "monograph", name: "Monograph", band: HALL, tier: 2, cost: 2, trigger: FIELD, claim: true, passives: ["bank_on_excess"] }),
    C({ id: "contested_genus", name: "Contested Genus", band: HALL, tier: 2, cost: 3, claim: true, passives: ["reveal_bonus"] }),
    C({ id: "definitive_revision", name: "The Definitive Revision", band: HALL, tier: 3, cost: 4, trigger: FIELD, claim: true, strBonus: 2 }),
    C({ id: "founding_fellow", name: "Founding Fellow", band: HALL, tier: 3, cost: 5, passives: ["sealed_reveal_bonus_2", "hold_two_fields"] }),
    C({ id: "sensational_discovery", name: "Sensational Discovery", band: HALL, tier: 3, cost: 4, trigger: FIELD, claim: true, onSuccessClock: 1, onSuccessDrawTactic: 1 }),
  ];
  const CARD = {}; CARDS.forEach((c) => (CARD[c.id] = c));
  const STARTERS = ["collecting_trip", "field_notes", "present_a_paper"];

  const TACTICS = [
    { id: "sensational_specimen", name: "A Sensational Specimen", kind: "feint", text: "In a presentation, +2 to your side on reveal." },
    { id: "prior_publication", name: "Prior Publication", kind: "ambush", text: "When defending, discredit one challenging paper before the compare." },
    { id: "whole_new_genus", name: "A Whole New Genus", kind: "overrun", text: "If your claim succeeds, excess Acclaim carries to an adjacent field." },
    { id: "anonymous_referee", name: "Anonymous Referee", kind: "counter", text: "Cancel one Tactic an opponent just revealed." },
    { id: "preemptive_letter", name: "Pre-emptive Letter", kind: "defence", text: "When challenged, +1 defence for each band you lead." },
    { id: "press_sensation", name: "Press Sensation", kind: "tempo", text: "Gain +2 Standing now; advance the clock +1." },
    { id: "borrowed_type_specimen", name: "Borrowed Type Specimen", kind: "toll", text: "Your next presentation this turn ignores the Hall toll." },
    { id: "erratum", name: "Erratum", kind: "recover", text: "After a failed claim, return the spent Findings." },
  ];
  const TACTIC = {}; TACTICS.forEach((t) => (TACTIC[t.id] = t));

  const FACTIONS = [
    { id: "systematist", name: "The Systematist", archetype: "turtle", powers: ["findings_never_decay", "first_claim_str_plus_1"], text: "Findings never decay; +1 strength on your first claim each round." },
    { id: "sensationalist", name: "The Sensationalist", archetype: "warlord", powers: ["contest_ticks_clock", "attack_occupied_plus_1"], text: "Each claim you contest ticks the clock +1; +1 str attacking an occupied field." },
    { id: "polymath", name: "The Polymath", archetype: "comboist", powers: ["ignore_one_toll_per_turn", "specimen_per_chain_step"], text: "Once/turn ignore one toll; +1 Specimen for each chain step you take." },
    { id: "collector", name: "The Collector", archetype: "drafter", powers: ["spec_per_activate_plus_1", "peek_row"], text: "+1 Specimen each time you activate a Field card; peek the row." },
    { id: "illustrator", name: "The Illustrator", archetype: "producer", powers: ["first_conv_1to1_round", "findings_cap_plus_1"], text: "Once/round your first conversion is 1:1; Findings cap +1." },
  ];
  const FACTION = {}; FACTIONS.forEach((f) => (FACTION[f.id] = f));

  const NODES = [
    { id: "botany", name: "Botany", sub: "the Grand Library", perk: "forge", perkText: "Forge: bump one conversion ratio." },
    { id: "entomology", name: "Entomology", sub: "the Cabinet", perk: "cache", perkText: "Cache: draw a Specimen on a loop-back." },
    { id: "ornithology", name: "Ornithology", sub: "the Rostrum", perk: "beacon", perkText: "Beacon: +1 Standing on a loop-back." },
    { id: "geology", name: "Geology", sub: "the Journal", perk: "tollgate", perkText: "Toll-gate: waive one toll per turn." },
    { id: "new_genus", name: "The New Genus", sub: "Open Ground", perk: "open", perkText: "Open ground: the first claim founds it." },
  ];
  const NODE = {}; NODES.forEach((n) => (NODE[n.id] = n));
  const NODE_IDS = NODES.map((n) => n.id);
  const NODE_ADJ = {
    botany: ["entomology"], entomology: ["botany", "ornithology"],
    ornithology: ["entomology", "geology"], geology: ["ornithology", "new_genus"],
    new_genus: ["geology"],
  };

  function buildEngineDeck(copies) {
    copies = copies || DEFAULT_COPIES;
    const d = [];
    CARDS.forEach((c) => { for (let i = 0; i < copies[c.tier]; i++) d.push(c.id); });
    return d;
  }
  function buildTacticDeck(n) {
    n = n || TACTIC_COPIES;
    const d = [];
    TACTICS.forEach((t) => { for (let i = 0; i < n; i++) d.push(t.id); });
    return d;
  }

  // ---- RNG (mulberry32) ----
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  class RNG {
    constructor(seed) { this.next = mulberry32(seed); }
    float() { return this.next(); }
    int(n) { return Math.floor(this.next() * n); }
    shuffle(arr) { for (let i = arr.length - 1; i > 0; i--) { const j = this.int(i + 1); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }
    choice(arr) { return arr[this.int(arr.length)]; }
  }

  function defaultDials(n) {
    return {
      nPlayers: n || 4, findingsCap: 3, fieldRowSize: 6, startSpecimens: 3,
      startTactics: 1, tollAmount: 1, clockLength: 9, escalationThreshold: 5,
      extraRatioSteps: 0, captureGarrisonMode: "excess", specimenCap: null,
      studyLeadMinThroughput: 1, tacticsEnabled: true, maxRounds: 40, maxChainSteps: 40,
    };
  }
  const closeSpace = (d) => d.clockLength + 1;

  // ---- helpers ----
  function newPlayer(idx, factionId, strategy) {
    return {
      idx, faction: FACTION[factionId], strategy,
      specimens: 0, findings: 0, standing: 0,
      tableau: { field: [], study: [], hall: [] }, hand: [],
      throughputLast: 0, throughputNow: 0, startSeat: 0,
      usedFirstFieldAction: false, usedFirstConvRound: false, usedFirstConvSeason: false,
      usedFirstBuildCheaper: false, usedPolymathToll: false, usedTollgate: false,
      usedBorrowedToll: false, usedFirstClaimBonus: false,
    };
  }
  const hasFaction = (p, power) => p.faction.powers.indexOf(power) >= 0;
  function hasPassive(p, flag) {
    for (const b of BANDS) for (const cid of p.tableau[b]) if (CARD[cid].passives.indexOf(flag) >= 0) return true;
    return false;
  }

  // ============================ GAME ============================
  class Game {
    constructor(opts) {
      const { factions, strategies, seed, dials } = opts;
      this.d = Object.assign(defaultDials(factions.length), dials || {});
      this.d.nPlayers = factions.length;
      this.rng = new RNG(seed >>> 0);
      this.seed = seed;
      this.players = factions.map((f, i) => newPlayer(i, f, strategies[i]));
      this.nodes = {}; NODE_IDS.forEach((nid) => (this.nodes[nid] = { owner: null, strength: 0, sealed: false }));
      this.clock = 1;
      this.leads = { field: null, study: null, hall: null };
      this.prime = { microscope: null, engraver: null };
      this.round = 0;
      this.ended = false; this.winner = null; this.winType = ""; this.endedBy = "";
      this.metrics = { rounds: 0, turns: 0, challenges: 0, medChanges: 0, chainSteps: 0 };
      this.log = [];
      this.turnEvents = [];
      this._setup();
    }

    say(msg) { this.turnEvents.push(msg); this.log.push(msg); }

    _setup() {
      this.deck = buildEngineDeck(this.d.deckCopies);
      this.rng.shuffle(this.deck);
      this.tacticDeck = buildTacticDeck(this.d.tacticCopies);
      this.rng.shuffle(this.tacticDeck);
      this.row = [];
      for (let i = 0; i < this.d.fieldRowSize; i++) { const c = this._drawCard(); if (c) this.row.push(c); }
      const order = this.players.map((p) => p.idx);
      this.rng.shuffle(order);
      this.priority = order.slice();
      order.forEach((idx, seat) => {
        const p = this.players[idx];
        p.startSeat = seat;
        p.specimens = this.d.startSpecimens;
        STARTERS.forEach((cid) => p.tableau[CARD[cid].band].push(cid));
        for (let k = 0; k < this.d.startTactics; k++) { const t = this._drawTactic(); if (t) p.hand.push(t); }
      });
      this._recomputeLeads();
    }
    _drawCard() { return this.deck.length ? this.deck.pop() : null; }
    _drawTactic() { return (this.d.tacticsEnabled && this.tacticDeck.length) ? this.tacticDeck.pop() : null; }

    // ---- derived ----
    specimenCap(p) {
      if (this.d.specimenCap == null) return null;
      return this.d.specimenCap + (hasFaction(p, "specimen_cap_plus_2") ? 2 : 0);
    }
    findingsCap(p) {
      let cap = this.d.findingsCap;
      for (const b of BANDS) for (const cid of p.tableau[b]) cap += CARD[cid].findingsCapBonus;
      if (hasFaction(p, "findings_cap_plus_1")) cap += 1;
      return cap;
    }
    fieldCollection(p) {
      let t = 0;
      for (const cid of p.tableau.field) { const c = CARD[cid]; let v = TIER_VALUE[c.tier]; if (c.passives.indexOf("field_lead_double") >= 0) v *= 2; t += v; }
      return t;
    }
    nodesHeld(idx) { return NODE_IDS.reduce((a, nid) => a + (this.nodes[nid].owner === idx ? 1 : 0), 0); }
    strengthHeld(idx) { return NODE_IDS.reduce((a, nid) => a + (this.nodes[nid].owner === idx ? this.nodes[nid].strength : 0), 0); }

    _argmaxUnique(scores, minValue) {
      scores = scores.slice().sort((a, b) => (b[0] - a[0]) || (b[1] - a[1]) || (b[2] - a[2]));
      const best = scores[0];
      if (best[0] < minValue) return null;
      if (scores.length > 1 && scores[1][0] === best[0] && scores[1][1] === best[1]) return null;
      return best[2];
    }
    leadsField() { return this._argmaxUnique(this.players.map((p) => [this.fieldCollection(p), -p.tableau.field.length, p.idx]), 1); }
    leadsStudy() {
      return this._argmaxUnique(this.players.map((p) => {
        let v = p.throughputLast; if (hasPassive(p, "study_lead_double")) v *= 2; return [v, 0, p.idx];
      }), this.d.studyLeadMinThroughput);
    }
    leadsHall() { return this._argmaxUnique(this.players.map((p) => [this.nodesHeld(p.idx), this.strengthHeld(p.idx), p.idx]), 1); }
    _recomputeLeads() {
      const nw = { field: this.leadsField(), study: this.leadsStudy(), hall: this.leadsHall() };
      for (const b of BANDS) if (nw[b] !== this.leads[b]) this.metrics.medChanges++;
      this.leads = nw;
    }
    medallions(idx) { return BANDS.reduce((a, b) => a + (this.leads[b] === idx ? 1 : 0), 0); }

    // ---- costs / tolls / ratios ----
    buildCost(p, card) {
      let cost = (this.d.buildCostOverride && this.d.buildCostOverride[card.tier] != null) ? this.d.buildCostOverride[card.tier] : card.cost;
      if (cost > 0 && hasPassive(p, "first_build_cheaper") && !p.usedFirstBuildCheaper) cost = Math.max(0, cost - 1);
      return cost;
    }
    tollDue(p, band, isChain) {
      if (!isChain && !this.d.tollOnPaidAction) return 0;
      if (this.leads[band] === p.idx) return 0;
      return this.d.tollAmount;
    }
    _tryWaiveToll(p, band) {
      if (NODE_IDS.some((nid) => this.nodes[nid].owner === p.idx && NODE[nid].perk === "tollgate") && !p.usedTollgate) { p.usedTollgate = true; return true; }
      if (hasFaction(p, "ignore_one_toll_per_turn") && !p.usedPolymathToll) { p.usedPolymathToll = true; return true; }
      if (band === HALL && p.usedBorrowedToll) return true;
      return false;
    }
    payToll(p, band, isChain) {
      const toll = this.tollDue(p, band, isChain);
      if (toll <= 0) return true;
      if (this._tryWaiveToll(p, band)) { this.say(`(toll into the ${band} waived)`); return true; }
      const cur = band === STUDY ? "specimens" : "findings";
      if (p[cur] >= toll) { p[cur] -= toll; this.say(`(paid ${toll} ${cur} toll into the ${band})`); return true; }
      if (p.standing >= 1) { p.standing -= 1; this.say(`(spent 1 Standing to waive the ${band} toll)`); return true; }
      return false;
    }
    effectiveInPer(p, card) {
      let inPer = card.convIn - (this.d.extraRatioSteps || 0);
      if (hasPassive(p, "all_conv_1to1")) return 1;
      const hasRound = hasPassive(p, "first_conv_1to1_round") || hasFaction(p, "first_conv_1to1_round");
      const hasSeason = hasPassive(p, "first_conv_1to1_season");
      if (hasRound && !p.usedFirstConvRound) return 1;
      if (hasSeason && !p.usedFirstConvSeason) return 1;
      if (NODE_IDS.some((nid) => this.nodes[nid].owner === p.idx && NODE[nid].perk === "forge")) inPer -= 1;
      return Math.max(1, inPer);
    }
    _consumeOneshotRatio(p) {
      const hasRound = hasPassive(p, "first_conv_1to1_round") || hasFaction(p, "first_conv_1to1_round");
      const hasSeason = hasPassive(p, "first_conv_1to1_season");
      if (hasRound && !p.usedFirstConvRound) p.usedFirstConvRound = true;
      else if (hasSeason && !p.usedFirstConvSeason) p.usedFirstConvSeason = true;
    }
    primeAvailable(p, tool) { const o = this.prime[tool]; return o == null || o === p.idx; }

    // ---- legal actions ----
    legalInitial(p) { return [].concat(this._fieldOptions(p), this._studyOptions(p, false), this._hallOptions(p, false)); }
    legalChain(p, band) {
      if (band === FIELD) return this._fieldOptions(p);
      if (band === STUDY) return this._studyOptions(p, true);
      if (band === HALL) return this._hallOptions(p, true);
      return [];
    }
    _fieldOptions(p) {
      const out = []; const seen = {};
      for (const cid of this.row) {
        if (seen[cid]) continue; seen[cid] = 1;
        if (this.buildCost(p, CARD[cid]) <= p.specimens) out.push({ kind: "survey", cardId: cid });
      }
      if (this.deck.length && hasPassive(p, "view2_draft1")) {
        const top = this.deck[this.deck.length - 1];
        if (this.buildCost(p, CARD[top]) <= p.specimens) out.push({ kind: "survey", cardId: top, fromDeck: true });
      }
      const fseen = {};
      for (const cid of p.tableau.field) { if (fseen[cid]) continue; fseen[cid] = 1; out.push({ kind: "field", cardId: cid }); }
      return out;
    }
    _studyOptions(p, chain) {
      const out = []; const toll = this.tollDue(p, STUDY, chain);
      const seen = {};
      for (const cid of p.tableau.study) {
        if (seen[cid]) continue; seen[cid] = 1;
        const card = CARD[cid];
        if (card.convMaxIn <= 0) continue;
        if (card.requiresPrime && !this.primeAvailable(p, card.requiresPrime)) continue;
        const inPer = this.effectiveInPer(p, card);
        if (p.specimens >= inPer + (toll || 0)) {
          const feed = Math.min(p.specimens - (toll || 0), card.convMaxIn);
          out.push({ kind: "study", cardId: cid, spend: feed });
        }
      }
      return out;
    }
    _hallOptions(p, chain) {
      const out = []; const toll = this.tollDue(p, HALL, chain);
      const avail = p.findings - (toll || 0);
      if (avail < 0) return out;
      const seen = {};
      for (const cid of p.tableau.hall) {
        if (seen[cid]) continue; seen[cid] = 1;
        const card = CARD[cid];
        if (!card.claim) continue;
        for (const nid of NODE_IDS) {
          const node = this.nodes[nid];
          if (card.sealed && node.owner != null && node.owner !== p.idx) continue;
          let spend = card.strCap == null ? avail : Math.min(avail, card.strCap);
          spend = Math.max(0, spend);
          const strength = spend + card.strBonus;
          if (!card.sealed && strength < 1) continue;
          out.push({ kind: "hall", cardId: cid, nodeId: nid, spend, sealed: card.sealed });
        }
      }
      return out;
    }

    // ---- execution ----
    applyAction(p, act, isChain) {
      if (!act || act.kind === "pass" || act.kind === "stop") return null;
      if (act.kind === "survey") return this._doSurvey(p, act);
      if (act.kind === "field") return this._doField(p, act);
      if (act.kind === "study") return this._doStudy(p, act, isChain);
      if (act.kind === "hall") return this._doHall(p, act, isChain);
      return null;
    }
    fieldActionBonus(p, isSurvey) {
      let bonus = 0;
      for (const b of BANDS) for (const cid of p.tableau[b]) bonus += CARD[cid].specPerField;
      if (hasFaction(p, "spec_per_activate_plus_1") && !isSurvey) bonus += 1;
      if (!p.usedFirstFieldAction && hasPassive(p, "spec_first_field_action")) bonus += 1;
      if (this.leads[FIELD] === p.idx && hasPassive(p, "lead_field_bonus")) bonus += 1;
      return bonus;
    }
    gainSpecimens(p, n) {
      p.specimens += n;
      const cap = this.specimenCap(p);
      if (cap != null && p.specimens > cap) p.specimens = cap;
    }
    _doSurvey(p, act) {
      const card = CARD[act.cardId];
      const cost = this.buildCost(p, card);
      if (cost > 0 && hasPassive(p, "first_build_cheaper")) p.usedFirstBuildCheaper = true;
      p.specimens -= cost;
      p.tableau[card.band].push(card.id);
      if (act.fromDeck) { if (this.deck.length && this.deck[this.deck.length - 1] === act.cardId) this.deck.pop(); }
      else { const i = this.row.indexOf(act.cardId); if (i >= 0) this.row.splice(i, 1); const nc = this._drawCard(); if (nc) this.row.push(nc); }
      const b = this.fieldActionBonus(p, true);
      this.gainSpecimens(p, b);
      p.usedFirstFieldAction = true;
      this.say(`drafts ${card.name}${cost ? ` (−${cost} Spec)` : ""}${b ? ` (+${b} Spec)` : ""}.`);
      this._recomputeLeads();
      return null;
    }
    _doField(p, act) {
      const card = CARD[act.cardId];
      const gain = card.spec + this.fieldActionBonus(p, false);
      this.gainSpecimens(p, gain);
      p.usedFirstFieldAction = true;
      let extra = "";
      if (card.drawTactic) for (let i = 0; i < card.drawTactic; i++) { const t = this._drawTactic(); if (t) { p.hand.push(t); extra = ` (drew a Tactic)`; } }
      this.say(`activates ${card.name}: +${gain} Specimens${extra}.`);
      this._recomputeLeads();
      return card.trigger;
    }
    _doStudy(p, act, isChain) {
      const card = CARD[act.cardId];
      if (!this.payToll(p, STUDY, isChain)) return null;
      if (card.requiresPrime) { if (!this.primeAvailable(p, card.requiresPrime)) return null; this.prime[card.requiresPrime] = p.idx; }
      const inPer = this.effectiveInPer(p, card);
      if (inPer === 1 && card.convIn > 1 && !hasPassive(p, "all_conv_1to1") &&
        !NODE_IDS.some((nid) => this.nodes[nid].owner === p.idx && NODE[nid].perk === "forge")) this._consumeOneshotRatio(p);
      const feed = Math.min(act.spend, p.specimens, card.convMaxIn);
      const batches = Math.floor(feed / inPer);
      if (batches <= 0) { this.say(`activates ${card.name}, but cannot convert.`); return card.trigger; }
      const consumed = batches * inPer, produced = batches * card.convOut;
      p.specimens -= consumed; p.findings += produced; p.throughputNow += produced;
      this.say(`activates ${card.name}: ${consumed} Spec → ${produced} Findings.`);
      this._recomputeLeads();
      return card.trigger;
    }
    _doHall(p, act, isChain) {
      const card = CARD[act.cardId], node = this.nodes[act.nodeId];
      if (!this.payToll(p, HALL, isChain)) return null;
      let spend = Math.min(act.spend, p.findings);
      if (card.strCap != null) spend = Math.min(spend, card.strCap);
      spend = Math.max(0, spend);
      p.findings -= spend;
      let baseStr = spend + card.strBonus;
      if (hasFaction(p, "first_claim_str_plus_1") && !p.usedFirstClaimBonus) { baseStr += 1; p.usedFirstClaimBonus = true; }
      // attacker feint: from explicit act.tactics (human) or AI heuristic
      baseStr += this._attackerTactics(p, card, node, act);
      const rival = node.owner != null && node.owner !== p.idx;
      const nm = NODE[act.nodeId].name;
      if (!rival) return this._resolveUncontested(p, card, act.nodeId, baseStr, spend, nm);
      return this._resolveChallenge(p, card, act.nodeId, baseStr, spend, nm);
    }
    _resolveUncontested(p, card, nid, strength, spend, nm) {
      const node = this.nodes[nid];
      if (strength < 1) { this.say(`presents at ${nm}, but the claim founds nothing.`); return card.trigger === FIELD ? null : card.trigger; }
      if (node.owner === p.idx) { node.strength = Math.max(node.strength, strength); this.say(`reinforces ${nm} (str ${node.strength}).`); }
      else { node.owner = p.idx; node.strength = strength; this.say(`${card.sealed ? "lodges a sealed claim at" : "claims"} ${nm} (str ${card.sealed ? "?" : strength}).`); }
      node.sealed = card.sealed;
      this._onClaimSuccess(p, card);
      this._tickClockForClaim(p, card, true, false);
      this._recomputeLeads();
      if (card.trigger === FIELD) { this._loopbackPerks(p); return FIELD; }
      return card.trigger;
    }
    _resolveChallenge(p, card, nid, attackStr, spend, nm) {
      const node = this.nodes[nid], defender = this.players[node.owner];
      this.metrics.challenges++;
      if (hasFaction(p, "attack_occupied_plus_1")) attackStr += 1;
      let defStr = node.strength;
      if (node.sealed && hasPassive(defender, "sealed_reveal_bonus_2")) defStr += 2;
      if (!node.sealed && hasPassive(defender, "reveal_bonus")) defStr += 1;
      let ambush = false;
      if (this.d.tacticsEnabled) { const r = this._defenderTactics(defender, p, defStr, attackStr); defStr = r.def; ambush = r.ambush; }
      this._tickClockForClaim(p, card, null, true);
      this.say(`challenges ${defender.faction.name} at ${nm}: ${attackStr} vs ${defStr}.`);
      if (ambush) { this._failAttack(p, card, spend, defender, true); this._recomputeLeads(); return null; }
      if (attackStr > defStr) {
        this._capture(p, card, nid, attackStr, defStr, spend, nm);
        this._onClaimSuccess(p, card);
        this._tickEscalation(p, true);
        this._recomputeLeads();
        if (card.trigger === FIELD) { this._loopbackPerks(p); return FIELD; }
        return card.trigger;
      } else if (attackStr === defStr) {
        node.owner = null; node.strength = 0; node.sealed = false;
        this.say(`both papers are discredited; ${nm} falls empty.`);
        this._recomputeLeads(); return null;
      } else {
        this._failAttack(p, card, spend, defender, true);
        this.say(`the claim is repelled; ${defender.faction.name} holds ${nm} (+1 Standing).`);
        this._recomputeLeads(); return null;
      }
    }
    _capture(p, card, nid, attackStr, defStr, spend, nm) {
      const node = this.nodes[nid], excess = attackStr - defStr;
      node.owner = p.idx;
      node.strength = this.d.captureGarrisonMode === "full" ? attackStr : Math.max(1, excess);
      node.sealed = false;
      this.say(`captures ${nm}! (now str ${node.strength})`);
      if (card.passives.indexOf("bank_on_excess") >= 0 && excess > 0) p.findings += 1;
      this._maybeOverrun(p, nid, excess);
    }
    _failAttack(p, card, spend, defender, gainStanding) {
      if (this.d.tacticsEnabled && p.hand.indexOf("erratum") >= 0 && spend > 0) { p.hand.splice(p.hand.indexOf("erratum"), 1); p.findings += spend; this.say(`plays Erratum to recover ${spend} Findings.`); }
      if (gainStanding) defender.standing += 1;
    }
    _onClaimSuccess(p, card) {
      if (card.passives.indexOf("standing_on_success") >= 0) p.standing += 1;
      if (card.onSuccessClock) this._tickClock(card.onSuccessClock);
      if (card.onSuccessDrawTactic) for (let i = 0; i < card.onSuccessDrawTactic; i++) { const t = this._drawTactic(); if (t) p.hand.push(t); }
    }
    _loopbackPerks(p) {
      for (const nid of NODE_IDS) {
        if (this.nodes[nid].owner !== p.idx) continue;
        const perk = NODE[nid].perk;
        if (perk === "cache") { this.gainSpecimens(p, 1); this.say(`(Cache: +1 Specimen)`); }
        else if (perk === "beacon") { p.standing += 1; this.say(`(Beacon: +1 Standing)`); }
      }
    }
    _tickClock(n) { this.clock += (n || 1); }
    _tickClockForClaim(p, card, success, contested) {
      if (contested) { this._tickClock(1); if (hasFaction(p, "contest_ticks_clock")) this._tickClock(1); }
      if (!contested && success) this._tickEscalation(p, true);
    }
    _tickEscalation(p, success) { if (success && this.clock >= this.d.escalationThreshold) this._tickClock(1); }

    // ---- tactics ----
    _attackerTactics(p, card, node, act) {
      if (!this.d.tacticsEnabled) return 0;
      const rival = node.owner != null && node.owner !== p.idx;
      // explicit human choice
      if (act && act.tactics && act.tactics.indexOf("sensational_specimen") >= 0 && p.hand.indexOf("sensational_specimen") >= 0) {
        p.hand.splice(p.hand.indexOf("sensational_specimen"), 1); this.say(`reveals A Sensational Specimen (+2)!`); return 2;
      }
      if (act && act.human) return 0; // human chose not to
      // AI heuristic
      if (rival && p.hand.indexOf("sensational_specimen") >= 0 && ["warlord", "comboist", "greedy"].indexOf(p.strategy) >= 0) {
        p.hand.splice(p.hand.indexOf("sensational_specimen"), 1); this.say(`reveals A Sensational Specimen (+2)!`); return 2;
      }
      return 0;
    }
    _defenderTactics(defender, attacker, defStr, attackStr) {
      // human defends automatically-optimally (logged); AI uses the same heuristic
      if (defender.hand.indexOf("prior_publication") >= 0 && attackStr > defStr) {
        defender.hand.splice(defender.hand.indexOf("prior_publication"), 1);
        this.say(`${defender.faction.name} reveals Prior Publication — the challenger is discredited!`);
        return { def: defStr, ambush: true };
      }
      if (defender.hand.indexOf("preemptive_letter") >= 0 && attackStr > defStr) {
        const led = this.medallions(defender.idx);
        if (defStr + led >= attackStr) { defender.hand.splice(defender.hand.indexOf("preemptive_letter"), 1); this.say(`${defender.faction.name} plays Pre-emptive Letter (+${led}).`); return { def: defStr + led, ambush: false }; }
      }
      if (defender.hand.indexOf("sensational_specimen") >= 0 && attackStr > defStr && defStr + 2 >= attackStr) {
        defender.hand.splice(defender.hand.indexOf("sensational_specimen"), 1); this.say(`${defender.faction.name} reveals A Sensational Specimen on defence (+2).`); return { def: defStr + 2, ambush: false };
      }
      return { def: defStr, ambush: false };
    }
    _maybeOverrun(p, nid, excess) {
      if (!this.d.tacticsEnabled || excess <= 0 || p.hand.indexOf("whole_new_genus") < 0) return;
      for (const adj of NODE_ADJ[nid]) {
        const n = this.nodes[adj];
        if (n.owner == null || (n.owner !== p.idx && n.strength < excess)) {
          p.hand.splice(p.hand.indexOf("whole_new_genus"), 1);
          if (n.owner == null) { n.owner = p.idx; n.strength = Math.max(1, excess); n.sealed = false; }
          else { n.owner = p.idx; n.strength = Math.max(1, excess - n.strength); n.sealed = false; }
          this.say(`A Whole New Genus carries to ${NODE[adj].name}!`);
          return;
        }
      }
    }
    playTempo(p) {
      if (this.d.tacticsEnabled && p.hand.indexOf("press_sensation") >= 0) {
        p.hand.splice(p.hand.indexOf("press_sensation"), 1); p.standing += 2; this._tickClock(1);
        this.say(`${p.faction.name} plays Press Sensation: +2 Standing, clock +1.`); return true;
      }
      return false;
    }

    // ---- turn lifecycle ----
    beginTurn(p) {
      p.throughputNow = 0; p.usedPolymathToll = false; p.usedTollgate = false; p.usedBorrowedToll = false;
    }
    finishTurn(p) {
      const noDecay = hasFaction(p, "findings_never_decay") || hasPassive(p, "no_decay_round");
      if (!noDecay) { const cap = this.findingsCap(p); if (p.findings > cap) { this.say(`${p.findings - cap} Findings spoil.`); p.findings = cap; } }
      p.throughputLast = p.throughputNow;
    }

    startRound() {
      const prev = {}; this.priority.forEach((idx, pos) => (prev[idx] = pos));
      this.priority = this.players.map((p) => p.idx).sort((a, b) => (this.players[b].standing - this.players[a].standing) || (prev[a] - prev[b]));
      this.prime = { microscope: null, engraver: null };
      for (const p of this.players) { p.usedFirstFieldAction = false; p.usedFirstConvRound = false; p.usedFirstBuildCheaper = false; p.usedFirstClaimBonus = false; }
    }
    knockoutWinner() { for (const p of this.players) if (this.medallions(p.idx) === 3) return p.idx; return null; }

    finalize() {
      if (this.winner == null) {
        const key = (p) => [this.medallions(p.idx), p.standing, this.fieldCollection(p), p.findings];
        const cmp = (a, b) => { const ka = key(a), kb = key(b); for (let i = 0; i < ka.length; i++) if (ka[i] !== kb[i]) return kb[i] - ka[i]; return 0; };
        const ranked = this.players.slice().sort(cmp);
        const top = ranked[0]; const tied = this.players.filter((p) => cmp(p, top) === 0);
        if (tied.length === 1) { this.winner = top.idx; this.winType = "close"; }
        else { this.winner = Math.min.apply(null, tied.map((t) => t.idx)); this.winType = "tie"; }
      }
      this.ended = true;
    }

    // ---- AI turn (used for bots, AI-vs-AI, self-check) ----
    aiTakeTurn(p, policy) {
      this.beginTurn(p);
      if (policy.startTurn) policy.startTurn(this, p);
      let opts = this.legalInitial(p);
      if (!opts.length) { this.finishTurn(p); this._recomputeLeads(); return; }
      let act = policy.chooseAction(this, p, opts);
      let band = this.applyAction(p, act, false);
      let steps = 0;
      while (band != null && steps < this.d.maxChainSteps) {
        const cs = this.legalChain(p, band);
        if (!cs.length) break;
        const choice = policy.chooseChain(this, p, cs.concat([{ kind: "stop" }]));
        if (!choice || choice.kind === "stop") break;
        this.metrics.chainSteps++; steps++;
        if (hasFaction(p, "specimen_per_chain_step")) this.gainSpecimens(p, 1);
        band = this.applyAction(p, choice, true);
      }
      this.finishTurn(p);
      this._recomputeLeads();
    }

    playToEnd(policies) {
      while (!this.ended) {
        this.round++;
        this.startRound();
        const ko = this.knockoutWinner();
        if (ko != null) { this.endedBy = "knockout"; this.winType = "knockout"; this.winner = ko; this.finalize(); break; }
        for (const idx of this.priority) { this.aiTakeTurn(this.players[idx], policies[idx]); this.metrics.turns++; }
        this.metrics.rounds++;
        if (this.clock >= closeSpace(this.d)) { this.endedBy = "close"; this.finalize(); break; }
        if (this.round >= this.d.maxRounds) { this.endedBy = "max_rounds"; this.finalize(); break; }
      }
      return this.metrics;
    }

    checkInvariants() {
      for (const p of this.players) {
        if (p.specimens < 0 || p.findings < 0 || p.standing < 0) throw new Error(`negative resource p${p.idx}`);
      }
      for (const b of BANDS) { const h = this.leads[b]; if (h != null && (h < 0 || h >= this.d.nPlayers)) throw new Error("bad lead"); }
      for (const nid of NODE_IDS) { const n = this.nodes[nid]; if (n.owner == null && n.strength !== 0) throw new Error(`empty ${nid} has strength`); if (n.owner != null && n.strength < 1) throw new Error(`held ${nid} no strength`); }
    }
  }

  // ============================ AI ============================
  const W = {
    MED: 3.0, LEADPROG: 0.8, FINDINGS: 0.22, SPEC: 0.05, STANDING: 0.25, TIER: 0.18,
    NODE: 1.1, TAKE_LEAD: 0.9, DENY: 0.7, CHAIN: 0.25, TRIGGER_BUILD: 0.2,
  };
  function bestOppCollection(g, me) { let m = 0; for (const p of g.players) if (p.idx !== me.idx) m = Math.max(m, g.fieldCollection(p)); return m; }
  function bestOppThroughput(g, me) { let m = 0; for (const p of g.players) if (p.idx !== me.idx) m = Math.max(m, p.throughputLast); return m; }
  function bestOppNodes(g, me) { let best = 0, who = null; for (const p of g.players) { if (p.idx === me.idx) continue; const k = g.nodesHeld(p.idx); if (k > best) { best = k; who = p.idx; } } return [best, who]; }
  function oppMedLeader(g, me) { for (const p of g.players) if (p.idx !== me.idx && g.medallions(p.idx) >= 2) return p.idx; return null; }
  function defEstimate(g, me, nid) { const n = g.nodes[nid]; if (n.owner == null) return null; if (n.owner !== me.idx && n.sealed) return EST_SEALED; return n.strength; }
  function canConvert(g, me) { return me.tableau.study.some((cid) => CARD[cid].convMaxIn > 0); }
  function canPresent(g, me) { return me.tableau.hall.some((cid) => CARD[cid].claim); }

  function makePolicy(strategy, seed) {
    const rng = new RNG((seed >>> 0) || 1);
    const base = baseWeights(strategy);

    function scoreSurvey(g, me, a) {
      const card = CARD[a.cardId]; let v = 0.45 * TIER_VALUE[card.tier];
      const after = g.fieldCollection(me) + TIER_VALUE[card.tier] * (card.passives.indexOf("field_lead_double") >= 0 ? 2 : 1);
      if (card.band === FIELD && after > bestOppCollection(g, me) && g.leads[FIELD] !== me.idx) v += base.TAKE_LEAD;
      if (card.trigger) v += base.TRIGGER_BUILD;
      v += base.TIER * TIER_VALUE[card.tier];
      if (strategy === "warlord") { if (card.band === STUDY && card.convMaxIn > 0) v += (me.tableau.study.filter((c) => CARD[c].convMaxIn > 0).length < 2 ? 0.9 : 0.2); if (card.band === HALL && card.claim) { const n = me.tableau.hall.filter((c) => CARD[c].claim).length; if (card.sealed && !me.tableau.hall.some((c) => CARD[c].sealed)) v += 1.0; else if (card.strBonus > 0 && n < 2) v += 0.8; else v -= 0.6; } if (card.band === FIELD) v -= 0.2; }
      if (strategy === "comboist") { if (card.trigger) v += 0.8; const have = me.tableau[card.band].some((c) => CARD[c].trigger); if (card.trigger && !have) v += 0.6; }
      return v;
    }
    function scoreField(g, me, a) {
      const card = CARD[a.cardId]; const gain = card.spec + g.fieldActionBonus(me, false);
      let v = base.SPEC * gain;
      if (card.trigger === STUDY && canConvert(g, me)) v += base.CHAIN;
      if (card.drawTactic) v += 0.3;
      return v;
    }
    function scoreStudy(g, me, a) {
      const card = CARD[a.cardId]; const inPer = g.effectiveInPer(me, card);
      const feed = Math.min(a.spend, me.specimens, card.convMaxIn); const batches = inPer ? Math.floor(feed / inPer) : 0;
      const produced = batches * card.convOut; if (produced <= 0) return null;
      let v = base.FINDINGS * produced;
      if (produced > bestOppThroughput(g, me) && g.leads[STUDY] !== me.idx) v += base.TAKE_LEAD;
      if (card.trigger === HALL && canPresent(g, me)) v += base.CHAIN;
      return v;
    }
    function scoreHall(g, me, a) {
      if (base._noHall) return null;                 // pure_turtle: refuse all Hall actions
      const card = CARD[a.cardId], node = g.nodes[a.nodeId], myNodes = g.nodesHeld(me.idx);
      const dEst = defEstimate(g, me, a.nodeId);
      let attack = a.spend + card.strBonus; if (hasFaction(me, "attack_occupied_plus_1") && node.owner != null && node.owner !== me.idx) attack += 1;
      if (node.owner === me.idx) return 0.08;
      if (node.owner == null) {
        let v = base.NODE;
        if (myNodes + 1 > bestOppNodes(g, me)[0] && g.leads[HALL] !== me.idx) v += base.TAKE_LEAD;
        v -= 0.04 * a.spend;
        if (g.medallions(me.idx) === 2 && g.leads[HALL] !== me.idx) v += 4.0;
        return v;
      }
      if (!base.ALLOW_ATTACK) return null;
      if (dEst == null) return null;
      if (attack < dEst + base.ATTACK_MARGIN) return null;
      let v = base.NODE; const leader = oppMedLeader(g, me); const bo = bestOppNodes(g, me)[0];
      if (myNodes + 1 > bo && g.leads[HALL] !== me.idx) v += base.TAKE_LEAD;
      if (node.owner === leader) v += base.DENY + 1.0;
      v -= 0.04 * a.spend;
      if (g.medallions(me.idx) === 2 && g.leads[HALL] !== me.idx) v += 4.0;
      return v;
    }
    function score(g, me, a) {
      if (a.kind === "pass" || a.kind === "stop") return 0;
      if (a.kind === "survey") return scoreSurvey(g, me, a);
      if (a.kind === "field") return scoreField(g, me, a);
      if (a.kind === "study") return scoreStudy(g, me, a);
      if (a.kind === "hall") return scoreHall(g, me, a);
      return 0;
    }
    return {
      name: strategy,
      startTurn(g, me) { if (strategy === "warlord" && me.hand.indexOf("press_sensation") >= 0 && g.clock < closeSpace(g.d) - 1) g.playTempo(me); },
      chooseAction(g, me, opts) {
        let best = null, bestScore = -Infinity;
        for (const a of opts) { let s = score(g, me, a); if (s == null) continue; s += rng.float() * 1e-6; if (s > bestScore) { bestScore = s; best = a; } }
        if (strategy === "random") return rng.choice(opts);
        return best || opts[0];
      },
      chooseChain(g, me, opts) {
        if (strategy === "random") return rng.choice(opts);
        let best = null, bestScore = base.STOP;
        for (const a of opts) { if (a.kind === "stop") continue; let s = score(g, me, a); if (s == null) continue; s += rng.float() * 1e-6; if (s > bestScore) { bestScore = s; best = a; } }
        return best || { kind: "stop" };
      },
      score, // exposed so the UI can rank human hints if desired
    };
  }
  function baseWeights(strategy) {
    const b = Object.assign({ ALLOW_ATTACK: true, ATTACK_MARGIN: 1, STOP: 0.05 }, W);
    if (strategy === "turtle") { b.ALLOW_ATTACK = false; b.TIER = 0.5; b.FINDINGS = 0.2; b.NODE = 0.7; b._noAttack = true; }
    if (strategy === "warlord") { b.NODE = 1.7; b.TAKE_LEAD = 1.6; b.DENY = 1.6; b.TIER = 0.08; b.TRIGGER_BUILD = 0.1; b.ATTACK_MARGIN = 0; b.FINDINGS = 0.5; }
    if (strategy === "comboist") { b.CHAIN = 0.7; b.TRIGGER_BUILD = 0.9; b.STOP = -0.5; }
    if (strategy === "pure_turtle") { b.ALLOW_ATTACK = false; b.TIER = 0.5; b._noHall = true; }
    return b;
  }
  // (turtle / pure_turtle Hall filtering is handled inside scoreHall via base flags.)

  // ============================ exports / self-check ============================
  const API = {
    Game, makePolicy,
    CARDS, CARD, FACTIONS, FACTION, TACTICS, TACTIC, NODES, NODE, NODE_IDS, NODE_ADJ,
    BANDS, FIELD, STUDY, HALL, TIER_VALUE, defaultDials, closeSpace, RNG,
    buildEngineDeck, buildTacticDeck, hasFaction, hasPassive,
  };

  function selfCheck(nGames) {
    nGames = nGames || 500;
    const strats = ["random", "greedy", "turtle", "warlord", "comboist", "pure_turtle"];
    let ko = 0, close = 0, mr = 0, sumRounds = 0;
    for (let s = 0; s < nGames; s++) {
      const n = 2 + (s % 3);
      const factions = [];
      const fids = FACTIONS.map((f) => f.id);
      for (let i = 0; i < n; i++) factions.push(fids[(s + i) % fids.length]);
      const strategies = []; for (let i = 0; i < n; i++) strategies.push(strats[(s * 3 + i) % strats.length]);
      const g = new Game({ factions, strategies, seed: s + 1 });
      const policies = strategies.map((st, i) => API.makePolicy(st, s * 131 + i));
      // step through with invariant checks each turn
      while (!g.ended) {
        g.round++; g.startRound();
        const kw = g.knockoutWinner();
        if (kw != null) { g.endedBy = "knockout"; g.winType = "knockout"; g.winner = kw; g.finalize(); break; }
        for (const idx of g.priority) { g.aiTakeTurn(g.players[idx], policies[idx]); g.checkInvariants(); g.metrics.turns++; }
        g.metrics.rounds++;
        if (g.clock >= closeSpace(g.d)) { g.endedBy = "close"; g.finalize(); break; }
        if (g.round >= g.d.maxRounds) { g.endedBy = "max_rounds"; g.finalize(); break; }
      }
      if (g.winner == null) throw new Error(`no winner seed ${s}`);
      ko += g.endedBy === "knockout"; close += g.endedBy === "close"; mr += g.endedBy === "max_rounds"; sumRounds += g.metrics.rounds;
    }
    return { nGames, avgRounds: (sumRounds / nGames).toFixed(1), ko, close, maxRounds: mr };
  }
  API.selfCheck = selfCheck;

  if (typeof module !== "undefined" && module.exports) module.exports = API;
  root.FITF = API;

  // node CLI
  if (typeof require !== "undefined" && typeof module !== "undefined" && require.main === module) {
    console.log("deck:", buildEngineDeck().length, "tactics:", buildTacticDeck().length, "factions:", FACTIONS.length);
    const t0 = Date.now();
    const r = selfCheck(800);
    console.log("selfCheck:", JSON.stringify(r), `(${Date.now() - t0}ms)`);
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
