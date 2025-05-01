import { db } from "../firebase/config";
import {
  GameSession,
  Town,
  CardPlay,
  RoundEvent,
  RoundStats,
  Card,
  Hazard,
} from "../model";
import { getTownTemplate } from "./gameSettingsService";
import {
  doc,
  collection,
  setDoc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  limit,
  orderBy,
  serverTimestamp,
  deleteDoc,
  writeBatch,
} from "firebase/firestore";

/**
 * Create a new game session
 * @param {string} userId - User ID
 * @returns {Promise<GameSession>} Created game session
 */
export const createGameSession = async (userId) => {
  try {
    // Create game session document
    const sessionsRef = collection(db, "gameSessions");
    const newSessionRef = await addDoc(sessionsRef, {
      userId,
      createdAt: serverTimestamp(),
      currentRound: 0,
      isActive: true,
      completedAt: null,
    });

    // Get the created session
    const sessionDoc = await getDoc(newSessionRef);
    return GameSession.fromFirestore(sessionDoc);
  } catch (error) {
    console.error("Error creating game session:", error);
    throw error;
  }
};

/**
 * Get a single game session by ID
 * @param {string} sessionId - Session ID
 * @returns {Promise<GameSession|null>} Game session or null if not found
 */
export const getGameSession = async (sessionId) => {
  try {
    const docRef = doc(db, "gameSessions", sessionId);
    const docSnapshot = await getDoc(docRef);

    if (docSnapshot.exists()) {
      return GameSession.fromFirestore(docSnapshot);
    }
    return null;
  } catch (error) {
    console.error("Error getting game session:", error);
    return null;
  }
};

/**
 * Get active game sessions for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array<GameSession>>} Array of active game sessions
 */
export const getUserActiveSessions = async (userId) => {
  try {
    const sessionsRef = collection(db, "gameSessions");
    const q = query(
      sessionsRef,
      where("userId", "==", userId),
      where("isActive", "==", true),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => GameSession.fromFirestore(doc));
  } catch (error) {
    console.error("Error getting user's active sessions:", error);
    return [];
  }
};

/**
 * Get completed game sessions for a user
 * @param {string} userId - User ID
 * @param {number} limitCount - Maximum number of sessions to retrieve
 * @returns {Promise<Array<GameSession>>} Array of completed game sessions
 */
export const getUserCompletedSessions = async (userId, limitCount = 10) => {
  try {
    const sessionsRef = collection(db, "gameSessions");
    const q = query(
      sessionsRef,
      where("userId", "==", userId),
      where("isActive", "==", false),
      orderBy("completedAt", "desc"),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => GameSession.fromFirestore(doc));
  } catch (error) {
    console.error("Error getting user's completed sessions:", error);
    return [];
  }
};

/**
 * Update a game session
 * @param {GameSession} session - Game session to update
 * @returns {Promise<GameSession>} Updated game session
 */
export const updateGameSession = async (session) => {
  try {
    const sessionRef = doc(db, "gameSessions", session.sessionId);
    await updateDoc(sessionRef, session.toFirestore());

    return getGameSession(session.sessionId);
  } catch (error) {
    console.error("Error updating game session:", error);
    throw error;
  }
};

/**
 * Advance a game session to the next round
 * @param {string} sessionId - Session ID
 * @returns {Promise<GameSession>} Updated game session
 */
export const advanceGameRound = async (sessionId) => {
  try {
    // Get current session
    const session = await getGameSession(sessionId);
    if (!session) {
      throw new Error(`Game session not found: ${sessionId}`);
    }

    // Advance to next round
    session.currentRound += 1;

    // Check if this was the last round
    const settings = await getDoc(doc(db, "gameSettings", "v1"));
    const roundsPerGame = settings.data()?.roundsPerGame || 5;

    if (session.currentRound > roundsPerGame) {
      session.isActive = false;
      session.completedAt = new Date();
    }

    return updateGameSession(session);
  } catch (error) {
    console.error("Error advancing game round:", error);
    throw error;
  }
};

/**
 * Delete a game session and all associated data
 * @param {string} sessionId - Session ID
 * @returns {Promise<void>}
 */
