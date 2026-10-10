import { ASPECTS, HAZARD_IDS, getTotalRounds } from './rounds.js';

export const totalResilience = town => HAZARD_IDS.reduce((sum, id) => sum + ASPECTS.reduce((s, aspect) => s + town[id][aspect], 0), 0);
export const neshAverages = town => Object.fromEntries(ASPECTS.map(aspect => [aspect,
  HAZARD_IDS.reduce((sum, id) => sum + town[id][aspect], 0) / HAZARD_IDS.length]));

export function buildGameSummary(session, events, snapshots) {
  const roundsPlayed = session.isActive ? Math.max(0, session.currentRound - 1) : session.currentRound - 1;
  const relevantEvents = events.filter(event => event.roundNumber <= roundsPlayed)
    .sort((a, b) => a.roundNumber - b.roundNumber);
  const hasCompleteImpacts = relevantEvents.every(event => event.impactComplete !== false && session.towns.every(town =>
    Number.isFinite(event.impactPoints?.[town.id])));
  const rows = session.towns.map(town => ({
    id: town.id, name: town.name, townNumber: town.townNumber, isComparisonTown: town.isComparisonTown,
    resilience: totalResilience(town) / 20, nesh: neshAverages(town),
    vulnerableSegments: HAZARD_IDS.reduce((count, id) => count + ASPECTS.filter(a => town[id][a] <= 20).length, 0),
    eventLoss: relevantEvents.reduce((sum, event) => sum + (event.impactPoints?.[town.id] || 0), 0),
    dividends: snapshots.filter(s => s.roundNumber <= roundsPlayed).reduce((sum, s) => sum + (s.dividends?.[town.id] || 0), 0),
    effortPoints: town.effortPoints,
  }));
  const maxResilience = Math.max(...rows.map(t => t.resilience));
  const maxLoss = Math.max(...rows.map(t => t.eventLoss));
  return { name: session.name, totalRounds: getTotalRounds(session), roundsPlayed,
    endedEarly: session.endedEarly === true, towns: rows, events: relevantEvents,
    hasCompleteImpacts, mostResilient: rows.filter(t => t.resilience === maxResilience),
    mostImpacted: hasCompleteImpacts && maxLoss > 0 ? rows.filter(t => t.eventLoss === maxLoss) : [],
    eventCount: relevantEvents.reduce((sum, e) => sum + (e.eventHistory?.length ?? e.hazardIds.length), 0),
    hasDividends: snapshots.some(s => s.roundNumber <= roundsPlayed && s.dividends),
  };
}
