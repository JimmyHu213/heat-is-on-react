import { GameRuleError } from "./errors.js";
import { ASPECTS, HAZARD_IDS, clampScore } from "./scores.js";

// Hazard-type cards boost all four aspects of one hazard type; aspect cards
// (type "nature", "economy", ...) boost one aspect across every hazard type.
export function applyCardEffects(town, card) {
  const updated = { ...town };
  if (HAZARD_IDS.includes(card.type)) {
    updated[card.type] = Object.fromEntries(
      ASPECTS.map((aspect) => [aspect, clampScore(town[card.type][aspect] + card[aspect])])
    );
  } else if (ASPECTS.includes(card.type)) {
    for (const hazard of HAZARD_IDS) {
      updated[hazard] = {
        ...town[hazard],
        [card.type]: clampScore(town[hazard][card.type] + card[card.type]),
      };
    }
  }
  return updated;
}

export function cardEffectiveRounds(playedAtRound, duration = 1) {
  return Array.from({ length: duration }, (_, i) => playedAtRound + i);
}

export function playCard(town, card, round) {
  if (town.isComparisonTown) throw new GameRuleError("comparison-town");
  if (town.effortPoints < card.cost) throw new GameRuleError("insufficient-effort-points");
  return {
    town: { ...applyCardEffects(town, card), effortPoints: town.effortPoints - card.cost },
    play: {
      cardId: card.id,
      townId: town.id,
      playedAtRound: round,
      effectiveRounds: cardEffectiveRounds(round, card.duration),
    },
  };
}
