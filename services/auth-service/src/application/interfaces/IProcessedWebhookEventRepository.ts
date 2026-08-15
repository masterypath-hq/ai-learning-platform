/** Port: webhook idempotency tracking. (SOLID: D, I.) */
export interface IProcessedWebhookEventRepository {
  hasProcessed(provider: string, eventId: string): Promise<boolean>;
  /** Idempotent insert — safe to call even if already marked (e.g. `ON CONFLICT DO NOTHING`). */
  markProcessed(provider: string, eventId: string): Promise<void>;
}
