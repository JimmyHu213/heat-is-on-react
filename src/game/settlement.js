import { applyCardEffects } from "./cards.js";
import { GameRuleError } from "./errors.js";
import { getTotalRounds } from "./options.js";
import { ASPECTS, DIVIDEND_PER_SEGMENT, HAZARD_IDS, MAX_SCORE, countSegments } from "./scores.js";

export function calculateDividend(town) {
  const segments = countSegments(town, (score) => score === MAX_SCORE);
  return { segments, amount: segments * DIVIDEND_PER_SEGMENT };
}

export function planStartGame(session) {
  if (session.currentRound !== 0) throw new GameRuleError("already-started");
  return { nextRound: 1, stage: "adaptation" };
}

function snapshotScores(town, round) {
  const snapshot = { round };
  for (const hazard of HAZARD_IDS) {
    snapshot[hazard] = Object.fromEntries(ASPECTS.map((aspect) => [aspect, town[hazard][aspect]]));
  }
  return snapshot;
}

// Closes round r: snapshot closing scores, pay dividends from that snapshot,
// then either start round r + 1 (applying cards scheduled for it) or finish the game.
export function planSettlement({
  session, towns, activePlays, cards, expectedRound, stage,
  endEarly = false, step = "combined", settledStats,
}) {
  if (!session.isActive) throw new GameRuleError("game-complete");
  if (session.currentRound === 0) throw new GameRuleError("not-started");
  if (session.currentRound !== expectedRound) throw new GameRuleError("stale-round");
  if (stage !== "review" && !endEarly) throw new GameRuleError("wrong-stage");

  const round = session.currentRound;
  const advance = step !== "award";
  if (step === "advance" && !settledStats) throw new GameRuleError("wrong-stage");
  if (step !== "advance" && settledStats) throw new GameRuleError("already-settled");
  const nextRound = advance ? round + 1 : round;
  const totalRounds = getTotalRounds(session);
  const isComplete = advance && (endEarly || round >= totalRounds);

  const snapshots = {};
  const dividends = {};
  const plannedTowns = towns.map((town) => {
    snapshots[town.id] = settledStats?.towns[town.id] ?? snapshotScores(town, round);
    dividends[town.id] = settledStats?.dividends[town.id] ?? calculateDividend(town).amount;
    let updated = {
      ...town,
      effortPoints: town.effortPoints + (settledStats ? 0 : dividends[town.id]),
      currentRound: nextRound,
    };
    if (advance && !isComplete) {
      for (const play of activePlays) {
        if (play.townId !== town.id || !play.effectiveRounds.includes(nextRound)) continue;
        const card = cards.find((c) => c.id === play.cardId);
        if (card) updated = applyCardEffects(updated, card);
      }
    }
    return updated;
  });

  const deactivatePlayIds = activePlays
    .filter((play) => advance && (isComplete || Math.max(...play.effectiveRounds) <= nextRound))
    .map((play) => play.id);

  return {
    round,
    nextRound,
    isComplete,
    endedEarly: endEarly && round < totalRounds,
    nextStage: isComplete ? "complete" : advance ? "adaptation" : "review",
    snapshots,
    dividends,
    towns: plannedTowns,
    deactivatePlayIds,
  };
}
