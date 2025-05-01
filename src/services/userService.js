import { db } from "../firebase/config";
import { User } from "../models";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";

/**
 * Creates a new user document in Firestore after registration
 * @param {Object} user - Firebase Auth user object
 * @param {Object} additionalData - Any additional user data to store
 * @returns {Promise<User>} The created user document
 */
export async function createUserDocument(user, additionalData = {}) {
  if (!user) return null;

  const userRef = doc(db, "users", user.uid);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    const { email, displayName, photoURL } = user;

    try {
      await setDoc(userRef, {
        userId: user.uid,
        email,
        displayName: displayName || additionalData.displayName || "",
        photoURL: photoURL || "",
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        ...additionalData,
      });
    } catch (error) {
      console.error("Error creating user document", error);
      throw error;
    }
  } else {
    // User already exists, update lastLogin
    await updateDoc(userRef, {
      lastLogin: serverTimestamp(),
    });
  }

  return getUserDocument(user.uid);
}

/**
 * Retrieves a user document from Firestore
 * @param {string} uid - User ID
 * @returns {Promise<User|null>} User document or null if not found
 */
export async function getUserDocument(uid) {
  if (!uid) return null;

  try {
    const userRef = doc(db, "users", uid);
    const snapshot = await getDoc(userRef);

    if (snapshot.exists()) {
      return User.fromFirestore(snapshot);
    }
  } catch (error) {
    console.error("Error getting user document", error);
    throw error;
  }

  return null;
}

/**
 * Updates a user document in Firestore
 * @param {string} uid - User ID
 * @param {Object} data - Data to update
 * @returns {Promise<User>} Updated user document
 */
export async function updateUserDocument(uid, data) {
  if (!uid || !data) return null;

  try {
    const userRef = doc(db, "users", uid);

    // Add updatedAt timestamp
    const updateData = {
      ...data,
      updatedAt: serverTimestamp(),
    };

    await updateDoc(userRef, updateData);
    return getUserDocument(uid);
  } catch (error) {
    console.error("Error updating user document", error);
    throw error;
  }
}

/**
 * Delete a user document from Firestore
 * @param {string} uid - User ID
 * @returns {Promise<void>}
 */
export async function deleteUserDocument(uid) {
  if (!uid) return;

  try {
    const userRef = doc(db, "users", uid);
    await deleteDoc(userRef);
  } catch (error) {
    console.error("Error deleting user document", error);
    throw error;
  }
}

/**
 * Query users by a specific field value
 * @param {string} field - Field to query
 * @param {any} value - Value to match
 * @returns {Promise<Array<User>>} Array of user documents
 */
export async function queryUsersByField(field, value) {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where(field, "==", value));
    const querySnapshot = await getDocs(q);

    const users = [];
    querySnapshot.forEach((doc) => {
      users.push(User.fromFirestore(doc));
    });

    return users;
  } catch (error) {
    console.error("Error querying users", error);
    throw error;
  }
}
