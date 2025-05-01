/**
 * GameSettings Model
 * Represents global game settings
 */
export class GameSettings {
  constructor(data = {}) {
    this.settingId = data.settingId || "";
    this.gameVersion = data.gameVersion || "1.0.0";
    this.roundsPerGame = data.roundsPerGame || 5;

    // Referenced collections (not directly stored)
    this.cards = data.cards || [];
    this.hazards = data.hazards || [];
    this.townTemplates = data.townTemplates || [];
  }

  // Convert to Firestore document data
  toFirestore() {
    return {
      gameVersion: this.gameVersion,
      roundsPerGame: this.roundsPerGame,
    };
  }

  // Create from Firestore document data
  static fromFirestore(doc) {
    const data = doc.data();
    return new GameSettings({
      settingId: doc.id,
      gameVersion: data.gameVersion,
      roundsPerGame: data.roundsPerGame,
    });
  }
}

/**
 * TownTemplate Model
 * Represents a template for creating towns
 */
export class TownTemplate {
  constructor(data = {}) {
    this.townTemplateId = data.townTemplateId || "";
    this.name = data.name || "";
    this.baseStats = data.baseStats || {
      bushfire: { nature: 60, economy: 60, society: 60, health: 60 },
      flood: { nature: 60, economy: 60, society: 60, health: 60 },
      stormSurge: { nature: 60, economy: 60, society: 60, health: 60 },
      heatwave: { nature: 60, economy: 60, society: 60, health: 60 },
      biohazard: { nature: 60, economy: 60, society: 60, health: 60 },
    };
  }

  // Convert to Firestore document data
  toFirestore() {
    return {
      name: this.name,
      baseStats: this.baseStats,
    };
  }

  // Create from Firestore document data
  static fromFirestore(doc) {
    const data = doc.data();
    return new TownTemplate({
      townTemplateId: doc.id,
      name: data.name,
      baseStats: data.baseStats,
    });
  }
}
