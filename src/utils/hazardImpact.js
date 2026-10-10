import { ASPECTS, HAZARD_IDS } from './rounds.js';

// Compare the exact before/after snapshots from the successful transaction.
export function buildHazardImpact(before, after) {
  return before.map(town => {
    const updated = after.find(value => value.id === town.id);
    const aspectLoss = Object.fromEntries(ASPECTS.map(aspect => [aspect,
      HAZARD_IDS.reduce((sum, hazard) => sum + town[hazard][aspect] - updated[hazard][aspect], 0)]));
    const total = value => HAZARD_IDS.reduce((sum, hazard) => sum +
      ASPECTS.reduce((points, aspect) => points + value[hazard][aspect], 0), 0);
    return { id: town.id, name: town.name, townNumber: town.townNumber,
      isComparisonTown: town.isComparisonTown, aspectLoss,
      loss: Object.values(aspectLoss).reduce((sum, value) => sum + value, 0),
      before: total(town) / 20, after: total(updated) / 20 };
  });
}
