import type { Pool } from "pg";
import type { IProcessedWebhookEventRepository } from "../../application/interfaces/IProcessedWebhookEventRepository.js";

export class PgProcessedWebhookEventRepository implements IProcessedWebhookEventRepository {
  constructor(private readonly pool: Pool) {}

  async hasProcessed(provider: string, eventId: string): Promise<boolean> {
    const result = await this.pool.query(
      `SELECT 1 FROM processed_webhook_events WHERE provider = $1 AND event_id = $2`,
      [provider, eventId]
    );
    return result.rows.length > 0;
  }

  async markProcessed(provider: string, eventId: string): Promise<void> {
    await this.pool.query(
      `INSERT INTO processed_webhook_events (provider, event_id)
       VALUES ($1, $2)
       ON CONFLICT (provider, event_id) DO NOTHING`,
      [provider, eventId]
    );
  }
}
