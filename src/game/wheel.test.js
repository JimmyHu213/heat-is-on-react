import assert from "node:assert/strict";
import test from "node:test";
import { HAZARD_IDS } from "./scores.js";
import { WHEEL_SLICES, pickRandomIndex, spinHazardWheel } from "./wheel.js";

test("pickRandomIndex rejects biased top values and maps 0..count-1 uniformly", () => {
  // For count = 5, 2^32 = 4294967296; limit = 4294967295 (4294967295 % 5 === 0)
  // Value 4294967295 is >= limit so it must be rejected and the next draw used.
  const sequence = [4294967295, 3];
  let calls = 0;
  const rng = () => sequence[calls++];

  const idx = pickRandomIndex(5, rng);
  assert.equal(idx, 3);
  assert.equal(calls, 2);
});

test("pickRandomIndex throws RangeError on invalid count", () => {
  assert.throws(() => pickRandomIndex(0), RangeError);
  assert.throws(() => pickRandomIndex(-2), RangeError);
  assert.throws(() => pickRandomIndex(2.5), RangeError);
});

test("spinHazardWheel selects a hazard and computes target rotation degrees", () => {
  const result = spinHazardWheel(HAZARD_IDS, () => 2);
  assert.equal(result.index, 2);
  assert.equal(result.hazardId, "stormSurge");
  // Slice 2 (72 deg each): center at 2*72 + 36 = 180 deg; 5 full turns (1800) + (360 - 180) = 1980
  assert.equal(result.rotationDegrees, 1980);

  const fromObjects = spinHazardWheel(
    [{ id: "bushfire" }, { id: "flood" }, { id: "stormSurge" }, { id: "heatwave" }, { id: "biohazard" }],
    () => 0
  );
  assert.equal(fromObjects.index, 0);
  assert.equal(fromObjects.hazardId, "bushfire");
  assert.equal(fromObjects.rotationDegrees, 2124);
});

test("WHEEL_SLICES includes 5 hazards plus the mystery ? slice", () => {
  assert.equal(WHEEL_SLICES.length, 6);
  const mystery = WHEEL_SLICES.find((s) => s.id === "mystery");
  assert.deepEqual(mystery, { id: "mystery", name: "?", color: "#546E7A", isMystery: true });
  const result = spinHazardWheel(WHEEL_SLICES, () => 5);
  assert.equal(result.index, 5);
  assert.equal(result.hazardId, "mystery");
});
