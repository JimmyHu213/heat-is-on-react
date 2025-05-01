import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";

export async function initializeGameSession({ userId }) {
  try {
    const gameSessionRef = doc(db, "gameSessions", "v1");
    await setDoc(gameSessionRef, {
      gameStarted: false,
      gameEnded: false,
      players: [],
      currentRound: 0,
      currentPlayerIndex: 0,
    });
    console.log("Game session initialized successfully.");
  } catch (error) {
    console.error("Error initializing game session:", error);
  }
}
