export const HAZARD_IDS = ["bushfire", "flood", "stormSurge", "heatwave", "biohazard"];
export const ASPECTS = ["nature", "economy", "society", "health"];

export const MIN_SCORE = 0;
export const MAX_SCORE = 100;
export const DIVIDEND_PER_SEGMENT = 5;
export const WEAK_SEGMENT_MAX = 20;

const SEGMENT_COUNT = HAZARD_IDS.length * ASPECTS.length;

export function clampScore(value) {
  return Math.max(MIN_SCORE, Math.min(MAX_SCORE, value));
}

function segmentScores(town) {
  return HAZARD_IDS.flatMap((hazard) => ASPECTS.map((aspect) => town[hazard][aspect]));
}

export function segmentTotal(town) {
  return segmentScores(town).reduce((sum, score) => sum + score, 0);
}

export function overallResilience(town) {
  return segmentTotal(town) / SEGMENT_COUNT;
}

export function neshAverages(town) {
  return Object.fromEntries(
    ASPECTS.map((aspect) => [
      aspect,
      HAZARD_IDS.reduce((sum, hazard) => sum + town[hazard][aspect], 0) / HAZARD_IDS.length,
    ])
  );
}

export function countSegments(town, predicate) {
  return segmentScores(town).filter(predicate).length;
}
