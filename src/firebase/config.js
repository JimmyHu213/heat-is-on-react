import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

// Set VITE_USE_FIREBASE_EMULATOR=true (see .env.emulator / `npm run dev:emulator`)
// to talk to the local Auth + Firestore emulators instead of a cloud project.
const env = import.meta.env ?? globalThis.process?.env ?? {};
const useEmulator = env.VITE_USE_FIREBASE_EMULATOR === "true";

const firebaseConfig = useEmulator
  ? {
      // Emulators accept any key; a "demo-" project ID guarantees nothing
      // can ever reach a real Firebase project.
      apiKey: "demo-api-key",
      authDomain: "demo-heat-is-on.firebaseapp.com",
      projectId: env.VITE_FIREBASE_PROJECT_ID || "demo-heat-is-on",
    }
  : {
      apiKey: env.VITE_FIREBASE_API_KEY,
      authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: env.VITE_FIREBASE_APP_ID,
      measurementId: env.VITE_FIREBASE_MEASUREMENT_ID,
    };

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

if (useEmulator) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  console.info(`[firebase] Using local emulators (project ${firebaseConfig.projectId})`);
}
