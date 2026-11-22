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

test("the scoring sheet charges only the struck sector even when another sector is weak", () => {
  const town = makeTown();
  for (const type of ["bushfire", "flood", "stormSurge", "heatwave", "biohazard"]) {
    town[type] = { nature: 50, economy: 50, society: 50, health: 50 };
  }
  town.bushfire.nature = 20;
  const after = applyHazard(town, flood);
  assert.deepEqual(after.flood, { nature: 30, economy: 20, society: 35, health: 35 });
  for (const type of ["bushfire", "stormSurge", "heatwave", "biohazard"]) {
    assert.deepEqual(after[type], town[type]);
  }
  const repeated = applyHazard(after, flood);
  assert.deepEqual(repeated.flood, { nature: 10, economy: 0, society: 20, health: 20 });
  assert.deepEqual(repeated.heatwave, town.heatwave);
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
