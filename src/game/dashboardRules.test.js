import assert from "node:assert/strict";
import test from "node:test";
import { allCards } from "../constants/cards.js";
import { hazards } from "../constants/hazards.js";
import { playCard } from "./cards.js";
import { applyHazard } from "./hazards.js";
import { planSettlement } from "./settlement.js";

// May 2025 dashboard (3fd03ab). Columns are nature, economy, society, health.
// Within each hazard the rows are its one-, two- and three-year cards.
const cardScores = {
  bushfire: [[20, 10, 10, 10], [30, 10, 10, 10], [10, 20, 20, 20]],
  flood: [[0, 20, 15, 15], [30, 10, 10, 10], [10, 20, 20, 20]],
  stormSurge: [[10, 20, 10, 10], [25, 15, 10, 10], [10, 20, 20, 20]],
  heatwave: [[10, 10, 10, 20], [25, 10, 10, 15], [10, 20, 15, 25]],
  biohazard: [[20, 10, 10, 10], [0, 30, 20, 10], [10, 20, 20, 20]],
};
const eventLosses = {
  bushfire: [30, 10, 20, 20],
  flood: [20, 30, 15, 15],
  stormSurge: [20, 40, 15, 5],
  heatwave: [20, 15, 15, 30],
  biohazard: [5, 25, 25, 25],
};
const aspects = ["nature", "economy", "society", "health"];
const hazardIds = Object.keys(cardScores);

function townWithScores(score) {
  const segments = Object.fromEntries(aspects.map((aspect) => [aspect, score]));
  return { id: "t", effortPoints: 100, ...Object.fromEntries(hazardIds.map((id) => [id, { ...segments }])) };
}

for (const hazard of hazardIds) {
  cardScores[hazard].forEach((annualGain, index) => {
    const years = index + 1;
    const id = hazard + years;
    test(id + " charges once and awards each scheduled year's NESH gains", () => {
      const card = allCards.find((entry) => entry.id === id);
      const played = playCard(townWithScores(0), card, 1);
      let town = played.town;
      let activePlays = [{ ...played.play, id: "play" }];
      for (let year = 1; year <= years + 1; year++) {
        assert.equal(town.effortPoints, 100 - 10 * years);
        for (const type of hazardIds) {
          const gains = annualGain.map((gain) => type === hazard ? gain * Math.min(year, years) : 0);
          assert.deepEqual(aspects.map((aspect) => town[type][aspect]), gains);
        }
        const plan = planSettlement({
          session: { isActive: true, currentRound: year, totalRounds: 5 },
          towns: [town], activePlays, cards: allCards, expectedRound: year, stage: "review",
        });
        town = plan.towns[0];
        activePlays = activePlays.filter((play) => !plan.deactivatePlayIds.includes(play.id));
      }
    });
  });

  test(hazard + " event deducts its agreed points only from the affected hazard", () => {
    const town = applyHazard(townWithScores(80), hazards.find((entry) => entry.id === hazard));
    for (const type of hazardIds) {
      const expected = eventLosses[hazard].map((loss) => type === hazard ? 80 - loss : 80);
      assert.deepEqual(aspects.map((aspect) => town[type][aspect]), expected);
    }
  });
}

test("each 15 EP multi-hazard card adds 15 to its aspect across all five hazards for one year", () => {
  for (const [index, id] of ["allNature", "allEconomy", "allSociety", "allHealth"].entries()) {
    const { town, play } = playCard(townWithScores(0), allCards.find((card) => card.id === id), 2);
    assert.equal(town.effortPoints, 85);
    assert.deepEqual(play.effectiveRounds, [2]);
    for (const type of hazardIds) {
      assert.deepEqual(aspects.map((aspect) => town[type][aspect]), aspects.map((_, i) => i === index ? 15 : 0));
    }
  }
});
