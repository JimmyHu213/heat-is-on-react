// src/services/gameSessionService.js
import firestoreService from "./firestoreService";
import { defaultTowns } from "../constants/towns";
import { hazards } from "../constants/hazards";
import { allCards } from "../constants/cards";

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
  async createSession(userId) {
    try {
      // Create new session
      const session = await firestoreService.createDocument(
        this.SESSIONS_COLLECTION,
        {
          userId,
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
   * Get a game session by ID
   * @param {string} sessionId - Session ID
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
   * Create towns for a game session based on templates
   * @param {string} sessionId - Session ID
   * @returns {Promise<Array>} Array of created towns
   */
  async createTownsForSession(sessionId) {
    try {
      const towns = [];

      // Use first 5 default towns (or fewer if not enough)
      const townTemplates = defaultTowns.slice(0, 5);

      for (const template of townTemplates) {
        const townData = {
          sessionId,
          name: template.name,
          townTemplateId: template.id,
          effortPoints: 100,
          currentRound: 0,
          bushfire: template.baseStats.bushfire,
          flood: template.baseStats.flood,
          stormSurge: template.baseStats.stormSurge,
          heatwave: template.baseStats.heatwave,
          biohazard: template.baseStats.biohazard,
          currentStats: {}, // Will be populated when round starts
        };

        const town = await firestoreService.createDocument(
          this.TOWNS_COLLECTION,
          townData
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
   * Get towns for a game session
   * @param {string} sessionId - Session ID
   * @returns {Promise<Array>} Array of towns
   */
  async getSessionTowns(sessionId) {
    try {
      return await firestoreService.getDocuments(this.TOWNS_COLLECTION, [
        ["sessionId", "==", sessionId],
      ]);
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
    try {
      return await firestoreService.updateDocument(
        this.TOWNS_COLLECTION,
        townId,
        data
      );
    } catch (error) {
      console.error(`Error updating town ${townId}:`, error);
      throw error;
    }
  }

  /**
   * Advance game session to next round
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object>} Updated game session
   */
  async advanceRound(sessionId) {
    try {
      // Get current session
      const session = await this.getSession(sessionId);
      if (!session) {
        throw new Error(`Game session not found: ${sessionId}`);
      }

      // Save current round stats if not round 0
      if (session.currentRound > 0) {
        await this.saveRoundStats(sessionId, session.currentRound);
      }

      // Calculate new round
      const newRound = session.currentRound + 1;

      // Check if game should be completed (5 rounds)
      const isComplete = newRound > 5;

      // Update session
      const updatedSession = await firestoreService.updateDocument(
        this.SESSIONS_COLLECTION,
        sessionId,
        {
          currentRound: newRound,
          isActive: !isComplete,
          completedAt: isComplete ? new Date() : null,
        }
      );

      // Update towns' current round
      const towns = await this.getSessionTowns(sessionId);
      for (const town of towns) {
        await this.updateTown(town.id, { currentRound: newRound });
      }

      return {
        ...updatedSession,
        towns: await this.getSessionTowns(sessionId),
      };
    } catch (error) {
      console.error(`Error advancing round for session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Apply a card to a town
   * @param {string} townId - Town ID
   * @param {string} cardId - Card ID
   * @param {number} round - Current round
   * @returns {Promise<Object>} Updated town and card play
   */
  async applyCardToTown(townId, cardId, round) {
    try {
      // Get town
      const town = await firestoreService.getDocument(
        this.TOWNS_COLLECTION,
        townId
      );
      if (!town) {
        throw new Error(`Town not found: ${townId}`);
      }

      // Get card from constants
      const card = allCards.find((c) => c.id === cardId);
      if (!card) {
        throw new Error(`Card not found: ${cardId}`);
      }

      // Apply card effects to town (simulate town.applyCard from Dart code)
      const updatedTown = this.applyCardEffects(town, card);

      // Update town
      const savedTown = await this.updateTown(townId, updatedTown);

      // Create card play record
      const effectiveRounds = [];
      for (let i = 0; i < 1; i++) {
        // Most cards last 1 round
        effectiveRounds.push(round + i);
      }

      const cardPlay = await firestoreService.createDocument(
        this.CARD_PLAYS_COLLECTION,
        {
          sessionId: town.sessionId,
          cardId,
          townId,
          playedAtRound: round,
          effectiveRounds,
          isActive: true,
        }
      );

      return {
        town: savedTown,
        cardPlay,
      };
    } catch (error) {
      console.error(`Error applying card ${cardId} to town ${townId}:`, error);
      throw error;
    }
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
    try {
      // Get hazard from constants
      const hazard = hazards.find((h) => h.id === hazardId);
      if (!hazard) {
        throw new Error(`Hazard not found: ${hazardId}`);
      }

      // Get towns
      const towns = await this.getSessionTowns(sessionId);
      const updatedTowns = [];

      // Apply hazard to each town
      for (const town of towns) {
        const updatedTown = this.applyHazardEffects(town, hazard);
        const savedTown = await this.updateTown(town.id, updatedTown);
        updatedTowns.push(savedTown);
      }

      // Create or update round event
      const roundEventId = `${sessionId}_${round}`;
      let roundEvent = await firestoreService.getDocument(
        this.ROUND_EVENTS_COLLECTION,
        roundEventId
      );

      if (roundEvent) {
        // Update existing round event
        const hazardIds = [...roundEvent.hazardIds];
        if (!hazardIds.includes(hazardId)) {
          hazardIds.push(hazardId);
        }

        const eventHistory = [...roundEvent.eventHistory];
        eventHistory.push({
          type: "hazard",
          hazardId,
          timestamp: new Date(),
        });

        roundEvent = await firestoreService.updateDocument(
          this.ROUND_EVENTS_COLLECTION,
          roundEventId,
          {
            hazardIds,
            eventHistory,
          }
        );
      } else {
        // Create new round event
        roundEvent = await firestoreService.createDocument(
          this.ROUND_EVENTS_COLLECTION,
          {
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
            isComplete: false,
          },
          roundEventId
        );
      }

      return {
        towns: updatedTowns,
        roundEvent,
      };
    } catch (error) {
      console.error(
        `Error applying hazard ${hazardId} to session ${sessionId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Apply hazard effects to town data (helper method)
   * @param {Object} town - Town data
   * @param {Object} hazard - Hazard data
   * @returns {Object} Updated town data
   */
  applyHazardEffects(town, hazard) {
    // Clone the town to avoid mutations
    const updatedTown = { ...town };

    // Apply hazard to the corresponding ability
    const hazardType = hazard.id;
    updatedTown[hazardType] = this.subtractPoints(
      updatedTown[hazardType],
      hazard
    );

    // Check if any aspect of any ability is below threshold
    const THRESHOLD = 20;
    const PENALTY = 10;
    const hazardTypes = [
      "bushfire",
      "flood",
      "stormSurge",
      "heatwave",
      "biohazard",
    ];

    let shouldApplyPenalty = false;

    // Check each hazard type and aspect for values below threshold
    for (const hazardType of hazardTypes) {
      const ability = updatedTown[hazardType];
      if (
        ability.nature <= THRESHOLD ||
        ability.economy <= THRESHOLD ||
        ability.society <= THRESHOLD ||
        ability.health <= THRESHOLD
      ) {
        shouldApplyPenalty = true;
        break;
      }
    }

    // Apply penalty to all hazards if needed
    if (shouldApplyPenalty) {
      for (const hazardType of hazardTypes) {
        updatedTown[hazardType] = {
          nature: this.clampValue(updatedTown[hazardType].nature - PENALTY),
          economy: this.clampValue(updatedTown[hazardType].economy - PENALTY),
          society: this.clampValue(updatedTown[hazardType].society - PENALTY),
          health: this.clampValue(updatedTown[hazardType].health - PENALTY),
        };
      }
    }

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
            cardsByRound[round].push(card.name);
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
}

export default new GameSessionService();
