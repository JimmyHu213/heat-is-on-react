// Run with: npm run seed:demo
// Creates only missing demo sessions; existing games are preserved.
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, connectAuthEmulator } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, query, where, writeBatch, Timestamp, terminate, connectFirestoreEmulator } from 'firebase/firestore';
import { deleteApp } from 'firebase/app';
import { auth, db } from '../src/firebase/config.js';
import gameService from '../src/services/gameSessionService.js';
import { defaultTowns } from '../src/constants/towns.js';
import { allCards } from '../src/constants/cards.js';
import { hazards } from '../src/constants/hazards.js';

const email = 'demo@example.com';
const password = 'password123';
const dimensions = ['bushfire', 'flood', 'stormSurge', 'heatwave', 'biohazard'];

function snapshot(town, round) {
  return Object.fromEntries([...dimensions.map(key => [key, structuredClone(town[key])]), ['round', round]]);
}

function generateSession(uid, scenario, index) {
  const sessionId = `demo-${uid}-${scenario.key}`;
  const started = Date.now() - (3 - index) * 86400000;
  const timestamp = (round = 0) => Timestamp.fromMillis(started + round * 3600000);
  const records = [];
  const towns = defaultTowns.map((template, i) => ({
    id: `${sessionId}_town_${i + 1}`,
    sessionId, townNumber: i + 1, name: template.name,
    townTemplateId: template.id, effortPoints: 100, currentRound: 0,
    ...structuredClone(template.baseStats), currentStats: {},
    isComparisonTown: template.name === 'Bludgeton',
    createdAt: timestamp(), updatedAt: timestamp(),
  }));
  const plays = [];
  for (let round = 1; round <= scenario.rounds; round++) {
    const hazard = hazards[(round - 1 + index) % hazards.length];
    for (let i = 0; i < towns.length; i++) {
      let town = towns[i];
      town.currentRound = round;
      for (const play of plays.filter(p => p.townId === town.id && p.playedAtRound < round && p.effectiveRounds.includes(round))) {
        town = gameService.applyCardEffects(structuredClone(town), allCards.find(c => c.id === play.cardId));
      }
      if (!town.isComparisonTown) {
        const choices = allCards.filter(c => c.type === hazard.id && c.cost <= town.effortPoints);
        const card = choices[(i + round) % choices.length];
        if (card) {
          town = gameService.applyCardEffects(structuredClone(town), card);
          town.effortPoints -= card.cost;
          plays.push({
            id: `${sessionId}_play_${round}_${i + 1}`, sessionId,
            townId: town.id, cardId: card.id, playedAtRound: round,
            effectiveRounds: Array.from({length: card.duration || 1}, (_, n) => round + n),
            isActive: true, playedAt: timestamp(round),
            createdAt: timestamp(round), updatedAt: timestamp(round),
          });
        }
      }
      town = gameService.applyHazardEffects(structuredClone(town), hazard);
      town.currentStats = snapshot(town, round);
      town.updatedAt = timestamp(round);
      towns[i] = town;
    }
    const complete = scenario.complete || round < scenario.rounds;
    records.push(['round_events', `${sessionId}_${round}`, {
      sessionId, roundNumber: round, hazardIds: [hazard.id],
      eventHistory: [{type: 'hazard', hazardId: hazard.id, timestamp: timestamp(round)}],
      isComplete: complete, completedAt: complete ? timestamp(round) : null,
      createdAt: timestamp(round), updatedAt: timestamp(round),
    }]);
    records.push(['round_stats', `${sessionId}_${round}`, {
      sessionId, roundNumber: round,
      towns: Object.fromEntries(towns.map(t => [t.id, structuredClone(t.currentStats)])),
      createdAt: timestamp(round), updatedAt: timestamp(round),
    }]);
  }
  const currentRound = scenario.complete ? 6 : scenario.rounds;
  records.unshift(['game_sessions', sessionId, {
    userId: uid, name: scenario.name, currentRound,
    isActive: !scenario.complete, completedAt: scenario.complete ? timestamp(6) : null,
    createdAt: timestamp(), updatedAt: timestamp(currentRound),
  }]);
  for (const town of towns) {
    const {id, ...data} = town;
    // structuredClone strips the Firestore Timestamp prototype while simulating.
    records.push(['towns', id, {...data, currentRound, createdAt: timestamp(), updatedAt: timestamp(currentRound)}]);
  }
  for (const play of plays) {
    const {id, ...data} = play;
    records.push(['card_plays', id, {...data, isActive: !scenario.complete && Math.max(...data.effectiveRounds) > currentRound}]);
  }
  return {sessionId, records};
}

