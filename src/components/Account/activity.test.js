import { test } from "node:test";
import assert from "node:assert/strict";
import { summarizeHosting } from "./activity.js";

test("sums recorded attendance in finished games and reports missing counts", () => {
  const result = summarizeHosting(
    [{ playerCount: 60 }],
    [{ playerCount: 15 }, { playerCount: 7, endedEarly: true }, {}],
  );
  assert.deepEqual(result, { total: 4, active: 1, finished: 3, attendances: 22, missing: 1 });
});

test("does not report zero attendance when there are no recorded counts", () => {
  assert.equal(summarizeHosting([], [{}]).attendances, null);
  assert.equal(summarizeHosting([], []).attendances, null);
});
