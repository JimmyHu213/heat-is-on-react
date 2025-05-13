// src/services/exportService.js
import gameSessionService from "./gameSessionService";

/**
 * Export Service
 * Handles exporting game session data in various formats
 */
class ExportService {
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

      // Get round events
      const roundEvents = await gameSessionService.getSessionRoundEvents(
        sessionId
      );

      // Convert to array format
      const roundEventsArray = Object.entries(roundEvents).map(
        ([round, hazardIds]) => ({
          round: parseInt(round),
          hazardIds,
          hazards: hazardIds.map((id) => {
            const hazard = this.getHazardById(id);
            return hazard ? hazard.name : id;
          }),
        })
      );

      // Get card plays for each town
      const cardPlays = {};
      const cardPlaysArray = [];

      for (const town of towns) {
        const townCards = await gameSessionService.getTownCardPlays(town.id);
        cardPlays[town.id] = townCards;

        // Convert to array format for easier export
        for (const [round, cards] of Object.entries(townCards)) {
          cards.forEach((card) => {
            cardPlaysArray.push({
              townId: town.id,
              townName: town.name,
              round: parseInt(round),
              card,
            });
          });
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
        roundEvents: roundEventsArray,
        cardPlays: cardPlaysArray,
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
   * Download session data as JSON
   * @param {Object} data - Session data
   * @param {string} filename - Download filename
   */
  downloadAsJSON(data, filename = "game-session-data.json") {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    this.downloadBlob(blob, filename);
  }

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

      // Add round events sheet
      const eventsSheet = XLSX.utils.json_to_sheet(data.roundEvents);
      XLSX.utils.book_append_sheet(wb, eventsSheet, "Round Events");

      // Add card plays sheet
      const playsSheet = XLSX.utils.json_to_sheet(data.cardPlays);
      XLSX.utils.book_append_sheet(wb, playsSheet, "Card Plays");

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
    const hazards = [
      { id: "bushfire", name: "Bushfire" },
      { id: "flood", name: "Flood" },
      { id: "stormSurge", name: "Storm Surge" },
      { id: "heatwave", name: "Heatwave" },
      { id: "biohazard", name: "Biohazard" },
    ];

    return hazards.find((h) => h.id === hazardId) || null;
  }
}

export default new ExportService();
