import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import {
  createGameSession,
  getGameSession,
  getUserActiveSessions,
  getUserCompletedSessions,
  deleteGameSession,
  advanceGameRound,
  createTownsForSession,
  getSessionTowns,
  applyCardToTown,
  applyHazardToSession,
  saveRoundStats,
  getSessionRoundEvents,
  getTownCardPlays,
} from "../services/gameSessionService";
import { defaultTowns } from "../constants/towns";

const GameContext = createContext();

export function useGame() {
  return useContext(GameContext);
}

export function GameProvider({ children }) {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Game state
  const [activeSessions, setActiveSessions] = useState([]);
  const [completedSessions, setCompletedSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [currentRound, setCurrentRound] = useState(0);

  // Towns and events
  const [towns, setTowns] = useState([]);
  const [roundEvents, setRoundEvents] = useState({});
  const [townCardPlays, setTownCardPlays] = useState({});

  // Load user's active game sessions
  useEffect(() => {
    if (currentUser) {
      fetchUserSessions();
    } else {
      setActiveSessions([]);
      setCompletedSessions([]);
      setCurrentSession(null);
    }
  }, [currentUser]);

  // Fetch user sessions
  const fetchUserSessions = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const active = await getUserActiveSessions(currentUser.uid);
      const completed = await getUserCompletedSessions(currentUser.uid);

      setActiveSessions(active);
      setCompletedSessions(completed);
      setError(null);
    } catch (err) {
      console.error("Error fetching user sessions:", err);
      setError("Failed to load game sessions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Create a new game session
  const createNewSession = async () => {
    if (!currentUser) return null;

    setLoading(true);
    try {
      // Create the game session
      const session = await createGameSession(currentUser.uid);

      // Create towns for the session (use first 5 town templates)
      const townTemplateIds = defaultTowns.slice(0, 5).map((town) => town.id);
      await createTownsForSession(session.sessionId, townTemplateIds);

      // Refresh the session list
      await fetchUserSessions();

      setError(null);
      return session;
    } catch (err) {
      console.error("Error creating new session:", err);
      setError("Failed to create a new game session. Please try again.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Load a specific game session
  const loadSession = async (sessionId) => {
    setLoading(true);
    try {
      const session = await getGameSession(sessionId);
      if (!session) {
        throw new Error("Session not found");
      }

      setCurrentSession(session);
      setCurrentRound(session.currentRound);

      // Load towns for this session
      const sessionTowns = await getSessionTowns(sessionId);
      setTowns(sessionTowns);

      // Load round events and card plays
      const events = await getSessionRoundEvents(sessionId);
      setRoundEvents(events);

      // Load card plays for each town
      const cardPlays = {};
      for (const town of sessionTowns) {
        const townCards = await getTownCardPlays(town.townId);
        cardPlays[town.townId] = townCards;
      }
      setTownCardPlays(cardPlays);

      setError(null);
      return session;
    } catch (err) {
      console.error("Error loading session:", err);
      setError("Failed to load game session. Please try again.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Delete a game session
  const deleteSession = async (sessionId) => {
    setLoading(true);
    try {
      await deleteGameSession(sessionId);

      // Refresh the session list
      await fetchUserSessions();

      // If this was the current session, clear it
      if (currentSession && currentSession.sessionId === sessionId) {
        setCurrentSession(null);
        setTowns([]);
        setRoundEvents({});
        setTownCardPlays({});
      }

      setError(null);
      return true;
    } catch (err) {
      console.error("Error deleting session:", err);
      setError("Failed to delete game session. Please try again.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Start the game or advance to the next round
  const advanceRound = async () => {
    if (!currentSession) return null;

    setLoading(true);
    try {
      // Save current round stats
      if (currentRound > 0) {
        await saveRoundStats(currentSession.sessionId, currentRound);
      }

      // Advance to next round
      const updatedSession = await advanceGameRound(currentSession.sessionId);
      setCurrentSession(updatedSession);
      setCurrentRound(updatedSession.currentRound);

      // Refresh towns data
      const sessionTowns = await getSessionTowns(currentSession.sessionId);
      setTowns(sessionTowns);

      setError(null);
      return updatedSession;
    } catch (err) {
      console.error("Error advancing round:", err);
      setError("Failed to advance to the next round. Please try again.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Apply a card to a town
  const playCard = async (townId, cardId) => {
    if (!currentSession || currentRound === 0) return null;

    setLoading(true);
    try {
      const result = await applyCardToTown(
        townId,
        cardId,
        currentSession.sessionId,
        currentRound
      );

      // Update the town in the state
      setTowns((prevTowns) =>
        prevTowns.map((t) =>
          t.townId === result.town.townId ? result.town : t
        )
      );

      // Update the card plays
      const townCards = await getTownCardPlays(townId);
      setTownCardPlays((prev) => ({
        ...prev,
        [townId]: townCards,
      }));

      setError(null);
      return result;
    } catch (err) {
      console.error("Error playing card:", err);
      setError("Failed to play the card. Please try again.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Apply a hazard to all towns
  const applyHazard = async (hazardId) => {
    if (!currentSession || currentRound === 0) return null;

    setLoading(true);
    try {
      const result = await applyHazardToSession(
        currentSession.sessionId,
        hazardId,
        currentRound
      );

      // Update towns in the state
      setTowns(result.towns);

      // Update round events
      const events = await getSessionRoundEvents(currentSession.sessionId);
      setRoundEvents(events);

      setError(null);
      return result;
    } catch (err) {
      console.error("Error applying hazard:", err);
      setError("Failed to apply the hazard. Please try again.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Refresh data for the current session
  const refreshSessionData = async () => {
    if (!currentSession) return;

    setLoading(true);
    try {
      // Reload the session
      const session = await getGameSession(currentSession.sessionId);
      setCurrentSession(session);
      setCurrentRound(session.currentRound);

      // Reload towns
      const sessionTowns = await getSessionTowns(session.sessionId);
      setTowns(sessionTowns);

      // Reload events
      const events = await getSessionRoundEvents(session.sessionId);
      setRoundEvents(events);

      // Reload card plays
      const cardPlays = {};
      for (const town of sessionTowns) {
        const townCards = await getTownCardPlays(town.townId);
        cardPlays[town.townId] = townCards;
      }
      setTownCardPlays(cardPlays);

      setError(null);
    } catch (err) {
      console.error("Error refreshing session data:", err);
      setError("Failed to refresh game data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const value = {
    // State
    loading,
    error,
    activeSessions,
    completedSessions,
    currentSession,
    currentRound,
    towns,
    roundEvents,
    townCardPlays,

    // Actions
    fetchUserSessions,
    createNewSession,
    loadSession,
    deleteSession,
    advanceRound,
    playCard,
    applyHazard,
    refreshSessionData,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
