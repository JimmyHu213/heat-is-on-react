// src/services/gameSessionService.js
import { db } from "../firebase/config";
import { doc, collection, runTransaction, serverTimestamp, Timestamp } from "firebase/firestore";
import { DEFAULT_ROUNDS, HAZARD_IDS, validateRoundCount, planRoundTransition } from "../utils/rounds";
import { totalResilience, buildGameSummary } from "../utils/gameSummary";
import firestoreService from "./firestoreService";
import { defaultTowns } from "../constants/towns";
import { hazards } from "../constants/hazards";
import { allCards } from "../constants/cards";
import { buildHazardImpact } from "../utils/hazardImpact";

/**
 * Game Session Service
 * Handles CRUD operations for game sessions, towns, and related entities
 */
class GameSessionService {
  // Collection paths
  SESSIONS_COLLECTION = "game_sessions";
  TOWNS_COLLECTION = "towns";
  CARD_PLAYS_COLLECTION = "card_plays";
  ROUND_EVENTS_COLLECTION = "round_events";
  ROUND_STATS_COLLECTION = "round_stats";

  /**
   * Create a new game session
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Created game session
   */
  // In src/services/gameSessionService.js
  // Add this check to the createSession method

  async createSession(userId, name = "New Game", options = {}) {
    const totalRounds = validateRoundCount(options.totalRounds ?? DEFAULT_ROUNDS);
    const digitalWheelEnabled = options.digitalWheelEnabled !== false;
    try {
      // Check if user already has 3 active sessions
      const activeSessions = await this.getUserActiveSessions(userId);
      if (activeSessions.length >= 3) {
        throw new Error("Maximum session limit reached (3)");
      }

      // Create new session
      const session = await firestoreService.createDocument(
        this.SESSIONS_COLLECTION,
        {
          userId,
          name,
          totalRounds,
          digitalWheelEnabled,
          stage: "adaptation",
          revision: 0,
          currentRound: 0,
          isActive: true,
          completedAt: null,
        }
      );

      // Create towns for this session
      const sessionTowns = await this.createTownsForSession(session.id);

      return {
        ...session,
        towns: sessionTowns,
      };
    } catch (error) {
      console.error("Error creating game session:", error);
      throw error;
    }
  }

