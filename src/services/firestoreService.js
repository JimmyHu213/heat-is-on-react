// src/services/firestoreService.js
import { db } from "../firebase/config";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";

/**
 * Generic Firestore service with common operations
 */
class FirestoreService {
  /**
   * Create a document in a collection
   * @param {string} collectionPath - Collection path
   * @param {Object} data - Document data
   * @param {string} [customId] - Optional custom document ID
   * @returns {Promise<Object>} Created document data with id
   */
  async createDocument(collectionPath, data, customId = null) {
    try {
      let docRef;

      if (customId) {
        // Use custom ID if provided
        docRef = doc(db, collectionPath, customId);
        await setDoc(docRef, {
          ...data,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        // Let Firestore generate an ID
        docRef = await addDoc(collection(db, collectionPath), {
          ...data,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      // Get the created document
      const docSnap = await getDoc(docRef);
      return {
        id: docRef.id,
        ...docSnap.data(),
      };
    } catch (error) {
      console.error(`Error creating document in ${collectionPath}:`, error);
      throw error;
    }
  }

  /**
   * Get a document by ID
   * @param {string} collectionPath - Collection path
   * @param {string} documentId - Document ID
   * @returns {Promise<Object|null>} Document data with id or null if not found
   */
  async getDocument(collectionPath, documentId) {
    try {
      const docRef = doc(db, collectionPath, documentId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
        };
      }
      return null;
    } catch (error) {
      console.error(
        `Error getting document ${documentId} from ${collectionPath}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get multiple documents from a collection with optional query conditions
   * @param {string} collectionPath - Collection path
   * @param {Array} [conditions] - Array of condition arrays [field, operator, value]
   * @param {Array} [orderByField] - Array of [field, direction]
   * @param {number} [limitCount] - Maximum number of documents to return
   * @returns {Promise<Array>} Array of document data with ids
   */
  async getDocuments(
    collectionPath,
    conditions = [],
    orderByField = null,
    limitCount = null
  ) {
    try {
      const collectionRef = collection(db, collectionPath);

      // Build query
      let queryRef = collectionRef;

      // Add where conditions
      conditions.forEach((condition) => {
        const [field, operator, value] = condition;
        queryRef = query(queryRef, where(field, operator, value));
      });

      // Add order by
      if (orderByField) {
        const [field, direction] = orderByField;
        queryRef = query(queryRef, orderBy(field, direction));
      }

      // Add limit
      if (limitCount) {
        queryRef = query(queryRef, limit(limitCount));
      }

      // Execute query
      const querySnapshot = await getDocs(queryRef);

      // Convert to array of data with ids
      const documents = [];
      querySnapshot.forEach((doc) => {
        documents.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      return documents;
    } catch (error) {
      console.error(`Error getting documents from ${collectionPath}:`, error);
      throw error;
    }
  }

  /**
   * Update a document
   * @param {string} collectionPath - Collection path
   * @param {string} documentId - Document ID
   * @param {Object} data - Data to update
   * @returns {Promise<Object>} Updated document data with id
   */
  async updateDocument(collectionPath, documentId, data) {
    try {
      const docRef = doc(db, collectionPath, documentId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });

      // Get the updated document
      const docSnap = await getDoc(docRef);
      return {
        id: docSnap.id,
        ...docSnap.data(),
      };
    } catch (error) {
      console.error(
        `Error updating document ${documentId} in ${collectionPath}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Delete a document
   * @param {string} collectionPath - Collection path
   * @param {string} documentId - Document ID
   * @returns {Promise<boolean>} True if successful
   */
  async deleteDocument(collectionPath, documentId) {
    try {
      const docRef = doc(db, collectionPath, documentId);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error(
        `Error deleting document ${documentId} from ${collectionPath}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Perform a batch write operation
   * @param {Array} operations - Array of operations: [type, collectionPath, documentId, data]
   * @returns {Promise<boolean>} True if successful
   */
  async batchOperation(operations) {
    try {
      const batch = writeBatch(db);

      operations.forEach((operation) => {
        const [type, collectionPath, documentId, data] = operation;
        const docRef = doc(db, collectionPath, documentId);

        switch (type) {
          case "set":
            batch.set(docRef, {
              ...data,
              updatedAt: serverTimestamp(),
            });
            break;
          case "update":
            batch.update(docRef, {
              ...data,
              updatedAt: serverTimestamp(),
            });
            break;
          case "delete":
            batch.delete(docRef);
            break;
          default:
            throw new Error(`Invalid batch operation type: ${type}`);
        }
      });

      await batch.commit();
      return true;
    } catch (error) {
      console.error("Error performing batch operation:", error);
      throw error;
    }
  }
}

export default new FirestoreService();
