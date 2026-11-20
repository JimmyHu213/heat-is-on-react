// src/services/exportService.js
import { allCards } from "../constants/cards.js";
import { hazards } from "../constants/hazards.js";
import { paidCardCost } from "../game/cards.js";
import { getPlayerCount, getTotalRounds } from "../game/options.js";
import { getStage } from "../game/stages.js";
import firestoreService from "./firestoreService.js";
import gameSessionService from "./gameSessionService.js";

/**
 * Pure helper to normalize session and per-round records so missing optional
 * fields have one consistent meaning everywhere (UI, JSON export, Excel export).
 */
export function normalizeSessionForExport(
  session,
  rawRoundEvents = [],
  rawRoundStats = []
) {
  const totalRounds = getTotalRounds(session);
  const digitalWheelEnabled = session.digitalWheelEnabled ?? true;
  const playerCount = getPlayerCount(session);
  const endedEarly = session.endedEarly === true;

  const currentRoundEvent = rawRoundEvents.find(
    (e) => e.roundNumber === session.currentRound
  );
  const currentRoundHazardCount = Array.isArray(currentRoundEvent?.hazardIds)
    ? currentRoundEvent.hazardIds.length
    : 0;
  const stage = getStage(session, currentRoundHazardCount);

  const roundsToExport = Math.max(
    0,
    session.isActive ? session.currentRound : session.currentRound - 1
  );

  const roundEvents = [];
  for (let round = 1; round <= roundsToExport; round++) {
    const existingEvent = rawRoundEvents.find((e) => e.roundNumber === round);
    const statsForRound = rawRoundStats.find((s) => s.roundNumber === round);
    const hazardIds = Array.isArray(existingEvent?.hazardIds)
      ? existingEvent.hazardIds
      : [];

    roundEvents.push({
      round,
      hazardIds,
      hazards: hazardIds.map((id) => {
        const h = hazards.find((item) => item.id === id);
        return h ? h.name : id;
      }),
      impactPoints: existingEvent?.impactPoints ?? null,
      impactComplete:
        existingEvent != null &&
        existingEvent.impactPoints != null &&
        existingEvent.impactComplete !== false,
      dividends: statsForRound?.dividends ?? null,
      timestamp: existingEvent?.completedAt || existingEvent?.updatedAt || null,
      isComplete: Boolean(existingEvent?.isComplete || statsForRound),
    });
  }

  return {
    session: {
      id: session.id,
      name: session.name || "Untitled Game",
      userId: session.userId,
      currentRound: session.currentRound,
      totalRounds,
      digitalWheelEnabled,
      playerCount,
      endedEarly,
      stage,
      isActive: session.isActive,
      createdAt: session.createdAt,
      completedAt: session.completedAt,
    },
    roundsToExport,
    roundEvents,
  };
}

/**
 * Export Service
 * Handles exporting game session data in various formats
 */
class ExportService {
  ROUND_EVENTS_COLLECTION = "round_events";

