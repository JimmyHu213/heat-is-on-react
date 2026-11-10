import { test } from "node:test";
import assert from "node:assert/strict";
import { town1 } from "../constants/towns.js";
import { allCards, bushfire1, bushfire3 } from "../constants/cards.js";
import { calculateDividend, planStartGame, planSettlement } from "./settlement.js";

const all100 = { nature: 100, economy: 100, society: 100, health: 100 };

const makeTown = (overrides = {}) => ({
  id: "t",
  effortPoints: 40,
  currentRound: 2,
  ...structuredClone(town1.baseStats),
  ...overrides,
});

const plays = () => [
  { id: "p1", townId: "t", cardId: bushfire1.id, effectiveRounds: [2, 3], isActive: true },
  { id: "p2", townId: "t", cardId: bushfire3.id, effectiveRounds: [2, 3, 4], isActive: true },
  { id: "p3", townId: "t", cardId: bushfire1.id, effectiveRounds: [1, 2], isActive: true },
];

const settle = (overrides = {}) =>
  planSettlement({
    session: { isActive: true, currentRound: 2, totalRounds: 5 },
    towns: [makeTown({ flood: { ...all100 } })],
    activePlays: plays(),
    cards: allCards,
    expectedRound: 2,
    stage: "review",
    ...overrides,
  });

test("calculateDividend pays 5 EP per segment at exactly 100", () => {
  const perfect = makeTown(
    Object.fromEntries(["bushfire", "flood", "stormSurge", "heatwave", "biohazard"].map((h) => [h, { ...all100 }]))
  );
  assert.deepEqual(calculateDividend(perfect), { segments: 20, amount: 100 });
  assert.deepEqual(calculateDividend(makeTown()), { segments: 0, amount: 0 });
  const partial = makeTown({ flood: { ...all100 }, bushfire: { nature: 100, economy: 40, society: 40, health: 40 } });
  assert.deepEqual(calculateDividend(partial), { segments: 5, amount: 25 });
});

test("planStartGame moves a new game to round 1 adaptation", () => {
  assert.deepEqual(planStartGame({ currentRound: 0 }), { nextRound: 1, stage: "adaptation" });
  assert.throws(() => planStartGame({ currentRound: 1 }), { code: "already-started" });
});

test("settling a round pays dividends, applies next-round cards and deactivates finished plays", () => {
  const towns = [makeTown({ flood: { ...all100 } })];
  const activePlays = plays();
  const before = structuredClone({ towns, activePlays });
  const plan = settle({ towns, activePlays });

  assert.equal(plan.round, 2);
  assert.equal(plan.nextRound, 3);
  assert.equal(plan.isComplete, false);
  assert.equal(plan.endedEarly, false);
  assert.equal(plan.nextStage, "adaptation");
  assert.equal(plan.dividends.t, 20);
  assert.equal(plan.snapshots.t.round, 2);
  assert.deepEqual(plan.snapshots.t.bushfire, { nature: 40, economy: 40, society: 40, health: 40 });

  const town = plan.towns[0];
  assert.equal(town.effortPoints, 60);
  assert.equal(town.currentRound, 3);
  // p1 (+20/+10/+10/+10) and p2 (+10/+20/+20/+20) apply for round 3; p3 has ended.
  assert.deepEqual(town.bushfire, { nature: 70, economy: 70, society: 70, health: 70 });
  assert.deepEqual([...plan.deactivatePlayIds].sort(), ["p1", "p3"]);

  assert.deepEqual({ towns, activePlays }, before, "inputs must not be mutated");
});

test("dividends use closing scores, before next-round card effects", () => {
  // bushfire nature 80 + LANDSCAPING (+20) next round would reach 100, but must not count now.
  const plan = settle({
    towns: [makeTown({ bushfire: { nature: 80, economy: 40, society: 40, health: 40 } })],
    activePlays: [{ id: "p1", townId: "t", cardId: bushfire1.id, effectiveRounds: [2, 3], isActive: true }],
  });
  assert.equal(plan.dividends.t, 0);
  assert.equal(plan.towns[0].bushfire.nature, 100);
});

test("settling the last round completes the game without applying cards", () => {
  const plan = settle({
    session: { isActive: true, currentRound: 5, totalRounds: 5 },
    expectedRound: 5,
  });
  assert.equal(plan.isComplete, true);
  assert.equal(plan.nextRound, 6);
  assert.equal(plan.endedEarly, false);
  assert.equal(plan.nextStage, "complete");
  assert.deepEqual(plan.towns[0].bushfire, { nature: 40, economy: 40, society: 40, health: 40 });
  assert.deepEqual([...plan.deactivatePlayIds].sort(), ["p1", "p2", "p3"]);
});

test("ending early settles the current round from any stage", () => {
  const plan = settle({ stage: "adaptation", endEarly: true });
  assert.equal(plan.isComplete, true);
  assert.equal(plan.endedEarly, true);
  assert.equal(plan.dividends.t, 20);
});

test("legacy sessions without totalRounds complete after round 5", () => {
  const plan = settle({ session: { isActive: true, currentRound: 5 }, expectedRound: 5 });
  assert.equal(plan.isComplete, true);
});

test("settlement rejects stale, finished, unstarted and wrong-stage requests", () => {
  assert.throws(() => settle({ expectedRound: 1 }), { code: "stale-round" });
  assert.throws(() => settle({ session: { isActive: false, currentRound: 6 } }), { code: "game-complete" });
  assert.throws(() => settle({ session: { isActive: true, currentRound: 0 }, expectedRound: 0 }), {
    code: "not-started",
  });
  assert.throws(() => settle({ stage: "hazard" }), { code: "wrong-stage" });
});
