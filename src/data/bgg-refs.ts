/**
 * BGG "Fans Also Like" snapshots — collaborative-filtering recommendations
 * fetched from recommend.games (Turi Create factorization model trained on
 * BGG user ratings).
 *
 * Used to validate our feature-based engine against an independent CF baseline.
 * Each `ourId` is a manual mapping into our catalog (null = not in catalog).
 *
 * Fetched: 2026-05-19
 */

import type { BggRef } from "./types";

export const BGG_REFS: readonly BggRef[] = [
  {
    anchorId: "brass-birmingham",
    bggId: 224517,
    fetchedAt: "2026-05-19",
    source: "recommend.games",
    cfQuality: "clean",
    list: [
      { rank: 1,  bggId: 251247, name: "Barrage",                             ourId: "barrage" },
      { rank: 2,  bggId: 193738, name: "Great Western Trail",                 ourId: null },
      { rank: 3,  bggId: 341169, name: "Great Western Trail: Second Edition", ourId: null },
      { rank: 4,  bggId: 175914, name: "Food Chain Magnate",                  ourId: null },
      { rank: 5,  bggId: 220308, name: "Gaia Project",                        ourId: null },
      { rank: 6,  bggId: 256730, name: "Pipeline",                            ourId: null },
      { rank: 7,  bggId: 125153, name: "The Gallerist",                       ourId: null },
      { rank: 8,  bggId: 284378, name: "Kanban EV",                           ourId: null },
      { rank: 9,  bggId: 4098,   name: "Age of Steam",                        ourId: null },
      { rank: 10, bggId: 40437,  name: "Cognition",                           ourId: null },
    ],
  },
  {
    anchorId: "terraforming-mars",
    bggId: 167791,
    fetchedAt: "2026-05-19",
    source: "recommend.games",
    cfQuality: "noisy",
    cfNote:
      "CF data is weak for TM — only #1 (Ark Nova) is a meaningful comparison. The rest is likely noise from small-n correlations.",
    list: [
      { rank: 1,  bggId: 342942, name: "Ark Nova",                            ourId: null },
      { rank: 2,  bggId: 328148, name: "Blanc-Manger Coco: Le Coming Out",    ourId: null },
      { rank: 3,  bggId: 80438,  name: "Flags The Game",                      ourId: null },
      { rank: 4,  bggId: 416684, name: "Valroc: The Legend of Aquiny",        ourId: null },
      { rank: 5,  bggId: 299246, name: "Medieval Mayhem: The Card Game",      ourId: null },
      { rank: 6,  bggId: 74527,  name: "Crouch Touch Engage Rugby",           ourId: null },
      { rank: 7,  bggId: 438962, name: "Forest Leader",                       ourId: null },
      { rank: 8,  bggId: 375486, name: "Fast Food",                           ourId: null },
      { rank: 9,  bggId: 72294,  name: "Traffic Jam Game",                    ourId: null },
      { rank: 10, bggId: 21604,  name: "S'witches",                           ourId: null },
    ],
  },
  {
    anchorId: "voidfall",
    bggId: 337627,
    fetchedAt: "2026-05-19",
    source: "recommend.games",
    cfQuality: "clean",
    list: [
      { rank: 1,  bggId: 396790, name: "Nucleum",                             ourId: null },
      { rank: 2,  bggId: 256997, name: "Perseverance: Castaway Chronicles",   ourId: null },
      { rank: 3,  bggId: 391137, name: "Galactic Cruise",                     ourId: null, note: "On your watchlist" },
      { rank: 4,  bggId: 347305, name: "Inventions: Evolution of Ideas",      ourId: null },
      { rank: 5,  bggId: 367041, name: "Scholars of the South Tigris",       ourId: null },
      { rank: 6,  bggId: 332772, name: "Revive",                              ourId: null },
      { rank: 7,  bggId: 382843, name: "Evacuation",                          ourId: null },
      { rank: 8,  bggId: 378387, name: "Inventors of the South Tigris",      ourId: null },
      { rank: 9,  bggId: 359438, name: "Skymines",                            ourId: null },
      { rank: 10, bggId: 237179, name: "Weather Machine",                     ourId: null },
    ],
  },
  {
    anchorId: "mage-knight",
    bggId: 96848,
    fetchedAt: "2026-05-19",
    source: "recommend.games",
    cfQuality: "clean",
    cfNote:
      "Queried against Mage Knight Board Game (96848) — Ultimate Edition (281948) typically shares the same fan base.",
    list: [
      { rank: 1,  bggId: 182028, name: "Through the Ages: A New Story",      ourId: "through-the-ages" },
      { rank: 2,  bggId: 146278, name: "Tash-Kalar: Arena of Legends",       ourId: null },
      { rank: 3,  bggId: 5032,   name: "Land Race Card Game",                 ourId: null },
      { rank: 4,  bggId: 181530, name: "Runebound (Third Edition)",           ourId: null },
      { rank: 5,  bggId: 25613,  name: "Through the Ages: A Story of Civ.",  ourId: "through-the-ages" },
      { rank: 6,  bggId: 170771, name: "Sword & Sorcery: Immortal Souls",    ourId: null },
      { rank: 7,  bggId: 45315,  name: "Dungeon Lords",                       ourId: null },
      { rank: 8,  bggId: 34639,  name: "The Dungeon of D",                    ourId: null },
      { rank: 9,  bggId: 97207,  name: "Dungeon Petz",                        ourId: null },
      { rank: 10, bggId: 429113, name: "Battle of Mekaverse",                 ourId: null },
    ],
  },
  {
    anchorId: "quacks",
    bggId: 244521,
    fetchedAt: "2026-05-19",
    source: "recommend.games",
    cfQuality: "clean",
    list: [
      { rank: 1,  bggId: 260605, name: "Camel Up (Second Edition)",           ourId: null },
      { rank: 2,  bggId: 269207, name: "The Taverns of Tiefenthal",           ourId: null },
      { rank: 3,  bggId: 242302, name: "Space Base",                          ourId: null },
      { rank: 4,  bggId: 201808, name: "Clank!: A Deck-Building Adventure",  ourId: null },
      { rank: 5,  bggId: 194594, name: "Dice Forge",                          ourId: null },
      { rank: 6,  bggId: 217372, name: "The Quest for El Dorado",             ourId: null },
      { rank: 7,  bggId: 5623,   name: "Zap!",                                ourId: null },
      { rank: 8,  bggId: 233867, name: "Welcome To...",                       ourId: "welcome-to" },
      { rank: 9,  bggId: 184921, name: "Bunny Kingdom",                       ourId: null },
      { rank: 10, bggId: 153938, name: "Camel Up",                            ourId: null },
    ],
  },
];

export const BGG_REFS_BY_ANCHOR = new Map(BGG_REFS.map((r) => [r.anchorId, r]));

export function getBggRef(anchorId: string): BggRef | undefined {
  return BGG_REFS_BY_ANCHOR.get(anchorId);
}
