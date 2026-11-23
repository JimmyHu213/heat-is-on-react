// A broken game rule. `code` is stable so the UI can choose a message.
export class GameRuleError extends Error {
  constructor(code, message = code) {
    super(message);
    this.name = "GameRuleError";
    this.code = code;
  }
}

export const GAME_RULE_MESSAGES = {
  "stale-revision": "This game changed elsewhere. Refresh to continue.",
  "nothing-to-undo": "There is no move to undo in this round.",
  "wrong-stage": "This action cannot be performed in the current stage.",
  "card-in-play": "This town already has this card in play for the selected year(s).",
  "comparison-town":
    "Bludgeton is the comparison town and cannot play adaptation cards.",
  "insufficient-effort-points": "Not enough effort points to play this card.",
  "stale-round": "The round has already changed. Refresh to continue.",
  "already-settled": "This round has already been settled.",
  "game-complete": "The game has already completed.",
  "not-started": "The game has not started yet.",
  "already-started": "The game has already started.",
  "hazard-limit": "Maximum hazards reached for this round.",
  "invalid-stage-transition": "Invalid stage transition.",
  "invalid-budget": "Budget must be a whole number between 0 and 999.",
  "invalid-rounds": "Total rounds must be a whole number between 1 and 20.",
  "invalid-player-count":
    "Player count must be a whole number between 1 and 200.",
  "invalid-town-name": "Town name must be between 1 and 80 characters.",
};

export function formatGameRuleError(err, fallback) {
  if (err?.code && GAME_RULE_MESSAGES[err.code]) {
    return GAME_RULE_MESSAGES[err.code];
  }
  if (
    err?.name === "GameRuleError" &&
    err.message &&
    err.message !== err.code
  ) {
    return err.message;
  }
  return fallback;
}
