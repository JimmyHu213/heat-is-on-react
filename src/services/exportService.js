// src/services/exportService.js
// Updated with fixed round events retrieval

import gameSessionService from "./gameSessionService";
import { hazards } from "../constants/hazards";
import { allCards } from "../constants/cards";
import firestoreService from "./firestoreService";

/**
 * Export Service
 * Handles exporting game session data in various formats
 */
class ExportService {
  // Collection paths (copied from gameSessionService for direct access)
  ROUND_EVENTS_COLLECTION = "round_events";
  CARD_PLAYS_COLLECTION = "card_plays";

  /**
   * Get complete session data package
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object>} Complete session data
   */
  async getSessionDataPackage(sessionId) {
    try {
      // Get session
      const session = await gameSessionService.getSession(sessionId);
      if (!session) {
        throw new Error(`Session not found: ${sessionId}`);
      }

      // Get towns
      const towns = await gameSessionService.getSessionTowns(sessionId);

      // ========== FIX 1: RETRIEVE ROUND EVENTS PROPERLY ==========
      // Get raw round events by directly accessing each round document
      const rawRoundEvents = await this.getRawRoundEvents(
        sessionId,
        session.currentRound
      );

      // Convert to array format with proper hazard names
      const roundEventsArray = rawRoundEvents.map((event) => {
        // Handle potentially missing or empty hazardIds
        const hazardIds = Array.isArray(event.hazardIds) ? event.hazardIds : [];

        return {
          round: event.roundNumber,
          hazardIds: hazardIds,
          hazards: hazardIds.map((id) => {
            const hazard = this.getHazardById(id);
            return hazard ? hazard.name : id;
          }),
          timestamp: event.completedAt || null,
          isComplete: event.isComplete || false,
        };
      });

      // Ensure we have an entry for each round, even if no hazards were applied
      const completeRoundEvents = [];
      for (let round = 1; round <= session.currentRound; round++) {
        const existingEvent = roundEventsArray.find((e) => e.round === round);
        if (existingEvent) {
          completeRoundEvents.push(existingEvent);
        } else {
          // Add placeholder for rounds with no events
          completeRoundEvents.push({
            round: round,
            hazardIds: [],
            hazards: [],
            timestamp: null,
            isComplete: false,
          });
        }
      }

      // ========== FIX 2: PROCESS CARD PLAYS CORRECTLY ==========
      // Get card plays for each town with proper round information
      const cardPlays = {};
      const cardPlaysArray = [];
      const townStatusByRound = [];

      for (const town of towns) {
        // Get raw card plays directly from Firestore
        const rawCardPlays = await this.getRawCardPlays(town.id);

        // Process card plays with proper round information
        const processedCardPlays = this.processCardPlays(rawCardPlays, town);

        // Store card plays by town
        cardPlays[town.id] = processedCardPlays.cardsByRound;

        // Add to the flattened array for export
        cardPlaysArray.push(...processedCardPlays.cardPlaysArray);

        // Track town status for each round
        for (let round = 1; round <= session.currentRound; round++) {
          // Calculate town stats for this round
          // We'll use the currentStats from town if available, or calculate from current values
          let roundStats = null;

          if (town.currentStats && town.currentStats.round === round) {
            roundStats = town.currentStats;
          }

          if (roundStats) {
            townStatusByRound.push({
              round,
              townId: town.id,
              townName: town.name,
              bushfire: roundStats.bushfire,
              flood: roundStats.flood,
              stormSurge: roundStats.stormSurge,
              heatwave: roundStats.heatwave,
              biohazard: roundStats.biohazard,
              effortPoints: town.effortPoints,
            });
          }
        }
      }

      // Return complete data package
      return {
        session: {
          id: session.id,
          name: session.name || "Untitled Game",
          userId: session.userId,
          currentRound: session.currentRound,
          isActive: session.isActive,
          createdAt: session.createdAt,
          completedAt: session.completedAt,
        },
        towns,
        roundEvents: completeRoundEvents,
        cardPlays: cardPlaysArray,
        townStatusByRound,
      };
    } catch (error) {
      console.error(
        `Error getting session data package for ${sessionId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get raw round events directly from Firestore by accessing each document by ID
   * @param {string} sessionId - Session ID
   * @param {number} maxRound - Maximum round number to fetch
   * @returns {Promise<Array>} Array of round event documents
   */
  async getRawRoundEvents(sessionId, maxRound = 5) {
    try {
      const events = [];

      // Attempt to get each round event by its specific ID
      for (let round = 1; round <= maxRound; round++) {
        const roundEventId = `${sessionId}_${round}`;
        try {
          const event = await firestoreService.getDocument(
            this.ROUND_EVENTS_COLLECTION,
            roundEventId
          );

          if (event) {
            // Add roundNumber if not present
            if (!event.roundNumber) {
              event.roundNumber = round;
            }
            events.push(event);
          }
        } catch (error) {
          console.log(`No event found for round ${round}`);
          // Continue to next round - don't break the loop if one round is missing
        }
      }

      // Fallback: if we didn't get any events by ID, try querying by sessionId field
      if (events.length === 0) {
        console.log("Falling back to sessionId query for round events");
        const queryEvents = await firestoreService.getDocuments(
          this.ROUND_EVENTS_COLLECTION,
          [["sessionId", "==", sessionId]]
        );

        if (queryEvents && queryEvents.length > 0) {
          events.push(...queryEvents);
        }
      }

      return events;
    } catch (error) {
      console.error(`Error getting raw round events for ${sessionId}:`, error);
      return [];
    }
  }

  /**
   * Get raw card plays directly from Firestore
   * @param {string} townId - Town ID
   * @returns {Promise<Array>} Array of card play documents
   */
  async getRawCardPlays(townId) {
    try {
      return await firestoreService.getDocuments(this.CARD_PLAYS_COLLECTION, [
        ["townId", "==", townId],
      ]);
    } catch (error) {
      console.error(`Error getting raw card plays for ${townId}:`, error);
      return [];
    }
  }

  /**
   * Process card plays into a structured format
   * @param {Array} rawCardPlays - Raw card play documents
   * @param {Object} town - Town data
   * @returns {Object} Processed card plays
   */
  processCardPlays(rawCardPlays, town) {
    const cardsByRound = {};
    const cardPlaysArray = [];

    // Process each card play
    for (const play of rawCardPlays) {
      // Find card details
      const card = this.getCardById(play.cardId);

      if (!card) continue;

      // Process each effective round for this card
      if (Array.isArray(play.effectiveRounds)) {
        for (const round of play.effectiveRounds) {
          // Initialize array for this round if not exists
          if (!cardsByRound[round]) {
            cardsByRound[round] = [];
          }

          // Create display name with duration info if applicable
          let displayName = card.name;
          const duration = card.duration || 1;
          const playedAtRound = play.playedAtRound || 0;

          if (duration > 1) {
            if (round === playedAtRound) {
              // First round
              displayName = `${card.name} (${duration} rounds)`;
            } else {
              // Later rounds
              const currentEffect = round - playedAtRound + 1;
              displayName = `${card.name} (${currentEffect}/${duration})`;
            }
          }

          // Add to card names for this round
          cardsByRound[round].push(displayName);

          // Add to flattened array for export
          cardPlaysArray.push({
            townId: town.id,
            townName: town.name,
            cardId: play.cardId,
            cardName: card.name,
            playedAtRound: playedAtRound,
            effectiveRound: round,
            round: round, // For backward compatibility
            playedAt: play.playedAt,
            duration: duration,
            cost: card.cost || 0,
            nature: card.nature || 0,
            economy: card.economy || 0,
            society: card.society || 0,
            health: card.health || 0,
          });
        }
      }
    }

    return { cardsByRound, cardPlaysArray };
  }

  /**
   * Download session data as JSON
   * @param {Object} data - Session data
   * @param {string} filename - Download filename
   */
  downloadAsJSON(data, filename = "game-session-data.json") {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    this.downloadBlob(blob, filename);
  }

  // Update only the downloadAsExcel method in src/services/exportService.js

  /**
   * Download session data as Excel
   * @param {Object} data - Session data
   * @param {string} filename - Download filename
   */
  async downloadAsExcel(data, filename = "game-session-data.xlsx") {
    try {
      // We'll use SheetJS to create Excel file
      const XLSX = await import("xlsx");

      // Create workbook
      const wb = XLSX.utils.book_new();

      // Add session info sheet
      const sessionSheet = XLSX.utils.json_to_sheet([
        {
          id: data.session.id,
          name: data.session.name,
          currentRound: data.session.currentRound,
          isActive: data.session.isActive ? "Yes" : "No",
          createdAt: data.session.createdAt
            ? new Date(data.session.createdAt).toLocaleString()
            : "N/A",
          completedAt: data.session.completedAt
            ? new Date(data.session.completedAt).toLocaleString()
            : "N/A",
        },
      ]);
      XLSX.utils.book_append_sheet(wb, sessionSheet, "Session Info");

      // Add towns sheet
      const townsSheet = XLSX.utils.json_to_sheet(
        data.towns.map((town) => ({
          id: town.id,
          name: town.name,
          effortPoints: town.effortPoints,
          currentRound: town.currentRound,
          bushfireNature: town.bushfire.nature,
          bushfireEconomy: town.bushfire.economy,
          bushfireSociety: town.bushfire.society,
          bushfireHealth: town.bushfire.health,
          floodNature: town.flood.nature,
          floodEconomy: town.flood.economy,
          floodSociety: town.flood.society,
          floodHealth: town.flood.health,
          stormSurgeNature: town.stormSurge.nature,
          stormSurgeEconomy: town.stormSurge.economy,
          stormSurgeSociety: town.stormSurge.society,
          stormSurgeHealth: town.stormSurge.health,
          heatwaveNature: town.heatwave.nature,
          heatwaveEconomy: town.heatwave.economy,
          heatwaveSociety: town.heatwave.society,
          heatwaveHealth: town.heatwave.health,
          biohazardNature: town.biohazard.nature,
          biohazardEconomy: town.biohazard.economy,
          biohazardSociety: town.biohazard.society,
          biohazardHealth: town.biohazard.health,
        }))
      );
      XLSX.utils.book_append_sheet(wb, townsSheet, "Towns");

      // Add round events sheet - FIX: Format arrays for Excel compatibility
      const formattedRoundEvents = data.roundEvents.map((event) => ({
        round: event.round,
        // Convert arrays to comma-separated strings for Excel
        hazardIds: Array.isArray(event.hazardIds)
          ? event.hazardIds.join(", ")
          : "",
        hazards: Array.isArray(event.hazards) ? event.hazards.join(", ") : "",
        timestamp: event.timestamp
          ? new Date(event.timestamp).toLocaleString()
          : "",
        isComplete: event.isComplete ? "TRUE" : "FALSE",
      }));

      const eventsSheet = XLSX.utils.json_to_sheet(formattedRoundEvents);
      XLSX.utils.book_append_sheet(wb, eventsSheet, "Round Events");

      // Add card plays sheet
      const playsSheet = XLSX.utils.json_to_sheet(data.cardPlays);
      XLSX.utils.book_append_sheet(wb, playsSheet, "Card Plays");

      // Add town status by round sheet
      if (data.townStatusByRound && data.townStatusByRound.length > 0) {
        // Transform townStatusByRound data to flatten the nested objects
        const flattenedStatusData = data.townStatusByRound.map((status) => {
          const flatStatus = {
            round: status.round,
            townId: status.townId,
            townName: status.townName,
            effortPoints: status.effortPoints,
          };

          // Add bushfire stats
          if (status.bushfire) {
            flatStatus.bushfireNature = status.bushfire.nature;
            flatStatus.bushfireEconomy = status.bushfire.economy;
            flatStatus.bushfireSociety = status.bushfire.society;
            flatStatus.bushfireHealth = status.bushfire.health;
          }

          // Add flood stats
          if (status.flood) {
            flatStatus.floodNature = status.flood.nature;
            flatStatus.floodEconomy = status.flood.economy;
            flatStatus.floodSociety = status.flood.society;
            flatStatus.floodHealth = status.flood.health;
          }

          // Add stormSurge stats
          if (status.stormSurge) {
            flatStatus.stormSurgeNature = status.stormSurge.nature;
            flatStatus.stormSurgeEconomy = status.stormSurge.economy;
            flatStatus.stormSurgeSociety = status.stormSurge.society;
            flatStatus.stormSurgeHealth = status.stormSurge.health;
          }

          // Add heatwave stats
          if (status.heatwave) {
            flatStatus.heatwaveNature = status.heatwave.nature;
            flatStatus.heatwaveEconomy = status.heatwave.economy;
            flatStatus.heatwaveSociety = status.heatwave.society;
            flatStatus.heatwaveHealth = status.heatwave.health;
          }

          // Add biohazard stats
          if (status.biohazard) {
            flatStatus.biohazardNature = status.biohazard.nature;
            flatStatus.biohazardEconomy = status.biohazard.economy;
            flatStatus.biohazardSociety = status.biohazard.society;
            flatStatus.biohazardHealth = status.biohazard.health;
          }

          return flatStatus;
        });

        const townStatusSheet = XLSX.utils.json_to_sheet(flattenedStatusData);
        XLSX.utils.book_append_sheet(
          wb,
          townStatusSheet,
          "Town Status By Round"
        );
      }

      // Generate Excel file
      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      // Download file
      this.downloadBlob(blob, filename);
    } catch (error) {
      console.error("Error generating Excel file:", error);
      throw error;
    }
  }
  /**
   * Helper method to download a blob as a file
   * @param {Blob} blob - Data blob
   * @param {string} filename - Download filename
   */
  downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Get hazard by ID
   * Helper to convert hazard IDs to names in export
   * @param {string} hazardId - Hazard ID
   * @returns {Object|null} Hazard object or null
   */
  getHazardById(hazardId) {
    return hazards.find((h) => h.id === hazardId) || null;
  }

  /**
   * Get card by ID
   * Helper to get card details
   * @param {string} cardId - Card ID
   * @returns {Object|null} Card object or null
   */
  getCardById(cardId) {
    return allCards.find((c) => c.id === cardId) || null;
  }
}

export default new ExportService();
