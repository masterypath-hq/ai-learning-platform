import type { Pool } from "pg";
import { RefreshToken } from "../../domain/models/RefreshToken.js";
import type { IRefreshTokenRepository } from "../../application/interfaces/IRefreshTokenRepository.js";

export class PgRefreshTokenRepository implements IRefreshTokenRepository {
  constructor(private readonly pool: Pool) {}

  async save(token: RefreshToken): Promise<void> {
    const props = token.toJSON();
    await this.pool.query(
      `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, revoked_at, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [props.id, props.userId, props.tokenHash, props.expiresAt, props.revokedAt, props.createdAt]
    );
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    const row = await this.pool.query(
      `SELECT id, user_id, token_hash, expires_at, revoked_at, created_at
       FROM refresh_tokens WHERE token_hash = $1`,
      [tokenHash]
    );
    if (row.rows.length === 0) return null;
    return this.rowToToken(row.rows[0]);
  }

  async revoke(id: string, revokedAt: Date): Promise<void> {
    await this.pool.query("UPDATE refresh_tokens SET revoked_at = $1 WHERE id = $2", [revokedAt, id]);
  }

  private rowToToken(row: {
    id: string;
    user_id: string;
    token_hash: string;
    expires_at: Date;
    revoked_at: Date | null;
    created_at: Date;
  }): RefreshToken {
    return RefreshToken.create({
      id: row.id,
      userId: row.user_id,
      tokenHash: row.token_hash,
      expiresAt: row.expires_at,
      revokedAt: row.revoked_at,
      createdAt: row.created_at,
    });
  }
}
