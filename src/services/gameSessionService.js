// src/services/gameSessionService.js
import {
  collection,
  doc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { allCards } from "../constants/cards.js";
import { hazards } from "../constants/hazards.js";
import { defaultTowns } from "../constants/towns.js";
import { db } from "../firebase/config.js";
import { applyCardEffects, cardEffectiveRounds, playCard, revertCardEffects } from "../game/cards.js";
import { GameRuleError } from "../game/errors.js";
import { applyHazard, buildHazardImpact } from "../game/hazards.js";
import {
  getTotalRounds,
  validateBudget,
  validateGameOptions,
} from "../game/options.js";
import { planSettlement, planStartGame } from "../game/settlement.js";
import {
  assertCanApplyHazard,
  assertCanPlayCard,
  canChangeStage,
  getStage,
} from "../game/stages.js";
import { buildCardUndo, buildHazardUndo, planUndo } from "../game/undo.js";
import firestoreService from "./firestoreService.js";
import { onGameCompleted, onGameCreated } from "./gameLifecycle.js";

function assertRevision(session, expectedRevision) {
  const current = session.revision ?? 0;
  if (expectedRevision !== undefined && current !== expectedRevision) {
    throw new GameRuleError(
      "stale-revision",
      "This game changed elsewhere. Refresh to continue."
    );
  }
  return current + 1;
}

function townDocRefs(sessionId) {
  return defaultTowns.map((_, index) =>
    doc(db, "towns", `${sessionId}_town_${index + 1}`)
  );
}

async function readTownsInTx(tx, sessionId) {
  const refs = townDocRefs(sessionId);
  const snaps = await Promise.all(refs.map((ref) => tx.get(ref)));
  const towns = [];
  for (const snap of snaps) {
    if (snap.exists()) {
      towns.push({ id: snap.id, ...snap.data() });
    }
  }
  return towns.sort((a, b) => a.townNumber - b.townNumber);
}

/**
 * Game Session Service
 * Handles CRUD and atomic transactions for game sessions, towns, and related entities
 */
class GameSessionService {
  SESSIONS_COLLECTION = "game_sessions";
  TOWNS_COLLECTION = "towns";
  CARD_PLAYS_COLLECTION = "card_plays";
  ROUND_EVENTS_COLLECTION = "round_events";
  ROUND_STATS_COLLECTION = "round_stats";

  /**
   * Create a new game session
   */
  async createSession(userId, name = "New Game", options = {}) {
    try {
      const trimmedName = (name ?? "").trim() || "New Game";
      if (trimmedName.length > 100) {
        throw new GameRuleError("invalid-session-name", "Session name is too long");
      }
      const validated = validateGameOptions(options);

      const activeSessions = await this.getUserActiveSessions(userId);
      if (activeSessions.length >= 3) {
        throw new Error("Maximum session limit reached (3)");
      }

      const session = await firestoreService.createDocument(
        this.SESSIONS_COLLECTION,
        {
          userId,
          name: trimmedName,
          currentRound: 0,
          totalRounds: validated.totalRounds,
          digitalWheelEnabled: validated.digitalWheelEnabled,
          playerCount: validated.playerCount,
          stage: "adaptation",
          revision: 0,
          isActive: true,
          endedEarly: false,
          completedAt: null,
          lastSettlementRound: 0,
          lastDividends: {},
          lastUndo: null,
        }
      );

      const sessionTowns = await this.createTownsForSession(session.id);

      const createdSession = {
        ...session,
        towns: sessionTowns,
      };
      await onGameCreated(createdSession);
      return createdSession;
    } catch (error) {
      console.error("Error creating game session:", error);
      throw error;
    }
  }

  /**
   * Update the name of a game session
   */
  async updateSessionName(sessionId, newName) {
    try {
      if (!newName || newName.trim() === "") {
        throw new Error("Session name cannot be empty");
      }
      const trimmed = newName.trim();
      if (trimmed.length > 100) {
        throw new GameRuleError("invalid-session-name", "Session name is too long");
      }

      return await firestoreService.updateDocument(
        this.SESSIONS_COLLECTION,
        sessionId,
        { name: trimmed }
      );
    } catch (error) {
      console.error(`Error updating session name for ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Update optional player count on an active session
   */
  async updatePlayerCount(sessionId, playerCount) {
    const validated = validateGameOptions({ playerCount });
    const sessionRef = doc(db, this.SESSIONS_COLLECTION, sessionId);
    return await runTransaction(db, async (tx) => {
      const snap = await tx.get(sessionRef);
      if (!snap.exists()) {
        throw new GameRuleError("not-found", "Game not found");
      }
      const session = { id: snap.id, ...snap.data() };
      if (!session.isActive) {
        throw new GameRuleError("game-complete", "Game is already completed");
      }
      tx.update(sessionRef, {
        playerCount: validated.playerCount,
        updatedAt: serverTimestamp(),
      });
      return { ...session, playerCount: validated.playerCount };
    });
  }

  /**
   * Get a game session by ID
   */
  async getSession(sessionId) {
    try {
      const session = await firestoreService.getDocument(
        this.SESSIONS_COLLECTION,
        sessionId
      );

      if (!session) return null;

      const towns = await this.getSessionTowns(sessionId);

      return {
        ...session,
        towns,
      };
    } catch (error) {
      console.error(`Error getting game session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Get active game sessions for a user
   */
  async getUserActiveSessions(userId) {
    try {
      return await firestoreService.getDocuments(
        this.SESSIONS_COLLECTION,
        [
          ["userId", "==", userId],
          ["isActive", "==", true],
        ],
        ["createdAt", "desc"]
      );
    } catch (error) {
      console.error(`Error getting active sessions for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get completed game sessions for a user
   */
  async getUserCompletedSessions(userId, limitCount = 10) {
    try {
      return await firestoreService.getDocuments(
        this.SESSIONS_COLLECTION,
        [
          ["userId", "==", userId],
          ["isActive", "==", false],
        ],
        ["completedAt", "desc"],
        limitCount
      );
    } catch (error) {
      console.error(
        `Error getting completed sessions for user ${userId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Create towns for a game session with sequential IDs
   */
  async createTownsForSession(sessionId) {
    try {
      const towns = [];
      const townTemplates = defaultTowns;

      for (let i = 0; i < townTemplates.length; i++) {
        const template = townTemplates[i];
        const townNumber = i + 1;
        const townId = `${sessionId}_town_${townNumber}`;
        const isComparisonTown = template.name === "Bludgeton";

        const townData = {
          sessionId,
          townNumber,
          name: template.name,
          townTemplateId: template.id,
          effortPoints: 100,
          currentRound: 0,
          bushfire: structuredClone(template.baseStats.bushfire),
          flood: structuredClone(template.baseStats.flood),
          stormSurge: structuredClone(template.baseStats.stormSurge),
          heatwave: structuredClone(template.baseStats.heatwave),
          biohazard: structuredClone(template.baseStats.biohazard),
          currentStats: {},
          isComparisonTown,
        };

        const town = await firestoreService.createDocument(
          this.TOWNS_COLLECTION,
          townData,
          townId
        );

        towns.push(town);
      }

      return towns;
    } catch (error) {
      console.error(`Error creating towns for session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Get towns for a game session ordered by townNumber
   */
  async getSessionTowns(sessionId) {
    try {
      const towns = await firestoreService.getDocuments(this.TOWNS_COLLECTION, [
        ["sessionId", "==", sessionId],
      ]);

      return towns.sort((a, b) => a.townNumber - b.townNumber);
    } catch (error) {
      console.error(`Error getting towns for session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Rename a town (only changes `name`; not a game move)
   */
  async updateTownName(townId, name) {
    const trimmed = typeof name === "string" ? name.trim() : "";
    if (!trimmed || trimmed.length > 80) {
      throw new GameRuleError("invalid-town-name", "Town name must be 1–80 characters");
    }
    return await firestoreService.updateDocument(this.TOWNS_COLLECTION, townId, {
      name: trimmed,
    });
  }

  /**
   * Set a town's manual budget (0–999 EP). Runs in a transaction, bumps session revision, clears undo.
   */
  async updateTownBudget(townId, effortPoints, { expectedRevision } = {}) {
    const validatedBudget = validateBudget(effortPoints);
    const townRef = doc(db, this.TOWNS_COLLECTION, townId);

    const committed = await runTransaction(db, async (tx) => {
      const townSnap = await tx.get(townRef);
      if (!townSnap.exists()) {
        throw new GameRuleError("not-found", `Town not found: ${townId}`);
      }
      const town = { id: townSnap.id, ...townSnap.data() };
      const sessionRef = doc(db, this.SESSIONS_COLLECTION, town.sessionId);
      const sessionSnap = await tx.get(sessionRef);
      if (!sessionSnap.exists()) {
        throw new GameRuleError("not-found", "Game not found");
      }
      const session = { id: sessionSnap.id, ...sessionSnap.data() };
      if (!session.isActive) {
        throw new GameRuleError("game-complete", "Game is already completed");
      }

      const nextRev = assertRevision(session, expectedRevision);

      tx.update(townRef, {
        effortPoints: validatedBudget,
        updatedAt: serverTimestamp(),
      });
      tx.update(sessionRef, {
        revision: nextRev,
        lastUndo: null,
        updatedAt: serverTimestamp(),
      });

      return {
        town: { ...town, effortPoints: validatedBudget },
        session: { ...session, revision: nextRev, lastUndo: null },
      };
    });

    return committed;
  }

  /**
   * Legacy helper: routes to updateTownBudget or updateTownName without overwriting full town state
   */
  async updateTown(townId, data, options = {}) {
    if (data && typeof data.effortPoints === "number") {
      const current = await firestoreService.getDocument(this.TOWNS_COLLECTION, townId);
      if (current && current.effortPoints !== data.effortPoints) {
        const res = await this.updateTownBudget(townId, data.effortPoints, options);
        if (data.name && data.name !== current.name) {
          await this.updateTownName(townId, data.name);
          return { ...res.town, name: data.name.trim() };
        }
        return res.town;
      }
    }
    if (data && typeof data.name === "string") {
      return await this.updateTownName(townId, data.name);
    }
    return await firestoreService.updateDocument(this.TOWNS_COLLECTION, townId, data);
  }

  /**
   * Start a new game (moves round 0 -> round 1, stage "adaptation")
   */
  async startGame(sessionId, { expectedRevision } = {}) {
    const sessionRef = doc(db, this.SESSIONS_COLLECTION, sessionId);

    const committed = await runTransaction(db, async (tx) => {
      const sessionSnap = await tx.get(sessionRef);
      if (!sessionSnap.exists()) {
        throw new GameRuleError("not-found", "Game not found");
      }
      const session = { id: sessionSnap.id, ...sessionSnap.data() };
      const towns = await readTownsInTx(tx, sessionId);

      const startPlan = planStartGame(session);
      const nextRev = assertRevision(session, expectedRevision);

      const sessionPatch = {
        currentRound: startPlan.nextRound,
        stage: startPlan.stage,
        revision: nextRev,
        totalRounds: getTotalRounds(session),
        digitalWheelEnabled: session.digitalWheelEnabled ?? true,
        playerCount: session.playerCount ?? null,
        endedEarly: false,
        lastUndo: null,
        updatedAt: serverTimestamp(),
      };
      tx.update(sessionRef, sessionPatch);

      const updatedTowns = towns.map((town) => {
        const ref = doc(db, this.TOWNS_COLLECTION, town.id);
        tx.update(ref, {
          currentRound: startPlan.nextRound,
          updatedAt: serverTimestamp(),
        });
        return { ...town, currentRound: startPlan.nextRound };
      });

      return {
        ...session,
        ...sessionPatch,
        towns: updatedTowns,
      };
    });

    return committed;
  }

  /**
   * Change the stage within the current round (adaptation <-> hazard <-> review)
   */
  async changeStage(sessionId, targetStage, { expectedRevision } = {}) {
    const sessionRef = doc(db, this.SESSIONS_COLLECTION, sessionId);

    return await runTransaction(db, async (tx) => {
      const sessionSnap = await tx.get(sessionRef);
      if (!sessionSnap.exists()) {
        throw new GameRuleError("not-found", "Game not found");
      }
      const session = { id: sessionSnap.id, ...sessionSnap.data() };
      if (!session.isActive) {
        throw new GameRuleError("game-complete", "Game is already completed");
      }
      if (session.currentRound === 0) {
        throw new GameRuleError("not-started", "Game has not started yet");
      }

      const eventRef = doc(
        db,
        this.ROUND_EVENTS_COLLECTION,
        `${sessionId}_${session.currentRound}`
      );
      const eventSnap = await tx.get(eventRef);
      const hazardCount = eventSnap.exists()
        ? (eventSnap.data().hazardIds ?? []).length
        : 0;

      const currentStage = getStage(session, hazardCount);
      if (!canChangeStage(currentStage, targetStage, hazardCount)) {
        throw new GameRuleError(
          "invalid-stage-transition",
          `Cannot move from ${currentStage} to ${targetStage}`
        );
      }

      const nextRev = assertRevision(session, expectedRevision);
      const patch = {
        stage: targetStage,
        revision: nextRev,
        totalRounds: getTotalRounds(session),
        lastUndo: null,
        updatedAt: serverTimestamp(),
      };
      tx.update(sessionRef, patch);

      return {
        ...session,
        ...patch,
      };
    });
  }

  /**
   * Apply an adaptation card to a town in a single transaction
   */
  async applyCardToTown(
    townId,
    cardId,
    round,
    { expectedRevision, targetRound, allowAnyStage = false } = {}
  ) {
    const card = allCards.find((c) => c.id === cardId);
    if (!card) {
      throw new GameRuleError("card-not-found", `Card not found: ${cardId}`);
    }

    const townRef = doc(db, this.TOWNS_COLLECTION, townId);
    const playRef = doc(collection(db, this.CARD_PLAYS_COLLECTION));

    return await runTransaction(db, async (tx) => {
      const townSnap = await tx.get(townRef);
      if (!townSnap.exists()) {
        throw new GameRuleError("not-found", `Town not found: ${townId}`);
      }
      const town = { id: townSnap.id, ...townSnap.data() };

      const sessionRef = doc(db, this.SESSIONS_COLLECTION, town.sessionId);
      const sessionSnap = await tx.get(sessionRef);
      if (!sessionSnap.exists()) {
        throw new GameRuleError("not-found", "Game not found");
      }
      const session = { id: sessionSnap.id, ...sessionSnap.data() };
      if (!session.isActive) {
        throw new GameRuleError("game-complete", "Game is already completed");
      }
      if (session.currentRound === 0) {
        throw new GameRuleError("not-started", "Game has not started yet");
      }
      if (round !== undefined && session.currentRound !== round) {
        throw new GameRuleError("stale-round", "Round changed elsewhere");
      }

      const recordRound = targetRound ?? session.currentRound;
      if (
        !Number.isInteger(recordRound) ||
        recordRound < 1 ||
        recordRound > session.currentRound
      ) {
        throw new GameRuleError(
          "invalid-round",
          `Invalid round ${recordRound} for card play`
        );
      }

      const eventRef = doc(
        db,
        this.ROUND_EVENTS_COLLECTION,
        `${session.id}_${session.currentRound}`
      );
      const eventSnap = await tx.get(eventRef);
      const hazardCount = eventSnap.exists()
        ? (eventSnap.data().hazardIds ?? []).length
        : 0;

      const currentStage = getStage(session, hazardCount);
      if (!allowAnyStage) {
        assertCanPlayCard(currentStage);
      }

      const nextRev = assertRevision(session, expectedRevision);
      const { town: updatedTown, play } = playCard(town, card, recordRound);

      const lastUndo = buildCardUndo({
        round: session.currentRound,
        townBefore: town,
        cardPlayId: playRef.id,
      });

      tx.update(townRef, {
        effortPoints: updatedTown.effortPoints,
        bushfire: updatedTown.bushfire,
        flood: updatedTown.flood,
        stormSurge: updatedTown.stormSurge,
        heatwave: updatedTown.heatwave,
        biohazard: updatedTown.biohazard,
        updatedAt: serverTimestamp(),
      });

      const isActivePlay = Math.max(...play.effectiveRounds) >= session.currentRound;
      const cardPlayDoc = {
        sessionId: session.id,
        cardId: play.cardId,
        townId: play.townId,
        playedAtRound: play.playedAtRound,
        effectiveRounds: play.effectiveRounds,
        isActive: isActivePlay,
        playedAt: new Date(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      tx.set(playRef, cardPlayDoc);

      const sessionPatch = {
        revision: nextRev,
        stage: currentStage,
        totalRounds: getTotalRounds(session),
        lastUndo,
        updatedAt: serverTimestamp(),
      };
      tx.update(sessionRef, sessionPatch);

      return {
        town: updatedTown,
        cardPlay: { id: playRef.id, ...cardPlayDoc },
        session: { ...session, ...sessionPatch },
      };
    });
  }

  /**
   * Apply a hazard to all towns in a session in a single transaction
   */
  async applyHazardToSession(
    sessionId,
    hazardId,
    round,
    { expectedRevision } = {}
  ) {
    const hazard = hazards.find((h) => h.id === hazardId);
    if (!hazard) {
      throw new GameRuleError("hazard-not-found", `Hazard not found: ${hazardId}`);
    }

    const sessionRef = doc(db, this.SESSIONS_COLLECTION, sessionId);

    return await runTransaction(db, async (tx) => {
      const sessionSnap = await tx.get(sessionRef);
      if (!sessionSnap.exists()) {
        throw new GameRuleError("not-found", "Game not found");
      }
      const session = { id: sessionSnap.id, ...sessionSnap.data() };
      if (!session.isActive) {
        throw new GameRuleError("game-complete", "Game is already completed");
      }
      if (session.currentRound === 0) {
        throw new GameRuleError("not-started", "Game has not started yet");
      }
      if (round !== undefined && session.currentRound !== round) {
        throw new GameRuleError("stale-round", "Round changed elsewhere");
      }

      const activeRound = session.currentRound;
      const towns = await readTownsInTx(tx, sessionId);
      const roundEventId = `${sessionId}_${activeRound}`;
      const eventRef = doc(db, this.ROUND_EVENTS_COLLECTION, roundEventId);
      const eventSnap = await tx.get(eventRef);
      const existingEvent = eventSnap.exists()
        ? { id: eventSnap.id, ...eventSnap.data() }
        : null;

      const existingHazardIds = existingEvent
        ? [...(existingEvent.hazardIds ?? [])]
        : [];
      const currentStage = getStage(session, existingHazardIds.length);
      assertCanApplyHazard(currentStage, existingHazardIds.length);

      const nextRev = assertRevision(session, expectedRevision);

      const updatedTowns = towns.map((town) => applyHazard(town, hazard));
      const impact = buildHazardImpact(towns, updatedTowns);

      const prevImpacts = existingEvent?.impactPoints ?? {};
      const impactPoints = { ...prevImpacts };
      for (const item of impact) {
        impactPoints[item.townId] = (impactPoints[item.townId] ?? 0) + item.loss;
      }
      const impactComplete = existingEvent
        ? existingEvent.impactComplete !== false &&
          existingEvent.impactPoints != null
        : true;

      const hazardIds = [...existingHazardIds, hazardId];
      const eventHistory = [
        ...(existingEvent?.eventHistory ?? []),
        {
          type: "hazard",
          hazardId,
          timestamp: new Date(),
        },
      ];

      const lastUndo = buildHazardUndo({
        round: activeRound,
        townsBefore: towns,
        roundEventBefore: existingEvent,
      });

      for (const updatedTown of updatedTowns) {
        const ref = doc(db, this.TOWNS_COLLECTION, updatedTown.id);
        tx.update(ref, {
          bushfire: updatedTown.bushfire,
          flood: updatedTown.flood,
          stormSurge: updatedTown.stormSurge,
          heatwave: updatedTown.heatwave,
          biohazard: updatedTown.biohazard,
          updatedAt: serverTimestamp(),
        });
      }

      const eventPayload = {
        sessionId,
        roundNumber: activeRound,
        hazardIds,
        eventHistory,
        impactPoints,
        impactComplete,
        isComplete: false,
        updatedAt: serverTimestamp(),
      };

      if (existingEvent) {
        tx.update(eventRef, eventPayload);
      } else {
        tx.set(eventRef, {
          ...eventPayload,
          createdAt: serverTimestamp(),
        });
      }

      const sessionPatch = {
        revision: nextRev,
        stage: currentStage,
        totalRounds: getTotalRounds(session),
        lastUndo,
        updatedAt: serverTimestamp(),
      };
      tx.update(sessionRef, sessionPatch);

      return {
        towns: updatedTowns,
        roundEvent: { id: roundEventId, ...eventPayload },
        impact,
        session: { ...session, ...sessionPatch },
      };
    });
  }

  /**
   * Settle the current round (or end the game early) in a single transaction
   */
  async settleRound(
    sessionId,
    { expectedRound, expectedRevision, endEarly = false, allowAnyStage = false } = {}
  ) {
    const activePlaysQuery = query(
      collection(db, this.CARD_PLAYS_COLLECTION),
      where("sessionId", "==", sessionId),
      where("isActive", "==", true)
    );
    const activePlaySnaps = await getDocs(activePlaysQuery);
    const activePlayRefs = activePlaySnaps.docs.map((d) => d.ref);

    const sessionRef = doc(db, this.SESSIONS_COLLECTION, sessionId);

    const committed = await runTransaction(db, async (tx) => {
      const sessionSnap = await tx.get(sessionRef);
      if (!sessionSnap.exists()) {
        throw new GameRuleError("not-found", "Game not found");
      }
      const session = { id: sessionSnap.id, ...sessionSnap.data() };
      if (!session.isActive) {
        throw new GameRuleError("game-complete", "Game is already completed");
      }
      if (session.currentRound === 0) {
        throw new GameRuleError("not-started", "Game has not started yet");
      }

      const round = session.currentRound;
      const towns = await readTownsInTx(tx, sessionId);
      const eventRef = doc(
        db,
        this.ROUND_EVENTS_COLLECTION,
        `${sessionId}_${round}`
      );
      const statsRef = doc(
        db,
        this.ROUND_STATS_COLLECTION,
        `${sessionId}_${round}`
      );

      const [eventSnap, statsSnap, ...playDocSnaps] = await Promise.all([
        tx.get(eventRef),
        tx.get(statsRef),
        ...activePlayRefs.map((ref) => tx.get(ref)),
      ]);

      if (statsSnap.exists()) {
        throw new GameRuleError("already-settled", "Round already settled");
      }

      const hazardCount = eventSnap.exists()
        ? (eventSnap.data().hazardIds ?? []).length
        : 0;
      const currentStage = allowAnyStage
        ? "review"
        : getStage(session, hazardCount);

      const activePlays = playDocSnaps
        .filter((s) => s.exists() && s.data().isActive === true)
        .map((s) => ({ id: s.id, ...s.data() }));

      const plan = planSettlement({
        session,
        towns,
        activePlays,
        cards: allCards,
        expectedRound: expectedRound ?? round,
        stage: currentStage,
        endEarly,
      });

      const nextRev = assertRevision(session, expectedRevision);

      const roundStatsData = {
        sessionId,
        roundNumber: plan.round,
        towns: plan.snapshots,
        dividends: plan.dividends,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      tx.set(statsRef, roundStatsData);

      for (const updatedTown of plan.towns) {
        const ref = doc(db, this.TOWNS_COLLECTION, updatedTown.id);
        const currentStats = plan.snapshots[updatedTown.id];
        tx.update(ref, {
          effortPoints: updatedTown.effortPoints,
          currentRound: updatedTown.currentRound,
          bushfire: updatedTown.bushfire,
          flood: updatedTown.flood,
          stormSurge: updatedTown.stormSurge,
          heatwave: updatedTown.heatwave,
          biohazard: updatedTown.biohazard,
          currentStats,
          updatedAt: serverTimestamp(),
        });
      }

      for (const playId of plan.deactivatePlayIds) {
        tx.update(doc(db, this.CARD_PLAYS_COLLECTION, playId), {
          isActive: false,
          updatedAt: serverTimestamp(),
        });
      }

      const completedAtValue = plan.isComplete ? new Date() : null;
      const sessionPatch = {
        currentRound: plan.nextRound,
        isActive: !plan.isComplete,
        completedAt: plan.isComplete ? serverTimestamp() : null,
        endedEarly: plan.endedEarly,
        stage: plan.nextStage,
        lastSettlementRound: plan.round,
        lastDividends: plan.dividends,
        lastUndo: null,
        revision: nextRev,
        totalRounds: getTotalRounds(session),
        updatedAt: serverTimestamp(),
      };
      tx.update(sessionRef, sessionPatch);

      return {
        ...session,
        ...sessionPatch,
        completedAt: completedAtValue,
        towns: plan.towns.map((t) => ({
          ...t,
          currentStats: plan.snapshots[t.id],
        })),
        dividends: plan.dividends,
      };
    });

    if (!committed.isActive) {
      await onGameCompleted(committed);
    }

    return committed;
  }

  /**
   * Undo the most recent card play or hazard application in the current round
   */
  async undoLastMove(sessionId, { expectedRevision } = {}) {
    const sessionRef = doc(db, this.SESSIONS_COLLECTION, sessionId);

    return await runTransaction(db, async (tx) => {
      const sessionSnap = await tx.get(sessionRef);
      if (!sessionSnap.exists()) {
        throw new GameRuleError("not-found", "Game not found");
      }
      const session = { id: sessionSnap.id, ...sessionSnap.data() };
      const towns = await readTownsInTx(tx, sessionId);

      const planned = planUndo({ session, currentTowns: towns });
      const nextRev = assertRevision(session, expectedRevision);

      let eventRef = null;
      let eventSnap = null;
      if (planned.kind === "hazard") {
        eventRef = doc(
          db,
          this.ROUND_EVENTS_COLLECTION,
          `${sessionId}_${planned.round}`
        );
        eventSnap = await tx.get(eventRef);
      }

      for (const restoredTown of planned.towns) {
        tx.update(doc(db, this.TOWNS_COLLECTION, restoredTown.id), {
          effortPoints: restoredTown.effortPoints,
          bushfire: restoredTown.bushfire,
          flood: restoredTown.flood,
          stormSurge: restoredTown.stormSurge,
          heatwave: restoredTown.heatwave,
          biohazard: restoredTown.biohazard,
          updatedAt: serverTimestamp(),
        });
      }

      if (planned.kind === "card" && planned.deleteCardPlayId) {
        tx.delete(doc(db, this.CARD_PLAYS_COLLECTION, planned.deleteCardPlayId));
      } else if (planned.kind === "hazard" && eventRef && eventSnap?.exists()) {
        tx.update(eventRef, {
          hazardIds: planned.roundEventPatch.hazardIds,
          eventHistory: planned.roundEventPatch.eventHistory,
          impactPoints: planned.roundEventPatch.impactPoints,
          impactComplete: planned.roundEventPatch.impactComplete,
          updatedAt: serverTimestamp(),
        });
      }

      const sessionPatch = {
        lastUndo: null,
        revision: nextRev,
        updatedAt: serverTimestamp(),
      };
      tx.update(sessionRef, sessionPatch);

      return {
        kind: planned.kind,
        round: planned.round,
        towns: planned.towns,
        roundEventPatch: planned.roundEventPatch,
        session: { ...session, ...sessionPatch },
      };
    });
  }

  /**
   * Backwards-compatible wrapper for round advancement
   */
  async advanceRound(sessionId) {
    try {
      const session = await firestoreService.getDocument(
        this.SESSIONS_COLLECTION,
        sessionId
      );
      if (!session) {
        throw new GameRuleError("not-found", `Game session not found: ${sessionId}`);
      }

      if (session.currentRound === 0) {
        return await this.startGame(sessionId);
      }

      return await this.settleRound(sessionId, {
        expectedRound: session.currentRound,
        allowAnyStage: true,
      });
    } catch (error) {
      console.error(`Error advancing round for session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Apply ongoing card effects for all towns in a session (kept for legacy callers)
   */
  async applyOngoingCardEffects(sessionId, round) {
    const towns = await this.getSessionTowns(sessionId);
    for (const town of towns) {
      const cardPlays = await firestoreService.getDocuments(
        this.CARD_PLAYS_COLLECTION,
        [
          ["townId", "==", town.id],
          ["isActive", "==", true],
        ]
      );
      const activeCardPlays = cardPlays.filter((play) =>
        play.effectiveRounds.includes(round)
      );
      if (activeCardPlays.length > 0) {
        let updatedTown = { ...town };
        for (const play of activeCardPlays) {
          const card = allCards.find((c) => c.id === play.cardId);
          if (card) {
            updatedTown = applyCardEffects(updatedTown, card);
            const maxRound = Math.max(...play.effectiveRounds);
            if (round >= maxRound) {
              await firestoreService.updateDocument(
                this.CARD_PLAYS_COLLECTION,
                play.id,
                { isActive: false }
              );
            }
          }
        }
        await firestoreService.updateDocument(
          this.TOWNS_COLLECTION,
          town.id,
          updatedTown
        );
      }
    }
  }

  /**
   * Save round stats for all towns in a session (kept for legacy callers)
   */
  async saveRoundStats(sessionId, round) {
    const towns = await this.getSessionTowns(sessionId);
    const townStats = {};

    for (const town of towns) {
      const currentStats = {
        bushfire: town.bushfire,
        flood: town.flood,
        stormSurge: town.stormSurge,
        heatwave: town.heatwave,
        biohazard: town.biohazard,
        round,
      };
      await firestoreService.updateDocument(this.TOWNS_COLLECTION, town.id, {
        currentStats,
      });
      townStats[town.id] = currentStats;
    }

    const roundStatsId = `${sessionId}_${round}`;
    return await firestoreService.createDocument(
      this.ROUND_STATS_COLLECTION,
      {
        sessionId,
        roundNumber: round,
        towns: townStats,
      },
      roundStatsId
    );
  }

  /**
   * Get round events for a session (map of roundNumber -> hazardIds)
   */
  async getSessionRoundEvents(sessionId) {
    try {
      const events = await firestoreService.getDocuments(
        this.ROUND_EVENTS_COLLECTION,
        [["sessionId", "==", sessionId]]
      );

      const roundEvents = {};
      for (const event of events) {
        roundEvents[event.roundNumber] = event.hazardIds;
      }

      return roundEvents;
    } catch (error) {
      console.error(
        `Error getting round events for session ${sessionId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get raw round event documents for a session
   */
  async getSessionRoundEventDocs(sessionId) {
    return await firestoreService.getDocuments(this.ROUND_EVENTS_COLLECTION, [
      ["sessionId", "==", sessionId],
    ]);
  }

  /**
   * Get round stats documents for a session
   */
  async getSessionRoundStats(sessionId) {
    return await firestoreService.getDocuments(this.ROUND_STATS_COLLECTION, [
      ["sessionId", "==", sessionId],
    ]);
  }

  /**
   * Get card plays for a town grouped by round
   */
  async getTownCardPlays(townId) {
    try {
      const cardPlays = await firestoreService.getDocuments(
        this.CARD_PLAYS_COLLECTION,
        [["townId", "==", townId]]
      );

      const cardsByRound = {};

      for (const play of cardPlays) {
        const card = allCards.find((c) => c.id === play.cardId);

        if (card) {
          for (const round of play.effectiveRounds ?? cardEffectiveRounds(play.playedAtRound, card.duration)) {
            if (!cardsByRound[round]) {
              cardsByRound[round] = [];
            }

            let displayName = card.name;
            if (card.duration > 1) {
              const playedAt = play.playedAtRound;
              const duration = card.duration;
              if (round === playedAt) {
                displayName = `${card.name} (${duration} rounds)`;
              } else {
                const currentEffect = round - playedAt + 1;
                displayName = `${card.name} (${currentEffect}/${duration})`;
              }
            }

            cardsByRound[round].push(displayName);
          }
        }
      }

      return cardsByRound;
    } catch (error) {
      console.error(`Error getting card plays for town ${townId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a game session and all related data
   */
  async deleteSession(sessionId) {
    try {
      const [towns, roundEvents, roundStats, cardPlays] = await Promise.all([
        this.getSessionTowns(sessionId),
        firestoreService.getDocuments(this.ROUND_EVENTS_COLLECTION, [
          ["sessionId", "==", sessionId],
        ]),
        firestoreService.getDocuments(this.ROUND_STATS_COLLECTION, [
          ["sessionId", "==", sessionId],
        ]),
        firestoreService.getDocuments(this.CARD_PLAYS_COLLECTION, [
          ["sessionId", "==", sessionId],
        ]),
      ]);

      const operations = [];

      for (const town of towns) {
        operations.push(["delete", this.TOWNS_COLLECTION, town.id]);
      }
      for (const event of roundEvents) {
        operations.push(["delete", this.ROUND_EVENTS_COLLECTION, event.id]);
      }
      for (const stats of roundStats) {
        operations.push(["delete", this.ROUND_STATS_COLLECTION, stats.id]);
      }
      for (const play of cardPlays) {
        operations.push(["delete", this.CARD_PLAYS_COLLECTION, play.id]);
      }
      // Delete session last so ownership checks on child documents succeed during the batch
      operations.push(["delete", this.SESSIONS_COLLECTION, sessionId]);

      if (operations.length > 0) {
        await firestoreService.batchOperation(operations);
      }

      return true;
    } catch (error) {
      console.error(`Error deleting game session ${sessionId}:`, error);
      throw error;
    }
  }

  async deleteRoundEvent(eventId) {
    return await firestoreService.deleteDocument(
      this.ROUND_EVENTS_COLLECTION,
      eventId
    );
  }

  async updateRoundEvent(eventId, data) {
    return await firestoreService.updateDocument(
      this.ROUND_EVENTS_COLLECTION,
      eventId,
      data
    );
  }

  async getTownCardPlaysForRound(townId, round) {
    return await firestoreService.getDocuments(this.CARD_PLAYS_COLLECTION, [
      ["townId", "==", townId],
      ["playedAtRound", "==", round],
    ]);
  }

  async getTownCardPlayDocs(townId) {
    return await firestoreService.getDocuments(this.CARD_PLAYS_COLLECTION, [
      ["townId", "==", townId],
    ]);
  }

  async removeCardPlay(sessionId, cardPlayId, { expectedRevision } = {}) {
    const sessionRef = doc(db, this.SESSIONS_COLLECTION, sessionId);
    const playRef = doc(db, this.CARD_PLAYS_COLLECTION, cardPlayId);

    return await runTransaction(db, async (tx) => {
      const [sessionSnap, playSnap] = await Promise.all([
        tx.get(sessionRef),
        tx.get(playRef),
      ]);
      if (!sessionSnap.exists()) {
        throw new GameRuleError("not-found", "Game not found");
      }
      if (!playSnap.exists()) {
        throw new GameRuleError("not-found", "Card play not found");
      }

      const session = { id: sessionSnap.id, ...sessionSnap.data() };
      if (!session.isActive) {
        throw new GameRuleError("game-complete", "Game is already completed");
      }

      const play = { id: playSnap.id, ...playSnap.data() };
      const townRef = doc(db, this.TOWNS_COLLECTION, play.townId);
      const townSnap = await tx.get(townRef);
      if (!townSnap.exists()) {
        throw new GameRuleError("not-found", `Town not found: ${play.townId}`);
      }
      const town = { id: townSnap.id, ...townSnap.data() };
      if (town.isComparisonTown) {
        throw new GameRuleError("comparison-town");
      }

      const card = allCards.find((c) => c.id === play.cardId);
      if (!card) {
        throw new GameRuleError("card-not-found", `Card not found: ${play.cardId}`);
      }

      const nextRev = assertRevision(session, expectedRevision);
      const revertedTown = revertCardEffects(town, card);

      tx.update(townRef, {
        effortPoints: revertedTown.effortPoints,
        bushfire: revertedTown.bushfire,
        flood: revertedTown.flood,
        stormSurge: revertedTown.stormSurge,
        heatwave: revertedTown.heatwave,
        biohazard: revertedTown.biohazard,
        updatedAt: serverTimestamp(),
      });
      tx.delete(playRef);

      const sessionPatch = {
        revision: nextRev,
        lastUndo: null,
        updatedAt: serverTimestamp(),
      };
      tx.update(sessionRef, sessionPatch);

      return {
        town: revertedTown,
        deletedPlayId: cardPlayId,
        townId: town.id,
        session: { ...session, ...sessionPatch },
      };
    });
  }

  async deleteCardPlay(playId) {
    return await firestoreService.deleteDocument(
      this.CARD_PLAYS_COLLECTION,
      playId
    );
  }
}

export default new GameSessionService();
