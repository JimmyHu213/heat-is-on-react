import { GameRuleError } from "./errors.js";

export const DEFAULT_ROUNDS = 5;
export const MAX_ROUNDS = 20;
export const MAX_PLAYERS = 200;
export const MAX_MANUAL_BUDGET = 999;

const isIntegerBetween = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;

export function validateGameOptions({
  totalRounds = DEFAULT_ROUNDS,
  digitalWheelEnabled = true,
  playerCount = null,
} = {}) {
  if (!isIntegerBetween(totalRounds, 1, MAX_ROUNDS)) throw new GameRuleError("invalid-rounds");
  if (playerCount !== null && !isIntegerBetween(playerCount, 1, MAX_PLAYERS)) {
    throw new GameRuleError("invalid-player-count");
  }
  return { totalRounds, digitalWheelEnabled, playerCount };
}

// Games created before configurable length have no totalRounds and are 5 rounds.
export function getTotalRounds(session) {
  return session.totalRounds ?? DEFAULT_ROUNDS;
}

export function getPlayerCount(session) {
  return session.playerCount ?? null;
}

export function validateBudget(value) {
  if (!isIntegerBetween(value, 0, MAX_MANUAL_BUDGET)) throw new GameRuleError("invalid-budget");
  return value;
}
