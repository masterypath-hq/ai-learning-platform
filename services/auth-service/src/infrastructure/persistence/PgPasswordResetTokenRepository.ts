import type { Pool } from "pg";
import { PasswordResetToken } from "../../domain/models/PasswordResetToken.js";
import type { IPasswordResetTokenRepository } from "../../application/interfaces/IPasswordResetTokenRepository.js";

export class PgPasswordResetTokenRepository implements IPasswordResetTokenRepository {
  constructor(private readonly pool: Pool) {}

  async save(token: PasswordResetToken): Promise<void> {
    const props = token.toJSON();
    await this.pool.query(
      `INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at, used_at, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        props.id,
        props.userId,
        props.tokenHash,
        props.expiresAt,
        props.usedAt,
        props.createdAt,
      ]
    );
  }

  async findByTokenHash(tokenHash: string): Promise<PasswordResetToken | null> {
    const row = await this.pool.query(
      "SELECT id, user_id, token_hash, expires_at, used_at, created_at FROM password_reset_tokens WHERE token_hash = $1",
      [tokenHash]
    );
    if (row.rows.length === 0) return null;
    return this.rowToToken(row.rows[0]);
  }

  async markUsed(id: string, usedAt: Date): Promise<void> {
    await this.pool.query(
      "UPDATE password_reset_tokens SET used_at = $1 WHERE id = $2",
      [usedAt, id]
    );
  }

  private rowToToken(row: {
    id: string;
    user_id: string;
    token_hash: string;
    expires_at: Date;
    used_at: Date | null;
    created_at: Date;
  }): PasswordResetToken {
    return PasswordResetToken.create({
      id: row.id,
      userId: row.user_id,
      tokenHash: row.token_hash,
      expiresAt: row.expires_at,
      usedAt: row.used_at,
      createdAt: row.created_at,
    });
  }
}
