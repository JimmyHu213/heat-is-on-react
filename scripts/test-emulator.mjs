process.env.VITE_USE_FIREBASE_EMULATOR = "true";
delete process.env.HTTP_PROXY;
delete process.env.HTTPS_PROXY;
delete process.env.http_proxy;
delete process.env.https_proxy;
process.env.NO_PROXY = "127.0.0.1,localhost";
process.env.no_proxy = "127.0.0.1,localhost";

import assert from "node:assert/strict";
import test from "node:test";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { defaultTowns } from "../src/constants/towns.js";
import { auth, db } from "../src/firebase/config.js";
import { buildGameSummary } from "../src/game/summary.js";
import gameSessionService from "../src/services/gameSessionService.js";

let counter = 0;
async function signInFreshUser(prefix = "user") {
  counter += 1;
  const email = `${prefix}-${Date.now()}-${counter}@example.com`;
  const password = "Password123!";
  await signOut(auth);
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  return { uid: cred.user.uid, email, password };
}

test("plays a full 2-round facilitated game with persisted undo, stage rules and revisions", async () => {
  const userA = await signInFreshUser("facilitator-a");

  // Create a 2-round session with playerCount 18 and wheel disabled
  const created = await gameSessionService.createSession(
    userA.uid,
    "Workshop Run 1",
    {
      totalRounds: 2,
      playerCount: 18,
      digitalWheelEnabled: false,
    }
  );
  const sessionId = created.id;
  assert.equal(created.currentRound, 0);
  assert.equal(created.totalRounds, 2);
  assert.equal(created.playerCount, 18);
  assert.equal(created.digitalWheelEnabled, false);
  assert.equal(created.revision, 0);
  assert.equal(created.towns.length, 6);

  // Start game -> round 1, stage adaptation, revision 1
  const started = await gameSessionService.startGame(sessionId, {
    expectedRevision: 0,
  });
  assert.equal(started.currentRound, 1);
  assert.equal(started.stage, "adaptation");
  assert.equal(started.revision, 1);

  const town1Id = `${sessionId}_town_1`;
  const comparisonTown = started.towns.find((t) => t.isComparisonTown);
  assert.ok(comparisonTown);

  // Bludgeton cannot play adaptation cards
  await assert.rejects(
    () => gameSessionService.applyCardToTown(comparisonTown.id, "bushfire1", 1),
    { name: "GameRuleError", code: "comparison-town" }
  );

  // Play bushfire1 (cost 15, duration 1) and bushfire2 (cost 15, duration 2) on Town 1
  const play1 = await gameSessionService.applyCardToTown(
    town1Id,
    "bushfire1",
    1,
    {
      expectedRevision: 1,
    }
  );
  assert.equal(play1.town.effortPoints, 85);
  assert.equal(play1.town.bushfire.nature, 60);
  assert.equal(play1.session.revision, 2);

  const play2 = await gameSessionService.applyCardToTown(
    town1Id,
    "bushfire2",
    1,
    {
      expectedRevision: 2,
    }
  );
  assert.equal(play2.town.effortPoints, 70);
  assert.equal(play2.town.bushfire.nature, 90);
  assert.equal(play2.session.revision, 3);

  // Undo last move (reverts bushfire2, deletes its card_plays doc, restores Town 1 EP to 85)
  const undoneCard = await gameSessionService.undoLastMove(sessionId, {
    expectedRevision: 3,
  });
  assert.equal(undoneCard.kind, "card");
  assert.equal(undoneCard.session.revision, 4);
  assert.equal(undoneCard.session.lastUndo, null);

  const reloadedAfterCardUndo = await gameSessionService.getSession(sessionId);
  const reloadedTown1 = reloadedAfterCardUndo.towns.find(
    (t) => t.id === town1Id
  );
  assert.equal(reloadedTown1.effortPoints, 85);
  assert.equal(reloadedTown1.bushfire.nature, 60);

  const deletedPlaySnap = await getDoc(
    doc(db, "card_plays", play2.cardPlay.id)
  );
  assert.equal(deletedPlaySnap.exists(), false);

  // Reject a second undo (one-level undo)
  await assert.rejects(() => gameSessionService.undoLastMove(sessionId), {
    name: "GameRuleError",
    code: "nothing-to-undo",
  });

  // Reject applying a hazard while still in adaptation
  await assert.rejects(
    () => gameSessionService.applyHazardToSession(sessionId, "bushfire", 1),
    { name: "GameRuleError", code: "wrong-stage" }
  );

  // Move adaptation -> hazard, then step back hazard -> adaptation (allowed when 0 hazards applied), then back to hazard
  const toHazard1 = await gameSessionService.changeStage(sessionId, "hazard", {
    expectedRevision: 4,
  });
  assert.equal(toHazard1.stage, "hazard");
  assert.equal(toHazard1.revision, 5);

  const backToAdapt = await gameSessionService.changeStage(
    sessionId,
    "adaptation",
    { expectedRevision: 5 }
  );
  assert.equal(backToAdapt.stage, "adaptation");
  assert.equal(backToAdapt.revision, 6);

  const toHazard2 = await gameSessionService.changeStage(sessionId, "hazard", {
    expectedRevision: 6,
  });
  assert.equal(toHazard2.stage, "hazard");
  assert.equal(toHazard2.revision, 7);

  // Apply bushfire hazard -> stores impactPoints and impactComplete: true
  const hazardResult = await gameSessionService.applyHazardToSession(
    sessionId,
    "bushfire",
    1,
    { expectedRevision: 7 }
  );
  assert.equal(hazardResult.session.revision, 8);
  assert.equal(hazardResult.roundEvent.impactComplete, true);
  assert.equal(typeof hazardResult.roundEvent.impactPoints[town1Id], "number");
  assert.ok(hazardResult.roundEvent.impactPoints[town1Id] > 0);

  // Cannot step back hazard -> adaptation once a hazard is applied
  await assert.rejects(
    () => gameSessionService.changeStage(sessionId, "adaptation"),
    { name: "GameRuleError", code: "invalid-stage-transition" }
  );

  // Undo the hazard -> restores pre-hazard scores and clears hazardIds to [], allowing hazard -> adaptation again
  const undoneHazard = await gameSessionService.undoLastMove(sessionId, {
    expectedRevision: 8,
  });
  assert.equal(undoneHazard.kind, "hazard");
  assert.equal(undoneHazard.session.revision, 9);

  const stepBackAfterUndo = await gameSessionService.changeStage(
    sessionId,
    "adaptation",
    { expectedRevision: 9 }
  );
  assert.equal(stepBackAfterUndo.stage, "adaptation");

  // Re-enter hazard stage, apply bushfire, then move hazard -> review
  await gameSessionService.changeStage(sessionId, "hazard", {
    expectedRevision: 10,
  });
  await gameSessionService.applyHazardToSession(sessionId, "bushfire", 1, {
    expectedRevision: 11,
  });
  const inReview = await gameSessionService.changeStage(sessionId, "review", {
    expectedRevision: 12,
  });
  assert.equal(inReview.stage, "review");
  assert.equal(inReview.revision, 13);
  assert.equal(inReview.lastUndo, null);

  // Stage change clears undo, so hazard cannot be undone from review
  await assert.rejects(() => gameSessionService.undoLastMove(sessionId), {
    name: "GameRuleError",
    code: "nothing-to-undo",
  });

  // Stale revision is rejected
  await assert.rejects(
    () =>
      gameSessionService.settleRound(sessionId, {
        expectedRound: 1,
        expectedRevision: 2,
      }),
    { name: "GameRuleError", code: "stale-revision" }
  );

  // Settle round 1
  const settled1 = await gameSessionService.settleRound(sessionId, {
    expectedRound: 1,
    expectedRevision: 13,
  });
  assert.equal(settled1.currentRound, 2);
  assert.equal(settled1.stage, "adaptation");
  assert.equal(settled1.isActive, true);
  assert.equal(settled1.revision, 14);

  // Settling round 1 a second time is rejected as stale-round
  await assert.rejects(
    () =>
      gameSessionService.settleRound(sessionId, {
        expectedRound: 1,
      }),
    { name: "GameRuleError", code: "stale-round" }
  );

  // bushfire1 (duration 1, played in round 1) is deactivated after round 1 settlement
  const play1Snap = await getDoc(doc(db, "card_plays", play1.cardPlay.id));
  assert.equal(play1Snap.data().isActive, false);

  // Manual budget edit in round 2 works (0..999) and bumps revision; 1000 is rejected
  await assert.rejects(
    () => gameSessionService.updateTownBudget(town1Id, 1000),
    { name: "GameRuleError", code: "invalid-budget" }
  );
  const budgetUpdated = await gameSessionService.updateTownBudget(
    town1Id,
    250,
    { expectedRevision: 14 }
  );
  assert.equal(budgetUpdated.town.effortPoints, 250);
  assert.equal(budgetUpdated.session.revision, 15);

  // Town rename does not bump revision
  const renamed = await gameSessionService.updateTownName(
    town1Id,
    "New Hobart"
  );
  assert.equal(renamed.name, "New Hobart");
  const afterRenameSession = await gameSessionService.getSession(sessionId);
  assert.equal(afterRenameSession.revision, 15);

  // Simultaneous budget + name update via updateTown preserves both changes and bumps revision once
  const bothUpdated = await gameSessionService.updateTown(
    town1Id,
    { effortPoints: 260, name: "Hobart Restored" },
    { expectedRevision: 15 }
  );
  assert.equal(bothUpdated.effortPoints, 260);
  assert.equal(bothUpdated.name, "Hobart Restored");
  const afterBothSession = await gameSessionService.getSession(sessionId);
  assert.equal(afterBothSession.revision, 16);

  // Update playerCount on active game
  const updatedPlayers = await gameSessionService.updatePlayerCount(
    sessionId,
    24
  );
  assert.equal(updatedPlayers.playerCount, 24);

  // Finish round 2 -> completes the 2-round game
  await gameSessionService.changeStage(sessionId, "hazard", {
    expectedRevision: 16,
  });
  await gameSessionService.applyHazardToSession(sessionId, "flood", 2, {
    expectedRevision: 17,
  });
  await gameSessionService.changeStage(sessionId, "review", {
    expectedRevision: 18,
  });
  const finished = await gameSessionService.settleRound(sessionId, {
    expectedRound: 2,
    expectedRevision: 19,
  });
  assert.equal(finished.isActive, false);
  assert.equal(finished.stage, "complete");
  assert.equal(finished.currentRound, 3);
  assert.equal(finished.endedEarly, false);

  // Summary builds cleanly from stored events and round stats
  const [events, stats] = await Promise.all([
    gameSessionService.getSessionRoundEventDocs(sessionId),
    gameSessionService.getSessionRoundStats(sessionId),
  ]);
  const summary = buildGameSummary({
    session: finished,
    towns: finished.towns,
    events,
    roundStats: stats,
  });
  assert.equal(summary.roundsPlayed, 2);
  assert.equal(summary.totalRounds, 2);
  assert.equal(summary.hasCompleteImpacts, true);
  assert.ok(summary.mostImpacted.length >= 1);
  assert.equal(summary.mostImpacted.includes(comparisonTown.id), false);
});

