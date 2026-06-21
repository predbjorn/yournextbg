/* Cryptids, Trophies & Lanes — browser/Node rules engine.
 *
 * 4 lanes: expedition, field, study, hall.
 * Win condition: hold all 3 trophy medallions (Collector / Systematist / Sensationalist).
 * Lane leads exist for toll purposes only.
 * Export: root.CTL
 * Node CLI: node engine.js  → runs selfCheck
 */
(function (root) {
  "use strict";

  const EXPEDITION = "expedition", FIELD = "field", STUDY = "study", HALL = "hall";
  const LANES = [EXPEDITION, FIELD, STUDY, HALL];
  const SET_IDS = ["winged", "terrestrial", "botanical", "legendary", "anomalous"];
  const DEFAULT_COPIES = { 1: 3, 2: 2, 3: 1 };

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

  // ---- species data ----
  const SPECIES_DATA = [
    // Common (8) — findings:1, 1 field
    { id:"house_sparrow",  name:"House Sparrow",  rarity:"common",     sets:["winged"],               fields:["winged"],               findings:1, isDubious:false, flavour:"An empire's most familiar colonist" },
    { id:"click_beetle",   name:"Click Beetle",   rarity:"common",     sets:["terrestrial"],           fields:["terrestrial"],          findings:1, isDubious:false, flavour:"One snap and it rights itself" },
    { id:"common_fern",    name:"Common Fern",    rarity:"common",     sets:["botanical"],             fields:["botanical"],            findings:1, isDubious:false, flavour:"Older than flowers" },
    { id:"garden_snail",   name:"Garden Snail",   rarity:"common",     sets:["terrestrial"],           fields:["terrestrial"],          findings:1, isDubious:false, flavour:"The hedgerow's slowest traveller" },
    { id:"reed_warbler",   name:"Reed Warbler",   rarity:"common",     sets:["winged"],               fields:["winged"],               findings:1, isDubious:false, flavour:"Song from the fen's murk" },
    { id:"wood_anemone",   name:"Wood Anemone",   rarity:"common",     sets:["botanical"],             fields:["botanical"],            findings:1, isDubious:false, flavour:"Carpets the oakwood in April" },
    { id:"stag_beetle",    name:"Stag Beetle",    rarity:"common",     sets:["terrestrial"],           fields:["terrestrial"],          findings:1, isDubious:false, flavour:"A knight in miniature armour" },
    { id:"common_toad",    name:"Common Toad",    rarity:"common",     sets:["anomalous"],             fields:["wetlands"],             findings:1, isDubious:false, flavour:"Ugly, patient, indispensable" },
    // Rare (7) — findings:2
    { id:"bird_of_paradise", name:"Bird of Paradise", rarity:"rare",   sets:["winged"],               fields:["winged","tropical"],    findings:2, isDubious:false, flavour:"A living jewel from the far canopy" },
    { id:"goliath_beetle", name:"Goliath Beetle",  rarity:"rare",     sets:["terrestrial","anomalous"],fields:["terrestrial","tropical"],findings:2, isDubious:false, flavour:"The heaviest insect known to science" },
    { id:"titan_arum",     name:"Titan Arum",     rarity:"rare",     sets:["botanical"],             fields:["botanical","tropical"], findings:2, isDubious:false, flavour:"Blooms once, reeks magnificently" },
    { id:"axolotl",        name:"Axolotl",        rarity:"rare",     sets:["anomalous"],             fields:["wetlands"],             findings:2, isDubious:false, flavour:"Eternal youth, gilled and laughing" },
    { id:"snow_leopard",   name:"Snow Leopard",   rarity:"rare",     sets:["terrestrial"],           fields:["terrestrial","mountain"],findings:2, isDubious:false, flavour:"Ghost of the high passes" },
    { id:"lyrebird",       name:"Lyrebird",       rarity:"rare",     sets:["winged","anomalous"],    fields:["winged","tropical"],    findings:2, isDubious:false, flavour:"The forest's greatest mimic" },
    { id:"corpse_flower",  name:"Corpse Flower",  rarity:"rare",     sets:["botanical","anomalous"], fields:["botanical","mountain"], findings:2, isDubious:false, flavour:"Smells of death, seeds of wonder" },
    // Sensational (6) — findings:3, multi-field
    { id:"platypus",       name:"Platypus",       rarity:"sensational", sets:["terrestrial","anomalous"], fields:["terrestrial","wetlands"],  findings:3, isDubious:false, flavour:"The committee rejected it as a hoax" },
    { id:"archaeopteryx",  name:"Archaeopteryx",  rarity:"sensational", sets:["winged","anomalous"],     fields:["winged","geological"],    findings:3, isDubious:false, flavour:"Stone feathers, living question" },
    { id:"giant_squid",    name:"Giant Squid",    rarity:"sensational", sets:["anomalous"],              fields:["marine","geological"],    findings:3, isDubious:false, flavour:"Dragged into legend by the sperm whale" },
    { id:"welwitschia",    name:"Welwitschia",    rarity:"sensational", sets:["botanical","anomalous"],  fields:["botanical","geological"], findings:3, isDubious:false, flavour:"Two leaves, two thousand years" },
    { id:"okapi",          name:"Okapi",          rarity:"sensational", sets:["terrestrial"],           fields:["terrestrial","tropical"],  findings:3, isDubious:false, flavour:"The forest giraffe nobody believed in" },
    { id:"coelacanth",     name:"Coelacanth",     rarity:"sensational", sets:["anomalous"],              fields:["marine","geological"],    findings:3, isDubious:false, flavour:"Forty million years of silence, then a net" },
    // Dubious / Legendary (6) — isDubious:true
    { id:"kraken",         name:"Kraken",         rarity:"legendary",  sets:["legendary","anomalous"], fields:["marine"],               findings:2, isDubious:true,  flavour:"The harbour-master's worst nightmare" },
    { id:"feejee_mermaid", name:"Feejee Mermaid", rarity:"legendary",  sets:["legendary"],             fields:["marine","wetlands"],    findings:2, isDubious:true,  flavour:"Half fish, all fraud" },
    { id:"vegetable_lamb", name:"Vegetable Lamb", rarity:"legendary",  sets:["legendary","botanical"], fields:["botanical"],            findings:2, isDubious:true,  flavour:"Grows on stalks, bleats at dawn" },
    { id:"sea_serpent",    name:"Sea Serpent",    rarity:"legendary",  sets:["legendary"],             fields:["marine"],               findings:3, isDubious:true,  flavour:"Every sailor has seen one" },
    { id:"jackalope",      name:"Jackalope",      rarity:"legendary",  sets:["legendary","terrestrial"],fields:["terrestrial"],         findings:2, isDubious:true,  flavour:"Antlered, swift, disputed" },
    { id:"yeti",           name:"Yeti",           rarity:"legendary",  sets:["legendary","terrestrial"],fields:["mountain"],            findings:3, isDubious:true,  flavour:"The print in the snow that no one can explain" },
  ];
  const SPECIES = {}; SPECIES_DATA.forEach((s) => (SPECIES[s.id] = s));

  // ---- engine card data ----
  const E = (o) => Object.assign({
    trigger: null, mountCost: 0, draws: 0, hazardProtection: 0,
    passiveSpecOnBank: 0, sightingBonus: 0,
    spec: 0, specPerField: 0, specWhileLead: 0,
    convIn: 0, convOut: 0, convMaxIn: 0, findingsCapBonus: 0, neverDecay: false,
    claim: false, strBonus: 0, strCap: null, sealed: false,
    standingBonus: 0, bankExcess: false, openRevealBonus: false, clockBonus: 0,
    countsDouble: false,
  }, o);

  const CARDS = [
    // Expedition (7)
    E({ id:"naturalists_pack",  name:"Naturalist's Pack",   band:EXPEDITION, tier:1, cost:0, mountCost:1, draws:1, hazardProtection:0 }),
    E({ id:"field_compass",     name:"Field Compass",       band:EXPEDITION, tier:1, cost:0, mountCost:1, draws:1, hazardProtection:0, passiveSpecOnBank:1 }),
    E({ id:"survey_permit",     name:"Survey Permit",       band:EXPEDITION, tier:2, cost:2, mountCost:2, draws:2, hazardProtection:0 }),
    E({ id:"charter_vessel",    name:"Charter Vessel",      band:EXPEDITION, tier:2, cost:3, mountCost:2, draws:3, hazardProtection:0, sightingBonus:1 }),
    E({ id:"deep_expedition",   name:"Deep Expedition",     band:EXPEDITION, tier:2, cost:2, mountCost:3, draws:3, hazardProtection:1 }),
    E({ id:"royal_commission",  name:"Royal Commission",    band:EXPEDITION, tier:3, cost:5, mountCost:3, draws:4, hazardProtection:2 }),
    E({ id:"ghost_map",         name:"Ghost Map",           band:EXPEDITION, tier:3, cost:4, mountCost:2, draws:2, hazardProtection:0, trigger:FIELD }),
    // Field (8)
    E({ id:"specimen_hunt",          name:"Specimen Hunt",          band:FIELD, tier:1, cost:0, spec:2 }),
    E({ id:"local_guide",            name:"Local Guide",            band:FIELD, tier:1, cost:0, spec:1, specPerField:1 }),
    E({ id:"botanical_survey",       name:"Botanical Survey",       band:FIELD, tier:1, cost:0, spec:2, trigger:STUDY, typedField:"botanical" }),
    E({ id:"marsh_survey",           name:"Marsh Survey",           band:FIELD, tier:2, cost:2, spec:4, typedField:"wetlands" }),
    E({ id:"mountain_expedition_card",name:"Mountain Expedition",   band:FIELD, tier:2, cost:2, spec:4, trigger:STUDY, typedField:"mountain" }),
    E({ id:"network_of_informants",  name:"Network of Informants",  band:FIELD, tier:2, cost:2, spec:2, specWhileLead:1 }),
    E({ id:"fossil_dig",             name:"Fossil Dig",             band:FIELD, tier:3, cost:4, spec:6, trigger:STUDY, typedField:"geological" }),
    E({ id:"patronage_contract",     name:"Patronage Contract",     band:FIELD, tier:3, cost:5, specPerField:2, countsDouble:true }),
    // Study (8)
    E({ id:"field_journal",      name:"Field Journal",      band:STUDY, tier:1, cost:0, convIn:2, convOut:1, convMaxIn:4 }),
    E({ id:"pressing_board",     name:"Pressing Board",     band:STUDY, tier:1, cost:0, convIn:3, convOut:1, convMaxIn:3, trigger:HALL }),
    E({ id:"taxonomy_manual",    name:"Taxonomy Manual",    band:STUDY, tier:2, cost:2, convIn:1, convOut:1, convMaxIn:8, trigger:HALL }),
    E({ id:"dissection_lab",     name:"Dissection Lab",     band:STUDY, tier:2, cost:2, convIn:3, convOut:2, convMaxIn:3 }),
    E({ id:"photography_kit",    name:"Photography Kit",    band:STUDY, tier:2, cost:2, convIn:1, convOut:1, convMaxIn:4, findingsCapBonus:1 }),
    E({ id:"reference_library",  name:"Reference Library",  band:STUDY, tier:3, cost:4, convIn:1, convOut:1, convMaxIn:10, trigger:HALL, findingsCapBonus:1 }),
    E({ id:"comparative_method", name:"Comparative Method", band:STUDY, tier:3, cost:5, convIn:1, convOut:1, convMaxIn:99, countsDouble:true }),
    E({ id:"darkroom",           name:"Darkroom",           band:STUDY, tier:3, cost:4, convIn:1, convOut:1, convMaxIn:8, trigger:HALL, neverDecay:true }),
    // Hall (8)
    E({ id:"field_report",       name:"Field Report",       band:HALL, tier:1, cost:0, claim:true, strBonus:0, trigger:FIELD }),
    E({ id:"monograph",          name:"Monograph",          band:HALL, tier:1, cost:0, claim:true, strBonus:0, standingBonus:1 }),
    E({ id:"systematic_paper",   name:"Systematic Paper",   band:HALL, tier:2, cost:2, claim:true, sealed:true, strBonus:1 }),
    E({ id:"illustrated_plate",  name:"Illustrated Plate",  band:HALL, tier:2, cost:2, claim:true, strBonus:0, trigger:FIELD, bankExcess:true }),
    E({ id:"rival_nomenclature", name:"Rival Nomenclature", band:HALL, tier:2, cost:3, claim:true, strBonus:1, openRevealBonus:true }),
    E({ id:"definitive_monograph",name:"Definitive Monograph",band:HALL,tier:3, cost:4, claim:true, strBonus:2, trigger:FIELD }),
    E({ id:"society_fellow",     name:"Society Fellow",     band:HALL, tier:3, cost:5, claim:true, sealed:true, strBonus:2 }),
    E({ id:"sensational_report", name:"Sensational Report", band:HALL, tier:3, cost:4, claim:true, strBonus:0, trigger:FIELD, clockBonus:1 }),
  ];
  const CARD = {}; CARDS.forEach((c) => (CARD[c.id] = c));

  // starter cards given to each player at setup
  const STARTERS = ["naturalists_pack", "field_journal", "field_report"];

  const TACTICS = [
    { id:"sensational_specimen", name:"A Sensational Specimen", text:"Add 2 to your strength on a naming challenge." },
    { id:"prior_publication",    name:"Prior Publication",      text:"Cancel a rival's naming attempt before it resolves." },
    { id:"whole_new_genus",      name:"A Whole New Genus",      text:"Name a species as if you have all its field prerequisites." },
    { id:"anonymous_referee",    name:"Anonymous Referee",      text:"Force a Verification on any Dubious species in the market." },
    { id:"preemptive_letter",    name:"Pre-emptive Letter",     text:"Protect your named species from one challenge this round." },
    { id:"press_sensation",      name:"Press Sensation",        text:"+3 Standing immediately." },
    { id:"borrowed_specimen",    name:"Borrowed Specimen",      text:"Copy another player's typed field access this turn." },
    { id:"erratum",              name:"Erratum",                text:"Remove one of your own Sighting tokens from any fraud bag." },
  ];
  const TACTIC = {}; TACTICS.forEach((t) => (TACTIC[t.id] = t));

  const FACTIONS = [
    { id:"collector",     name:"The Collector",     archetype:"ACCUMULATOR", text:"On each Field action, gain +1 Specimen." },
    { id:"systematist",   name:"The Systematist",   archetype:"PRECISION",   text:"+1 strength when naming species that require 2+ fields." },
    { id:"sensationalist",name:"The Sensationalist",archetype:"RISK-TAKER",  text:"Dubious species cost 1 fewer Finding to name. May name Dubious species without all field prereqs." },
    { id:"expeditioner",  name:"The Expeditioner",  archetype:"EXPLORER",    text:"Hazards on Expeditions are ignored once per turn. Gain +1 Sighting token when banking an Expedition." },
    { id:"forger",        name:"The Forger",        archetype:"SABOTEUR",    text:"Once per round, may spend 1 Standing to add a Doubt-weighted token to any species' evidence bag." },
  ];
  const FACTION = {}; FACTIONS.forEach((f) => (FACTION[f.id] = f));

  const DISCOVERY_COMPOSITION = [
    "specimen","specimen","specimen","specimen",
    "finding","finding",
    "sighting","sighting",
    "hazard","hazard","hazard",
  ];

  // ---- dials ----
  function defaultDials(n) {
    return {
      nPlayers: n || 4,
      findingsCap: 3,
      rowSize: 5,
      speciesMarketSize: 6,
      startSpecimens: 3,
      startSightings: 2,
      startTactics: 1,
      clockLength: 12,
      escalationThreshold: 8,
      maxRounds: 40,
      maxChainSteps: 6,
      minVerifyTokens: 2,
    };
  }

  // ---- deck builders ----
  function buildEngineDeck(copies) {
    copies = copies || DEFAULT_COPIES;
    const d = [];
    CARDS.forEach((c) => { for (let i = 0; i < (copies[c.tier] || 1); i++) d.push(c.id); });
    return d;
  }
  function buildTacticDeck(n) {
    n = n || 2;
    const d = [];
    TACTICS.forEach((t) => { for (let i = 0; i < n; i++) d.push(t.id); });
    return d;
  }
  function buildDiscoveryDeck(rng) {
    return rng.shuffle([...DISCOVERY_COMPOSITION]);
  }

  // ---- player factory ----
  function newPlayer(idx, factionId, strategy) {
    return {
      idx, faction: FACTION[factionId], strategy,
      specimens: 0, findings: 0, standing: 0, sightings: 0,
      tableau: { expedition:[], field:[], study:[], hall:[] },
      hand: [],
      namedCount: 0,
      completedSets: [],
      confirmedDubious: 0,
      typedFields: {},
      expeditionActive: false,
      expeditionBanked: [],
      expeditionDepth: 0,
      expeditionProtection: 0,
      expeditionCardId: null,
      lastTurnConverted: 0,
      findingsGainedThisTurn: 0,
      usedFirstFieldBonus: false,
      usedLoopback: false,
      usedForgerAbility: false,
      usedHazardProtection: false,
    };
  }

  // ============================ GAME ============================
  class Game {
    constructor(opts) {
      const { factions, strategies, seed, dials } = opts;
      this.d = Object.assign(defaultDials(factions.length), dials || {});
      this.d.nPlayers = factions.length;
      this.rng = new RNG(seed >>> 0);
      this.seed = seed;
      this.round = 0; this.clock = 0;
      this.ended = false; this.winner = null; this.winType = null; this.endedBy = null;
      this.players = factions.map((f, i) => newPlayer(i, f, strategies[i]));
      this.row = [];
      this.deck = [];
      this.speciesMarket = [];
      this.speciesDeck = [];
      this.namedSpecies = [];
      this.discoveryDeck = [];
      this.fraudBags = {};
      this.leads = { expedition: null, field: null, study: null, hall: null };
      this.tacticDeck = [];
      this.metrics = { rounds: 0, turns: 0, chains: 0, challenges: 0, expeditions: 0, verifications: 0 };
      this.log = [];
      this.turnEvents = [];
      this._setup();
    }

    say(msg) { this.turnEvents.push(msg); this.log.push(msg); }

    _setup() {
      // Engine card deck
      this.deck = buildEngineDeck();
      this.rng.shuffle(this.deck);
      // Remove starter card IDs from deck proportionally (best-effort)
      for (const sid of STARTERS) {
        const i = this.deck.indexOf(sid);
        if (i >= 0) this.deck.splice(i, 1);
      }
      // Row
      for (let i = 0; i < this.d.rowSize; i++) { const c = this._drawCard(); if (c) this.row.push(c); }
      // Tactic deck
      this.tacticDeck = buildTacticDeck(2);
      this.rng.shuffle(this.tacticDeck);
      // Species market
      this.speciesDeck = this.rng.shuffle(SPECIES_DATA.map((s) => s.id));
      for (let i = 0; i < this.d.speciesMarketSize; i++) this._dealSpecies();
      // Discovery deck
      this.discoveryDeck = buildDiscoveryDeck(this.rng);
      // Players
      const order = this.players.map((p) => p.idx);
      this.rng.shuffle(order);
      this.priority = order.slice();
      order.forEach((idx) => {
        const p = this.players[idx];
        p.specimens = this.d.startSpecimens;
        p.sightings = this.d.startSightings;
        STARTERS.forEach((cid) => p.tableau[CARD[cid].band].push(cid));
        for (let k = 0; k < this.d.startTactics; k++) { const t = this._drawTactic(); if (t) p.hand.push(t); }
      });
      this._recomputeLeads();
    }

    _drawCard() { return this.deck.length ? this.deck.pop() : null; }
    _drawTactic() { return this.tacticDeck.length ? this.tacticDeck.pop() : null; }
    _drawDiscovery() {
      if (!this.discoveryDeck.length) this.discoveryDeck = buildDiscoveryDeck(this.rng);
      return this.discoveryDeck.pop();
    }
    _dealSpecies() {
      if (!this.speciesDeck.length) return;
      const sid = this.speciesDeck.pop();
      this.speciesMarket.push(sid);
      // Init fraud bag when dubious species enters market
      if (SPECIES[sid].isDubious && !this.fraudBags[sid]) {
        this.fraudBags[sid] = {
          truthToken: this.rng.float() < 0.67 ? "genuine" : "hoax",
          sightings: [], verified: false, result: null,
        };
      }
    }

    // ---- derived ----
    findingsCap(p) {
      let cap = this.d.findingsCap;
      for (const b of [FIELD, STUDY, HALL]) for (const cid of p.tableau[b]) cap += (CARD[cid].findingsCapBonus || 0);
      return cap;
    }
    gainSpecimens(p, n) { p.specimens = Math.max(0, p.specimens + n); }

    // Field lead: sum of spec values in field tableau (patronage_contract countsDouble = double tier value)
    _fieldScore(p) {
      let t = 0;
      for (const cid of p.tableau.field) {
        const c = CARD[cid];
        const v = c.spec || 0;
        t += c.countsDouble ? v * 2 : v;
      }
      return t;
    }
    _expeditionScore(p) { return p.tableau.expedition.length; }

    _argmaxUnique(scores) {
      // scores = [[value, tiebreak, idx], ...]
      const s = scores.slice().sort((a, b) => (b[0] - a[0]) || (b[1] - a[1]));
      if (!s.length || s[0][0] <= 0) return null;
      if (s.length > 1 && s[1][0] === s[0][0] && s[1][1] === s[0][1]) return null;
      return s[0][2];
    }

    collectorLead()      { return this._argmaxUnique(this.players.map((p) => [p.namedCount, p.standing, p.idx])); }
    systematistLead()    { return this._argmaxUnique(this.players.map((p) => [p.completedSets.length, p.namedCount, p.idx])); }
    sensationalistLead() { return this._argmaxUnique(this.players.map((p) => [p.confirmedDubious, p.standing, p.idx])); }
    medallions(idx) {
      let t = 0;
      if (this.collectorLead() === idx) t++;
      if (this.systematistLead() === idx) t++;
      if (this.sensationalistLead() === idx) t++;
      return t;
    }
    knockoutWinner() { for (const p of this.players) if (this.medallions(p.idx) === 3) return p.idx; return null; }

    _recomputeLeads() {
      this.leads.expedition = this._argmaxUnique(this.players.map((p) => [this._expeditionScore(p), p.standing, p.idx]));
      this.leads.field      = this._argmaxUnique(this.players.map((p) => [this._fieldScore(p), p.standing, p.idx]));
      this.leads.study      = this._argmaxUnique(this.players.map((p) => [p.lastTurnConverted, p.standing, p.idx]));
      this.leads.hall       = this._argmaxUnique(this.players.map((p) => [p.namedCount, p.standing, p.idx]));
    }

    // ---- legal actions ----
    legalInitial(p) {
      const out = [];
      // build from row
      const seen = {};
      for (const cid of this.row) {
        if (seen[cid]) continue; seen[cid] = true;
        if (CARD[cid].cost <= p.specimens) out.push({ kind:"build", cardId:cid });
      }
      // expedition
      const eseen = {};
      for (const cid of p.tableau.expedition) {
        if (eseen[cid]) continue; eseen[cid] = true;
        if (CARD[cid].mountCost <= p.specimens) out.push({ kind:"expedition", cardId:cid });
      }
      // field
      const fseen = {};
      for (const cid of p.tableau.field) {
        if (fseen[cid]) continue; fseen[cid] = true;
        out.push({ kind:"field", cardId:cid });
      }
      // study (initial only)
      const sseen = {};
      for (const cid of p.tableau.study) {
        if (sseen[cid]) continue; sseen[cid] = true;
        const c = CARD[cid];
        if (c.convMaxIn <= 0) continue;
        const spend = Math.min(p.specimens, c.convMaxIn);
        if (spend >= c.convIn) out.push({ kind:"study", cardId:cid, spend });
      }
      // hall naming (initial)
      out.push(...this._hallOptions(p, false));
      // sighting
      if (p.sightings > 0) {
        for (const sid of this.speciesMarket) {
          if (SPECIES[sid].isDubious) out.push({ kind:"sighting", speciesId:sid });
        }
      }
      // verify
      for (const sid of this.speciesMarket) {
        if (!SPECIES[sid].isDubious) continue;
        const bag = this.fraudBags[sid];
        if (bag && !bag.verified && bag.sightings.length >= this.d.minVerifyTokens) out.push({ kind:"verify", speciesId:sid });
      }
      return out;
    }

    legalChain(p, band) {
      if (band === FIELD) {
        const out = [];
        const fseen = {};
        for (const cid of p.tableau.field) {
          if (fseen[cid]) continue; fseen[cid] = true;
          out.push({ kind:"field", cardId:cid });
        }
        return out;
      }
      if (band === STUDY) {
        const out = []; const sseen = {};
        for (const cid of p.tableau.study) {
          if (sseen[cid]) continue; sseen[cid] = true;
          const c = CARD[cid]; if (c.convMaxIn <= 0) continue;
          const toll = this.leads.study === p.idx ? 0 : 1;
          const avail = p.specimens - toll;
          if (avail < c.convIn) continue;
          out.push({ kind:"study", cardId:cid, spend: Math.min(avail, c.convMaxIn) });
        }
        return out;
      }
      if (band === HALL) return this._hallOptions(p, true);
      return [];
    }

    _hallOptions(p, isChain) {
      const out = [];
      const toll = isChain ? (this.leads.hall === p.idx ? 0 : 1) : 0;
      const seen = {};
      for (const cid of p.tableau.hall) {
        if (seen[cid]) continue; seen[cid] = true;
        const card = CARD[cid]; if (!card.claim) continue;
        for (const sid of this.speciesMarket) {
          const sp = SPECIES[sid];
          // cost
          let cost = sp.findings;
          if (p.faction.id === "sensationalist" && sp.isDubious) cost = Math.max(0, cost - 1);
          const avail = p.findings - toll;
          if (avail < cost) continue;
          // field prereqs
          if (p.faction.id === "sensationalist" && sp.isDubious) {
            // skip prereq check
          } else if (!sp.fields.every((f) => p.typedFields[f])) continue;
          out.push({ kind:"hall", cardId:cid, speciesId:sid, spend:cost, isChain });
        }
      }
      return out;
    }

    // ---- action execution ----
    applyAction(p, act, isChain) {
      if (!act || act.kind === "stop") return null;
      if (act.kind === "build") return this._doBuild(p, act);
      if (act.kind === "field") return this._doField(p, act);
      if (act.kind === "study") return this._doStudy(p, act, isChain);
      if (act.kind === "hall") return this._doHall(p, act, isChain);
      if (act.kind === "expedition") { this._doExpedition(p, act); return p.expeditionActive ? "expedition-active" : null; }
      if (act.kind === "expedition-press") { this._doExpeditionPress(p); return p.expeditionActive ? "expedition-active" : null; }
      if (act.kind === "expedition-bank") return this._doExpeditionBank(p);
      if (act.kind === "sighting") { this._addSightingToBag(p, act.speciesId); return null; }
      if (act.kind === "verify") { this._doVerify(p, act.speciesId); return null; }
      return null;
    }

    _doBuild(p, act) {
      const card = CARD[act.cardId];
      p.specimens -= card.cost;
      p.tableau[card.band].push(card.id);
      const i = this.row.indexOf(act.cardId);
      if (i >= 0) this.row.splice(i, 1);
      const nc = this._drawCard(); if (nc) this.row.push(nc);
      this.say(`drafts ${card.name}${card.cost ? ` (−${card.cost} Spec)` : ""}.`);
      this._recomputeLeads();
      return null;
    }

    _doField(p, act) {
      const card = CARD[act.cardId];
      let gain = card.spec || 0;
      if (p.faction.id === "collector") gain += 1;
      if (card.specPerField && !p.usedFirstFieldBonus) { gain += card.specPerField; p.usedFirstFieldBonus = true; }
      if (card.specWhileLead && this.leads.field === p.idx) gain += card.specWhileLead;
      this.gainSpecimens(p, gain);
      if (card.typedField) p.typedFields[card.typedField] = true;
      this.say(`activates ${card.name}: +${gain} Specimens${card.typedField ? ` (${card.typedField} access)` : ""}.`);
      this._recomputeLeads();
      return card.trigger || null;
    }

    _doStudy(p, act, isChain) {
      const card = CARD[act.cardId];
      if (isChain && this.leads.study !== p.idx) {
        if (p.specimens < 1) return null;
        p.specimens -= 1;
        this.say(`(paid 1 Spec toll into study)`);
      }
      let feed = Math.min(act.spend, p.specimens, card.convMaxIn);
      const batches = card.convIn > 0 ? Math.floor(feed / card.convIn) : 0;
      if (batches <= 0) { this.say(`activates ${card.name}, no conversion.`); return card.trigger || null; }
      const consumed = batches * card.convIn;
      let produced = batches * card.convOut;
      // comparative_method countsDouble: if leads study, double output
      if (card.countsDouble && this.leads.study === p.idx) produced *= 2;
      p.specimens -= consumed;
      p.findings += produced;
      p.findingsGainedThisTurn += produced;
      this.say(`activates ${card.name}: ${consumed} Spec → ${produced} Findings.`);
      this._recomputeLeads();
      return card.trigger || null;
    }

    _doHall(p, act, isChain) {
      const card = CARD[act.cardId];
      const sp = SPECIES[act.speciesId];
      // toll
      if (isChain && this.leads.hall !== p.idx) {
        if (p.findings < 1) return null;
        p.findings -= 1;
        this.say(`(paid 1 Finding toll into hall)`);
      }
      let cost = sp.findings;
      if (p.faction.id === "sensationalist" && sp.isDubious) cost = Math.max(0, cost - 1);
      if (p.findings < cost) return null;
      let strength = cost + card.strBonus;
      if (p.faction.id === "systematist" && sp.fields.length >= 2) strength += 1;
      // check if already named
      const existing = this.namedSpecies.find((ns) => ns.speciesId === act.speciesId);
      if (existing && existing.namedBy !== p.idx) {
        // challenge
        this.metrics.challenges++;
        const defender = this.players[existing.namedBy];
        const defStr = existing.strength;
        this.say(`challenges ${defender.faction.name} for ${sp.name}: ${strength} vs ${defStr}.`);
        if (strength > defStr) {
          // attacker wins
          p.findings -= cost;
          existing.namedBy = p.idx; existing.strength = strength;
          p.namedCount++; defender.namedCount = Math.max(0, defender.namedCount - 1);
          this.say(`${p.faction.name} wrests ${sp.name} from ${defender.faction.name}!`);
          if (card.standingBonus) p.standing += card.standingBonus;
          if (card.bankExcess && strength > cost) p.findings += 1;
          if (card.clockBonus) this.clock += card.clockBonus;
        } else if (strength === defStr) {
          // tie — entry removed
          p.findings -= cost;
          const idx2 = this.namedSpecies.indexOf(existing);
          this.namedSpecies.splice(idx2, 1);
          defender.namedCount = Math.max(0, defender.namedCount - 1);
          this.say(`Both papers discredited — ${sp.name} falls unclaimed.`);
        } else {
          // defender holds
          p.findings -= cost;
          defender.standing += 1;
          this.say(`Claim repelled; ${defender.faction.name} holds ${sp.name} (+1 Standing).`);
        }
      } else if (existing && existing.namedBy === p.idx) {
        // reinforce own claim
        p.findings -= cost;
        existing.strength = Math.max(existing.strength, strength);
        this.say(`reinforces claim on ${sp.name} (str ${existing.strength}).`);
      } else {
        // uncontested
        p.findings -= cost;
        this.namedSpecies.push({ speciesId: act.speciesId, namedBy: p.idx, strength, round: this.round });
        p.namedCount++;
        this.say(`${p.faction.name} names ${sp.name}!`);
        if (card.standingBonus) p.standing += card.standingBonus;
        if (card.bankExcess && strength > cost) p.findings += 1;
        if (card.openRevealBonus && !card.sealed) p.standing += 1;
        if (card.clockBonus) this.clock += card.clockBonus;
      }
      this._checkSetCompletion(p);
      this._recomputeLeads();
      // replenish species market
      if (this.speciesMarket.indexOf(act.speciesId) >= 0) {
        this.speciesMarket.splice(this.speciesMarket.indexOf(act.speciesId), 1);
        this._dealSpecies();
      }
      return card.trigger || null;
    }

    _doExpedition(p, act) {
      const card = CARD[act.cardId];
      if (p.specimens < card.mountCost) return;
      p.specimens -= card.mountCost;
      p.expeditionActive = true;
      p.expeditionBanked = [];
      p.expeditionDepth = 0;
      p.expeditionProtection = card.hazardProtection;
      p.expeditionCardId = card.id;
      p.usedHazardProtection = false;
      this.say(`begins expedition with ${card.name}.`);
      for (let i = 0; i < card.draws; i++) {
        if (!p.expeditionActive) break;
        this._resolveDiscoveryDraw(p, this._drawDiscovery());
      }
    }

    _doExpeditionPress(p) {
      if (!p.expeditionActive) return;
      this._resolveDiscoveryDraw(p, this._drawDiscovery());
    }

    _resolveDiscoveryDraw(p, token) {
      if (token === "hazard") {
        if (p.faction.id === "expeditioner" && !p.usedHazardProtection) {
          p.usedHazardProtection = true;
          this.say(`hazard! (Expeditioner ignores it)`);
        } else if (p.expeditionProtection > 0) {
          p.expeditionProtection--;
          this.say(`hazard! (protection absorbs it, ${p.expeditionProtection} left)`);
        } else {
          p.expeditionActive = false;
          p.expeditionBanked = [];
          this.say(`hazard! Expedition busted — all discoveries lost.`);
        }
      } else {
        p.expeditionBanked.push(token);
        p.expeditionDepth++;
        this.say(`found: ${token} (depth ${p.expeditionDepth})`);
      }
    }

    _doExpeditionBank(p) {
      if (!p.expeditionActive) return null;
      const card = CARD[p.expeditionCardId];
      for (const token of p.expeditionBanked) {
        if (token === "specimen") this.gainSpecimens(p, 1);
        else if (token === "finding") { p.findings = Math.min(this.findingsCap(p), p.findings + 1); p.findingsGainedThisTurn++; }
        else if (token === "sighting") p.sightings++;
      }
      if (card.passiveSpecOnBank) this.gainSpecimens(p, card.passiveSpecOnBank);
      if (p.faction.id === "expeditioner") p.sightings++;
      if (card.sightingBonus) p.sightings += card.sightingBonus;
      this.say(`banks expedition: ${p.expeditionBanked.join(", ") || "nothing"}.`);
      p.expeditionActive = false;
      p.expeditionBanked = [];
      p.expeditionCardId = null;
      this.metrics.expeditions++;
      return card.trigger || null;
    }

    _addSightingToBag(p, speciesId) {
      if (p.sightings < 1) return false;
      p.sightings--;
      if (!this.fraudBags[speciesId]) {
        this.fraudBags[speciesId] = { truthToken: this.rng.float() < 0.67 ? "genuine" : "hoax", sightings:[], verified:false, result:null };
      }
      this.fraudBags[speciesId].sightings.push({ playerIdx: p.idx });
      this.say(`adds Sighting token to ${SPECIES[speciesId].name}'s evidence bag.`);
      return true;
    }

    _doVerify(p, speciesId) {
      if (!this.fraudBags[speciesId]) {
        this.fraudBags[speciesId] = { truthToken: this.rng.float() < 0.67 ? "genuine" : "hoax", sightings:[], verified:false, result:null };
      }
      const bag = this.fraudBags[speciesId];
      if (bag.verified) return;
      if (bag.sightings.length < this.d.minVerifyTokens) return;
      const counts = {};
      for (const s of bag.sightings) counts[s.playerIdx] = (counts[s.playerIdx] || 0) + 1;
      let top = null, topCount = 0;
      for (const [pidx, cnt] of Object.entries(counts)) {
        if (cnt > topCount) { topCount = cnt; top = parseInt(pidx); }
      }
      bag.verified = true; bag.result = bag.truthToken;
      const sp = SPECIES[speciesId];
      if (bag.truthToken === "genuine") {
        this.players[top].standing += 4;
        this.players[top].confirmedDubious++;
        if (!this.namedSpecies.find((ns) => ns.speciesId === speciesId && ns.namedBy === top)) {
          this.namedSpecies.push({ speciesId, namedBy: top, strength: 0, round: this.round });
          this.players[top].namedCount++;
        }
        this.say(`GENUINE! ${sp.name} confirmed — ${this.players[top].faction.name} vindicated (+4 Standing).`);
        this._checkSetCompletion(this.players[top]);
      } else {
        const penalty = Math.min(topCount, 4);
        this.players[top].standing = Math.max(0, this.players[top].standing - penalty);
        const prevLen = this.namedSpecies.length;
        this.namedSpecies = this.namedSpecies.filter((ns) => !(ns.speciesId === speciesId && ns.namedBy === top));
        if (this.namedSpecies.length < prevLen) {
          this.players[top].namedCount = Math.max(0, this.players[top].namedCount - 1);
        }
        this.say(`HOAX! ${sp.name} debunked — ${this.players[top].faction.name} disgraced (−${penalty} Standing).`);
      }
      this._recomputeLeads();
      this.metrics.verifications++;
    }

    _checkSetCompletion(p) {
      for (const setId of SET_IDS) {
        if (p.completedSets.indexOf(setId) >= 0) continue;
        const needed = SPECIES_DATA.filter((s) => s.sets.indexOf(setId) >= 0);
        const owned = needed.filter((s) => this.namedSpecies.some((ns) => ns.speciesId === s.id && ns.namedBy === p.idx));
        if (owned.length === needed.length) {
          p.completedSets.push(setId);
          this._grantSetBonus(p, setId);
          this.say(`${p.faction.name} completes the ${setId} set!`);
        }
      }
    }

    _grantSetBonus(p, setId) {
      if (setId === "winged")      { p.findings = Math.min(this.findingsCap(p), p.findings + 2); }
      else if (setId === "terrestrial") { this.gainSpecimens(p, 3); }
      else if (setId === "botanical")   { p.standing += 2; }
      else if (setId === "legendary")   { p.confirmedDubious += 1; }
      else if (setId === "anomalous")   { const t = this._drawTactic(); if (t) p.hand.push(t); }
    }

    // ---- turn lifecycle ----
    beginTurn(p) {
      p.typedFields = {};
      p.usedFirstFieldBonus = false;
      p.usedLoopback = false;
      p.expeditionActive = false;
      p.findingsGainedThisTurn = 0;
    }

    finishTurn(p) {
      // findings decay unless neverDecay card in tableau
      const noDecay = p.tableau.study.some((cid) => CARD[cid].neverDecay);
      if (!noDecay) {
        const cap = this.findingsCap(p);
        if (p.findings > cap) { this.say(`${p.findings - cap} Findings spoil.`); p.findings = cap; }
      }
      p.lastTurnConverted = p.findingsGainedThisTurn;
      p.findingsGainedThisTurn = 0;
    }

    startRound() {
      const prev = {}; this.priority.forEach((idx, pos) => (prev[idx] = pos));
      this.priority = this.players.map((p) => p.idx).sort((a, b) =>
        (this.players[b].standing - this.players[a].standing) || (prev[a] - prev[b])
      );
      for (const p of this.players) p.usedForgerAbility = false;
    }

    finalize() {
      if (this.winner == null) {
        const key = (p) => [this.medallions(p.idx), p.standing, p.namedCount];
        const cmp = (a, b) => { const ka = key(a), kb = key(b); for (let i = 0; i < ka.length; i++) if (ka[i] !== kb[i]) return kb[i] - ka[i]; return 0; };
        const ranked = this.players.slice().sort(cmp);
        const top = ranked[0];
        const tied = this.players.filter((p) => cmp(p, top) === 0);
        if (tied.length === 1) { this.winner = top.idx; this.winType = "close"; }
        else { this.winner = Math.min(...tied.map((t) => t.idx)); this.winType = "tie"; }
      }
      this.ended = true;
    }

    // ---- AI turn ----
    aiTakeTurn(p, policy) {
      this.beginTurn(p);
      const opts = this.legalInitial(p);
      if (!opts.length) { this.finishTurn(p); return; }
      let act = policy.chooseAction(this, p, opts);
      if (!act) { this.finishTurn(p); return; }

      // expedition sub-loop
      if (act.kind === "expedition") {
        this._doExpedition(p, act);
        while (p.expeditionActive && policy.shouldPress(this, p)) {
          this._doExpeditionPress(p);
        }
        if (p.expeditionActive) this._doExpeditionBank(p);
        // chain from expedition bank trigger
        const expCard = CARD[act.cardId];
        let chainBand = expCard.trigger || null;
        let steps = 0;
        while (chainBand && steps < this.d.maxChainSteps) {
          if (chainBand === FIELD && p.usedLoopback) break;
          const cs = this.legalChain(p, chainBand);
          if (!cs.length) break;
          const choice = policy.chooseChain(this, p, cs.concat([{ kind:"stop" }]));
          if (!choice || choice.kind === "stop") break;
          steps++; this.metrics.chains++;
          if (chainBand === FIELD) p.usedLoopback = true;
          chainBand = this.applyAction(p, choice, true);
        }
      } else {
        let band = this.applyAction(p, act, false);
        let steps = 0;
        while (band && band !== "expedition-active" && steps < this.d.maxChainSteps) {
          if (band === FIELD && p.usedLoopback) break;
          const cs = this.legalChain(p, band);
          if (!cs.length) break;
          const choice = policy.chooseChain(this, p, cs.concat([{ kind:"stop" }]));
          if (!choice || choice.kind === "stop") break;
          steps++; this.metrics.chains++;
          if (band === FIELD) p.usedLoopback = true;
          band = this.applyAction(p, choice, true);
        }
      }
      this.finishTurn(p);
    }

    playToEnd(policies) {
      while (!this.ended) {
        this.round++;
        this.startRound();
        const ko = this.knockoutWinner();
        if (ko != null) { this.endedBy = "knockout"; this.winType = "knockout"; this.winner = ko; this.finalize(); break; }
        for (const idx of this.priority) { this.aiTakeTurn(this.players[idx], policies[idx]); this.metrics.turns++; }
        this.metrics.rounds++;
        if (this.clock >= this.d.clockLength) { this.endedBy = "close"; this.finalize(); break; }
        if (this.round >= this.d.maxRounds) { this.endedBy = "max_rounds"; this.finalize(); break; }
      }
      return this.metrics;
    }

    checkInvariants() {
      for (const p of this.players) {
        if (p.specimens < 0) throw new Error(`neg specimens p${p.idx}`);
        if (p.findings < 0) throw new Error(`neg findings p${p.idx}`);
        if (p.standing < 0) throw new Error(`neg standing p${p.idx}`);
        if (p.sightings < 0) throw new Error(`neg sightings p${p.idx}`);
        if (p.confirmedDubious > 6) throw new Error(`confirmedDubious > 6 p${p.idx}`);
        const actual = this.namedSpecies.filter((ns) => ns.namedBy === p.idx).length;
        if (actual !== p.namedCount) throw new Error(`namedCount mismatch p${p.idx}: ${p.namedCount} vs ${actual}`);
      }
    }
  }

  // ============================ AI ============================
  function shouldPress(game, p, strategy) {
    const hazardFrac = 3 / DISCOVERY_COMPOSITION.length;
    const pSafe = 1 - (game.discoveryDeck.length > 0 ? hazardFrac : 0.4);
    if (strategy === "expeditioner") return p.expeditionDepth < 5 && pSafe > 0.5;
    if (strategy === "sensationalist_ai") return p.expeditionDepth < 4 && pSafe > 0.6;
    if (strategy === "greedy" || strategy === "systematist_ai") return p.expeditionDepth < 2 && pSafe > 0.7;
    return p.expeditionDepth < 1 && pSafe > 0.8;
  }

  function makePolicy(strategy, seed) {
    const rng = new RNG((seed >>> 0) || 1);

    function scoreAction(game, p, act) {
      if (act.kind === "stop") return 0;
      if (act.kind === "build") {
        const c = CARD[act.cardId]; let v = 0.3 * c.tier;
        if (c.band === EXPEDITION) v += 0.5;
        if (strategy === "expeditioner" && c.band === EXPEDITION) v += 1.0;
        if (strategy === "systematist_ai" && c.trigger) v += 0.4;
        return v;
      }
      if (act.kind === "expedition") {
        if (strategy === "expeditioner") return 3.0;
        return 1.0;
      }
      if (act.kind === "field") {
        const c = CARD[act.cardId];
        let gain = c.spec || 0;
        if (p.faction.id === "collector") gain += 1;
        let v = 0.1 * gain;
        if (c.trigger === STUDY) v += 0.3;
        if (c.typedField) v += 0.4;
        return v;
      }
      if (act.kind === "study") {
        const c = CARD[act.cardId];
        const batches = c.convIn > 0 ? Math.floor(Math.min(act.spend, p.specimens, c.convMaxIn) / c.convIn) : 0;
        const produced = batches * c.convOut;
        let v = 0.3 * produced;
        if (c.trigger === HALL) v += 0.3;
        return v;
      }
      if (act.kind === "hall") {
        const sp = SPECIES[act.speciesId];
        let v = 2.0;
        if (strategy === "systematist_ai") {
          // bonus for completing a set
          for (const setId of sp.sets) {
            const needed = SPECIES_DATA.filter((s) => s.sets.indexOf(setId) >= 0);
            const owned = needed.filter((s) => game.namedSpecies.some((ns) => ns.speciesId === s.id && ns.namedBy === p.idx)).length;
            if (owned >= needed.length - 1) v += 3.0;
          }
        }
        if (strategy === "sensationalist_ai" && sp.isDubious) v += 4.0;
        return v;
      }
      if (act.kind === "sighting") return strategy === "expeditioner" || strategy === "sensationalist_ai" ? 1.5 : 0.3;
      if (act.kind === "verify") {
        if (strategy === "sensationalist_ai") return 3.0;
        return 0.5;
      }
      return 0;
    }

    return {
      name: strategy,
      chooseAction(game, p, opts) {
        if (strategy === "random") return rng.choice(opts);
        let best = null, bestScore = -Infinity;
        for (const a of opts) { const s = scoreAction(game, p, a) + rng.float() * 1e-6; if (s > bestScore) { bestScore = s; best = a; } }
        return best || opts[0];
      },
      chooseChain(game, p, opts) {
        if (strategy === "random") return rng.choice(opts);
        let best = null, bestScore = 0.05;
        for (const a of opts) {
          if (a.kind === "stop") continue;
          const s = scoreAction(game, p, a) + rng.float() * 1e-6;
          if (s > bestScore) { bestScore = s; best = a; }
        }
        return best || { kind:"stop" };
      },
      shouldPress(game, p) { return shouldPress(game, p, strategy); },
    };
  }

  // ============================ self-check ============================
  function selfCheck(nGames) {
    nGames = nGames || 400;
    const fids = FACTIONS.map((f) => f.id);
    const strats = ["greedy", "systematist_ai", "sensationalist_ai", "expeditioner", "mix"];
    let ko = 0, close = 0, mr = 0, sumRounds = 0, sumNamed = 0;
    for (let s = 0; s < nGames; s++) {
      const n = 2 + (s % 3);
      const factions = [], strategies = [];
      for (let i = 0; i < n; i++) {
        factions.push(fids[(s + i) % fids.length]);
        const strat = s < nGames * 0.67 ? "greedy" : strats[(s * 3 + i) % (strats.length - 1)];
        strategies.push(strat);
      }
      const g = new Game({ factions, strategies, seed: s + 1 });
      const policies = strategies.map((st, i) => makePolicy(st, s * 131 + i));
      while (!g.ended) {
        g.round++; g.startRound();
        const kw = g.knockoutWinner();
        if (kw != null) { g.endedBy = "knockout"; g.winType = "knockout"; g.winner = kw; g.finalize(); break; }
        for (const idx of g.priority) { g.aiTakeTurn(g.players[idx], policies[idx]); g.checkInvariants(); g.metrics.turns++; }
        g.metrics.rounds++;
        if (g.clock >= g.d.clockLength) { g.endedBy = "close"; g.finalize(); break; }
        if (g.round >= g.d.maxRounds) { g.endedBy = "max_rounds"; g.finalize(); break; }
      }
      if (!g.ended || g.winner == null) throw new Error(`no winner seed ${s}`);
      ko += g.endedBy === "knockout" ? 1 : 0;
      close += g.endedBy === "close" ? 1 : 0;
      mr += g.endedBy === "max_rounds" ? 1 : 0;
      sumRounds += g.metrics.rounds;
      sumNamed += g.players.reduce((a, p) => a + p.namedCount, 0) / n;
    }
    return {
      nGames, avgRounds: (sumRounds / nGames).toFixed(1),
      ko, close, maxRounds: mr,
      avgNamedPerPlayer: (sumNamed / nGames).toFixed(1),
    };
  }

  // ============================ exports ============================
  const API = {
    SPECIES_DATA, SPECIES, CARD, CARDS, FACTIONS, FACTION, TACTIC, TACTICS,
    SET_IDS, DISCOVERY_COMPOSITION, Game, RNG, makePolicy, selfCheck, defaultDials,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  root.CTL = API;

  if (typeof require !== "undefined" && typeof module !== "undefined" && require.main === module) {
    console.log(`species:${SPECIES_DATA.length} cards:${CARDS.length} factions:${FACTIONS.length} tactics:${TACTICS.length}`);
    const t0 = Date.now();
    const r = selfCheck(400);
    console.log("selfCheck:", JSON.stringify(r), `(${Date.now() - t0}ms)`);
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
