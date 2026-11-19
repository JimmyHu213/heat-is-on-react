import { signInWithCustomToken, signOut } from "firebase/auth";
import { auth } from "../firebase/config";
import { syncCcsProfile } from "../services/userService";
import { accessDeadline } from "./ccsAccess";

export const ccsOnly = import.meta.env.VITE_CCS_ONLY === "true";

export async function exchangeCcsToken(token) {
  try {
    if (!token) throw new Error("Missing hand-off");
    const { user } = await signInWithCustomToken(auth, token);
    const { claims } = await user.getIdTokenResult();
    if (accessDeadline(user.uid, claims, true) <= Date.now()) throw new Error("Expired hand-off");
    await syncCcsProfile(user.uid, claims);
    return user.uid;
  } catch {
    await signOut(auth);
    return null;
  }
}
