import { test } from "node:test";
import assert from "node:assert/strict";
import { town1 } from "../constants/towns.js";
import { bushfire, flood } from "../constants/hazards.js";
import { applyHazard, buildHazardImpact } from "./hazards.js";

const makeTown = () => ({ id: "t1", ...structuredClone(town1.baseStats) });

test("a hazard reduces its own type when no aspect is vulnerable", () => {
  const town = makeTown();
  const before = structuredClone(town);
  const result = applyHazard(town, bushfire);
  assert.deepEqual(result.bushfire, { nature: 10, economy: 30, society: 20, health: 20 });
  for (const type of ["flood", "stormSurge", "heatwave", "biohazard"]) {
    assert.deepEqual(result[type], before[type]);
  }
  assert.deepEqual(town, before, "input town must not be mutated");
});

test("aspects at or below 20 are penalised in every hazard type before the hazard hits", () => {
  const afterFirst = applyHazard(makeTown(), bushfire);
  const snapshot = structuredClone(afterFirst);
  const result = applyHazard(afterFirst, bushfire);
  // nature (10), society (20) and health (20) are vulnerable; economy (30) is not.
  assert.deepEqual(result.bushfire, { nature: 0, economy: 20, society: 0, health: 0 });
  assert.deepEqual(result.flood, { nature: 70, economy: 80, society: 70, health: 70 });
  assert.deepEqual(result.stormSurge, { nature: 70, economy: 80, society: 70, health: 70 });
  assert.deepEqual(result.heatwave, { nature: 50, economy: 60, society: 50, health: 50 });
  assert.deepEqual(result.biohazard, { nature: 70, economy: 80, society: 70, health: 70 });
  assert.deepEqual(afterFirst, snapshot, "input town must not be mutated");
});

test("Town 1 facing bushfire then flood pays each vulnerable dimension penalty once per sector", () => {
  const first = applyHazard(makeTown(), bushfire);
  const second = applyHazard(first, flood);
  assert.deepEqual(second.bushfire, { nature: 0, economy: 30, society: 10, health: 10 });
  assert.deepEqual(second.flood, { nature: 50, economy: 50, society: 55, health: 55 });
  assert.deepEqual(second.heatwave, { nature: 50, economy: 60, society: 50, health: 50 });
});

test("buildHazardImpact reports losses per aspect and overall resilience", () => {
  const town = makeTown();
  const after = applyHazard(town, bushfire);
  assert.deepEqual(buildHazardImpact([town], [after]), [
    {
      townId: "t1",
      aspectLoss: { nature: 30, economy: 10, society: 20, health: 20 },
      loss: 80,
      before: 68,
      after: 64,
    },
  ]);
});
