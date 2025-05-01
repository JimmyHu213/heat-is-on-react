/**
 * User Model
 * Represents a user in the system
 */
export class User {
  constructor(data = {}) {
    this.userId = data.userId || "";
    this.email = data.email || "";
    this.displayName = data.displayName || "";
    this.createdAt = data.createdAt || null;
    this.lastLogin = data.lastLogin || null;
  }

  // Convert to Firestore document data
  toFirestore() {
    return {
      userId: this.userId,
      email: this.email,
      displayName: this.displayName,
      createdAt: this.createdAt,
      lastLogin: this.lastLogin,
    };
  }

  // Create from Firestore document data
  static fromFirestore(doc) {
    const data = doc.data();
    return new User({
      userId: doc.id,
      email: data.email,
      displayName: data.displayName,
      createdAt: data.createdAt?.toDate(),
      lastLogin: data.lastLogin?.toDate(),
    });
  }
}
