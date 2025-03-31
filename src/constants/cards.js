// List of ability cards
export const bushfire1 = {
  id: "bushfire1",
  type: "bushfire",
  name: "LANDSCAPING",
  round: 1,
  cost: 15,
  nature: 20,
  economy: 10,
  society: 10,
  health: 10,
};

export const bushfire2 = {
  id: "bushfire2",
  type: "bushfire",
  name: "MANAGED BURNING",
  round: 2,
  cost: 15,
  nature: 30,
  economy: 10,
  society: 10,
  health: 10,
};

export const bushfire3 = {
  id: "bushfire3",
  type: "bushfire",
  name: "FIRE-RESILIENT HOMES",
  round: 3,
  cost: 15,
  nature: 10,
  economy: 20,
  society: 20,
  health: 20,
};

export const flood1 = {
  id: "flood1",
  type: "flood",
  name: "FLOOD ZONING",
  round: 1,
  cost: 15,
  nature: 0,
  economy: 20,
  society: 15,
  health: 15,
};

export const flood2 = {
  id: "flood2",
  type: "flood",
  name: "STORMWATER SPONGES",
  round: 2,
  cost: 15,
  nature: 30,
  economy: 10,
  society: 10,
  health: 10,
};

export const flood3 = {
  id: "flood3",
  type: "flood",
  name: "COMMUNITY EDUCATION",
  round: 3,
  cost: 15,
  nature: 10,
  economy: 20,
  society: 20,
  health: 20,
};

export const stormSurge1 = {
  id: "stormSurge1",
  type: "stormSurge",
  name: "SEA DEFENSES",
  round: 1,
  cost: 15,
  nature: 10,
  economy: 20,
  society: 10,
  health: 10,
};

export const stormSurge2 = {
  id: "stormSurge2",
  type: "stormSurge",
  name: "NATURAL BARRIERS",
  round: 2,
  cost: 15,
  nature: 25,
  economy: 15,
  society: 10,
  health: 10,
};

export const stormSurge3 = {
  id: "stormSurge3",
  type: "stormSurge",
  name: "STILTS AND TREES",
  round: 3,
  cost: 15,
  nature: 10,
  economy: 20,
  society: 20,
  health: 20,
};

export const heatwave1 = {
  id: "heatwave1",
  type: "heatwave",
  name: "COOL PUBLIC SPACES",
  round: 1,
  cost: 15,
  nature: 10,
  economy: 10,
  society: 10,
  health: 20,
};

export const heatwave2 = {
  id: "heatwave2",
  type: "heatwave",
  name: "GREEN STREETS",
  round: 2,
  cost: 15,
  nature: 25,
  economy: 10,
  society: 10,
  health: 15,
};

export const heatwave3 = {
  id: "heatwave3",
  type: "heatwave",
  name: "WHITE ROOFS",
  round: 3,
  cost: 15,
  nature: 10,
  economy: 20,
  society: 15,
  health: 25,
};

export const biohazard1 = {
  id: "biohazard1",
  type: "biohazard",
  name: "BUFFER ZONES",
  round: 1,
  cost: 15,
  nature: 20,
  economy: 10,
  society: 10,
  health: 10,
};

export const biohazard2 = {
  id: "biohazard2",
  type: "biohazard",
  name: "CLEAN FARMING",
  round: 2,
  cost: 15,
  nature: 0,
  economy: 30,
  society: 20,
  health: 10,
};

export const biohazard3 = {
  id: "biohazard3",
  type: "biohazard",
  name: "BIOLOGICAL CONTROL",
  round: 3,
  cost: 15,
  nature: 10,
  economy: 20,
  society: 20,
  health: 20,
};

export const cards = [
  bushfire1,
  bushfire2,
  bushfire3,
  flood1,
  flood2,
  flood3,
  stormSurge1,
  stormSurge2,
  stormSurge3,
  heatwave1,
  heatwave2,
  heatwave3,
  biohazard1,
  biohazard2,
  biohazard3,
];

export const allNature = {
  id: "allNature",
  type: "nature",
  name: "PROTECTED AREAS",
  round: 1,
  cost: 15,
  nature: 15,
  economy: 15,
  society: 15,
  health: 15,
};

export const allEconomy = {
  id: "allEconomy",
  type: "economy",
  name: "GREEN INDUSTRY",
  round: 1,
  cost: 15,
  nature: 15,
  economy: 15,
  society: 15,
  health: 15,
};

export const allSociety = {
  id: "allSociety",
  type: "society",
  name: "COMMUNITY EVENTS",
  round: 1,
  cost: 15,
  nature: 15,
  economy: 15,
  society: 15,
  health: 15,
};

export const allHealth = {
  id: "allHealth",
  type: "health",
  name: "HEALTH SERVICES",
  round: 1,
  cost: 15,
  nature: 15,
  economy: 15,
  society: 15,
  health: 15,
};

export const allAbilityCards = [allNature, allEconomy, allSociety, allHealth];

// Grouped cards by type for easier access
export const cardsByType = {
  bushfire: [bushfire1, bushfire2, bushfire3],
  flood: [flood1, flood2, flood3],
  stormSurge: [stormSurge1, stormSurge2, stormSurge3],
  heatwave: [heatwave1, heatwave2, heatwave3],
  biohazard: [biohazard1, biohazard2, biohazard3],
  all: [allNature, allEconomy, allSociety, allHealth],
};

// Grouped cards by round for easier access
export const cardsByRound = {
  1: [
    bushfire1,
    flood1,
    stormSurge1,
    heatwave1,
    biohazard1,
    allNature,
    allEconomy,
    allSociety,
    allHealth,
  ],
  2: [bushfire2, flood2, stormSurge2, heatwave2, biohazard2],
  3: [bushfire3, flood3, stormSurge3, heatwave3, biohazard3],
};

// Combined array of all cards
export const allCards = [...cards, ...allAbilityCards];