export const deleteGameSession = async (sessionId) => {
  try {
    const batch = writeBatch(db);

    // Delete session document
    batch.delete(doc(db, "gameSessions", sessionId));

    // Delete towns
    const townsQuery = query(
      collection(db, "towns"),
      where("sessionId", "==", sessionId)
    );
    const townDocs = await getDocs(townsQuery);
    townDocs.forEach((townDoc) => {
      batch.delete(townDoc.ref);
    });

    // Delete card plays
    const cardPlaysQuery = query(
      collection(db, "cardPlays"),
      where("sessionId", "==", sessionId)
    );
    const cardPlayDocs = await getDocs(cardPlaysQuery);
    cardPlayDocs.forEach((cardPlayDoc) => {
      batch.delete(cardPlayDoc.ref);
    });

    // Delete round events
    const roundEventsQuery = query(
      collection(db, "roundEvents"),
      where("sessionId", "==", sessionId)
    );
    const roundEventDocs = await getDocs(roundEventsQuery);
    roundEventDocs.forEach((roundEventDoc) => {
      batch.delete(roundEventDoc.ref);
    });

    // Delete round stats
    const roundStatsQuery = query(
      collection(db, "roundStats"),
      where("sessionId", "==", sessionId)
    );
    const roundStatsDocs = await getDocs(roundStatsQuery);
    roundStatsDocs.forEach((roundStatsDoc) => {
      batch.delete(roundStatsDoc.ref);
    });

    // Commit the batch
    await batch.commit();
  } catch (error) {
    console.error("Error deleting game session:", error);
    throw error;
  }
};

/**
 * Create towns for a game session
 * @param {string} sessionId - Session ID
 * @param {Array} templateIds - Array of town template IDs to use
 * @returns {Promise<Array<Town>>} Created towns
 */
export const createTownsForSession = async (sessionId, templateIds) => {
  try {
    const towns = [];

    for (const templateId of templateIds) {
      // Get the town template
      const template = await getTownTemplate(templateId);
      if (!template) {
        console.error(`Town template not found: ${templateId}`);
        continue;
      }

      // Create a new town based on the template
      const newTown = new Town({
        sessionId,
        townTemplateId: templateId,
        name: template.name,
        effortPoints: 100, // Default
        currentRound: 0,
        ...template.baseStats,
      });

      // Save the town to Firestore
      const townsRef = collection(db, "towns");
      const newTownRef = await addDoc(townsRef, newTown.toFirestore());

      // Get the created town
      const townDoc = await getDoc(newTownRef);
      towns.push(Town.fromFirestore(townDoc));
    }

    return towns;
  } catch (error) {
    console.error("Error creating towns for session:", error);
    throw error;
  }
};

/**
 * Get towns for a game session
 * @param {string} sessionId - Session ID
 * @returns {Promise<Array<Town>>} Towns in the session
 */
export const getSessionTowns = async (sessionId) => {
  try {
    const townsRef = collection(db, "towns");
    const q = query(townsRef, where("sessionId", "==", sessionId));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => Town.fromFirestore(doc));
  } catch (error) {
    console.error("Error getting session towns:", error);
    return [];
  }
};

/**
 * Update a town
 * @param {Town} town - Town to update
 * @returns {Promise<Town>} Updated town
 */
export const updateTown = async (town) => {
  try {
    const townRef = doc(db, "towns", town.townId);
    await updateDoc(townRef, town.toFirestore());

    // Get the updated town
    const townDoc = await getDoc(townRef);
    return Town.fromFirestore(townDoc);
  } catch (error) {
    console.error("Error updating town:", error);
    throw error;
  }
};

/**
 * Apply a card to a town
 * @param {string} townId - Town ID
 * @param {string} cardId - Card ID
 * @param {string} sessionId - Session ID
 * @param {number} round - Current round
 * @returns {Promise<{town: Town, cardPlay: CardPlay}>} Updated town and created card play
 */
export const applyCardToTown = async (townId, cardId, sessionId, round) => {
  try {
    // Get the town
    const townRef = doc(db, "towns", townId);
    const townDoc = await getDoc(townRef);
    if (!townDoc.exists()) {
      throw new Error(`Town not found: ${townId}`);
    }
    const town = Town.fromFirestore(townDoc);

    // Get the card
    const cardRef = doc(db, "cards", cardId);
    const cardDoc = await getDoc(cardRef);
    if (!cardDoc.exists()) {
      throw new Error(`Card not found: ${cardId}`);
    }
    const card = Card.fromFirestore(cardDoc);

    // Apply the card to the town
    town.applyCard(card);

    // Create a card play record
    const effectiveRounds = [];
    for (let i = 0; i < card.durationRounds; i++) {
      effectiveRounds.push(round + i);
    }

    const cardPlay = new CardPlay({
      sessionId,
      cardId,
      townId,
      playedAtRound: round,
      effectiveRounds,
      playedAt: new Date(),
      isActive: true,
    });

    // Save the card play
    const cardPlaysRef = collection(db, "cardPlays");
    const newCardPlayRef = await addDoc(cardPlaysRef, cardPlay.toFirestore());

    // Update the town
    await updateDoc(townRef, town.toFirestore());

    // Get the created card play
    const cardPlayDoc = await getDoc(newCardPlayRef);

    return {
      town: Town.fromFirestore(await getDoc(townRef)),
      cardPlay: CardPlay.fromFirestore(cardPlayDoc),
    };
  } catch (error) {
    console.error("Error applying card to town:", error);
    throw error;
  }
};

