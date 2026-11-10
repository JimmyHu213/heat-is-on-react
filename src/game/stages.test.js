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
  assert.equal(canChangeStage("adaptation", "hazard", 0), true);
  assert.equal(canChangeStage("hazard", "review", 1), true);
  assert.equal(canChangeStage("review", "hazard", 4), true);
  assert.equal(canChangeStage("hazard", "adaptation", 0), true);

  assert.equal(canChangeStage("hazard", "review", 0), false);
  assert.equal(canChangeStage("review", "hazard", 5), false);
  assert.equal(canChangeStage("hazard", "adaptation", 1), false);
  assert.equal(canChangeStage("adaptation", "review", 0), false);
});

test("cards can only be played in the adaptation stage", () => {
  assert.doesNotThrow(() => assertCanPlayCard("adaptation"));
  assert.throws(() => assertCanPlayCard("hazard"), { code: "wrong-stage" });
});

test("hazards can only be applied in the hazard stage, up to five per round", () => {
  assert.doesNotThrow(() => assertCanApplyHazard("hazard", 4));
  assert.throws(() => assertCanApplyHazard("review", 0), { code: "wrong-stage" });
  assert.throws(() => assertCanApplyHazard("hazard", 5), { code: "hazard-limit" });
});
