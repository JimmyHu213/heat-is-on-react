export const DEFAULT_ROUNDS = 5;
export const MAX_ROUNDS = 20;
export const HAZARD_IDS = ['bushfire', 'flood', 'stormSurge', 'heatwave', 'biohazard'];
export const ASPECTS = ['nature', 'economy', 'society', 'health'];

export function validateRoundCount(value) {
  if (!Number.isInteger(value) || value < 1 || value > MAX_ROUNDS) {
    throw new Error(`Choose between 1 and ${MAX_ROUNDS} rounds.`);
  }
  return value;
}

export function getTotalRounds(session) {
  return session?.totalRounds ?? DEFAULT_ROUNDS;
}

export function calculateDividend(town) {
  const segments = HAZARD_IDS.reduce((count, hazard) => count +
    ASPECTS.filter(aspect => town[hazard]?.[aspect] === 100).length, 0);
  return { segments, amount: segments * 5 };
}

// Closing scores determine dividends before the next round's card effects.
export function planRoundTransition(session, towns, plays, cards, applyCard, expectedRound, endGame = false) {
  if (!session.isActive) throw new Error('This game has already finished.');
  if (session.currentRound !== expectedRound) {
    throw new Error('The round has already changed. Refresh the game before continuing.');
  }
  const round = session.currentRound;
  const nextRound = round + 1;
  if (endGame && round === 0) throw new Error('Start a round before ending the game.');
  const isComplete = endGame || nextRound > getTotalRounds(session);
  const dividends = {};
  const snapshots = {};
  const deactivate = [];
  const updatedTowns = towns.map(town => {
    let updated = { ...town, currentRound: nextRound };
    if (round > 0) {
      dividends[town.id] = calculateDividend(town).amount;
      snapshots[town.id] = Object.fromEntries(HAZARD_IDS.map(id => [id, { ...town[id] }]));
      snapshots[town.id].round = round;
      updated.currentStats = snapshots[town.id];
      updated.effortPoints = town.effortPoints + dividends[town.id];
    }
    for (const play of plays.filter(p => p.townId === town.id && p.isActive)) {
      if (!isComplete && play.effectiveRounds.includes(nextRound)) {
        const card = cards.find(c => c.id === play.cardId);
        if (card) updated = applyCard(updated, card);
      }
      if (isComplete || nextRound >= Math.max(...play.effectiveRounds)) deactivate.push(play.id);
    }
    return updated;
  });
  return { round, nextRound, isComplete, endedEarly: endGame && round < getTotalRounds(session), dividends, snapshots, towns: updatedTowns, deactivate };
}
