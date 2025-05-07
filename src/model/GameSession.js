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
    this.currentRound = data.currentRound || 0;
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.completedAt = data.completedAt || null;
  }

  // Convert to Firestore document data
  toFirestore() {
    return {
      userId: this.userId,
      name: this.name,
      createdAt: this.createdAt,
      currentRound: this.currentRound,
      isActive: this.isActive,
      completedAt: this.completedAt,
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
      currentRound: data.currentRound,
      isActive: data.isActive,
      completedAt: data.completedAt?.toDate(),
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
