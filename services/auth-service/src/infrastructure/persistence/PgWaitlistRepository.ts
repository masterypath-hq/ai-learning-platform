import type { Pool } from "pg";
import type { IWaitlistRepository } from "../../application/interfaces/IWaitlistRepository.js";

export class PgWaitlistRepository implements IWaitlistRepository {
  constructor(private readonly pool: Pool) {}

  async add(email: string, source: string | null): Promise<{ alreadyJoined: boolean }> {
    const result = await this.pool.query(
      `INSERT INTO waitlist (email, source)
       VALUES ($1, $2)
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      [email, source]
    );
    return { alreadyJoined: result.rowCount === 0 };
  }
}
