import { GameRuleError } from "./errors.js";

export const STAGES = ["adaptation", "hazard", "review"];
export const MAX_HAZARDS_PER_ROUND = 5;

// Round 0 is shown as "setup" but never stored. Games created before stages
// existed have no `stage`: a round with a hazard already applied resumes at review.
export function getStage(session, hazardCountThisRound) {
  if (!session.isActive) return "complete";
  if (session.currentRound === 0) return "setup";
  if (session.stage) return session.stage;
  return hazardCountThisRound > 0 ? "review" : "adaptation";
}

export function canChangeStage(from, to, hazardCountThisRound) {
  if (from === "adaptation" && to === "hazard") return true;
  if (from === "hazard" && to === "review") return hazardCountThisRound >= 1;
  if (from === "review" && to === "hazard") return hazardCountThisRound < MAX_HAZARDS_PER_ROUND;
  // No buying cards once a hazard has hit this round.
  if (from === "hazard" && to === "adaptation") return hazardCountThisRound === 0;
  return false;
}

export function assertCanPlayCard(stage) {
  if (stage !== "adaptation") throw new GameRuleError("wrong-stage");
}

export function assertCanApplyHazard(stage, hazardCountThisRound) {
  if (stage !== "hazard") throw new GameRuleError("wrong-stage");
  if (hazardCountThisRound >= MAX_HAZARDS_PER_ROUND) throw new GameRuleError("hazard-limit");
}
