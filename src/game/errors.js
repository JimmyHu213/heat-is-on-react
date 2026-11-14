// A broken game rule. `code` is stable so the UI can choose a message.
export class GameRuleError extends Error {
  constructor(code, message = code) {
    super(message);
    this.name = "GameRuleError";
    this.code = code;
  }
}
