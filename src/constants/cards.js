// List of ability cards
export const bushfire1 = {
  id: "bushfire1",
  type: "bushfire",
  name: "LANDSCAPING",
  duration: 1,
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
  duration: 2,
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
  duration: 3,
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
  duration: 1,
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
  duration: 2,
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
  duration: 3,
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
  duration: 1,
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
  duration: 2,
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
  duration: 3,
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
  duration: 1,
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
  duration: 2,
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
  duration: 3,
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
  duration: 1,
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
  duration: 2,
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
  duration: 3,
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
  duration: 1,
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
  duration: 1,
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
  duration: 1,
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
  duration: 1,
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

// Grouped cards by duration for easier access
export const cardsByDuration = {
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
