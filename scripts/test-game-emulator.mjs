import assert from 'node:assert/strict';
import { createUserWithEmailAndPassword, connectAuthEmulator, signOut } from 'firebase/auth';
import { connectFirestoreEmulator, doc, getDoc, getDocs, collection, updateDoc, deleteField, terminate } from 'firebase/firestore';
import { auth, db } from '../src/firebase/config.js';
import service from '../src/services/gameSessionService.js';
import store from '../src/services/firestoreService.js';
import exportService from '../src/services/exportService.js';
import { ASPECTS, HAZARD_IDS } from '../src/utils/rounds.js';
import { totalResilience } from '../src/utils/gameSummary.js';
import { submitSubscriptionRequest, getSubscriptionRequest } from '../src/services/subscriptionService.js';
import { GameSession } from '../src/model/GameSession.js';

// This test deliberately refuses to run against the deployed project.
if (!process.env.FIRESTORE_EMULATOR_HOST || !process.env.FIREBASE_AUTH_EMULATOR_HOST) {
  throw new Error('Run this test through Firebase emulators:exec with Auth and Firestore.');
}
connectAuthEmulator(auth, `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}`, { disableWarnings: true });
const [host, port] = process.env.FIRESTORE_EMULATOR_HOST.split(':');
connectFirestoreEmulator(db, host, Number(port));

