import { getTotalRounds } from "./options.js";
import { WEAK_SEGMENT_MAX, countSegments, neshAverages, overallResilience } from "./scores.js";

// IDs of the non-comparison towns sharing the highest value (empty if none, or if all are 0).
function leaders(rows, key) {
  const candidates = rows.filter((row) => !row.isComparisonTown);
  const best = Math.max(...candidates.map((row) => row[key]));
  if (!Number.isFinite(best) || best <= 0) return [];
  return candidates.filter((row) => row[key] === best).map((row) => row.id);
}

export function buildGameSummary({ session, towns, events, roundStats }) {
  const roundsPlayed = Math.max(0, session.currentRound - 1);
  const playedEvents = events.filter((event) => event.roundNumber <= roundsPlayed);
  const playedStats = roundStats.filter((stats) => stats.roundNumber <= roundsPlayed);
  const hasCompleteImpacts = playedEvents.every((event) => event.impactPoints != null);

  const rows = towns.map((town) => ({
    id: town.id,
    name: town.name,
    isComparisonTown: town.isComparisonTown === true,
    resilience: overallResilience(town),
    nesh: neshAverages(town),
    weakSegments: countSegments(town, (score) => score <= WEAK_SEGMENT_MAX),
    eventLoss: playedEvents.reduce((sum, event) => sum + (event.impactPoints?.[town.id] ?? 0), 0),
    dividends: playedStats.reduce((sum, stats) => sum + (stats.dividends?.[town.id] ?? 0), 0),
    effortPoints: town.effortPoints,
  }));

  return {
    name: session.name,
    totalRounds: getTotalRounds(session),
    roundsPlayed,
    endedEarly: session.endedEarly === true,
    towns: rows,
    mostResilient: leaders(rows, "resilience"),
    mostImpacted: hasCompleteImpacts ? leaders(rows, "eventLoss") : [],
    hasCompleteImpacts,
  };
}
