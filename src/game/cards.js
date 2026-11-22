import { GameRuleError } from "./errors.js";
import { ASPECTS, HAZARD_IDS, clampScore } from "./scores.js";

// Plays saved by the flat-price dashboard have no recorded cost.
export function paidCardCost(play) {
  return play.costPaid ?? 15;
}

// Hazard-type cards boost all four aspects of one hazard type; aspect cards
// (type "nature", "economy", ...) boost one aspect across every hazard type.
export function applyCardEffects(town, card, times = 1) {
  const updated = { ...town };
  if (HAZARD_IDS.includes(card.type)) {
    updated[card.type] = Object.fromEntries(
      ASPECTS.map((aspect) => [aspect, clampScore(town[card.type][aspect] + card[aspect] * times)])
    );
  } else if (ASPECTS.includes(card.type)) {
    for (const hazard of HAZARD_IDS) {
      updated[hazard] = {
        ...town[hazard],
        [card.type]: clampScore(town[hazard][card.type] + card[card.type] * times),
      };
    }
  }
  return updated;
}

export function revertCardEffects(town, card, times = 1, refund = card.cost ?? 0) {
  const updated = {
    ...town,
    effortPoints: Math.min(9999, Math.max(0, (town.effortPoints ?? 0) + refund)),
  };
  if (HAZARD_IDS.includes(card.type)) {
    updated[card.type] = Object.fromEntries(
      ASPECTS.map((aspect) => [aspect, clampScore(town[card.type][aspect] - card[aspect] * times)])
    );
  } else if (ASPECTS.includes(card.type)) {
    for (const hazard of HAZARD_IDS) {
      updated[hazard] = {
        ...town[hazard],
        [card.type]: clampScore(town[hazard][card.type] - card[card.type] * times),
      };
    }
  }
  return updated;
}

export function cardEffectiveRounds(playedAtRound, duration = 1) {
  return Array.from({ length: duration }, (_, i) => playedAtRound + i);
}

export function overlapsCardPlay(plays, card, round) {
  const requested = cardEffectiveRounds(round, card.duration);
  return plays.some((play) => play.cardId === card.id &&
    (play.effectiveRounds ?? cardEffectiveRounds(play.playedAtRound, card.duration))
      .some((year) => requested.includes(year)));
}

export function playCard(town, card, round, times = 1) {
  if (town.isComparisonTown) throw new GameRuleError("comparison-town");
  if (town.effortPoints < card.cost) throw new GameRuleError("insufficient-effort-points");
  return {
    town: { ...applyCardEffects(town, card, times), effortPoints: town.effortPoints - card.cost },
    play: {
      cardId: card.id,
      townId: town.id,
      playedAtRound: round,
      effectiveRounds: cardEffectiveRounds(round, card.duration),
    },
  };
}