async function main() {
try {
  const { user } = await createUserWithEmailAndPassword(auth, `rounds-${Date.now()}@example.com`, 'test-password-123');
  const first = await service.createSession(user.uid, 'One round', { totalRounds: 1, digitalWheelEnabled: true });
  await service.advanceRound(first.id, 0);
  const fullScores = Object.fromEntries(HAZARD_IDS.map(h => [h, Object.fromEntries(ASPECTS.map(a => [a, 100]))]));
  await service.updateTown(first.towns[0].id, fullScores);
  await service.updateTown(first.towns[5].id, fullScores);
  const submissions = await Promise.allSettled([service.advanceRound(first.id, 1), service.advanceRound(first.id, 1)]);
  assert.equal(submissions.filter(s => s.status === 'fulfilled').length, 1, `only one concurrent settlement may commit: ${submissions.map(s => s.reason?.message || s.status).join('; ')}`);
  const closed = await service.getSession(first.id);
  assert.equal(closed.isActive, false); assert.equal(closed.currentRound, 2);
  assert.equal(closed.towns[0].effortPoints, 200); assert.equal(closed.towns[5].effortPoints, 200);
  assert.equal(closed.lastDividends[first.towns[0].id], 100);
  const saved = await getDoc(doc(db, 'round_stats', `${first.id}_1`));
  assert.equal(saved.data().dividends[first.towns[0].id], 100);
  assert.equal(saved.data().towns[first.towns[0].id].flood.health, 100);
  await assert.rejects(service.advanceRound(first.id, 2), /finished/);
  console.log('PASS: final-round dividends, comparison town, persisted snapshots and concurrent replay protection');

  const long = await service.createSession(user.uid, 'Twenty rounds', { totalRounds: 20 });
  await service.advanceRound(long.id, 0);
  await service.setDigitalWheel(long.id, true);
  assert.equal((await service.getSession(long.id)).digitalWheelEnabled, true);
  await service.applyCardToTown(long.towns[0].id, 'bushfire1', 1);
  const roundTwo = await service.advanceRound(long.id, 1);
  assert.ok(roundTwo.towns[0].bushfire.nature >= long.towns[0].bushfire.nature);
  for (let round = 2; round < 20; round++) await service.advanceRound(long.id, round);
  await service.applyCardToTown(long.towns[1].id, 'bushfire1', 20);
  await service.applyHazardToSession(long.id, 'heatwave', 20);
  const last = await service.advanceRound(long.id, 20);
  assert.equal(last.currentRound, 21); assert.equal(last.isActive, false);
  assert.ok((await service.getSessionRoundEvents(long.id))[20].includes('heatwave'));
  assert.ok((await service.getTownCardPlays(long.towns[1].id))[20].length > 0);
  console.log('PASS: twenty configured rounds, ongoing cards, final-round cards and events, wheel settings');

  const legacy = await store.createDocument('game_sessions', {
    userId: user.uid, name: 'Legacy game', currentRound: 0, isActive: true, completedAt: null,
  });
  await service.createTownsForSession(legacy.id);
  await service.advanceRound(legacy.id, 0);
  await service.saveRoundStats(legacy.id, 1);
  const oldSnapshotRef = doc(db, 'round_stats', `${legacy.id}_1`);
  const oldCreatedAt = (await getDoc(oldSnapshotRef)).data().createdAt;
  for (let round = 1; round <= 5; round++) await service.advanceRound(legacy.id, round);
  assert.ok((await getDoc(oldSnapshotRef)).data().createdAt.isEqual(oldCreatedAt));
  assert.equal((await service.getSession(legacy.id)).isActive, false);
  console.log('PASS: legacy five-round games and pre-existing round snapshots');

  const review = await service.createSession(user.uid, 'Review and early end', { totalRounds: 8 });
  await service.advanceRound(review.id, 0);
  const original = (await service.getSession(review.id)).towns[0];
  const one = await service.applyCardToTown(original.id, 'bushfire1', 1);
  const two = await service.applyCardToTown(original.id, 'bushfire1', 1);
  assert.notEqual(one.cardPlay.id, two.cardPlay.id);
  const undone = await service.undoAction(review.id, two.undo);
  assert.ok((await getDoc(doc(db, 'card_plays', one.cardPlay.id))).exists());
  assert.equal((await store.getDocuments('card_plays', [['townId', '==', original.id]])).some(play => play.id === two.cardPlay.id), false);
  assert.equal(undone.session.towns[0].effortPoints, one.town.effortPoints);
  const undoFirst = await service.undoAction(review.id, { ...one.undo, afterRevision: undone.revision });
  assert.equal(undoFirst.session.towns[0].effortPoints, original.effortPoints);
  assert.equal(totalResilience(undoFirst.session.towns[0]), totalResilience(original));
  const beforeHazard = (await service.getSession(review.id)).towns;
  const applied = await service.applyHazardToSession(review.id, 'flood', 1);
  for (const town of beforeHazard) assert.equal(applied.roundEvent.impactPoints[town.id],
    totalResilience(town) - totalResilience(applied.towns.find(t => t.id === town.id)));
  assert.equal(applied.impact.length, 6);
  for (const row of applied.impact) {
    const before = beforeHazard.find(t => t.id === row.id);
    const after = applied.towns.find(t => t.id === row.id);
    assert.equal(row.loss, totalResilience(before) - totalResilience(after));
    assert.equal(row.before, totalResilience(before) / 20);
    assert.equal(row.after, totalResilience(after) / 20);
    assert.equal(Object.values(row.aspectLoss).reduce((sum, n) => sum + n, 0), row.loss);
  }
  await assert.rejects(service.applyHazardToSession(review.id, 'flood', 1), /already been applied/);
  assert.equal((await service.getSession(review.id)).revision, applied.undo.afterRevision);
  await service.undoAction(review.id, applied.undo);
  assert.equal((await getDoc(doc(db, 'round_events', `${review.id}_1`))).exists(), false);
  const reapplied = await service.applyHazardToSession(review.id, 'flood', 1);
  const secondHazard = await service.applyHazardToSession(review.id, 'heatwave', 1);
  await service.undoAction(review.id, secondHazard.undo);
  assert.deepEqual((await getDoc(doc(db, 'round_events', `${review.id}_1`))).data().impactPoints, reapplied.roundEvent.impactPoints);
  await service.setStage(review.id, 'review', 1);
  assert.equal((await service.getSession(review.id)).stage, 'review');
  // A manual edit from another browser must prevent a stale undo from overwriting it.
  await service.updateTown(original.id, { name: 'Edited town' });
  await assert.rejects(service.undoAction(review.id, reapplied.undo), /game has changed/);
  await assert.rejects(service.applyCardToTown(original.id, 'bushfire1', 2), /round has changed/);
  const early = await service.advanceRound(review.id, 1, true);
  assert.equal(early.totalRounds, 8); assert.equal(early.currentRound, 2);
  assert.equal(early.endedEarly, true); assert.equal(early.stage, 'complete');
  const summary = await service.getSummary(review.id);
  assert.equal(summary.roundsPlayed, 1); assert.equal(summary.towns.length, 6);
  assert.ok(summary.towns.some(t => t.name === 'Bludgeton'));
  assert.equal(summary.hasCompleteImpacts, true); assert.equal(summary.eventCount, 1);
  const exported = await exportService.getSessionDataPackage(review.id);
  assert.equal(exported.session.roundsPlayed, 1); assert.equal(exported.roundEvents.length, 1);
  assert.equal(exported.session.totalRounds, 8); assert.equal(exported.session.endedEarly, true);
  await assert.rejects(service.applyHazardToSession(review.id, 'bushfire', 2), /finished/);
  await assert.rejects(service.applyCardToTown(original.id, 'bushfire1', 2), /finished/);
  console.log('PASS: atomic cards/events, exact repeated-card undo, event metrics/undo, stages, stale actions, early finish and six-town summary');

  const wheel = await service.createSession(user.uid, 'Wheel review guard', { totalRounds: 3 });
  assert.equal(wheel.digitalWheelEnabled, true);
  assert.equal(new GameSession().digitalWheelEnabled, true);
  assert.equal(new GameSession({ digitalWheelEnabled: false }).digitalWheelEnabled, false);
  await service.advanceRound(wheel.id, 0);
  await service.setStage(wheel.id, 'hazard', 1);
  await assert.rejects(service.setStage(wheel.id, 'review', 1), /Spin the hazard wheel/);
  assert.equal((await service.getSession(wheel.id)).stage, 'hazard');
  await service.applyHazardToSession(wheel.id, 'flood', 1);
  await service.setStage(wheel.id, 'review', 1);
  await service.advanceRound(wheel.id, 1);
  await assert.rejects(service.setStage(wheel.id, 'review', 2), /Spin the hazard wheel/);
  await service.setDigitalWheel(wheel.id, false);
  await service.setStage(wheel.id, 'review', 2);
  const physical = await service.createSession(user.uid, 'Physical wheel', { digitalWheelEnabled: false });
  assert.equal(physical.digitalWheelEnabled, false);
  console.log('PASS: default wheel, per-round review guard, confirmed events, physical-wheel opt-out and impact reports');

  assert.equal(await getSubscriptionRequest(user.uid), null);
  const application = await submitSubscriptionRequest(user, { name: 'Workshop presenter', organization: 'Example University', message: 'Teaching' });
  assert.equal(application.status, 'pending');
  const repeated = await submitSubscriptionRequest(user, { name: 'Another', organization: 'Other', message: '' });
  assert.equal(repeated.name, application.name); assert.ok(repeated.createdAt.isEqual(application.createdAt));
  console.log('PASS: subscription application persists and repeated submission is idempotent');

  const denied = promise => assert.rejects(promise, error => error.code === 'permission-denied');
  const sessionRef = doc(db, 'game_sessions', long.id);
  await denied(updateDoc(sessionRef, { totalRounds: 2 }));
  await denied(updateDoc(sessionRef, { digitalWheelEnabled: 'yes' }));
  await denied(updateDoc(sessionRef, { name: 'x'.repeat(201) }));
  await denied(updateDoc(sessionRef, { userId: 'someone-else' }));
  await denied(updateDoc(sessionRef, { name: deleteField() }));
  await denied(updateDoc(sessionRef, { extraData: true }));
  await denied(updateDoc(doc(db, 'subscription_requests', user.uid), { status: 'approved' }));
  await signOut(auth);
  await denied(getDocs(collection(db, 'game_sessions')));
  await createUserWithEmailAndPassword(auth, `other-${Date.now()}@example.com`, 'test-password-123');
  await denied(getDoc(sessionRef));
  await denied(getSubscriptionRequest(user.uid));
  console.log('PASS: schema validation, immutable settings, ownership and queries');
} finally {
  await terminate(db);
  await auth.signOut();
}

}
main().catch(error => { console.error(error); process.exitCode = 1; });
