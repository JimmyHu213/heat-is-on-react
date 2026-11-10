import { test } from "node:test";
import assert from "node:assert/strict";
import { town1 } from "../constants/towns.js";
import { GameRuleError } from "./errors.js";
import {
  clampScore,
  segmentTotal,
  overallResilience,
  neshAverages,
  countSegments,
} from "./scores.js";

const town = { id: "t1", ...structuredClone(town1.baseStats) };

test("clampScore keeps scores within 0-100", () => {
  assert.equal(clampScore(-5), 0);
  assert.equal(clampScore(105), 100);
  assert.equal(clampScore(55), 55);
});

test("segmentTotal sums all 20 segments", () => {
  assert.equal(segmentTotal(town), 1360);
});

test("overallResilience is the average segment score", () => {
  assert.equal(overallResilience(town), 68);
});

test("neshAverages averages each aspect over the five hazard types", () => {
  assert.deepEqual(neshAverages(town), {
    nature: 68,
    economy: 68,
    society: 68,
    health: 68,
  });
});

test("countSegments counts segments matching the predicate", () => {
  assert.equal(countSegments(town, (s) => s <= 40), 4);
});

test("GameRuleError carries a code and is an Error", () => {
  const error = new GameRuleError("x");
  assert.equal(error.code, "x");
  assert.ok(error instanceof Error);
  assert.equal(error.name, "GameRuleError");
});
