/**
 * Card Model
 * Represents an adaptation card in the game
 */
export class Card {
  constructor(data = {}) {
    this.cardId = data.cardId || "";
    this.name = data.name || "";
    this.dimension = data.dimension || ""; // hazard type or aspect
    this.points = data.points || 0;
    this.durationRounds = data.durationRounds || 1;

    // Stats impacts
    this.nature = data.nature || 0;
    this.economy = data.economy || 0;
    this.society = data.society || 0;
    this.health = data.health || 0;

    // Optional properties
    this.cost = data.cost || 0;
    this.round = data.round || 1;
    this.type = data.type || "";
  }

  // Convert to Firestore document data
  toFirestore() {
    return {
      name: this.name,
      dimension: this.dimension,
      points: this.points,
      durationRounds: this.durationRounds,
      nature: this.nature,
      economy: this.economy,
      society: this.society,
      health: this.health,
      cost: this.cost,
      round: this.round,
      type: this.type,
    };
  }

  // Create from Firestore document data
  static fromFirestore(doc) {
    const data = doc.data();
    return new Card({
      cardId: doc.id,
      name: data.name,
      dimension: data.dimension,
      points: data.points,
      durationRounds: data.durationRounds,
      nature: data.nature,
      economy: data.economy,
      society: data.society,
      health: data.health,
      cost: data.cost,
      round: data.round,
      type: data.type,
    });
  }
}

/**
 * CardPlay Model
 * Represents a card played in a game session
 */
export class CardPlay {
  constructor(data = {}) {
    this.playId = data.playId || "";
    this.sessionId = data.sessionId || "";
    this.cardId = data.cardId || "";
    this.townId = data.townId || "";
    this.playedAtRound = data.playedAtRound || 0;
    this.effectiveRounds = data.effectiveRounds || [];
    this.playedAt = data.playedAt || null;
    this.isActive = data.isActive !== undefined ? data.isActive : true;
  }

  // Convert to Firestore document data
  toFirestore() {
    return {
      sessionId: this.sessionId,
      cardId: this.cardId,
      townId: this.townId,
      playedAtRound: this.playedAtRound,
      effectiveRounds: this.effectiveRounds,
      playedAt: this.playedAt,
      isActive: this.isActive,
    };
  }

  // Create from Firestore document data
  static fromFirestore(doc) {
    const data = doc.data();
    return new CardPlay({
      playId: doc.id,
      sessionId: data.sessionId,
      cardId: data.cardId,
      townId: data.townId,
      playedAtRound: data.playedAtRound,
      effectiveRounds: data.effectiveRounds,
      playedAt: data.playedAt?.toDate(),
      isActive: data.isActive,
    });
  }

  // Deactivate the card
  deactivate() {
    this.isActive = false;
    return this;
  }
}
