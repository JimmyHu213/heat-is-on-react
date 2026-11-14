import assert from "node:assert/strict";
import test from "node:test";
import {
  onGameCompleted,
  onGameCreated,
  registerGameLifecycleHooks,
} from "./gameLifecycle.js";

test("onGameCreated and onGameCompleted are safe no-ops by default and invoke registered hooks", async () => {
  registerGameLifecycleHooks({});
  await assert.doesNotReject(() => onGameCreated({ id: "s0" }));
  await assert.doesNotReject(() => onGameCompleted({ id: "s0" }));

  const createdCalls = [];
  const completedCalls = [];
  registerGameLifecycleHooks({
    onCreated: async (session) => createdCalls.push(session.id),
    onCompleted: async (session) => completedCalls.push(session.id),
  });

  await onGameCreated({ id: "s1" });
  await onGameCompleted({ id: "s1" });

  assert.deepEqual(createdCalls, ["s1"]);
  assert.deepEqual(completedCalls, ["s1"]);

  // Reset hooks
  registerGameLifecycleHooks({});
});
