import { test } from "node:test";
import assert from "node:assert/strict";
import { town1 } from "../constants/towns.js";
import { bushfire1, bushfire3, allNature } from "../constants/cards.js";
import { applyCardEffects, cardEffectiveRounds, playCard, revertCardEffects } from "./cards.js";

const makeTown = (overrides = {}) => ({
  id: "t1",
  effortPoints: 100,
  isComparisonTown: false,
  ...structuredClone(town1.baseStats),
  ...overrides,
});

test("a hazard-type card adds its values to that hazard type only", () => {
  const town = makeTown();
  const before = structuredClone(town);
  const result = applyCardEffects(town, bushfire1);
  assert.deepEqual(result.bushfire, { nature: 60, economy: 50, society: 50, health: 50 });
  assert.deepEqual(result.flood, before.flood);
  assert.deepEqual(town, before, "input town must not be mutated");
});

test("an aspect card adds to that aspect in every hazard type", () => {
  const result = applyCardEffects(makeTown(), allNature);
  assert.deepEqual(
    ["bushfire", "flood", "stormSurge", "heatwave", "biohazard"].map((h) => result[h].nature),
    [55, 95, 95, 75, 95]
  );
  assert.equal(result.flood.economy, 80);
});

test("card effects are clamped at 100", () => {
  const town = makeTown({ flood: { nature: 95, economy: 80, society: 80, health: 80 } });
  assert.equal(applyCardEffects(town, allNature).flood.nature, 100);
});

test("cardEffectiveRounds covers the play round and following rounds", () => {
  assert.deepEqual(cardEffectiveRounds(2, 3), [2, 3, 4]);
  assert.deepEqual(cardEffectiveRounds(4, undefined), [4]);
});

test("playCard deducts the cost, applies effects and records the play", () => {
  const town = makeTown();
  const before = structuredClone(town);
  const { town: updated, play } = playCard(town, bushfire3, 2);
  assert.equal(updated.effortPoints, 85);
  assert.deepEqual(updated.bushfire, { nature: 50, economy: 60, society: 60, health: 60 });
  assert.deepEqual(play, {
    cardId: "bushfire3",
    townId: "t1",
    playedAtRound: 2,
    effectiveRounds: [2, 3, 4],
  });
  assert.deepEqual(town, before, "input town must not be mutated");
});

test("the comparison town cannot play cards", () => {
  assert.throws(() => playCard(makeTown({ isComparisonTown: true }), bushfire1, 1), {
    code: "comparison-town",
  });
});

test("a town without enough effort points cannot play a card", () => {
  assert.throws(() => playCard(makeTown({ effortPoints: 10 }), bushfire1, 1), {
    code: "insufficient-effort-points",
  });
});

test("revertCardEffects subtracts hazard-type effects and refunds cost without mutating input", () => {
  const town = makeTown({ effortPoints: 80 });
  const applied = applyCardEffects(town, bushfire1);
  const before = structuredClone(applied);
  const reverted = revertCardEffects(applied, bushfire1);
  assert.deepEqual(reverted.bushfire, town.bushfire);
  assert.equal(reverted.effortPoints, 80 + bushfire1.cost);
  assert.deepEqual(applied, before);
});

test("revertCardEffects subtracts aspect-type effects across all hazards and clamps at 0", () => {
  const lowTown = makeTown({
    effortPoints: 10,
    bushfire: { nature: 5, economy: 50, society: 50, health: 50 },
  });
  const reverted = revertCardEffects(lowTown, allNature);
  assert.equal(reverted.bushfire.nature, 0);
  assert.equal(reverted.flood.nature, 65);
  assert.equal(reverted.effortPoints, 10 + allNature.cost);
});
