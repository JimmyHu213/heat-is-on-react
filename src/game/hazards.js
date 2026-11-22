import {
  ASPECTS,
  HAZARD_IDS,
  clampScore,
  overallResilience,
} from "./scores.js";

// Heat Is On Scoring, rows 25–29: each event has costs in its own four columns.
export function applyHazard(town, hazard) {
  const scores = town[hazard.id];
  return {
    ...town,
    [hazard.id]: Object.fromEntries(ASPECTS.map((aspect) => [
      aspect, clampScore(scores[aspect] - hazard[aspect]),
    ])),
  };
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
