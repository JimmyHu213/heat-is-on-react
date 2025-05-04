// src/contexts/GameContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import gameSessionService from "../services/gameSessionService";

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
  const [towns, setTowns] = useState([]);
  const [roundEvents, setRoundEvents] = useState({});
  const [townCardPlays, setTownCardPlays] = useState({});

  // Fetch user's sessions when user changes
  useEffect(() => {
    if (currentUser) {
      fetchUserSessions();
    } else {
      // Clear data when user logs out
      setActiveSessions([]);
      setCompletedSessions([]);
      setCurrentSession(null);
      setTowns([]);
      setRoundEvents({});
      setTownCardPlays({});
    }
  }, [currentUser]);

  // Fetch user's active and completed sessions
  const fetchUserSessions = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const active = await gameSessionService.getUserActiveSessions(
        currentUser.uid
      );
      const completed = await gameSessionService.getUserCompletedSessions(
        currentUser.uid
      );

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

  // In src/contexts/GameContext.jsx
  // Modify the createNewSession function

  const createNewSession = async () => {
    if (!currentUser) return null;

    setLoading(true);
    try {
      // Check if user already has 3 active sessions
      if (activeSessions.length >= 3) {
        setError(
          "You can only have a maximum of 3 active game sessions. Please complete or delete an existing session."
        );
        return null;
      }

      const session = await gameSessionService.createSession(currentUser.uid);

      // Refresh session list
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
      const session = await gameSessionService.getSession(sessionId);
      if (!session) {
        throw new Error("Session not found");
      }

      setCurrentSession(session);
      setCurrentRound(session.currentRound);
      setTowns(session.towns || []);

      // Load round events
      const events = await gameSessionService.getSessionRoundEvents(sessionId);
      setRoundEvents(events);

      // Load card plays for each town
      const cardPlays = {};
      for (const town of session.towns || []) {
        const townCards = await gameSessionService.getTownCardPlays(town.id);
        cardPlays[town.id] = townCards;
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
      await gameSessionService.deleteSession(sessionId);

      // Refresh session list
      await fetchUserSessions();

      // If this was the current session, clear it
      if (currentSession && currentSession.id === sessionId) {
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

  // Advance to the next round
  const advanceRound = async () => {
    if (!currentSession) return null;

    setLoading(true);
    try {
      const updatedSession = await gameSessionService.advanceRound(
        currentSession.id
      );

      setCurrentSession(updatedSession);
      setCurrentRound(updatedSession.currentRound);
      setTowns(updatedSession.towns || []);

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
      const result = await gameSessionService.applyCardToTown(
        townId,
        cardId,
        currentRound
      );

      // Update town in state
      setTowns((prevTowns) =>
        prevTowns.map((t) => (t.id === result.town.id ? result.town : t))
      );

      // Update card plays
      const townCards = await gameSessionService.getTownCardPlays(townId);
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
      const result = await gameSessionService.applyHazardToSession(
        currentSession.id,
        hazardId,
        currentRound
      );

      // Update towns
      setTowns(result.towns);

      // Update round events
      const events = await gameSessionService.getSessionRoundEvents(
        currentSession.id
      );
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
      await loadSession(currentSession.id);
      setError(null);
    } catch (err) {
      console.error("Error refreshing session data:", err);
      setError("Failed to refresh game data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Get town by ID
  const getTownById = (townId) => {
    return towns.find((town) => town.id === townId) || null;
  };

  // State for undo functionality
  const [stateHistory, setStateHistory] = useState([]);

  // Save current state to history before making changes
  const saveStateSnapshot = () => {
    setStateHistory((prevHistory) => [
      ...prevHistory,
      {
        towns: JSON.parse(JSON.stringify(towns)),
        roundEvents: JSON.parse(JSON.stringify(roundEvents)),
        townCardPlays: JSON.parse(JSON.stringify(townCardPlays)),
      },
    ]);
  };

  const updateTown = async (updatedTown) => {
    if (!currentSession) return null;

    setLoading(true);
    try {
      // Call the service to update the town
      const result = await gameSessionService.updateTown(
        updatedTown.id,
        updatedTown
      );

      // Update towns in state
      setTowns((prevTowns) =>
        prevTowns.map((town) => (town.id === updatedTown.id ? result : town))
      );

      setError(null);
      return result;
    } catch (err) {
      console.error("Error updating town:", err);
      setError("Failed to update town. Please try again.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Revert to previous state
  const revertToPreviousState = async () => {
    if (stateHistory.length === 0) {
      setError("Nothing to revert");
      return null;
    }

    setLoading(true);
    try {
      // Get the last state from history
      const previousState = stateHistory[stateHistory.length - 1];

      // Update towns in database
      for (const town of previousState.towns) {
        await gameSessionService.updateTown(town.id, town);
      }

      // Update UI state
      setTowns(previousState.towns);
      setRoundEvents(previousState.roundEvents);
      setTownCardPlays(previousState.townCardPlays);

      // Remove the used state from history
      setStateHistory((prevHistory) => prevHistory.slice(0, -1));

      setError(null);
      return true;
    } catch (err) {
      console.error("Error reverting to previous state:", err);
      setError("Failed to revert changes. Please try again.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Wrap functions that modify state to save snapshots
  const wrappedApplyHazard = async (hazardId) => {
    saveStateSnapshot();
    return applyHazard(hazardId);
  };

  const wrappedPlayCard = async (townId, cardId) => {
    saveStateSnapshot();
    return playCard(townId, cardId);
  };

  const wrappedAdvanceRound = async () => {
    saveStateSnapshot();
    return advanceRound();
  };

  // Context value
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
    canRevert: stateHistory.length > 0,

    // Actions
    fetchUserSessions,
    createNewSession,
    loadSession,
    deleteSession,
    advanceRound: wrappedAdvanceRound,
    playCard: wrappedPlayCard,
    applyHazard: wrappedApplyHazard,
    refreshSessionData,
    getTownById,
    updateTown,
    saveStateSnapshot,
    revertToPreviousState,

    // Clear error
    clearError: () => setError(null),
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