  /**
   * Get complete session data package
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object>} Complete session data
   */
  async getSessionDataPackage(sessionId) {
    try {
      const session = await gameSessionService.getSession(sessionId);
      if (!session) {
        throw new Error(`Session not found: ${sessionId}`);
      }

      const [towns, rawRoundEvents, rawRoundStats] = await Promise.all([
        gameSessionService.getSessionTowns(sessionId),
        this.getRawRoundEvents(
          sessionId,
          Math.max(session.currentRound, getTotalRounds(session))
        ),
        gameSessionService.getSessionRoundStats(sessionId),
      ]);

      const normalized = normalizeSessionForExport(
        session,
        rawRoundEvents,
        rawRoundStats
      );

      const cardPlays = {};
      const cardPlaysArray = [];
      const townStatusByRound = [];

      for (const town of towns) {
        const rawCardPlays = await this.getRawCardPlays(town.id, sessionId);
        const processedCardPlays = this.processCardPlays(rawCardPlays, town);
        cardPlays[town.id] = processedCardPlays.cardsByRound;
        cardPlaysArray.push(...processedCardPlays.cardPlaysArray);

        for (let round = 1; round <= normalized.roundsToExport; round++) {
          const statsDoc = rawRoundStats.find((s) => s.roundNumber === round);
          const roundSnapshot =
            statsDoc?.towns?.[town.id] ||
            (town.currentStats && town.currentStats.round === round
              ? town.currentStats
              : null);

          if (roundSnapshot) {
            townStatusByRound.push({
              round,
              townId: town.id,
              townName: town.name,
              bushfire: roundSnapshot.bushfire,
              flood: roundSnapshot.flood,
              stormSurge: roundSnapshot.stormSurge,
              heatwave: roundSnapshot.heatwave,
              biohazard: roundSnapshot.biohazard,
              dividendEarned: statsDoc?.dividends?.[town.id] ?? null,
              effortPoints: town.effortPoints,
            });
          }
        }
      }

      return {
        session: normalized.session,
        towns,
        roundEvents: normalized.roundEvents,
        roundStats: rawRoundStats,
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
   * Get raw round events directly from Firestore
   */
  async getRawRoundEvents(sessionId, maxRound = 5) {
    try {
      const queryEvents = await firestoreService.getDocuments(
        this.ROUND_EVENTS_COLLECTION,
        [["sessionId", "==", sessionId]]
      );
      if (queryEvents && queryEvents.length > 0) {
        return queryEvents;
      }

      const events = [];
      for (let round = 1; round <= maxRound; round++) {
        const roundEventId = `${sessionId}_${round}`;
        try {
          const event = await firestoreService.getDocument(
            this.ROUND_EVENTS_COLLECTION,
            roundEventId
          );
          if (event) {
            if (!event.roundNumber) {
              event.roundNumber = round;
            }
            events.push(event);
          }
        } catch {
          // Continue to next round
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
   */
  async getRawCardPlays(townId, sessionId) {
    try {
      return await gameSessionService.getTownCardPlayDocs(townId, sessionId);
    } catch (error) {
      console.error(`Error getting raw card plays for ${townId}:`, error);
      return [];
    }
  }

  /**
   * Process card plays into a structured format
   */
  processCardPlays(rawCardPlays, town) {
    const cardsByRound = {};
    const cardPlaysArray = [];

    for (const play of rawCardPlays) {
      const card = this.getCardById(play.cardId);
      if (!card) continue;

      if (Array.isArray(play.effectiveRounds)) {
        for (const round of play.effectiveRounds) {
          if (!cardsByRound[round]) {
            cardsByRound[round] = [];
          }

          let displayName = card.name;
          const duration = card.duration || 1;
          const playedAtRound = play.playedAtRound || 0;

          if (duration > 1) {
            if (round === playedAtRound) {
              displayName = `${card.name} (${duration} rounds)`;
            } else {
              const currentEffect = round - playedAtRound + 1;
              displayName = `${card.name} (${currentEffect}/${duration})`;
            }
          }

          cardsByRound[round].push(displayName);

          cardPlaysArray.push({
            townId: town.id,
            townName: town.name,
            cardId: play.cardId,
            cardName: card.name,
            playedAtRound,
            effectiveRound: round,
            round,
            playedAt: play.playedAt,
            duration,
            cost: round === playedAtRound ? paidCardCost(play) : 0,
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
   */
  downloadAsJSON(data, filename = "game-session-data.json") {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    this.downloadBlob(blob, filename);
  }

  /**
   * Download session data as Excel
   */
  async downloadAsExcel(data, filename = "game-session-data.xlsx") {
    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.utils.book_new();

      const sessionSheet = XLSX.utils.json_to_sheet([
        {
          id: data.session.id,
          name: data.session.name,
          currentRound: data.session.currentRound,
          totalRounds: data.session.totalRounds,
          digitalWheelEnabled: data.session.digitalWheelEnabled ? "Yes" : "No",
          playerCount: data.session.playerCount ?? "N/A",
          endedEarly: data.session.endedEarly ? "Yes" : "No",
          stage: data.session.stage,
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

      const townsSheet = XLSX.utils.json_to_sheet(
        data.towns.map((town) => ({
          id: town.id,
          name: town.name,
          isComparisonTown: town.isComparisonTown ? "Yes" : "No",
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

      const formattedRoundEvents = data.roundEvents.map((event) => ({
        round: event.round,
        hazardIds: Array.isArray(event.hazardIds)
          ? event.hazardIds.join(", ")
          : "",
        hazards: Array.isArray(event.hazards) ? event.hazards.join(", ") : "",
        impactComplete: event.impactComplete ? "TRUE" : "FALSE",
        timestamp: event.timestamp
          ? new Date(event.timestamp).toLocaleString()
          : "",
        isComplete: event.isComplete ? "TRUE" : "FALSE",
      }));

      const eventsSheet = XLSX.utils.json_to_sheet(formattedRoundEvents);
      XLSX.utils.book_append_sheet(wb, eventsSheet, "Round Events");

      const playsSheet = XLSX.utils.json_to_sheet(data.cardPlays);
      XLSX.utils.book_append_sheet(wb, playsSheet, "Card Plays");

      if (data.townStatusByRound && data.townStatusByRound.length > 0) {
        const flattenedStatusData = data.townStatusByRound.map((status) => {
          const flatStatus = {
            round: status.round,
            townId: status.townId,
            townName: status.townName,
            dividendEarned: status.dividendEarned ?? "",
            effortPoints: status.effortPoints,
          };

          if (status.bushfire) {
            flatStatus.bushfireNature = status.bushfire.nature;
            flatStatus.bushfireEconomy = status.bushfire.economy;
            flatStatus.bushfireSociety = status.bushfire.society;
            flatStatus.bushfireHealth = status.bushfire.health;
          }
          if (status.flood) {
            flatStatus.floodNature = status.flood.nature;
            flatStatus.floodEconomy = status.flood.economy;
            flatStatus.floodSociety = status.flood.society;
            flatStatus.floodHealth = status.flood.health;
          }
          if (status.stormSurge) {
            flatStatus.stormSurgeNature = status.stormSurge.nature;
            flatStatus.stormSurgeEconomy = status.stormSurge.economy;
            flatStatus.stormSurgeSociety = status.stormSurge.society;
            flatStatus.stormSurgeHealth = status.stormSurge.health;
          }
          if (status.heatwave) {
            flatStatus.heatwaveNature = status.heatwave.nature;
            flatStatus.heatwaveEconomy = status.heatwave.economy;
            flatStatus.heatwaveSociety = status.heatwave.society;
            flatStatus.heatwaveHealth = status.heatwave.health;
          }
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

      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      this.downloadBlob(blob, filename);
    } catch (error) {
      console.error("Error generating Excel file:", error);
      throw error;
    }
  }

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

  getHazardById(hazardId) {
    return hazards.find((h) => h.id === hazardId) || null;
  }

  getCardById(cardId) {
    return allCards.find((c) => c.id === cardId) || null;
  }
}

export default new ExportService();
