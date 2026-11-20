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

export function canChangeStage(from, to) {
  if (from === "hazard") return to === "adaptation" || to === "review";
  return (from === "adaptation" || from === "review") && to === "hazard";
}

export function assertCanPlayCard(stage) {
  if (stage !== "adaptation") throw new GameRuleError("wrong-stage");
}

export function assertCanApplyHazard(stage, hazardCountThisRound) {
  if (!STAGES.includes(stage)) throw new GameRuleError("wrong-stage");
  if (hazardCountThisRound >= MAX_HAZARDS_PER_ROUND) throw new GameRuleError("hazard-limit");
}
