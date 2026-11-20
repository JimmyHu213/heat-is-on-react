import { allCards } from "../constants/cards.js";
import { getTotalRounds } from "./options.js";
import { WEAK_SEGMENT_MAX, countSegments, neshAverages, overallResilience } from "./scores.js";

// IDs of the non-comparison towns sharing the highest value (empty if none, or if all are 0).
function leaders(rows, key) {
  const candidates = rows.filter((row) => !row.isComparisonTown);
  const best = Math.max(...candidates.map((row) => row[key]));
  if (!Number.isFinite(best) || best <= 0) return [];
  return candidates.filter((row) => row[key] === best).map((row) => row.id);
}

function computeMostPopularCards(cardPlays) {
  if (!Array.isArray(cardPlays) || cardPlays.length === 0) return [];
  const counts = new Map();
  for (const play of cardPlays) {
    if (!play?.cardId) continue;
    counts.set(play.cardId, (counts.get(play.cardId) ?? 0) + 1);
  }
  if (counts.size === 0) return [];
  const maxCount = Math.max(...counts.values());
  const cardById = new Map(allCards.map((c) => [c.id, c.name]));
  return Array.from(counts.entries())
    .filter(([, count]) => count === maxCount)
    .map(([cardId, count]) => ({
      cardId,
      name: cardById.get(cardId) ?? cardId,
      count,
    }));
}

export function buildGameSummary({ session, towns, events, roundStats, cardPlays = [] }) {
  const roundsPlayed = Math.max(0, session.currentRound - 1);
  const playedEvents = events.filter((event) => event.roundNumber <= roundsPlayed);
  const playedStats = roundStats.filter((stats) => stats.roundNumber <= roundsPlayed);
  // Rounds from before losses were recorded have no impactPoints; a round where
  // only some hazards were recorded is flagged impactComplete: false.
  const hasCompleteImpacts = playedEvents.every(
    (event) => event.impactPoints != null && event.impactComplete !== false
  );

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

  const eventsTimeline = Array.from({ length: roundsPlayed }, (_, index) => {
    const round = index + 1;
    const event = playedEvents.find((entry) => entry.roundNumber === round);
    return { round, year: 2050 + round, hazards: event?.hazardIds ?? [] };
  });

  return {
    name: session.name,
    totalRounds: getTotalRounds(session),
    roundsPlayed,
    endedEarly: session.endedEarly === true,
    towns: rows,
    mostResilient: leaders(rows, "resilience"),
    mostImpacted: hasCompleteImpacts ? leaders(rows, "eventLoss") : [],
    hasCompleteImpacts,
    totalCardsPlayed: Array.isArray(cardPlays) ? cardPlays.length : 0,
    mostPopularCards: computeMostPopularCards(cardPlays),
    eventsTimeline,
  };
}