/**
 * Apply a hazard to all towns in a session
 * @param {string} sessionId - Session ID
 * @param {string} hazardId - Hazard ID
 * @param {number} round - Current round
 * @returns {Promise<{towns: Array<Town>, roundEvent: RoundEvent}>} Updated towns and created round event
 */
export const applyHazardToSession = async (sessionId, hazardId, round) => {
  try {
    // Get the hazard
    const hazardRef = doc(db, "hazards", hazardId);
    const hazardDoc = await getDoc(hazardRef);
    if (!hazardDoc.exists()) {
      throw new Error(`Hazard not found: ${hazardId}`);
    }
    const hazard = Hazard.fromFirestore(hazardDoc);

    // Get all towns in the session
    const towns = await getSessionTowns(sessionId);

    // Apply the hazard to each town
    const updatedTowns = [];
    for (const town of towns) {
      town.applyHazard(hazard);
      await updateTown(town);
      updatedTowns.push(town);
    }

    // Create or update a round event
    let roundEvent = null;
    const roundEventRef = doc(db, "roundEvents", `${sessionId}_${round}`);
    const roundEventDoc = await getDoc(roundEventRef);

    if (roundEventDoc.exists()) {
      roundEvent = RoundEvent.fromFirestore(roundEventDoc);
      roundEvent.addHazard(hazardId);
    } else {
      roundEvent = new RoundEvent({
        sessionId,
        roundNumber: round,
        hazardIds: [hazardId],
        eventHistory: [
          {
            type: "hazard",
            hazardId,
            timestamp: new Date(),
          },
        ],
      });
    }

    await setDoc(roundEventRef, roundEvent.toFirestore());

    return {
      towns: updatedTowns,
      roundEvent,
    };
  } catch (error) {
    console.error("Error applying hazard to session:", error);
    throw error;
  }
};

/**
 * Save round stats for a session
 * @param {string} sessionId - Session ID
 * @param {number} round - Round number
 * @returns {Promise<RoundStats>} Created round stats
 */
export const saveRoundStats = async (sessionId, round) => {
  try {
    // Get all towns in the session
    const towns = await getSessionTowns(sessionId);

    // Snapshot stats for each town
    const townStats = {};
    for (const town of towns) {
      town.snapshotStats();
      await updateTown(town);
      townStats[town.townId] = town.currentStats;
    }

    // Create round stats
    const roundStats = new RoundStats({
      sessionId,
      roundNumber: round,
      towns: townStats,
      completedAt: new Date(),
    });

    // Save the round stats
    const roundStatsRef = doc(db, "roundStats", `${sessionId}_${round}`);
    await setDoc(roundStatsRef, roundStats.toFirestore());

    return roundStats;
  } catch (error) {
    console.error("Error saving round stats:", error);
    throw error;
  }
};

/**
 * Get round events for a session
 * @param {string} sessionId - Session ID
 * @returns {Promise<Object>} Map of round number to hazard IDs
 */
export const getSessionRoundEvents = async (sessionId) => {
  try {
    const eventsRef = collection(db, "roundEvents");
    const q = query(eventsRef, where("sessionId", "==", sessionId));
    const querySnapshot = await getDocs(q);

    const roundEvents = {};
    querySnapshot.forEach((doc) => {
      const event = RoundEvent.fromFirestore(doc);
      roundEvents[event.roundNumber] = event.hazardIds;
    });

    return roundEvents;
  } catch (error) {
    console.error("Error getting session round events:", error);
    return {};
  }
};

/**
 * Get card plays for a town
 * @param {string} townId - Town ID
 * @returns {Promise<Object>} Map of round number to card names
 */
export const getTownCardPlays = async (townId) => {
  try {
    const playsRef = collection(db, "cardPlays");
    const q = query(playsRef, where("townId", "==", townId));
    const querySnapshot = await getDocs(q);

    // Group by round
    const cardsByRound = {};
    const cardPlays = querySnapshot.docs.map((doc) =>
      CardPlay.fromFirestore(doc)
    );

    // Need to get card details
    const cardDetailsPromises = cardPlays.map(async (play) => {
      const cardRef = doc(db, "cards", play.cardId);
      const cardDoc = await getDoc(cardRef);
      return {
        play,
        card: cardDoc.exists() ? cardDoc.data() : null,
      };
    });

    const cardDetails = await Promise.all(cardDetailsPromises);

    // Group by round
    for (const { play, card } of cardDetails) {
      if (!card) continue;

      for (const round of play.effectiveRounds) {
        if (!cardsByRound[round]) {
          cardsByRound[round] = [];
        }
        cardsByRound[round].push(card.name);
      }
    }

    return cardsByRound;
  } catch (error) {
    console.error("Error getting town card plays:", error);
    return {};
  }
};