async function main() {
  if (process.env.DEMO_EMULATORS === '1') {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099');
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
  }
  let credential;
  try {
    credential = await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    if (!['auth/invalid-credential', 'auth/user-not-found'].includes(error.code)) throw error;
    credential = await createUserWithEmailAndPassword(auth, email, password);
  }
  const uid = credential.user.uid;
  console.log('Demo account authenticated.');
  const profileRef = doc(db, 'users', uid);
  if (!(await getDoc(profileRef)).exists()) {
    const batch = writeBatch(db);
    const now = Timestamp.now();
    batch.set(profileRef, {userId: uid, email, displayName: 'Demo Player', photoURL: '', createdAt: now, lastLogin: now});
    await batch.commit();
  }
  console.log('Demo profile ready.');
  const existing = await getDocs(query(collection(db, 'game_sessions'), where('userId', '==', uid)));
  const existingIds = new Set(existing.docs.map(d => d.id));
  const scenarios = [
    {key: 'starter', name: 'Demo: A New Beginning', rounds: 0, complete: false},
    {key: 'progress', name: 'Demo: Climate Adaptation in Progress', rounds: 2, complete: false},
    {key: 'complete', name: 'Demo: Five Years of Resilience', rounds: 5, complete: true},
  ];
  const counts = {};
  for (const [index, scenario] of scenarios.entries()) {
    const {sessionId, records} = generateSession(uid, scenario, index);
    const present = new Map();
    if (existingIds.has(sessionId)) {
      present.set('game_sessions', new Set([sessionId]));
      for (const name of ['towns', 'round_events', 'round_stats', 'card_plays']) {
        const docs = await getDocs(query(collection(db, name), where('sessionId', '==', sessionId)));
        present.set(name, new Set(docs.docs.map(d => d.id)));
      }
    }
    const missing = records.filter(([name, id]) => !present.get(name)?.has(id));
    console.log(`Writing ${scenario.name} (${missing.length} missing documents)...`);
    // Write one document per batch to stay within rule expression/access limits.
    // Existing records are never overwritten, so interrupted runs can resume.
    const batchSize = 1;
    for (let offset = 0; offset < missing.length; offset += batchSize) {
      const batch = writeBatch(db);
      const items = missing.slice(offset, offset + batchSize);
      for (const [name, id, data] of items) {
        batch.set(doc(db, name, id), data);
        counts[name] = (counts[name] || 0) + 1;
      }
      try { await batch.commit(); }
      catch (error) {
        console.error('Rejected collections:', items.map(([name]) => name).join(', '));
        throw error;
      }
    }
    console.log(`Ready: ${scenario.name}`);
  }
  // Read every collection back using the same queries as the app.
  const totals = {game_sessions: (await getDocs(query(collection(db, 'game_sessions'), where('userId', '==', uid)))).size};
  for (const name of ['towns', 'round_events', 'round_stats', 'card_plays']) {
    totals[name] = 0;
    for (const scenario of scenarios) {
      totals[name] += (await getDocs(query(collection(db, name), where('sessionId', '==', `demo-${uid}-${scenario.key}`)))).size;
    }
  }
  console.log(JSON.stringify({email, added: counts, verified: totals}, null, 2));
  const active = await gameService.getUserActiveSessions(uid);
  const completed = await gameService.getUserCompletedSessions(uid);
  const cardHistory = await gameService.getTownCardPlays(`demo-${uid}-progress_town_1`);
  if (active.length < 2 || completed.length < 1 || Object.keys(cardHistory).length === 0) {
    throw new Error('Demo game queries returned incomplete data.');
  }
  console.log('Dashboard and card-history queries verified.');
}

main().catch(error => {console.error(error.code || error.message); process.exitCode = 1;})
  .finally(async () => {await terminate(db); await deleteApp(auth.app);});
