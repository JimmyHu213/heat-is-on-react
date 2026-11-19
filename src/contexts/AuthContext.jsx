import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import {
  onIdTokenChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import { auth } from "../firebase/config";
import {
  createUserDocument,
  getUserDocument,
  updateUserDocument,
} from "../services/userService";

import { accessDeadline } from "./ccsAccess";

import { ccsOnly } from "./ccsSession";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [deadline, setDeadline] = useState(0);
  const [expired, setExpired] = useState(false);
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

  // Memoize the logout function
  const logout = useCallback(async () => {
    setUserProfile(null);
    setCurrentUser(null);

    // Add a browser storage clear
    localStorage.removeItem("lastUserId");
    sessionStorage.clear();
    return signOut(auth);
  }, []);

  function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }

  async function changePassword(currentPassword, newPassword) {
    const user = auth.currentUser;
    if (!user?.email) throw new Error("Sign in again to change your password.");
    await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, currentPassword));
    await updatePassword(user, newPassword);
  }

  // Memoize the updateProfile function to avoid unnecessary re-creations
  const updateProfile = useCallback(
    async (data) => {
      if (!currentUser) throw new Error("Sign in again to update your profile.");

      try {
        if (!userProfile) await createUserDocument(currentUser);
        const updated = await updateUserDocument(currentUser.uid, data);
        setUserProfile(updated);
        return updated;
      } catch (error) {
        console.error("Error updating profile:", error);
        throw error;
      }
    },
    [currentUser, userProfile]
  );

  useEffect(() => {
    let generation = 0;
    let timer;
    let until = 0;
    let activeUser;
    let previousUid;
    const checkExpiry = () => {
      if (activeUser && activeUser === auth.currentUser && Date.now() >= until) {
        setExpired(true);
        setCurrentUser(null);
        setUserProfile(null);
        void signOut(auth);
      }
    };
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      const version = ++generation;
      clearTimeout(timer);
      if (user && user.uid !== previousUid) {
        setCurrentUser(null);
        setUserProfile(null);
        setLoading(true);
      }
      previousUid = user?.uid;
      activeUser = null;
      if (!user) {
        setCurrentUser(null);
        setUserProfile(null);
        setDeadline(0);
        setLoading(false);
        return;
      }
      try {
        const { claims } = await user.getIdTokenResult();
        if (version !== generation || auth.currentUser !== user) return;
        until = accessDeadline(user.uid, claims, ccsOnly);
        activeUser = user;
        if (until <= Date.now()) return checkExpiry();
        if (Number.isFinite(until)) timer = setTimeout(checkExpiry, until - Date.now());
        const profile = await getUserDocument(user.uid);
        if (version !== generation || auth.currentUser !== user) return;
        if (until <= Date.now()) return checkExpiry();
        setExpired(false);
        setDeadline(until);
        setUserProfile(profile);
        setCurrentUser(user);
        setLoading(false);
      } catch {
        if (version !== generation || auth.currentUser !== user) return;
        setExpired(true);
        await signOut(auth);
      }
    });
    window.addEventListener("focus", checkExpiry);
    document.addEventListener("visibilitychange", checkExpiry);
    return () => {
      generation++;
      unsubscribe();
      clearTimeout(timer);
      window.removeEventListener("focus", checkExpiry);
      document.removeEventListener("visibilitychange", checkExpiry);
    };
  }, []);

  const value = {
    currentUser,
    userProfile,
    login,
    signup,
    logout,
    resetPassword,
    changePassword,
    deadline,
    expired,
    isCcs: Number.isFinite(deadline) && deadline > 0,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
