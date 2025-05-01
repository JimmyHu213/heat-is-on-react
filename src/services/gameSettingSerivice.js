// src/services/gameSettingsService.js
import { doc, setDoc, collection, getDocs, getDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { defaultTowns } from "../constants/towns";
import { allCards } from "../constants/cards";
import { hazards } from "../constants/hazards";

/**
 * Initialize game settings (run once during setup)
 * @returns {Promise<boolean>} True if successful, false otherwise
 * @throws {Error} If there is an error initializing the game settings
 */
export const initializeGameSettings = async () => {
  try {
    // Create game settings document
    await setDoc(doc(db, "gameSettings", "v1"), {
      gameVersion: "1.0.0",
      roundsPerGame: 5, // default number of rounds
    });

    // Create town templates
    const townTemplates = defaultTowns;

    for (const town of townTemplates) {
      await setDoc(doc(db, "gameSettings", "v1", "townTemplates", town.id), {
        name: town.name,
        effortPoints: town.effortPoints,
        baseStats: town.baseStats,
      });
    }

    // Create cards
    const defaultCards = allCards;

    for (const card of defaultCards) {
      await setDoc(doc(db, "gameSettings", "v1", "cards", card.id), {
        name: card.name,
        type: card.type,
        duration: card.round,
        cost: card.cost,
        nature: card.nature,
        economy: card.economy,
        society: card.society,
        health: card.health,
      });
    }

    // Create hazards
    const defaultHazards = hazards;

    for (const hazard of defaultHazards) {
      await setDoc(doc(db, "gameSettings", "v1", "hazards", hazard.id), {
        name: hazard.name,
        nature: hazard.nature,
        economy: hazard.economy,
        society: hazard.society,
        health: hazard.health,
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
 * @returns {Promise<Object>} Game settings object
 * @throws {Error} If there is an error retrieving the game settings
 */
export const getGameSettings = async () => {
  try {
    const docRef = doc(db, "gameSettings", "v1");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      };
    }
    return null;
  } catch (error) {
    console.error("Error getting game settings:", error);
    return null;
  }
};

/**
 * Get all town templates
 * @returns {Promise<Array>} Array of town templates
 * @throws {Error} If there is an error retrieving the town templates
 */
export const getTownTemplates = async () => {
  try {
    const snapshot = await getDocs(
      collection(db, "gameSettings", "v1", "townTemplates")
    );
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting town templates:", error);
    return [];
  }
};

/**
 * Get all cards
 * @returns {Promise<Array>} Array of cards
 * @throws {Error} If there is an error retrieving the cards
 */
export const getCards = async () => {
  try {
    const snapshot = await getDocs(
      collection(db, "gameSettings", "v1", "cards")
    );
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting cards:", error);
    return [];
  }
};

/**
 * Get all hazards
 * @returns {Promise<Array>} Array of hazards
 * @throws {Error} If there is an error retrieving the hazards
 */
export const getHazards = async () => {
  try {
    const snapshot = await getDocs(
      collection(db, "gameSettings", "v1", "hazards")
    );
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting hazards:", error);
    return [];
  }
};

/**
 * Get a single card by ID
 */
export const getCard = async (cardId) => {
  try {
    const docRef = doc(db, "gameSettings", "v1", "cards", cardId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      };
    }
    return null;
  } catch (error) {
    console.error("Error getting card:", error);
    return null;
  }
};

/**
 * Get a single hazard by ID
 * @param {string} hazardId - The ID of the hazard to retrieve
 * @returns {Promise<Object|null>} The hazard object if found, null otherwise
 */
export const getHazard = async (hazardId) => {
  try {
    const docRef = doc(db, "gameSettings", "v1", "hazards", hazardId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      };
    }
    return null;
  } catch (error) {
    console.error("Error getting hazard:", error);
    return null;
  }
};
