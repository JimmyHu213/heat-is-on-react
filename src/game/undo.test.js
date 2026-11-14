import assert from "node:assert/strict";
import test from "node:test";
import { town1, town2 } from "../constants/towns.js";
import { buildCardUndo, buildHazardUndo, pickTownState, planUndo } from "./undo.js";

function makeTown(id, name, baseStats, effortPoints = 100) {
  return structuredClone({
    id,
    name,
    sessionId: "s1",
    townNumber: 1,
    isComparisonTown: false,
    currentRound: 1,
    effortPoints,
    ...baseStats,
  });
}

test("pickTownState deep-clones hazard scores and effortPoints without mutating input", () => {
  const town = makeTown("t1", "Alpha", town1.baseStats, 85);
  const copy = structuredClone(town);
  const picked = pickTownState(town);

  assert.deepEqual(town, copy);
  assert.equal(picked.id, "t1");
  assert.equal(picked.effortPoints, 85);
  assert.deepEqual(picked.bushfire, town.bushfire);

  picked.bushfire.nature = 999;
  assert.equal(town.bushfire.nature, 40);
});

test("buildCardUndo and planUndo restore town scores and effortPoints while preserving renamed town name", () => {
  const before = makeTown("t1", "Alpha", town1.baseStats, 100);
  const beforeCopy = structuredClone(before);
  const lastUndo = buildCardUndo({ round: 1, townBefore: before, cardPlayId: "play-1" });

  const afterPlayAndRename = {
    ...makeTown("t1", "Alpha Renamed", town1.baseStats, 85),
    bushfire: { nature: 60, economy: 50, society: 50, health: 50 },
  };
  const otherTown = makeTown("t2", "Beta", town2.baseStats, 100);
  const currentTowns = [afterPlayAndRename, otherTown];
  const currentCopy = structuredClone(currentTowns);

  const session = { isActive: true, currentRound: 1, lastUndo };
  const sessionCopy = structuredClone(session);

  const planned = planUndo({ session, currentTowns });

  assert.equal(planned.kind, "card");
  assert.equal(planned.round, 1);
  assert.equal(planned.deleteCardPlayId, "play-1");
  assert.equal(planned.roundEventPatch, null);
  assert.equal(planned.towns[0].effortPoints, 100);
  assert.equal(planned.towns[0].name, "Alpha Renamed");
  assert.deepEqual(planned.towns[0].bushfire, before.bushfire);
  assert.deepEqual(planned.towns[1], otherTown);

  assert.deepEqual(before, beforeCopy);
  assert.deepEqual(currentTowns, currentCopy);
  assert.deepEqual(session, sessionCopy);
});

test("buildHazardUndo for first hazard in round restores all towns and clears round event", () => {
  const t1 = makeTown("t1", "Alpha", town1.baseStats, 100);
  const t2 = makeTown("t2", "Beta", town2.baseStats, 100);
  const lastUndo = buildHazardUndo({
    round: 2,
    townsBefore: [t1, t2],
    roundEventBefore: null,
  });

  const damagedT1 = {
    ...t1,
    bushfire: { nature: 10, economy: 30, society: 20, health: 20 },
  };
  const damagedT2 = {
    ...t2,
    bushfire: { nature: 30, economy: 50, society: 40, health: 40 },
  };

  const planned = planUndo({
    session: { isActive: true, currentRound: 2, lastUndo },
    currentTowns: [damagedT1, damagedT2],
  });

  assert.equal(planned.kind, "hazard");
  assert.equal(planned.round, 2);
  assert.equal(planned.deleteCardPlayId, null);
  assert.deepEqual(planned.roundEventPatch, {
    existed: false,
    hazardIds: [],
    eventHistory: [],
    impactPoints: {},
    impactComplete: true,
  });
  assert.deepEqual(planned.towns[0].bushfire, t1.bushfire);
  assert.deepEqual(planned.towns[1].bushfire, t2.bushfire);
});

test("buildHazardUndo for second hazard restores previous round event hazardIds and impactPoints", () => {
  const t1 = makeTown("t1", "Alpha", town1.baseStats, 100);
  const roundEventBefore = {
    hazardIds: ["bushfire"],
    eventHistory: [{ type: "hazard", hazardId: "bushfire" }],
    impactPoints: { t1: 40 },
    impactComplete: true,
  };
  const eventCopy = structuredClone(roundEventBefore);

  const lastUndo = buildHazardUndo({
    round: 1,
    townsBefore: [t1],
    roundEventBefore,
  });

  const planned = planUndo({
    session: { isActive: true, currentRound: 1, lastUndo },
    currentTowns: [{ ...t1, flood: { nature: 10, economy: 10, society: 10, health: 10 } }],
  });

  assert.deepEqual(planned.roundEventPatch, {
    existed: true,
    hazardIds: ["bushfire"],
    eventHistory: [{ type: "hazard", hazardId: "bushfire" }],
    impactPoints: { t1: 40 },
    impactComplete: true,
  });
  assert.deepEqual(roundEventBefore, eventCopy);
});

test("planUndo rejects completed games and missing or stale-round undo snapshots", () => {
  const t1 = makeTown("t1", "Alpha", town1.baseStats, 100);
  const validUndo = buildCardUndo({ round: 1, townBefore: t1, cardPlayId: "p1" });

  assert.throws(
    () => planUndo({ session: { isActive: false, currentRound: 1, lastUndo: validUndo }, currentTowns: [t1] }),
    { name: "GameRuleError", code: "game-complete" }
  );

  assert.throws(
    () => planUndo({ session: { isActive: true, currentRound: 1, lastUndo: null }, currentTowns: [t1] }),
    { name: "GameRuleError", code: "nothing-to-undo" }
  );

  assert.throws(
    () => planUndo({ session: { isActive: true, currentRound: 2, lastUndo: validUndo }, currentTowns: [t1] }),
    { name: "GameRuleError", code: "nothing-to-undo" }
  );
});
