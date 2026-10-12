/**
 * GameSession Model
 * Represents a game session with player, round and state information
 */
export class GameSession {
  constructor(data = {}) {
    this.sessionId = data.sessionId || "";
    this.userId = data.userId || "";
    this.name = data.name || "";
    this.createdAt = data.createdAt || null;
    this.totalRounds = data.totalRounds ?? 5;
    this.digitalWheelEnabled = data.digitalWheelEnabled !== false;
    this.currentRound = data.currentRound || 0;
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.completedAt = data.completedAt || null;
    this.endedEarly = data.endedEarly === true;
    this.stage = data.stage || (this.isActive ? "adaptation" : "complete");
    this.revision = data.revision || 0;
  }

  // Convert to Firestore document data
  toFirestore() {
    return {
      userId: this.userId,
      name: this.name,
      createdAt: this.createdAt,
      totalRounds: this.totalRounds,
      digitalWheelEnabled: this.digitalWheelEnabled,
      currentRound: this.currentRound,
      isActive: this.isActive,
      completedAt: this.completedAt,
      endedEarly: this.endedEarly,
      stage: this.stage,
      revision: this.revision,
    };
  }

  // Create from Firestore document data
  static fromFirestore(doc) {
    const data = doc.data();
    return new GameSession({
      sessionId: doc.id,
      userId: data.userId,
      name: data.name,
      createdAt: data.createdAt?.toDate(),
      totalRounds: data.totalRounds,
      digitalWheelEnabled: data.digitalWheelEnabled,
      currentRound: data.currentRound,
      isActive: data.isActive,
      completedAt: data.completedAt?.toDate(),
      endedEarly: data.endedEarly,
      stage: data.stage,
      revision: data.revision,
    });
  }

  // Advance to the next round
  advanceRound() {
    this.currentRound += 1;
    return this;
  }

  // Complete the game
  completeGame() {
    this.isActive = false;
    this.completedAt = new Date();
    return this;
  }
}
