import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "../firebase/config";
import {
  createUserDocument,
  getUserDocument,
  updateUserDocument,
} from "../services/userService";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function signup(email, password, additionalData = {}) {
    try {
      // Create the user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      console.log("User created in Auth:", userCredential.user);

      // Create a document in Firestore for this user
      const userDoc = await createUserDocument(
        userCredential.user,
        additionalData
      );
      console.log("User document created in Firestore:", userDoc);

      return userCredential;
    } catch (error) {
      console.error("Error in signup process:", error);
      throw error;
    }
  }

  async function login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Update the last login timestamp in Firestore
      if (userCredential.user) {
        await updateUserDocument(userCredential.user.uid, {
          lastLogin: new Date(),
        });
      }

      return userCredential;
    } catch (error) {
      console.error("Error in login process:", error);
      throw error;
    }
  }

  async function logout() {
    setUserProfile(null);
    return signOut(auth);
  }

  function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }

  // Fetch the user's profile from Firestore
  async function fetchUserProfile(user) {
    if (user) {
      try {
        const userDoc = await getUserDocument(user.uid);
        setUserProfile(userDoc);
        return userDoc;
      } catch (error) {
        console.error("Error fetching user profile:", error);
        return null;
      }
    } else {
      setUserProfile(null);
      return null;
    }
  }

  // Update user profile in Firestore
  async function updateProfile(data) {
    if (!currentUser) return null;

    try {
      const updated = await updateUserDocument(currentUser.uid, data);
      setUserProfile(updated);
      return updated;
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        // When a user logs in, try to fetch their Firestore profile
        await fetchUserProfile(user);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    login,
    signup,
    logout,
    resetPassword,
    fetchUserProfile,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