  /**
   * Update the name of a game session
   * @param {string} sessionId - Session ID
   * @param {string} newName - New session name
   * @returns {Promise<Object>} Updated game session
   * */
  async updateSessionName(sessionId, newName) {
    try {
      if (!newName || newName.trim() === "") {
        throw new Error("Session name cannot be empty");
      }

      return await firestoreService.updateDocument(
        this.SESSIONS_COLLECTION,
        sessionId,
        { name: newName.trim() }
      );
    } catch (error) {
      console.error(`Error updating session name for ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Get a game session by ID
   * @param {string} sessionId - Session ID
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} Game session or null if not found
   */
  async getSession(sessionId) {
    try {
      const session = await firestoreService.getDocument(
        this.SESSIONS_COLLECTION,
        sessionId
      );

      if (!session) return null;

      // Get all towns for this session
      const towns = await this.getSessionTowns(sessionId);

      return {
        ...session,
        towns,
      };
    } catch (error) {
      console.error(`Error getting game session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Get active game sessions for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of active game sessions
   */
  async getUserActiveSessions(userId) {
    try {
      return await firestoreService.getDocuments(
        this.SESSIONS_COLLECTION,
        [
          ["userId", "==", userId],
          ["isActive", "==", true],
        ],
        ["createdAt", "desc"]
      );
    } catch (error) {
      console.error(`Error getting active sessions for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get completed game sessions for a user
   * @param {string} userId - User ID
   * @param {number} limitCount - Maximum number of sessions to return
   * @returns {Promise<Array>} Array of completed game sessions
   */
  async getUserCompletedSessions(userId, limitCount = 10) {
    try {
      return await firestoreService.getDocuments(
        this.SESSIONS_COLLECTION,
        [
          ["userId", "==", userId],
          ["isActive", "==", false],
        ],
        ["completedAt", "desc"],
        limitCount
      );
    } catch (error) {
      console.error(
        `Error getting completed sessions for user ${userId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Create towns for a game session with sequential IDs
   * @param {string} sessionId - Session ID
   * @returns {Promise<Array>} Array of created towns
   */
  async createTownsForSession(sessionId) {
    try {
      const towns = [];

      // Use first 5 default towns
      const townTemplates = defaultTowns;

      for (let i = 0; i < townTemplates.length; i++) {
        const template = townTemplates[i];
        const townNumber = i + 1; // Ensure sequential IDs (1, 2, 3, 4, 5)
        const townId = `${sessionId}_town_${townNumber}`; // Unique ID for each town

        const isComparisonTown = template.name === "Bludgeton";

        const townData = {
          sessionId,
          townNumber,
          name: template.name, // Ensure name matches ID
          townTemplateId: template.id,
          effortPoints: 100,
          currentRound: 0,
          bushfire: template.baseStats.bushfire,
          flood: template.baseStats.flood,
          stormSurge: template.baseStats.stormSurge,
          heatwave: template.baseStats.heatwave,
          biohazard: template.baseStats.biohazard,
          currentStats: {}, // Will be populated when round starts
          isComparisonTown: isComparisonTown,
        };

        // Use explicit ID for the document
        const town = await firestoreService.createDocument(
          this.TOWNS_COLLECTION,
          townData,
          townId // Pass the explicit ID as the third parameter
        );

        towns.push(town);
      }

      return towns;
    } catch (error) {
      console.error(`Error creating towns for session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Get towns for a game session ordered by ID
   * @param {string} sessionId - Session ID
   * @returns {Promise<Array>} Array of towns ordered by ID
   */
  async getSessionTowns(sessionId) {
    try {
      // Get towns from Firestore
      const towns = await firestoreService.getDocuments(this.TOWNS_COLLECTION, [
        ["sessionId", "==", sessionId],
      ]);

      return towns.sort((a, b) => a.townNumber - b.townNumber); // Sort by ID
    } catch (error) {
      console.error(`Error getting towns for session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Update a town
   * @param {string} townId - Town ID
   * @param {Object} data - Data to update
   * @returns {Promise<Object>} Updated town
   */
  async updateTown(townId, data) {
    const ref = doc(db, this.TOWNS_COLLECTION, townId);
    await runTransaction(db, async transaction => {
      const town = await transaction.get(ref);
      const sessionRef = doc(db, this.SESSIONS_COLLECTION, town.data().sessionId);
      const session = await transaction.get(sessionRef);
      if (!session.data().isActive) throw new Error("This game has already finished.");
      const { id, ...changes } = data;
      transaction.update(ref, { ...changes, updatedAt: serverTimestamp() });
      transaction.update(sessionRef, { revision: (session.data().revision || 0) + 1, updatedAt: serverTimestamp() });
    });
    return firestoreService.getDocument(this.TOWNS_COLLECTION, townId);
  }

  /**
   * Advance game session to next round
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object>} Updated game session
   */
  async advanceRound(sessionId, expectedRound, endGame = false) {
    // Query document IDs first; read their current contents inside the transaction.
    const before = await firestoreService.getDocument(this.SESSIONS_COLLECTION, sessionId);
    const towns = await this.getSessionTowns(sessionId);
    if (towns.length !== 6) throw new Error("The game must contain all six towns before starting.");
    const plays = await firestoreService.getDocuments(this.CARD_PLAYS_COLLECTION,
      [["sessionId", "==", sessionId]]);
    const sessionRef = doc(db, this.SESSIONS_COLLECTION, sessionId);
    await runTransaction(db, async transaction => {
      const sessionSnap = await transaction.get(sessionRef);
      if (!sessionSnap.exists()) throw new Error("Game session not found.");
      if ((sessionSnap.data().revision || 0) !== (before.revision || 0)) {
        throw new Error("The game changed during settlement. Refresh and try again.");
      }
      const townSnaps = await Promise.all(towns.map(t => transaction.get(doc(db, this.TOWNS_COLLECTION, t.id))));
      const playSnaps = await Promise.all(plays.map(p => transaction.get(doc(db, this.CARD_PLAYS_COLLECTION, p.id))));
      const currentTowns = townSnaps.map(s => ({ ...s.data(), id: s.id }));
      const currentPlays = playSnaps.filter(s => s.exists()).map(s => ({ ...s.data(), id: s.id }));
      const plan = planRoundTransition(sessionSnap.data(), currentTowns, currentPlays,
        allCards, (town, card) => this.applyCardEffects(town, card), expectedRound, endGame);
      const roundStatsRef = plan.round > 0
        ? doc(db, this.ROUND_STATS_COLLECTION, `${sessionId}_${plan.round}`) : null;
      const existingStats = roundStatsRef ? await transaction.get(roundStatsRef) : null;
      const eventRef = plan.round > 0 ? doc(db, this.ROUND_EVENTS_COLLECTION, `${sessionId}_${plan.round}`) : null;
      const eventSnap = eventRef ? await transaction.get(eventRef) : null;
      const timestamp = serverTimestamp();
      transaction.update(sessionRef, {
        currentRound: plan.nextRound, isActive: !plan.isComplete,
        endedEarly: plan.endedEarly, stage: plan.isComplete ? "complete" : "adaptation",
        revision: (sessionSnap.data().revision || 0) + 1,
        completedAt: plan.isComplete ? timestamp : null, updatedAt: timestamp,
        ...(plan.round > 0 ? { lastSettlementRound: plan.round, lastDividends: plan.dividends } : {}),
      });
      for (const { id, ...town } of plan.towns) {
        transaction.update(doc(db, this.TOWNS_COLLECTION, id), { ...town, updatedAt: timestamp });
      }
      for (const id of plan.deactivate) {
        transaction.update(doc(db, this.CARD_PLAYS_COLLECTION, id), { isActive: false, updatedAt: timestamp });
      }
      if (eventSnap?.exists()) transaction.update(eventRef, { isComplete: true, completedAt: timestamp, updatedAt: timestamp });
      if (plan.round > 0) {
        transaction.set(roundStatsRef, {
          sessionId, roundNumber: plan.round, towns: plan.snapshots,
          dividends: plan.dividends, createdAt: existingStats?.data()?.createdAt || timestamp, updatedAt: timestamp,
        }, { merge: true });
      }
    });
    return this.getSession(sessionId);
  }

  async setDigitalWheel(sessionId, enabled) {
    return firestoreService.updateDocument(this.SESSIONS_COLLECTION, sessionId,
      { digitalWheelEnabled: Boolean(enabled) });
  }

  /**
   * Apply a card to a town
   * @param {string} townId - Town ID
   * @param {string} cardId - Card ID
   * @param {number} round - Current round
   * @returns {Promise<Object>} Updated town and card play
   */
  assertPlayable(session, round) {
    if (!session.isActive) throw new Error("This game has already finished.");
    if (round < 1 || session.currentRound !== round) throw new Error("The round has changed. Refresh before continuing.");
  }

  async applyCardToTown(townId, cardId, round) {
    const card = allCards.find(c => c.id === cardId);
    if (!card) throw new Error("Card not found.");
    const townRef = doc(db, this.TOWNS_COLLECTION, townId);
    const town = await firestoreService.getDocument(this.TOWNS_COLLECTION, townId);
    if (!town) throw new Error("Town not found.");
    const sessionRef = doc(db, this.SESSIONS_COLLECTION, town.sessionId);
    const playRef = doc(collection(db, this.CARD_PLAYS_COLLECTION));
    const undo = await runTransaction(db, async transaction => {
      const [townSnap, sessionSnap] = await Promise.all([transaction.get(townRef), transaction.get(sessionRef)]);
      const currentTown = { ...townSnap.data(), id: townId };
      const session = sessionSnap.data();
      this.assertPlayable(session, round);
      if (currentTown.isComparisonTown) throw new Error("Bludgeton is the comparison town and cannot play adaptation cards.");
      if (currentTown.effortPoints < card.cost) throw new Error("Not enough effort points to play this card.");
      const { id, ...updated } = this.applyCardEffects(currentTown, card);
      const timestamp = serverTimestamp();
      transaction.update(townRef, { ...updated, effortPoints: currentTown.effortPoints - card.cost, updatedAt: timestamp });
      transaction.set(playRef, { sessionId: town.sessionId, cardId, townId, playedAtRound: round,
        effectiveRounds: Array.from({ length: card.duration || 1 }, (_, i) => round + i),
        isActive: true, playedAt: timestamp, createdAt: timestamp, updatedAt: timestamp });
      const revision = (session.revision || 0) + 1;
      transaction.update(sessionRef, { revision, updatedAt: timestamp });
      return { round, afterRevision: revision, towns: [currentTown], cardPlayId: playRef.id };
    });
    return { town: await firestoreService.getDocument(this.TOWNS_COLLECTION, townId), undo,
      cardPlay: await firestoreService.getDocument(this.CARD_PLAYS_COLLECTION, playRef.id) };
  }

  /**
   * Apply card effects to town data (helper method)
   * @param {Object} town - Town data
   * @param {Object} card - Card data
   * @returns {Object} Updated town data
   */
  applyCardEffects(town, card) {
    // Clone the town to avoid mutations
    const updatedTown = { ...town };

    // Apply card based on type
    if (
      ["bushfire", "flood", "stormSurge", "heatwave", "biohazard"].includes(
        card.type
      )
    ) {
      // Apply to specific hazard type
      const hazardType = card.type;
      updatedTown[hazardType] = this.addPoints(updatedTown[hazardType], card);
    } else {
      // Apply to all abilities but only for the specified aspect
      const aspectTypes = ["nature", "economy", "society", "health"];
      const hazardTypes = [
        "bushfire",
        "flood",
        "stormSurge",
        "heatwave",
        "biohazard",
      ];

      // For "all" type cards
      if (aspectTypes.includes(card.type)) {
        const aspect = card.type;

        // Apply to each hazard type
        for (const hazardType of hazardTypes) {
          const hazard = { ...updatedTown[hazardType] };
          hazard[aspect] = this.clampValue(hazard[aspect] + card[aspect]);
          updatedTown[hazardType] = hazard;
        }
      }
    }

    return updatedTown;
  }

  /**
   * Add card points to a hazard's ability points
   * @param {Object} ability - Hazard ability points
   * @param {Object} card - Card with points to add
   * @returns {Object} Updated ability points
   */
  addPoints(ability, card) {
    return {
      nature: this.clampValue(ability.nature + card.nature),
      economy: this.clampValue(ability.economy + card.economy),
      society: this.clampValue(ability.society + card.society),
      health: this.clampValue(ability.health + card.health),
    };
  }

  /**
   * Clamp value between 0 and 100
   * @param {number} value - Value to clamp
   * @returns {number} Clamped value
   */
  clampValue(value) {
    return Math.max(0, Math.min(100, value));
  }

  /**
   * Apply hazard to all towns in a session
   * @param {string} sessionId - Session ID
   * @param {string} hazardId - Hazard ID
   * @param {number} round - Current round
   * @returns {Promise<Object>} Updated towns and round event
   */
  async applyHazardToSession(sessionId, hazardId, round) {
    const hazard = hazards.find(h => h.id === hazardId);
    if (!hazard) throw new Error("Hazard not found.");
    const towns = await this.getSessionTowns(sessionId);
    if (towns.length !== 6) throw new Error("All six towns must be present.");
    const sessionRef = doc(db, this.SESSIONS_COLLECTION, sessionId);
    const eventRef = doc(db, this.ROUND_EVENTS_COLLECTION, `${sessionId}_${round}`);
    const { impact, ...undo } = await runTransaction(db, async transaction => {
      const sessionSnap = await transaction.get(sessionRef);
      this.assertPlayable(sessionSnap.data(), round);
      const eventSnap = await transaction.get(eventRef);
      const townSnaps = await Promise.all(towns.map(t => transaction.get(doc(db, this.TOWNS_COLLECTION, t.id))));
      const previous = eventSnap.exists() ? eventSnap.data() : null;
      if (previous?.hazardIds.includes(hazardId)) throw new Error("This hazard has already been applied in this round.");
      const currentTowns = townSnaps.map(s => ({ ...s.data(), id: s.id }));
      const timestamp = serverTimestamp();
      const impactPoints = { ...previous?.impactPoints };
      const updatedTowns = [];
      for (const town of currentTowns) {
        const { id, ...updated } = this.applyHazardEffects(town, hazard);
        updatedTowns.push({ ...updated, id });
        impactPoints[id] = (impactPoints[id] || 0) + totalResilience(town) - totalResilience(updated);
        transaction.update(doc(db, this.TOWNS_COLLECTION, id), { ...updated, updatedAt: timestamp });
      }
      transaction.set(eventRef, { ...previous, sessionId, roundNumber: round,
        hazardIds: [...(previous?.hazardIds || []), hazardId],
        eventHistory: [...(previous?.eventHistory || []), { type: "hazard", hazardId, timestamp: Timestamp.now() }],
        impactPoints, impactComplete: previous ? (previous.impactComplete !== false && Boolean(previous.impactPoints)) : true, isComplete: false, createdAt: previous?.createdAt || timestamp, updatedAt: timestamp });
      const revision = (sessionSnap.data().revision || 0) + 1;
      transaction.update(sessionRef, { revision, updatedAt: timestamp });
      return { round, afterRevision: revision, towns: currentTowns, event: previous,
        impact: buildHazardImpact(currentTowns, updatedTowns) };
    });
    return { towns: await this.getSessionTowns(sessionId), undo, impact,
      roundEvent: await firestoreService.getDocument(this.ROUND_EVENTS_COLLECTION, eventRef.id) };
  }

  async undoAction(sessionId, snapshot) {
    const sessionRef = doc(db, this.SESSIONS_COLLECTION, sessionId);
    const revision = await runTransaction(db, async transaction => {
      const sessionSnap = await transaction.get(sessionRef);
      this.assertPlayable(sessionSnap.data(), snapshot.round);
      if ((sessionSnap.data().revision || 0) !== snapshot.afterRevision) {
        throw new Error("The game has changed since this action. Refresh before continuing.");
      }
      const timestamp = serverTimestamp();
      for (const { id, ...town } of snapshot.towns) {
        transaction.update(doc(db, this.TOWNS_COLLECTION, id), { ...town, updatedAt: timestamp });
      }
      if (snapshot.cardPlayId) transaction.delete(doc(db, this.CARD_PLAYS_COLLECTION, snapshot.cardPlayId));
      else {
        const ref = doc(db, this.ROUND_EVENTS_COLLECTION, `${sessionId}_${snapshot.round}`);
        if (snapshot.event) transaction.set(ref, { ...snapshot.event, updatedAt: timestamp });
        else transaction.delete(ref);
      }
      const next = (sessionSnap.data().revision || 0) + 1;
      transaction.update(sessionRef, { revision: next, updatedAt: timestamp });
      return next;
    });
    return { session: await this.getSession(sessionId), revision };
  }

  async setStage(sessionId, stage, expectedRound) {
    if (!["adaptation", "hazard", "review"].includes(stage)) throw new Error("Unknown game stage.");
    const ref = doc(db, this.SESSIONS_COLLECTION, sessionId);
    await runTransaction(db, async transaction => {
      const snap = await transaction.get(ref);
      this.assertPlayable(snap.data(), expectedRound);
      if (stage === 'review' && snap.data().digitalWheelEnabled !== false) {
        const event = await transaction.get(doc(db, this.ROUND_EVENTS_COLLECTION, `${sessionId}_${expectedRound}`));
        if (!event.exists() || !event.data().hazardIds?.length) {
          throw new Error('Spin the hazard wheel and apply this round’s event before reviewing.');
        }
      }
      transaction.update(ref, { stage, updatedAt: serverTimestamp() });
    });
    return this.getSession(sessionId);
  }

  async getSummary(sessionId) {
    const [session, events, snapshots] = await Promise.all([
      this.getSession(sessionId),
      firestoreService.getDocuments(this.ROUND_EVENTS_COLLECTION, [["sessionId", "==", sessionId]]),
      firestoreService.getDocuments(this.ROUND_STATS_COLLECTION, [["sessionId", "==", sessionId]]),
    ]);
    return buildGameSummary(session, events, snapshots);
  }

  /**
   * Apply hazard effects to town data (helper method)
   * @param {Object} town - Town data
   * @param {Object} hazard - Hazard data
   * @returns {Object} Updated town data
   */
  applyHazardEffects(town, hazard) {
    // Clone the town to avoid mutations
    const updatedTown = { ...town, ...Object.fromEntries(HAZARD_IDS.map(id => [id, { ...town[id] }])) };

    const hazardType = hazard.id;
    const THRESHOLD = 20;
    const penaltyAmount = 10; // Amount to subtract from each aspect

    // Get all hazard types
    const hazardTypes = [
      "bushfire",
      "flood",
      "stormSurge",
      "heatwave",
      "biohazard",
    ];

    // First, check which aspects are ALREADY below threshold before applying new hazard
    for (const aspect of ["nature", "economy", "society", "health"]) {
      // Check if this aspect is already below threshold in any hazard type
      const isAspectVulnerable = hazardTypes.some(
        (type) => updatedTown[type][aspect] <= THRESHOLD
      );

      if (isAspectVulnerable) {
        // Apply the penalty to ALL hazard types for this aspect
        for (const type of hazardTypes) {
          updatedTown[type][aspect] = this.clampValue(
            updatedTown[type][aspect] - penaltyAmount
          );
        }
      }
    }

    // Then apply the hazard's direct effect to its corresponding hazard type
    // (This happens after penalty check but before returning the updated town)
    updatedTown[hazardType] = this.subtractPoints(
      updatedTown[hazardType],
      hazard
    );

    return updatedTown;
  }
  /**
   * Subtract hazard points from ability points
   * @param {Object} ability - Hazard ability points
   * @param {Object} hazard - Hazard with points to subtract
   * @returns {Object} Updated ability points
   */
  subtractPoints(ability, hazard) {
    return {
      nature: this.clampValue(ability.nature - hazard.nature),
      economy: this.clampValue(ability.economy - hazard.economy),
      society: this.clampValue(ability.society - hazard.society),
      health: this.clampValue(ability.health - hazard.health),
    };
  }

  /**
   * Save round stats for all towns in a session
   * @param {string} sessionId - Session ID
   * @param {number} round - Round number
   * @returns {Promise<Object>} Saved round stats
   */
  async saveRoundStats(sessionId, round) {
    try {
      // Get all towns
      const towns = await this.getSessionTowns(sessionId);

      // Prepare town stats
      const townStats = {};

      for (const town of towns) {
        // Snapshot of current stats
        const currentStats = {
          bushfire: town.bushfire,
          flood: town.flood,
          stormSurge: town.stormSurge,
          heatwave: town.heatwave,
          biohazard: town.biohazard,
          round,
        };

        // Update town's current stats
        await this.updateTown(town.id, { currentStats });

        // Add to round stats
        townStats[town.id] = currentStats;
      }

      // Save round stats
      const roundStatsId = `${sessionId}_${round}`;
      const roundStats = await firestoreService.createDocument(
        this.ROUND_STATS_COLLECTION,
        {
          sessionId,
          roundNumber: round,
          towns: townStats,
        },
        roundStatsId
      );

      return roundStats;
    } catch (error) {
      console.error(
        `Error saving round stats for session ${sessionId}, round ${round}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get round events for a session
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object>} Map of round number to events
   */
  async getSessionRoundEvents(sessionId) {
    try {
      const events = await firestoreService.getDocuments(
        this.ROUND_EVENTS_COLLECTION,
        [["sessionId", "==", sessionId]]
      );

      const roundEvents = {};

      for (const event of events) {
        roundEvents[event.roundNumber] = event.hazardIds;
      }

      return roundEvents;
    } catch (error) {
      console.error(
        `Error getting round events for session ${sessionId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get card plays for a town grouped by round
   * @param {string} townId - Town ID
   * @returns {Promise<Object>} Map of round number to card names
   */
  // In gameSessionService.js - getTownCardPlays method
  async getTownCardPlays(townId) {
    try {
      const cardPlays = await firestoreService.getDocuments(
        this.CARD_PLAYS_COLLECTION,
        [["townId", "==", townId]]
      );

      const cardsByRound = {};

      for (const play of cardPlays) {
        // Find card details
        const card = allCards.find((c) => c.id === play.cardId);

        if (card) {
          for (const round of play.effectiveRounds) {
            if (!cardsByRound[round]) {
              cardsByRound[round] = [];
            }

            // Just add the card name as a string, as in the original implementation
            let displayName = card.name;

            // If this card has multi-round duration, indicate it
            if (card.duration > 1) {
              const playedAt = play.playedAtRound;
              const duration = card.duration;

              // If this is the first round the card is active
              if (round === playedAt) {
                displayName = `${card.name} (${duration} rounds)`;
              } else {
                // Show which round of effect this is
                const currentEffect = round - playedAt + 1;
                displayName = `${card.name} (${currentEffect}/${duration})`;
              }
            }

            cardsByRound[round].push(displayName);
          }
        }
      }

      return cardsByRound;
    } catch (error) {
      console.error(`Error getting card plays for town ${townId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a game session and all related data
   * @param {string} sessionId - Session ID
   * @returns {Promise<boolean>} True if successful
   */
  async deleteSession(sessionId) {
    try {
      // Get towns in this session
      const towns = await this.getSessionTowns(sessionId);

      // Get round events
      const roundEvents = await firestoreService.getDocuments(
        this.ROUND_EVENTS_COLLECTION,
        [["sessionId", "==", sessionId]]
      );

      // Get round stats
      const roundStats = await firestoreService.getDocuments(
        this.ROUND_STATS_COLLECTION,
        [["sessionId", "==", sessionId]]
      );

      // Get card plays
      const cardPlays = await firestoreService.getDocuments(
        this.CARD_PLAYS_COLLECTION,
        [["sessionId", "==", sessionId]]
      );

      // Delete all related data in a batch operation
      const operations = [];

      // Delete session
      operations.push(["delete", this.SESSIONS_COLLECTION, sessionId]);

      // Delete towns
      for (const town of towns) {
        operations.push(["delete", this.TOWNS_COLLECTION, town.id]);
      }

      // Delete round events
      for (const event of roundEvents) {
        operations.push(["delete", this.ROUND_EVENTS_COLLECTION, event.id]);
      }

      // Delete round stats
      for (const stats of roundStats) {
        operations.push(["delete", this.ROUND_STATS_COLLECTION, stats.id]);
      }

      // Delete card plays
      for (const play of cardPlays) {
        operations.push(["delete", this.CARD_PLAYS_COLLECTION, play.id]);
      }

      // Execute batch operation
      if (operations.length > 0) {
        await firestoreService.batchOperation(operations);
      }

      return true;
    } catch (error) {
      console.error(`Error deleting game session ${sessionId}:`, error);
      throw error;
    }
  }
  /**
   * Delete a round event
   * @param {string} eventId - Round event ID
   * @returns {Promise<boolean>} True if successful
   */
  async deleteRoundEvent(eventId) {
    try {
      return await firestoreService.deleteDocument(
        this.ROUND_EVENTS_COLLECTION,
        eventId
      );
    } catch (error) {
      console.error(`Error deleting round event ${eventId}:`, error);
      throw error;
    }
  }

  /**
   * Update a round event
   * @param {string} eventId - Round event ID
   * @param {Object} data - Data to update
   * @returns {Promise<Object>} Updated round event
   */
  async updateRoundEvent(eventId, data) {
    try {
      return await firestoreService.updateDocument(
        this.ROUND_EVENTS_COLLECTION,
        eventId,
        data
      );
    } catch (error) {
      console.error(`Error updating round event ${eventId}:`, error);
      throw error;
    }
  }

  /**
   * Get card plays for a town in a specific round
   * @param {string} townId - Town ID
   * @param {number} round - Round number
   * @returns {Promise<Array>} Array of card plays
   */
  async getTownCardPlaysForRound(townId, round) {
    try {
      const cardPlays = await firestoreService.getDocuments(
        this.CARD_PLAYS_COLLECTION,
        [
          ["townId", "==", townId],
          ["playedAtRound", "==", round],
        ]
      );

      return cardPlays;
    } catch (error) {
      console.error(
        `Error getting card plays for town ${townId} in round ${round}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Delete a card play
   * @param {string} playId - Card play ID
   * @returns {Promise<boolean>} True if successful
   */
  async deleteCardPlay(playId) {
    try {
      return await firestoreService.deleteDocument(
        this.CARD_PLAYS_COLLECTION,
        playId
      );
    } catch (error) {
      console.error(`Error deleting card play ${playId}:`, error);
      throw error;
    }
  }
}

export default new GameSessionService();
