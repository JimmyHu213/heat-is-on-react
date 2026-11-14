import { GameRuleError } from "./errors.js";
import { ASPECTS, HAZARD_IDS } from "./scores.js";

export function pickTownState(town) {
  const state = {
    id: town.id,
    effortPoints: town.effortPoints,
  };
  for (const hazard of HAZARD_IDS) {
    state[hazard] = Object.fromEntries(
      ASPECTS.map((aspect) => [aspect, town[hazard][aspect]])
    );
  }
  return state;
}

export function buildCardUndo({ round, townBefore, cardPlayId }) {
  return {
    kind: "card",
    round,
    towns: [pickTownState(townBefore)],
    cardPlayId,
  };
}

export function buildHazardUndo({ round, townsBefore, roundEventBefore }) {
  const existed = Boolean(roundEventBefore);
  return {
    kind: "hazard",
    round,
    towns: townsBefore.map(pickTownState),
    roundEvent: {
      existed,
      hazardIds: existed ? [...(roundEventBefore.hazardIds ?? [])] : [],
      eventHistory: existed
        ? (roundEventBefore.eventHistory ?? []).map((entry) => ({ ...entry }))
        : [],
      impactPoints:
        existed && roundEventBefore.impactPoints != null
          ? { ...roundEventBefore.impactPoints }
          : {},
      impactComplete: existed
        ? roundEventBefore.impactComplete !== false && roundEventBefore.impactPoints != null
        : true,
    },
  };
}

export function planUndo({ session, currentTowns }) {
  if (!session.isActive) {
    throw new GameRuleError("game-complete");
  }
  const undo = session.lastUndo;
  if (!undo || undo.round !== session.currentRound) {
    throw new GameRuleError("nothing-to-undo");
  }

  const savedById = new Map((undo.towns ?? []).map((snap) => [snap.id, snap]));
  const towns = currentTowns.map((town) => {
    const saved = savedById.get(town.id);
    if (!saved) return { ...town };
    const restored = {
      ...town,
      effortPoints: saved.effortPoints,
    };
    for (const hazard of HAZARD_IDS) {
      restored[hazard] = Object.fromEntries(
        ASPECTS.map((aspect) => [aspect, saved[hazard][aspect]])
      );
    }
    return restored;
  });

  if (undo.kind === "card") {
    return {
      kind: "card",
      round: undo.round,
      towns,
      deleteCardPlayId: undo.cardPlayId,
      roundEventPatch: null,
    };
  }

  return {
    kind: "hazard",
    round: undo.round,
    towns,
    deleteCardPlayId: null,
    roundEventPatch: {
      existed: Boolean(undo.roundEvent?.existed),
      hazardIds: [...(undo.roundEvent?.hazardIds ?? [])],
      eventHistory: (undo.roundEvent?.eventHistory ?? []).map((entry) => ({ ...entry })),
      impactPoints:
        undo.roundEvent?.impactPoints != null ? { ...undo.roundEvent.impactPoints } : {},
      impactComplete: undo.roundEvent?.impactComplete ?? true,
    },
  };
}
