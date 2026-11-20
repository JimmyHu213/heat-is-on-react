import { test } from "node:test";
import assert from "node:assert/strict";
import { getStage, canChangeStage, assertCanPlayCard, assertCanApplyHazard } from "./stages.js";

test("getStage reports complete, setup, stored and inferred stages", () => {
  assert.equal(getStage({ isActive: false, currentRound: 6 }, 0), "complete");
  assert.equal(getStage({ isActive: true, currentRound: 0 }, 0), "setup");
  assert.equal(getStage({ isActive: true, currentRound: 2 }, 1), "review");
  assert.equal(getStage({ isActive: true, currentRound: 2 }, 0), "adaptation");
  assert.equal(getStage({ isActive: true, currentRound: 2, stage: "hazard" }, 1), "hazard");
});

test("canChangeStage allows only the legal transitions", () => {
  assert.equal(canChangeStage("adaptation", "hazard"), true);
  assert.equal(canChangeStage("hazard", "review", 0), true);
  assert.equal(canChangeStage("review", "hazard", 5), true);
  assert.equal(canChangeStage("hazard", "adaptation", 1), true);
  assert.equal(canChangeStage("adaptation", "review"), false);
  assert.equal(canChangeStage("complete", "review"), false);
});

test("cards can only be played in the adaptation stage", () => {
  assert.doesNotThrow(() => assertCanPlayCard("adaptation"));
  assert.throws(() => assertCanPlayCard("hazard"), { code: "wrong-stage" });
});

test("events are available throughout a live round and share one five-hazard limit", () => {
  for (const stage of ["adaptation", "hazard", "review"]) {
    assert.doesNotThrow(() => assertCanApplyHazard(stage, 4));
    assert.throws(() => assertCanApplyHazard(stage, 5), { code: "hazard-limit" });
  }
  for (const stage of ["setup", "complete"]) {
    assert.throws(() => assertCanApplyHazard(stage, 0), { code: "wrong-stage" });
  }
});
