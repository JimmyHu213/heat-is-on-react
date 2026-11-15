// src/contexts/GameContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { formatGameRuleError } from "../game/errors.js";
import { getStage } from "../game/stages.js";
import gameSessionService from "../services/gameSessionService.js";
import { useAuth } from "./AuthContext";

const GameContext = createContext();

const REFRESH_WARNING = "Saved; refresh to see the latest";

function formatMoveError(err, fallback) {
  return formatGameRuleError(err, fallback);
}

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
  const [roundEventDocs, setRoundEventDocs] = useState([]);
  const [roundStats, setRoundStats] = useState([]);
  const [townCardPlays, setTownCardPlays] = useState({});
  const [townCardPlayDocs, setTownCardPlayDocs] = useState({});
  const [lastHazardImpact, setLastHazardImpact] = useState(null);
  const [lastHazardId, setLastHazardId] = useState(null);

  useEffect(() => {
    if (currentUser) {
      fetchUserSessions();
    } else {
      setActiveSessions([]);
      setCompletedSessions([]);
      setCurrentSession(null);
      setTowns([]);
      setRoundEvents({});
      setRoundEventDocs([]);
      setRoundStats([]);
      setTownCardPlays({});
      setLastHazardImpact(null);
      setLastHazardId(null);
    }
  }, [currentUser]);

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

  const createNewSession = async (name = "New Game", options = {}) => {
    if (!currentUser) return null;

    setLoading(true);
    try {
      if (activeSessions.length >= 3) {
        setError(
          "You can only have a maximum of 3 active game sessions. Please complete or delete an existing session."
        );
        return null;
      }

      const session = await gameSessionService.createSession(
        currentUser.uid,
        name,
        options
      );

      try {
        await fetchUserSessions();
        setError(null);
      } catch (refreshErr) {
        console.warn("Saved session, but refresh failed:", refreshErr);
        setError(REFRESH_WARNING);
      }
      return session;
    } catch (err) {
      console.error("Error creating new session:", err);
      setError(
        formatMoveError(
          err,
          "Failed to create a new game session. Please try again."
        )
      );
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateSessionName = async (sessionId, newName) => {
    setLoading(true);
    try {
      const updatedSession = await gameSessionService.updateSessionName(
        sessionId,
        newName
      );

      if (currentSession && currentSession.id === sessionId) {
        setCurrentSession((prev) => ({
          ...prev,
          name: newName.trim(),
        }));
      }

      try {
        await fetchUserSessions();
        setError(null);
      } catch (refreshErr) {
        console.warn("Saved session name, but refresh failed:", refreshErr);
        setError(REFRESH_WARNING);
      }
      return updatedSession;
    } catch (err) {
      console.error("Error updating session name:", err);
      setError("Failed to update session name. Please try again.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updatePlayerCount = async (sessionId, playerCount) => {
    setLoading(true);
    try {
      const updated = await gameSessionService.updatePlayerCount(
        sessionId,
        playerCount
      );
      if (currentSession && currentSession.id === sessionId) {
        setCurrentSession((prev) => ({
          ...prev,
          playerCount: updated.playerCount,
        }));
      }
      setError(null);
      return updated;
    } catch (err) {
      console.error("Error updating player count:", err);
      setError(
        formatMoveError(err, "Failed to update player count. Please try again.")
      );
      return null;
    } finally {
      setLoading(false);
    }
  };

  const loadSession = async (sessionId) => {
    setLoading(true);
    try {
      const session = await gameSessionService.getSession(sessionId);
      if (!session) {
        setCurrentSession(null);
        setTowns([]);
        setRoundEvents({});
        setRoundEventDocs([]);
        setRoundStats([]);
        setTownCardPlays({});
        setTownCardPlayDocs({});
        setError("Game not found");
        return null;
      }

      setCurrentSession(session);
      setCurrentRound(session.currentRound);
      setTowns(session.towns || []);

      const [events, eventDocs, stats] = await Promise.all([
        gameSessionService.getSessionRoundEvents(sessionId),
        gameSessionService.getSessionRoundEventDocs(sessionId),
        gameSessionService.getSessionRoundStats(sessionId),
      ]);
      setRoundEvents(events);
      setRoundEventDocs(eventDocs);
      setRoundStats(stats);

      const cardPlays = {};
      const cardPlayDocs = {};
      for (const town of session.towns || []) {
        const [townCards, townPlayDocs] = await Promise.all([
          gameSessionService.getTownCardPlays(town.id),
          gameSessionService.getTownCardPlayDocs(town.id),
        ]);
        cardPlays[town.id] = townCards;
        cardPlayDocs[town.id] = townPlayDocs;
      }
      setTownCardPlays(cardPlays);
      setTownCardPlayDocs(cardPlayDocs);

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

  const deleteSession = async (sessionId) => {
    setLoading(true);
    try {
      await gameSessionService.deleteSession(sessionId);

      if (currentSession && currentSession.id === sessionId) {
        setCurrentSession(null);
        setTowns([]);
        setRoundEvents({});
        setRoundEventDocs([]);
        setRoundStats([]);
        setTownCardPlays({});
        setTownCardPlayDocs({});
      }

      try {
        await fetchUserSessions();
        setError(null);
      } catch (refreshErr) {
        console.warn("Deleted session, but refresh failed:", refreshErr);
        setError(REFRESH_WARNING);
      }
      return true;
    } catch (err) {
      console.error("Error deleting session:", err);
      setError("Failed to delete game session. Please try again.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const startGame = async () => {
    if (!currentSession) return null;

    setLoading(true);
    try {
      const updatedSession = await gameSessionService.startGame(
        currentSession.id,
        { expectedRevision: currentSession.revision }
      );

      setCurrentSession(updatedSession);
      setCurrentRound(updatedSession.currentRound);
      setTowns(updatedSession.towns || []);
      setError(null);
      return updatedSession;
    } catch (err) {
      console.error("Error starting game:", err);
      setError(formatMoveError(err, "Failed to start game. Please try again."));
      return null;
    } finally {
      setLoading(false);
    }
  };

  const changeStage = async (targetStage) => {
    if (!currentSession) return null;

    setLoading(true);
    try {
      const updatedSession = await gameSessionService.changeStage(
        currentSession.id,
        targetStage,
        { expectedRevision: currentSession.revision }
      );
      setCurrentSession((prev) => ({ ...prev, ...updatedSession }));
      setError(null);
      return updatedSession;
    } catch (err) {
      console.error("Error changing stage:", err);
      setError(
        formatMoveError(err, "Failed to change stage. Please try again.")
      );
      return null;
    } finally {
      setLoading(false);
    }
  };

  const settleRound = async ({ endEarly = false, allowAnyStage = false } = {}) => {
    if (!currentSession) return null;

    setLoading(true);
    try {
      const updatedSession = await gameSessionService.settleRound(
        currentSession.id,
        {
          expectedRound: currentRound,
          expectedRevision: currentSession.revision,
          endEarly,
          allowAnyStage,
        }
      );

      setCurrentSession(updatedSession);
      setCurrentRound(updatedSession.currentRound);
      setTowns(updatedSession.towns || []);

      try {
        const [stats, eventDocs] = await Promise.all([
          gameSessionService.getSessionRoundStats(currentSession.id),
          gameSessionService.getSessionRoundEventDocs(currentSession.id),
        ]);
        setRoundStats(stats);
        setRoundEventDocs(eventDocs);
        setError(null);
      } catch (refreshErr) {
        console.warn("Round settled, but stats re-read failed:", refreshErr);
        setError(REFRESH_WARNING);
        return { ...updatedSession, refreshFailed: true };
      }

      return updatedSession;
    } catch (err) {
      console.error("Error settling round:", err);
      setError(
        formatMoveError(
          err,
          "Failed to advance to the next round. Please try again."
        )
      );
      return null;
    } finally {
      setLoading(false);
    }
  };

  const advanceRound = async () => {
    if (!currentSession) return null;
    if (currentRound === 0) {
      return await startGame();
    }
    return await settleRound({ allowAnyStage: true });
  };

  const playCard = async (townId, cardId) => {
    if (!currentSession || currentRound === 0) return null;

    setLoading(true);
    try {
      const result = await gameSessionService.applyCardToTown(
        townId,
        cardId,
        currentRound,
        { expectedRevision: currentSession.revision }
      );

      setCurrentSession((prev) => ({ ...prev, ...result.session }));
      setTowns((prevTowns) =>
        prevTowns.map((t) => (t.id === result.town.id ? result.town : t))
      );

      try {
        const [townCards, townPlayDocs] = await Promise.all([
          gameSessionService.getTownCardPlays(townId),
          gameSessionService.getTownCardPlayDocs(townId),
        ]);
        setTownCardPlays((prev) => ({
          ...prev,
          [townId]: townCards,
        }));
        setTownCardPlayDocs((prev) => ({
          ...prev,
          [townId]: townPlayDocs,
        }));
        setError(null);
      } catch (refreshErr) {
        console.warn("Card saved, but card plays re-read failed:", refreshErr);
        setError(REFRESH_WARNING);
        return { ...result, refreshFailed: true };
      }

      return result;
    } catch (err) {
      console.error("Error playing card:", err);
      setError(
        formatMoveError(err, "Failed to play the card. Please try again.")
      );
      return null;
    } finally {
      setLoading(false);
    }
  };

  const addCardPlayAtRound = async (townId, cardId, targetRound) => {
    if (!currentSession || currentRound === 0) return null;

    setLoading(true);
    try {
      const result = await gameSessionService.applyCardToTown(
        townId,
        cardId,
        currentRound,
        {
          expectedRevision: currentSession.revision,
          targetRound,
          allowAnyStage: true,
        }
      );

      setCurrentSession((prev) => ({ ...prev, ...result.session }));
      setTowns((prevTowns) =>
        prevTowns.map((t) => (t.id === result.town.id ? result.town : t))
      );

      try {
        const [townCards, townPlayDocs] = await Promise.all([
          gameSessionService.getTownCardPlays(townId),
          gameSessionService.getTownCardPlayDocs(townId),
        ]);
        setTownCardPlays((prev) => ({
          ...prev,
          [townId]: townCards,
        }));
        setTownCardPlayDocs((prev) => ({
          ...prev,
          [townId]: townPlayDocs,
        }));
        setError(null);
      } catch (refreshErr) {
        console.warn("Card saved, but card plays re-read failed:", refreshErr);
        setError(REFRESH_WARNING);
        return { ...result, refreshFailed: true };
      }

      return result;
    } catch (err) {
      console.error("Error adding card play:", err);
      setError(
        formatMoveError(err, "Failed to add the card. Please try again.")
      );
      return null;
    } finally {
      setLoading(false);
    }
  };

  const removeCardPlay = async (cardPlayId) => {
    if (!currentSession || !cardPlayId) return null;

    setLoading(true);
    try {
      const result = await gameSessionService.removeCardPlay(
        currentSession.id,
        cardPlayId,
        { expectedRevision: currentSession.revision }
      );

      setCurrentSession((prev) => ({ ...prev, ...result.session }));
      setTowns((prevTowns) =>
        prevTowns.map((t) => (t.id === result.town.id ? result.town : t))
      );

      try {
        const [townCards, townPlayDocs] = await Promise.all([
          gameSessionService.getTownCardPlays(result.townId),
          gameSessionService.getTownCardPlayDocs(result.townId),
        ]);
        setTownCardPlays((prev) => ({
          ...prev,
          [result.townId]: townCards,
        }));
        setTownCardPlayDocs((prev) => ({
          ...prev,
          [result.townId]: townPlayDocs,
        }));
        setError(null);
      } catch (refreshErr) {
        console.warn("Card removed, but card plays re-read failed:", refreshErr);
        setError(REFRESH_WARNING);
        return { ...result, refreshFailed: true };
      }

      return result;
    } catch (err) {
      console.error("Error removing card play:", err);
      setError(
        formatMoveError(err, "Failed to remove the card. Please try again.")
      );
      return null;
    } finally {
      setLoading(false);
    }
  };

  const applyHazard = async (hazardId) => {
    if (!currentSession || currentRound === 0) return null;

    setLoading(true);
    try {
      const result = await gameSessionService.applyHazardToSession(
        currentSession.id,
        hazardId,
        currentRound,
        { expectedRevision: currentSession.revision }
      );

      setCurrentSession((prev) => ({ ...prev, ...result.session }));
      setTowns(result.towns);
      setLastHazardImpact(result.impact);
      setLastHazardId(hazardId);

      try {
        const [events, eventDocs] = await Promise.all([
          gameSessionService.getSessionRoundEvents(currentSession.id),
          gameSessionService.getSessionRoundEventDocs(currentSession.id),
        ]);
        setRoundEvents(events);
        setRoundEventDocs(eventDocs);
        setError(null);
      } catch (refreshErr) {
        console.warn("Hazard saved, but events re-read failed:", refreshErr);
        setRoundEvents((prev) => ({
          ...prev,
          [currentRound]: result.roundEvent.hazardIds,
        }));
        setError(REFRESH_WARNING);
        return { ...result, refreshFailed: true };
      }

      return result;
    } catch (err) {
      console.error("Error applying hazard:", err);
      setError(
        formatMoveError(err, "Failed to apply the hazard. Please try again.")
      );
      return null;
    } finally {
      setLoading(false);
    }
  };

  const refreshSessionData = async () => {
    if (!currentSession) return;
    await loadSession(currentSession.id);
  };

  const getTownById = (townId) => {
    return towns.find((town) => town.id === townId) || null;
  };

  const updateTownName = async (townId, name) => {
    if (!currentSession) return null;

    setLoading(true);
    try {
      await gameSessionService.updateTownName(townId, name);
      const trimmedName = name.trim();
      let updatedTown = null;
      setTowns((prevTowns) =>
        prevTowns.map((t) => {
          if (t.id !== townId) return t;
          updatedTown = { ...t, name: trimmedName };
          return updatedTown;
        })
      );
      setError(null);
      return updatedTown || { id: townId, name: trimmedName };
    } catch (err) {
      console.error("Error updating town name:", err);
      setError(
        formatMoveError(err, "Failed to update town name. Please try again.")
      );
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateTownBudget = async (townId, effortPoints) => {
    if (!currentSession) return null;

    setLoading(true);
    try {
      const result = await gameSessionService.updateTownBudget(
        townId,
        effortPoints,
        { expectedRevision: currentSession.revision }
      );
      setCurrentSession((prev) => ({ ...prev, ...result.session }));
      setTowns((prevTowns) =>
        prevTowns.map((t) => (t.id === townId ? result.town : t))
      );
      setError(null);
      return result.town;
    } catch (err) {
      console.error("Error updating town budget:", err);
      setError(
        formatMoveError(err, "Failed to update town budget. Please try again.")
      );
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateTown = async (updatedTown) => {
    if (!currentSession || !updatedTown) return null;
    const existing = towns.find((t) => t.id === updatedTown.id);
    let resultTown = existing || null;
    if (
      existing &&
      typeof updatedTown.effortPoints === "number" &&
      updatedTown.effortPoints !== existing.effortPoints
    ) {
      resultTown = await updateTownBudget(
        updatedTown.id,
        updatedTown.effortPoints
      );
      if (!resultTown) return null;
    }
    if (
      existing &&
      typeof updatedTown.name === "string" &&
      updatedTown.name !== existing.name
    ) {
      const renamed = await updateTownName(updatedTown.id, updatedTown.name);
      if (!renamed) return null;
      const mergedName = updatedTown.name.trim();
      resultTown = { ...(resultTown || existing), name: mergedName };
      setTowns((prevTowns) =>
        prevTowns.map((t) =>
          t.id === updatedTown.id ? { ...t, name: mergedName } : t
        )
      );
    }
    return resultTown;
  };

  const revertToPreviousState = async () => {
    if (!currentSession) return null;

    setLoading(true);
    try {
      const result = await gameSessionService.undoLastMove(currentSession.id, {
        expectedRevision: currentSession.revision,
      });

      setCurrentSession((prev) => ({ ...prev, ...result.session }));
      setTowns(result.towns);
      setLastHazardImpact(null);
      setLastHazardId(null);

      try {
        const [events, eventDocs] = await Promise.all([
          gameSessionService.getSessionRoundEvents(currentSession.id),
          gameSessionService.getSessionRoundEventDocs(currentSession.id),
        ]);
        setRoundEvents(events);
        setRoundEventDocs(eventDocs);

        const cardPlays = {};
        for (const town of result.towns || []) {
          const townCards = await gameSessionService.getTownCardPlays(town.id);
          cardPlays[town.id] = townCards;
        }
        setTownCardPlays(cardPlays);
        setError(null);
      } catch (refreshErr) {
        console.warn("Undo saved, but re-read failed:", refreshErr);
        setError(REFRESH_WARNING);
        return { ...result, refreshFailed: true };
      }

      return true;
    } catch (err) {
      console.error("Error reverting to previous state:", err);
      setError(
        formatMoveError(err, "Failed to revert changes. Please try again.")
      );
      return null;
    } finally {
      setLoading(false);
    }
  };

  const hazardCountThisRound = (roundEvents[currentRound] || []).length;
  const currentStage = currentSession
    ? getStage(currentSession, hazardCountThisRound)
    : "setup";
  const canRevert = Boolean(
    currentSession?.isActive &&
      currentSession?.lastUndo &&
      currentSession.lastUndo.round === currentRound
  );

  const value = {
    loading,
    error,
    activeSessions,
    completedSessions,
    currentSession,
    currentRound,
    currentStage,
    towns,
    roundEvents,
    roundEventDocs,
    roundStats,
    townCardPlays,
    townCardPlayDocs,
    lastHazardImpact,
    lastHazardId,
    canRevert,

    fetchUserSessions,
    createNewSession,
    updateSessionName,
    updatePlayerCount,
    loadSession,
    deleteSession,
    startGame,
    changeStage,
    settleRound,
    advanceRound,
    playCard,
    addCardPlayAtRound,
    removeCardPlay,
    applyHazard,
    refreshSessionData,
    getTownById,
    updateTown,
    updateTownName,
    updateTownBudget,
    revertToPreviousState,
    clearLastHazardImpact: () => {
      setLastHazardImpact(null);
      setLastHazardId(null);
    },

    clearError: () => setError(null),
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
