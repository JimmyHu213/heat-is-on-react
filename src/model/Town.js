/**
 * AbilityPoints Model
 * Represents a set of ability points for a town's resilience to a hazard
 */
export class AbilityPoints {
  constructor(data = {}) {
    this.nature = this._clamp(data.nature || 0);
    this.economy = this._clamp(data.economy || 0);
    this.society = this._clamp(data.society || 0);
    this.health = this._clamp(data.health || 0);
  }

  // Clamp value between 0 and 100
  _clamp(value) {
    return Math.max(0, Math.min(100, value));
  }

  // Convert to plain object
  toJSON() {
    return {
      nature: this.nature,
      economy: this.economy,
      society: this.society,
      health: this.health,
    };
  }

  // Apply hazard effect (subtract values)
  applyHazard(hazard) {
    this.nature = this._clamp(this.nature - hazard.nature);
    this.economy = this._clamp(this.economy - hazard.economy);
    this.society = this._clamp(this.society - hazard.society);
    this.health = this._clamp(this.health - hazard.health);
    return this;
  }

  // Apply card effect (add values)
  applyCard(card) {
    this.nature = this._clamp(this.nature + card.nature);
    this.economy = this._clamp(this.economy + card.economy);
    this.society = this._clamp(this.society + card.society);
    this.health = this._clamp(this.health + card.health);
    return this;
  }

  // Get total points
  getTotal() {
    return this.nature + this.economy + this.society + this.health;
  }
}

/**
 * Town Model
 * Represents a town in the game with various ability scores
 */
export class Town {
  constructor(data = {}) {
    this.townId = data.townId || "";
    this.sessionId = data.sessionId || "";
    this.townTemplateId = data.townTemplateId || "";
    this.name = data.name || "";
    this.effortPoints = data.effortPoints || 100;
    this.currentRound = data.currentRound || 0;

    // Initialize ability points for each hazard
    this.bushfire = new AbilityPoints(data.bushfire || {});
    this.flood = new AbilityPoints(data.flood || {});
    this.stormSurge = new AbilityPoints(data.stormSurge || {});
    this.heatwave = new AbilityPoints(data.heatwave || {});
    this.biohazard = new AbilityPoints(data.biohazard || {});

    // Current stats (snapshot for current round)
    this.currentStats = data.currentStats || {};
  }

  // Convert to Firestore document data
  toFirestore() {
    return {
      sessionId: this.sessionId,
      townTemplateId: this.townTemplateId,
      name: this.name,
      effortPoints: this.effortPoints,
      currentRound: this.currentRound,
      bushfire: this.bushfire.toJSON(),
      flood: this.flood.toJSON(),
      stormSurge: this.stormSurge.toJSON(),
      heatwave: this.heatwave.toJSON(),
      biohazard: this.biohazard.toJSON(),
      currentStats: this.currentStats,
    };
  }

  // Create from Firestore document data
  static fromFirestore(doc) {
    const data = doc.data();
    return new Town({
      townId: doc.id,
      sessionId: data.sessionId,
      townTemplateId: data.townTemplateId,
      name: data.name,
      effortPoints: data.effortPoints,
      currentRound: data.currentRound,
      bushfire: data.bushfire,
      flood: data.flood,
      stormSurge: data.stormSurge,
      heatwave: data.heatwave,
      biohazard: data.biohazard,
      currentStats: data.currentStats,
    });
  }

  // Apply hazard effect to a specific ability
  applyHazard(hazard) {
    const ability = this._getAbilityForHazard(hazard.id);
    ability.applyHazard(hazard);
    this._applyPenaltyToOtherAbilities();
    return this;
  }

  // Apply card effect to a specific ability or all abilities
  applyCard(card) {
    if (
      ["bushfire", "flood", "stormSurge", "heatwave", "biohazard"].includes(
        card.type
      )
    ) {
      // Apply to specific hazard type
      this._getAbilityForHazard(card.type).applyCard(card);
    } else {
      // Apply to all abilities but only for the specified aspect
      const abilities = [
        this.bushfire,
        this.flood,
        this.stormSurge,
        this.heatwave,
        this.biohazard,
      ];

      abilities.forEach((ability) => {
        const cardEffect = {
          nature: card.type === "nature" ? card.nature : 0,
          economy: card.type === "economy" ? card.economy : 0,
          society: card.type === "society" ? card.society : 0,
          health: card.type === "health" ? card.health : 0,
        };

        ability.applyCard(cardEffect);
      });
    }

    return this;
  }

  // Get ability for a specific hazard
  _getAbilityForHazard(hazardId) {
    switch (hazardId) {
      case "bushfire":
        return this.bushfire;
      case "flood":
        return this.flood;
      case "stormSurge":
        return this.stormSurge;
      case "heatwave":
        return this.heatwave;
      case "biohazard":
        return this.biohazard;
      default:
        throw new Error(`Invalid hazard ID: ${hazardId}`);
    }
  }

  // Apply penalty to all abilities if any aspect falls below threshold
  _applyPenaltyToOtherAbilities() {
    const THRESHOLD = 20;
    const PENALTY = 10;

    const abilities = [
      this.bushfire,
      this.flood,
      this.stormSurge,
      this.heatwave,
      this.biohazard,
    ];

    // Check if any aspect is below threshold
    const shouldApplyPenalty = abilities.some(
      (ability) =>
        ability.nature <= THRESHOLD ||
        ability.economy <= THRESHOLD ||
        ability.society <= THRESHOLD ||
        ability.health <= THRESHOLD
    );

    // Apply penalty to all aspects if needed
    if (shouldApplyPenalty) {
      abilities.forEach((ability) => {
        ability.nature = ability._clamp(ability.nature - PENALTY);
        ability.economy = ability._clamp(ability.economy - PENALTY);
        ability.society = ability._clamp(ability.society - PENALTY);
        ability.health = ability._clamp(ability.health - PENALTY);
      });
    }
  }

  // Snapshot current stats for the round
  snapshotStats() {
    this.currentStats = {
      bushfire: this.bushfire.toJSON(),
      flood: this.flood.toJSON(),
      stormSurge: this.stormSurge.toJSON(),
      heatwave: this.heatwave.toJSON(),
      biohazard: this.biohazard.toJSON(),
      round: this.currentRound,
    };
    return this;
  }
}
