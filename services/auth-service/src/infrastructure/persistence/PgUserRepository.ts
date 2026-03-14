import type { Pool } from "pg";
import { User } from "../../domain/models/User.js";
import type { IUserRepository } from "../../application/interfaces/IUserRepository.js";

export class PgUserRepository implements IUserRepository {
  constructor(private readonly pool: Pool) {}

  async save(user: User): Promise<void> {
    const props = user.toJSON();
    await this.pool.query(
      `INSERT INTO users (id, email, password_hash, name, created_at, email_verified_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET
         email = EXCLUDED.email,
         password_hash = EXCLUDED.password_hash,
         name = EXCLUDED.name,
         email_verified_at = EXCLUDED.email_verified_at`,
      [
        props.id,
        props.email,
        props.passwordHash,
        props.name,
        props.createdAt,
        props.emailVerifiedAt,
      ]
    );
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.pool.query(
      "SELECT id, email, password_hash, name, created_at, email_verified_at FROM users WHERE email = $1",
      [email]
    );
    if (row.rows.length === 0) return null;
    return this.rowToUser(row.rows[0]);
  }

  async findById(id: string): Promise<User | null> {
    const row = await this.pool.query(
      "SELECT id, email, password_hash, name, created_at, email_verified_at FROM users WHERE id = $1",
      [id]
    );
    if (row.rows.length === 0) return null;
    return this.rowToUser(row.rows[0]);
  }

  private rowToUser(row: {
    id: string;
    email: string;
    password_hash: string;
    name: string | null;
    created_at: Date;
    email_verified_at: Date | null;
  }): User {
    return User.create({
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      name: row.name,
      createdAt: row.created_at,
      emailVerifiedAt: row.email_verified_at,
    });
  }
}