test("ending early from adaptation settles the current round and marks endedEarly", async () => {
  const user = await signInFreshUser("early");
  const created = await gameSessionService.createSession(
    user.uid,
    "Early End Game",
    { totalRounds: 5 }
  );
  await gameSessionService.startGame(created.id);

  const ended = await gameSessionService.settleRound(created.id, {
    expectedRound: 1,
    endEarly: true,
  });
  assert.equal(ended.isActive, false);
  assert.equal(ended.endedEarly, true);
  assert.equal(ended.stage, "complete");
  assert.equal(ended.currentRound, 2);
  assert.equal(ended.totalRounds, 5);
});

test("legacy in-progress session without new fields loads, plays and settles as a 5-round game", async () => {
  const user = await signInFreshUser("legacy");
  const legacySessionId = `legacy_${Date.now()}`;

  await setDoc(doc(db, "game_sessions", legacySessionId), {
    userId: user.uid,
    name: "Legacy Session",
    currentRound: 1,
    isActive: true,
    completedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  for (let i = 0; i < defaultTowns.length; i++) {
    const t = defaultTowns[i];
    const townNumber = i + 1;
    await setDoc(doc(db, "towns", `${legacySessionId}_town_${townNumber}`), {
      sessionId: legacySessionId,
      townNumber,
      name: t.name,
      townTemplateId: t.id,
      effortPoints: 100,
      currentRound: 1,
      bushfire: structuredClone(t.baseStats.bushfire),
      flood: structuredClone(t.baseStats.flood),
      stormSurge: structuredClone(t.baseStats.stormSurge),
      heatwave: structuredClone(t.baseStats.heatwave),
      biohazard: structuredClone(t.baseStats.biohazard),
      currentStats: {},
      isComparisonTown: t.name === "Bludgeton",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  // First move on legacy session: play a card in round 1 (inferred stage: adaptation)
  const town1Id = `${legacySessionId}_town_1`;
  const cardRes = await gameSessionService.applyCardToTown(
    town1Id,
    "bushfire1",
    1
  );
  assert.equal(cardRes.session.revision, 1);
  assert.equal(cardRes.session.totalRounds, 5);
  assert.equal(cardRes.session.stage, "adaptation");

  await gameSessionService.changeStage(legacySessionId, "hazard");
  await gameSessionService.applyHazardToSession(legacySessionId, "bushfire", 1);
  await gameSessionService.changeStage(legacySessionId, "review");

  const settled = await gameSessionService.settleRound(legacySessionId, {
    expectedRound: 1,
  });
  assert.equal(settled.currentRound, 2);
  assert.equal(settled.totalRounds, 5);
  assert.equal(settled.stage, "adaptation");
});

test("firestore.rules reject cross-user access, ID squatting, round_stats mutation and invalid values", async () => {
  const userA = await signInFreshUser("owner-a");
  const sessionA = await gameSessionService.createSession(
    userA.uid,
    "Owner A Game"
  );
  await gameSessionService.startGame(sessionA.id);
  await gameSessionService.changeStage(sessionA.id, "hazard");
  await gameSessionService.applyHazardToSession(sessionA.id, "bushfire", 1);
  await gameSessionService.changeStage(sessionA.id, "review");
  await gameSessionService.settleRound(sessionA.id, { expectedRound: 1 });

  // Owner A cannot mutate round_stats after settlement
  await assert.rejects(() =>
    updateDoc(doc(db, "round_stats", `${sessionA.id}_1`), {
      dividends: { [`${sessionA.id}_town_1`]: 9999 },
    })
  );

  // Owner A cannot create a round_event whose ID does not match <sessionId>_<roundNumber>
  await assert.rejects(() =>
    setDoc(doc(db, "round_events", `${sessionA.id}_99`), {
      sessionId: sessionA.id,
      roundNumber: 2,
      hazardIds: ["bushfire"],
      eventHistory: [],
      isComplete: false,
    })
  );

  // Owner A cannot write negative effortPoints or out-of-range hazard scores (> 100)
  await assert.rejects(() =>
    updateDoc(doc(db, "towns", `${sessionA.id}_town_1`), {
      effortPoints: -10,
    })
  );
  await assert.rejects(() =>
    updateDoc(doc(db, "towns", `${sessionA.id}_town_1`), {
      bushfire: { nature: 150, economy: 50, society: 50, health: 50 },
    })
  );

  // Switch to User B
  const userB = await signInFreshUser("intruder-b");
  assert.notEqual(userB.uid, userA.uid);

  // User B cannot read or update User A's session or town
  await assert.rejects(() => getDoc(doc(db, "game_sessions", sessionA.id)));
  await assert.rejects(() =>
    getDoc(doc(db, "towns", `${sessionA.id}_town_1`))
  );
  await assert.rejects(() =>
    updateDoc(doc(db, "towns", `${sessionA.id}_town_1`), {
      name: "Hijacked",
    })
  );

  // User B cannot squat round_stats or round_events under User A's session ID
  await assert.rejects(() =>
    setDoc(doc(db, "round_stats", `${sessionA.id}_2`), {
      sessionId: sessionA.id,
      roundNumber: 2,
      towns: {},
    })
  );
  await assert.rejects(() =>
    setDoc(doc(db, "round_events", `${sessionA.id}_2`), {
      sessionId: sessionA.id,
      roundNumber: 2,
      hazardIds: ["flood"],
    })
  );

  // Restore User A session and verify deleteSession cleans up everything
  await signOut(auth);
  await signInWithEmailAndPassword(auth, userA.email, userA.password);
  const deleted = await gameSessionService.deleteSession(sessionA.id);
  assert.equal(deleted, true);
  const afterDelete = await gameSessionService.getSession(sessionA.id);
  assert.equal(afterDelete, null);
});
