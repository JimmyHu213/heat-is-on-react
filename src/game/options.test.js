import { test } from "node:test";
import assert from "node:assert/strict";
import { validateGameOptions, getTotalRounds, getPlayerCount, validateBudget } from "./options.js";

test("validateGameOptions applies defaults", () => {
  assert.deepEqual(validateGameOptions(), {
    totalRounds: 5,
    digitalWheelEnabled: true,
    playerCount: null,
  });
});

test("validateGameOptions accepts 1-20 rounds and rejects anything else", () => {
  assert.equal(validateGameOptions({ totalRounds: 1 }).totalRounds, 1);
  assert.equal(validateGameOptions({ totalRounds: 20 }).totalRounds, 20);
  for (const totalRounds of [0, 21, 2.5]) {
    assert.throws(() => validateGameOptions({ totalRounds }), { code: "invalid-rounds" });
  }
});

test("validateGameOptions accepts a blank or 1-200 player count", () => {
  assert.equal(validateGameOptions({ playerCount: null }).playerCount, null);
  assert.equal(validateGameOptions({ playerCount: 200 }).playerCount, 200);
  for (const playerCount of [0, 201, 3.5]) {
    assert.throws(() => validateGameOptions({ playerCount }), { code: "invalid-player-count" });
  }
});

test("validateGameOptions keeps an explicit wheel choice", () => {
  assert.equal(validateGameOptions({ digitalWheelEnabled: false }).digitalWheelEnabled, false);
});

test("legacy sessions default to 5 rounds and no player count", () => {
  assert.equal(getTotalRounds({}), 5);
  assert.equal(getTotalRounds({ totalRounds: 8 }), 8);
  assert.equal(getPlayerCount({}), null);
  assert.equal(getPlayerCount({ playerCount: 24 }), 24);
});

test("validateBudget accepts whole numbers 0-999", () => {
  assert.equal(validateBudget(0), 0);
  assert.equal(validateBudget(999), 999);
  for (const value of [-5, 1000, 12.5]) {
    assert.throws(() => validateBudget(value), { code: "invalid-budget" });
  }
});
