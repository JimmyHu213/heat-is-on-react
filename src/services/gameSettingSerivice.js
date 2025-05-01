import { db } from "../firebase/config";
import { GameSettings, TownTemplate, Card, Hazard } from "../models";
import {
  doc,
  collection,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";

// Default data
import { defaultTowns } from "../constants/towns";
import { allCards } from "../constants/cards";
import { hazards } from "../constants/hazards";

/**
 * Initialize game settings (run once during setup)
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
export const initializeGameSettings = async () => {
  try {
    // Create game settings document
    await setDoc(doc(db, "gameSettings", "v1"), {
      gameVersion: "1.0.0",
      roundsPerGame: 5, // default number of rounds
      createdAt: serverTimestamp(),
    });

    // Create town templates
    const townTemplatesRef = collection(db, "townTemplates");
    for (const town of defaultTowns) {
      await setDoc(doc(townTemplatesRef, town.id), {
        name: town.name,
        baseStats: town.baseStats,
        createdAt: serverTimestamp(),
      });
    }

    // Create cards
    const cardsRef = collection(db, "cards");
    for (const card of allCards) {
      await setDoc(doc(cardsRef, card.id), {
        name: card.name,
        type: card.type,
        dimension: card.type, // For backward compatibility
        durationRounds: card.round,
        cost: card.cost,
        nature: card.nature,
        economy: card.economy,
        society: card.society,
        health: card.health,
        createdAt: serverTimestamp(),
      });
    }

    // Create hazards
    const hazardsRef = collection(db, "hazards");
    for (const hazard of hazards) {
      await setDoc(doc(hazardsRef, hazard.id), {
        name: hazard.name,
        nature: hazard.nature,
        economy: hazard.economy,
        society: hazard.society,
        health: hazard.health,
        dimensionEffects: {
          nature: hazard.nature,
          economy: hazard.economy,
          society: hazard.society,
          health: hazard.health,
        },
        createdAt: serverTimestamp(),
      });
    }

    return true;
  } catch (error) {
    console.error("Error initializing game settings:", error);
    return false;
  }
};

/**
 * Get game settings
 * @returns {Promise<GameSettings|null>} Game settings object
 */
export const getGameSettings = async () => {
  try {
    const docRef = doc(db, "gameSettings", "v1");
    const docSnapshot = await getDoc(docRef);

    if (docSnapshot.exists()) {
      return GameSettings.fromFirestore(docSnapshot);
    }
    return null;
  } catch (error) {
    console.error("Error getting game settings:", error);
    return null;
  }
};

/**
 * Get all town templates
 * @returns {Promise<Array<TownTemplate>>} Array of town templates
 */
export const getTownTemplates = async () => {
  try {
    const templatesRef = collection(db, "townTemplates");
    const querySnapshot = await getDocs(templatesRef);

    return querySnapshot.docs.map((doc) => TownTemplate.fromFirestore(doc));
  } catch (error) {
    console.error("Error getting town templates:", error);
    return [];
  }
};

/**
 * Get a single town template by ID
 * @param {string} templateId - Town template ID
 * @returns {Promise<TownTemplate|null>} Town template or null if not found
 */
export const getTownTemplate = async (templateId) => {
  try {
    const docRef = doc(db, "townTemplates", templateId);
    const docSnapshot = await getDoc(docRef);

    if (docSnapshot.exists()) {
      return TownTemplate.fromFirestore(docSnapshot);
    }
    return null;
  } catch (error) {
    console.error("Error getting town template:", error);
    return null;
  }
};

/**
 * Get all cards
 * @returns {Promise<Array<Card>>} Array of cards
 */
export const getCards = async () => {
  try {
    const cardsRef = collection(db, "cards");
    const querySnapshot = await getDocs(cardsRef);

    return querySnapshot.docs.map((doc) => Card.fromFirestore(doc));
  } catch (error) {
    console.error("Error getting cards:", error);
    return [];
  }
};

/**
 * Get cards filtered by type
 * @param {string} type - Card type to filter by
 * @returns {Promise<Array<Card>>} Array of filtered cards
 */
export const getCardsByType = async (type) => {
  try {
    const cardsRef = collection(db, "cards");
    const q = query(cardsRef, where("type", "==", type));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => Card.fromFirestore(doc));
  } catch (error) {
    console.error("Error getting cards by type:", error);
    return [];
  }
};

/**
 * Get all cards for a specific round
 * @param {number} round - Round number
 * @returns {Promise<Array<Card>>} Array of cards for the round
 */
export const getCardsByRound = async (round) => {
  try {
    const cardsRef = collection(db, "cards");
    const q = query(cardsRef, where("round", "==", round));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => Card.fromFirestore(doc));
  } catch (error) {
    console.error("Error getting cards by round:", error);
    return [];
  }
};

/**
 * Get a single card by ID
 * @param {string} cardId - Card ID
 * @returns {Promise<Card|null>} Card or null if not found
 */
export const getCard = async (cardId) => {
  try {
    const docRef = doc(db, "cards", cardId);
    const docSnapshot = await getDoc(docRef);

    if (docSnapshot.exists()) {
      return Card.fromFirestore(docSnapshot);
    }
    return null;
  } catch (error) {
    console.error("Error getting card:", error);
    return null;
  }
};

/**
 * Get all hazards
 * @returns {Promise<Array<Hazard>>} Array of hazards
 */
export const getHazards = async () => {
  try {
    const hazardsRef = collection(db, "hazards");
    const querySnapshot = await getDocs(hazardsRef);

    return querySnapshot.docs.map((doc) => Hazard.fromFirestore(doc));
  } catch (error) {
    console.error("Error getting hazards:", error);
    return [];
  }
};

/**
 * Get a single hazard by ID
 * @param {string} hazardId - Hazard ID
 * @returns {Promise<Hazard|null>} Hazard or null if not found
 */
export const getHazard = async (hazardId) => {
  try {
    const docRef = doc(db, "hazards", hazardId);
    const docSnapshot = await getDoc(docRef);

    if (docSnapshot.exists()) {
      return Hazard.fromFirestore(docSnapshot);
    }
    return null;
  } catch (error) {
    console.error("Error getting hazard:", error);
    return null;
  }
};
