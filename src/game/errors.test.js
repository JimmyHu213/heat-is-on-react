import assert from "node:assert/strict";
import test from "node:test";
import { GameRuleError, formatGameRuleError } from "./errors.js";

test("formatGameRuleError maps known GameRuleError codes to human-readable messages", () => {
  assert.equal(
    formatGameRuleError(new GameRuleError("stale-revision"), "Fallback"),
    "This game changed elsewhere. Refresh to continue."
  );
  assert.equal(
    formatGameRuleError(new GameRuleError("nothing-to-undo"), "Fallback"),
    "There is no move to undo in this round."
  );
  assert.equal(
    formatGameRuleError(new GameRuleError("wrong-stage"), "Fallback"),
    "This action cannot be performed in the current stage."
  );
  assert.equal(
    formatGameRuleError(new GameRuleError("comparison-town"), "Fallback"),
    "Bludgeton is the comparison town and cannot play adaptation cards."
  );
});

test("formatGameRuleError uses custom message when distinct from code, otherwise fallback", () => {
  assert.equal(
    formatGameRuleError(
      new GameRuleError("custom-code", "Custom human message"),
      "Fallback"
    ),
    "Custom human message"
  );
  assert.equal(
    formatGameRuleError(new GameRuleError("unknown-code"), "Fallback"),
    "Fallback"
  );
  assert.equal(formatGameRuleError(new Error("boom"), "Fallback"), "Fallback");
});
