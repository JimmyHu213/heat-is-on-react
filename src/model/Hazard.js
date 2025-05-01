/**
 * Hazard Model
 * Represents a hazard type in the game
 */
export class Hazard {
  constructor(data = {}) {
    this.hazardId = data.hazardId || data.id || "";
    this.name = data.name || "";
    this.nature = data.nature || 0;
    this.economy = data.economy || 0;
    this.society = data.society || 0;
    this.health = data.health || 0;

    // Dimension effects (optional)
    this.dimensionEffects = data.dimensionEffects || {
      nature: this.nature,
      economy: this.economy,
      society: this.society,
      health: this.health,
    };
  }

  // Convert to Firestore document data
  toFirestore() {
    return {
      name: this.name,
      nature: this.nature,
      economy: this.economy,
      society: this.society,
      health: this.health,
      dimensionEffects: this.dimensionEffects,
    };
  }

  // Create from Firestore document data
  static fromFirestore(doc) {
    const data = doc.data();
    return new Hazard({
      hazardId: doc.id,
      name: data.name,
      nature: data.nature,
      economy: data.economy,
      society: data.society,
      health: data.health,
      dimensionEffects: data.dimensionEffects,
    });
  }
}

/**
 * RoundEvent Model
 * Represents hazard events that occur in a game round
 */
export class RoundEvent {
  constructor(data = {}) {
    this.sessionId = data.sessionId || "";
    this.roundNumber = data.roundNumber || 0;
    this.hazardIds = data.hazardIds || [];
    this.completedAt = data.completedAt || null;
    this.eventHistory = data.eventHistory || [];
    this.isComplete = data.isComplete !== undefined ? data.isComplete : false;
  }

  // Convert to Firestore document data
  toFirestore() {
    return {
      sessionId: this.sessionId,
      roundNumber: this.roundNumber,
      hazardIds: this.hazardIds,
      completedAt: this.completedAt,
      eventHistory: this.eventHistory,
      isComplete: this.isComplete,
    };
  }

  // Create from Firestore document data
  static fromFirestore(doc) {
    const data = doc.data();
    return new RoundEvent({
      roundId: doc.id, // Not used directly in model, but available
      sessionId: data.sessionId,
      roundNumber: data.roundNumber,
      hazardIds: data.hazardIds,
      completedAt: data.completedAt?.toDate(),
      eventHistory: data.eventHistory,
      isComplete: data.isComplete,
    });
  }

  // Add a hazard to the round
  addHazard(hazardId) {
    if (!this.hazardIds.includes(hazardId)) {
      this.hazardIds.push(hazardId);
      this.eventHistory.push({
        type: "hazard",
        hazardId,
        timestamp: new Date(),
      });
    }
    return this;
  }

  // Complete the round
  complete() {
    this.isComplete = true;
    this.completedAt = new Date();
    return this;
  }
}

/**
 * RoundStats Model
 * Represents stats for towns at the end of a round
 */
export class RoundStats {
  constructor(data = {}) {
    this.sessionId = data.sessionId || "";
    this.roundNumber = data.roundNumber || 0;
    this.towns = data.towns || {}; // Map of townId to stats
    this.completedAt = data.completedAt || null;
  }

  // Convert to Firestore document data
  toFirestore() {
    return {
      sessionId: this.sessionId,
      roundNumber: this.roundNumber,
      towns: this.towns,
      completedAt: this.completedAt,
    };
  }

  // Create from Firestore document data
  static fromFirestore(doc) {
    const data = doc.data();
    return new RoundStats({
      sessionId: data.sessionId,
      roundNumber: data.roundNumber,
      towns: data.towns,
      completedAt: data.completedAt?.toDate(),
    });
  }

  // Add town stats for the round
  addTownStats(townId, stats) {
    this.towns[townId] = stats;
    return this;
  }

  // Complete the stats recording
  complete() {
    this.completedAt = new Date();
    return this;
  }
}
