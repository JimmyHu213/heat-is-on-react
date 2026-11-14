import { test } from "node:test";
import assert from "node:assert/strict";
import { buildGameSummary } from "./summary.js";

const HAZARDS = ["bushfire", "flood", "stormSurge", "heatwave", "biohazard"];
const uniform = (score) => ({ nature: score, economy: score, society: score, health: score });
const makeTown = (id, score, extra = {}) => ({
  id,
  name: id,
  isComparisonTown: false,
  effortPoints: 50,
  ...Object.fromEntries(HAZARDS.map((h) => [h, uniform(score)])),
  ...extra,
});

const towns = [
  makeTown("a", 60),
  makeTown("b", 60),
  makeTown("cmp", 90, { isComparisonTown: true }),
];
const session = { name: "Workshop", isActive: false, currentRound: 3, totalRounds: 4, endedEarly: true };

test("most resilient lists every tie and never the comparison town", () => {
  const summary = buildGameSummary({ session, towns, events: [], roundStats: [] });
  assert.deepEqual(summary.mostResilient.sort(), ["a", "b"]);
  assert.equal(summary.towns.find((t) => t.id === "cmp").isComparisonTown, true);
});

test("most impacted uses stored event losses and excludes the comparison town", () => {
  const events = [
    { roundNumber: 1, hazardIds: ["flood"], impactPoints: { a: 20, b: 10, cmp: 50 } },
    { roundNumber: 2, hazardIds: ["bushfire"], impactPoints: { a: 10, b: 0, cmp: 40 } },
  ];
  const summary = buildGameSummary({ session, towns, events, roundStats: [] });
  assert.equal(summary.hasCompleteImpacts, true);
  assert.deepEqual(summary.mostImpacted, ["a"]);
  assert.equal(summary.towns.find((t) => t.id === "a").eventLoss, 30);
});

test("most impacted is empty when a played round has no stored losses", () => {
  const events = [
    { roundNumber: 1, hazardIds: ["flood"], impactPoints: { a: 20, b: 10, cmp: 50 } },
    { roundNumber: 2, hazardIds: ["bushfire"] },
  ];
  const summary = buildGameSummary({ session, towns, events, roundStats: [] });
  assert.equal(summary.hasCompleteImpacts, false);
  assert.deepEqual(summary.mostImpacted, []);
});

test("most impacted is empty when a played round's losses are only partly recorded", () => {
  // e.g. a round where one hazard was applied before losses were stored, and one after.
  const events = [
    { roundNumber: 1, hazardIds: ["flood", "heatwave"], impactPoints: { a: 5, b: 20, cmp: 0 }, impactComplete: false },
  ];
  const summary = buildGameSummary({ session, towns, events, roundStats: [] });
  assert.equal(summary.hasCompleteImpacts, false);
  assert.deepEqual(summary.mostImpacted, []);
});

test("events and dividends after the rounds played are ignored", () => {
  const events = [{ roundNumber: 3, hazardIds: ["flood"], impactPoints: { a: 99, b: 0, cmp: 0 } }];
  const roundStats = [
    { roundNumber: 1, dividends: { a: 10, b: 0, cmp: 5 } },
    { roundNumber: 2, dividends: { a: 15, b: 5, cmp: 5 } },
    { roundNumber: 3, dividends: { a: 100, b: 100, cmp: 100 } },
  ];
  const summary = buildGameSummary({ session, towns, events, roundStats });
  assert.equal(summary.roundsPlayed, 2);
  assert.equal(summary.towns.find((t) => t.id === "a").eventLoss, 0);
  assert.equal(summary.towns.find((t) => t.id === "a").dividends, 25);
});

test("rows report resilience, dimension averages and weak segments", () => {
  const weak = makeTown("w", 60, { bushfire: uniform(20), flood: { ...uniform(60), nature: 10 } });
  const summary = buildGameSummary({ session, towns: [weak], events: [], roundStats: [] });
  const row = summary.towns[0];
  assert.equal(row.weakSegments, 5);
  assert.equal(row.resilience, (20 * 4 + 10 + 60 * 3 + 60 * 12) / 20);
  assert.equal(row.nesh.economy, (20 + 60 * 4) / 5);
  assert.equal(row.effortPoints, 50);
});

test("legacy sessions report 5 rounds and are not marked as ended early", () => {
  const summary = buildGameSummary({
    session: { name: "Old", isActive: false, currentRound: 6 },
    towns,
    events: [],
    roundStats: [],
  });
  assert.equal(summary.totalRounds, 5);
  assert.equal(summary.roundsPlayed, 5);
  assert.equal(summary.endedEarly, false);
});
