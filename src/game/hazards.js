import {
  ASPECTS,
  HAZARD_IDS,
  PENALTY_AMOUNT,
  PENALTY_THRESHOLD,
  clampScore,
  overallResilience,
} from "./scores.js";

// Before the hazard's own effect, any aspect already at or below the
// threshold in some hazard type loses PENALTY_AMOUNT across all hazard types.
export function applyHazard(town, hazard) {
  const vulnerable = ASPECTS.filter((aspect) =>
    HAZARD_IDS.some((type) => town[type][aspect] <= PENALTY_THRESHOLD)
  );
  const updated = { ...town };
  for (const type of HAZARD_IDS) {
    updated[type] = { ...town[type] };
    for (const aspect of vulnerable) {
      updated[type][aspect] = clampScore(updated[type][aspect] - PENALTY_AMOUNT);
    }
  }
  updated[hazard.id] = Object.fromEntries(
    ASPECTS.map((aspect) => [aspect, clampScore(updated[hazard.id][aspect] - hazard[aspect])])
  );
  return updated;
}

export function buildHazardImpact(beforeTowns, afterTowns) {
  return beforeTowns.map((before) => {
    const after = afterTowns.find((town) => town.id === before.id);
    const aspectLoss = Object.fromEntries(
      ASPECTS.map((aspect) => [
        aspect,
        HAZARD_IDS.reduce((sum, type) => sum + before[type][aspect] - after[type][aspect], 0),
      ])
    );
    return {
      townId: before.id,
      aspectLoss,
      loss: Object.values(aspectLoss).reduce((sum, value) => sum + value, 0),
      before: overallResilience(before),
      after: overallResilience(after),
    };
  });
}
