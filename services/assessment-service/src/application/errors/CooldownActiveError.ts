export class CooldownActiveError extends Error {
  constructor(public readonly retryAvailableAt: Date) {
    super("COOLDOWN_ACTIVE");
    this.name = "CooldownActiveError";
  }
}
