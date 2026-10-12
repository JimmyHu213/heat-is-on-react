import test from 'node:test';
import assert from 'node:assert/strict';
import { ASPECTS, HAZARD_IDS, calculateDividend, getTotalRounds, planRoundTransition, validateRoundCount } from '../src/utils/rounds.js';
import { buildGameSummary, neshAverages } from '../src/utils/gameSummary.js';

const town = (score, id = 'town') => ({ id, effortPoints: 100,
  ...Object.fromEntries(HAZARD_IDS.map(h => [h, Object.fromEntries(ASPECTS.map(a => [a, score]))])) });
const advance = (session, towns, plays = [], apply = t => t, expected = session.currentRound) =>
  planRoundTransition(session, towns, plays, [{ id: 'card' }], apply, expected);

test('each of the twenty segments at exactly 100 earns five EP, including the comparison town', () => {
  assert.deepEqual(calculateDividend(town(100)), { segments: 20, amount: 100 });
  const mixed = town(95); mixed.flood.health = 100; mixed.heatwave.nature = 100;
  assert.deepEqual(calculateDividend(mixed), { segments: 2, amount: 10 });
  assert.equal(calculateDividend({ ...town(100), isComparisonTown: true }).amount, 100);
});
test('round zero starts without dividends; the final played round is settled', () => {
  const start = advance({ currentRound: 0, totalRounds: 1, isActive: true }, [town(100)]);
  assert.equal(start.isComplete, false); assert.deepEqual(start.dividends, {});
  assert.equal(start.towns[0].effortPoints, 100);
  const end = advance({ currentRound: 1, totalRounds: 1, isActive: true }, [town(100)]);
  assert.equal(end.isComplete, true); assert.equal(end.towns[0].effortPoints, 200);
});
test('dividends and snapshots precede ongoing cards; next-round effects cannot earn closing dividends', () => {
  const original = town(95);
  const play = { id: 'play', townId: 'town', cardId: 'card', isActive: true, effectiveRounds: [1, 2] };
  const plan = advance({ currentRound: 1, totalRounds: 3, isActive: true }, [original], [play], t => ({ ...t, flood: { ...t.flood, health: 100 } }));
  assert.equal(plan.dividends.town, 0); assert.equal(plan.snapshots.town.flood.health, 95);
  assert.equal(plan.towns[0].flood.health, 100); assert.equal(original.flood.health, 95);
  assert.deepEqual(plan.deactivate, ['play']);
});
test('completed games and stale/double round submissions cannot pay again', () => {
  assert.throws(() => advance({ currentRound: 2, isActive: false }, [town(100)]), /finished/);
  assert.throws(() => advance({ currentRound: 2, isActive: true }, [town(100)], [], undefined, 1), /already changed/);
});
test('legacy games use five rounds; configured games stop at their selected length', () => {
  assert.equal(getTotalRounds({}), 5);
  for (const totalRounds of [1, 5, 8, 20]) {
    assert.equal(advance({ currentRound: totalRounds, totalRounds, isActive: true }, [town(100)]).isComplete, true);
  }
  assert.equal(advance({ currentRound: 5, totalRounds: 8, isActive: true }, [town(100)]).isComplete, false);
  for (const value of [0, 21, 1.5, NaN, '5']) assert.throws(() => validateRoundCount(value));
});
test('early ending pays closing dividends, preserves planned length, and skips ongoing effects', () => {
  const session = { currentRound: 2, totalRounds: 8, isActive: true };
  const play = { id: 'ongoing', townId: 'town', cardId: 'card', isActive: true, effectiveRounds: [2, 3] };
  const plan = planRoundTransition(session, [town(100)], [play], [], () => { throw new Error('must not apply'); }, 2, true);
  assert.equal(plan.isComplete, true); assert.equal(plan.endedEarly, true);
  assert.equal(plan.nextRound, 3); assert.equal(plan.towns[0].effortPoints, 200);
  assert.deepEqual(plan.deactivate, ['ongoing']); assert.equal(session.totalRounds, 8);
  assert.throws(() => planRoundTransition({ ...session, currentRound: 0 }, [], [], [], () => {}, 0, true), /Start a round/);
});
test('summary uses measured event losses, includes comparison town and preserves tied highlights', () => {
  const towns = [
    { ...town(80, 'a'), name: 'Town A' },
    { ...town(80, 'b'), name: 'Bludgeton', isComparisonTown: true },
    { ...town(40, 'c'), name: 'Town C' },
  ];
  const report = buildGameSummary({ name: 'Early', isActive: false, currentRound: 3, totalRounds: 8, endedEarly: true, towns },
    [{ roundNumber: 1, hazardIds: ['flood'], impactPoints: { a: 100, b: 120, c: 20 } },
      { roundNumber: 2, hazardIds: ['bushfire', 'heatwave'], impactPoints: { a: 70, b: 20, c: 10 } },
      { roundNumber: 3, hazardIds: ['stormSurge'], impactPoints: { a: 999, b: 999, c: 999 } }],
    [{ roundNumber: 1, dividends: { a: 5, b: 10, c: 0 } }, { roundNumber: 2, dividends: { a: 15, b: 0, c: 0 } }]);
  assert.equal(report.roundsPlayed, 2); assert.equal(report.eventCount, 3);
  assert.deepEqual(report.mostResilient.map(t => t.name), ['Town A', 'Bludgeton']);
  assert.equal(report.mostImpacted[0].name, 'Town A'); assert.equal(report.mostImpacted[0].eventLoss, 170);
  assert.equal(report.towns[0].dividends, 20);
  assert.deepEqual(neshAverages(towns[2]), { nature: 40, economy: 40, society: 40, health: 40 });
});
test('legacy events without measurements are not assigned invented impact rankings', () => {
  const report = buildGameSummary({ currentRound: 2, isActive: false, towns: [{ ...town(50), name: 'Town' }] },
    [{ roundNumber: 1, hazardIds: ['flood'] }], []);
  assert.equal(report.hasCompleteImpacts, false); assert.deepEqual(report.mostImpacted, []);
  assert.equal(report.hasDividends, false); assert.equal(report.towns[0].resilience, 50);
});
