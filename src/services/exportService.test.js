globalThis.process.env.VITE_USE_FIREBASE_EMULATOR = "true";

import assert from "node:assert/strict";
import test from "node:test";
const { default: exportService, normalizeSessionForExport } = await import("./exportService.js");

test("normalizeSessionForExport fills defaults for legacy sessions without optional fields", () => {
  const legacySession = {
    id: "leg-1",
    name: "Legacy Workshop",
    userId: "u1",
    currentRound: 2,
    isActive: true,
    createdAt: "2026-01-01T00:00:00Z",
    completedAt: null,
  };

  const normalized = normalizeSessionForExport(legacySession, [], []);
  assert.equal(normalized.session.totalRounds, 5);
  assert.equal(normalized.session.digitalWheelEnabled, true);
  assert.equal(normalized.session.playerCount, null);
  assert.equal(normalized.session.endedEarly, false);
  assert.equal(normalized.session.stage, "adaptation");
  assert.equal(normalized.roundsToExport, 2);
  assert.equal(normalized.roundEvents.length, 2);
});

test("normalizeSessionForExport exports exact played rounds for completed 2-round game with dividends and impacts", () => {
  const session = {
    id: "s-2",
    name: "Short Game",
    userId: "u1",
    currentRound: 3,
    totalRounds: 2,
    digitalWheelEnabled: false,
    playerCount: 24,
    endedEarly: false,
    stage: "complete",
    isActive: false,
    createdAt: "2026-01-01T00:00:00Z",
    completedAt: "2026-01-01T01:00:00Z",
  };
  const roundEvents = [
    {
      roundNumber: 1,
      hazardIds: ["bushfire"],
      impactPoints: { t1: 45 },
      impactComplete: true,
    },
    {
      roundNumber: 2,
      hazardIds: ["flood"],
      impactPoints: { t1: 60 },
      impactComplete: true,
    },
  ];
  const roundStats = [
    { roundNumber: 1, dividends: { t1: 15 } },
    { roundNumber: 2, dividends: { t1: 10 } },
  ];

  const normalized = normalizeSessionForExport(session, roundEvents, roundStats);
  assert.equal(normalized.session.totalRounds, 2);
  assert.equal(normalized.session.digitalWheelEnabled, false);
  assert.equal(normalized.session.playerCount, 24);
  assert.equal(normalized.roundsToExport, 2);
  assert.equal(normalized.roundEvents.length, 2);
  assert.deepEqual(normalized.roundEvents[0].impactPoints, { t1: 45 });
  assert.equal(normalized.roundEvents[0].impactComplete, true);
  assert.deepEqual(normalized.roundEvents[0].dividends, { t1: 15 });
  assert.deepEqual(normalized.roundEvents[1].dividends, { t1: 10 });
});

test("normalizeSessionForExport handles ended-early 10-round session at round 3", () => {
  const session = {
    id: "s-early",
    name: "Early Exit",
    userId: "u1",
    currentRound: 4,
    totalRounds: 10,
    isActive: false,
    endedEarly: true,
    stage: "complete",
  };

  const normalized = normalizeSessionForExport(session, [], []);
  assert.equal(normalized.session.totalRounds, 10);
  assert.equal(normalized.session.endedEarly, true);
  assert.equal(normalized.roundsToExport, 3);
  assert.equal(normalized.roundEvents.length, 3);
});

test("multi-year export records the paid EP once, including the old flat price", () => {
  const play = { cardId: "bushfire3", playedAtRound: 2, effectiveRounds: [2, 3, 4] };
  const costs = (record) => exportService.processCardPlays([record], { id: "t" })
    .cardPlaysArray.map((row) => row.cost);
  assert.deepEqual(costs({ ...play, costPaid: 30 }), [30, 0, 0]);
  assert.deepEqual(costs(play), [15, 0, 0]);
});
