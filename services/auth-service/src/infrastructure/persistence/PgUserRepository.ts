import type { Pool } from "pg";
import { User } from "../../domain/models/User.js";
import type { AuthProvider, PlanTier } from "../../domain/models/User.js";
import type { IUserRepository } from "../../application/interfaces/IUserRepository.js";

const SELECT_COLS =
  "id, email, password_hash, name, plan_tier, created_at, email_verified_at, auth_provider, google_id, github_id";

export class PgUserRepository implements IUserRepository {
  constructor(private readonly pool: Pool) {}

  async save(user: User): Promise<void> {
    const props = user.toJSON();
    await this.pool.query(
      `INSERT INTO users (id, email, password_hash, name, plan_tier, created_at, email_verified_at, auth_provider, google_id, github_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (id) DO UPDATE SET
         email = EXCLUDED.email,
         password_hash = EXCLUDED.password_hash,
         name = EXCLUDED.name,
         plan_tier = EXCLUDED.plan_tier,
         email_verified_at = EXCLUDED.email_verified_at,
         auth_provider = EXCLUDED.auth_provider,
         google_id = EXCLUDED.google_id,
         github_id = EXCLUDED.github_id`,
      [
        props.id,
        props.email,
        props.passwordHash,
        props.name,
        props.planTier,
        props.createdAt,
        props.emailVerifiedAt,
        props.authProvider,
        props.googleId,
        props.githubId,
      ]
    );
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.pool.query(
      `SELECT ${SELECT_COLS} FROM users WHERE email = $1`,
      [email]
    );
    if (row.rows.length === 0) return null;
    return this.rowToUser(row.rows[0]);
  }

  async findById(id: string): Promise<User | null> {
    const row = await this.pool.query(
      `SELECT ${SELECT_COLS} FROM users WHERE id = $1`,
      [id]
    );
    if (row.rows.length === 0) return null;
    return this.rowToUser(row.rows[0]);
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    const row = await this.pool.query(
      `SELECT ${SELECT_COLS} FROM users WHERE google_id = $1`,
      [googleId]
    );
    if (row.rows.length === 0) return null;
    return this.rowToUser(row.rows[0]);
  }

  async findByGithubId(githubId: string): Promise<User | null> {
    const row = await this.pool.query(
      `SELECT ${SELECT_COLS} FROM users WHERE github_id = $1`,
      [githubId]
    );
    if (row.rows.length === 0) return null;
    return this.rowToUser(row.rows[0]);
  }

  private rowToUser(row: {
    id: string;
    email: string;
    password_hash: string | null;
    name: string | null;
    plan_tier: string;
    created_at: Date;
    email_verified_at: Date | null;
    auth_provider: string;
    google_id: string | null;
    github_id: string | null;
  }): User {
    return User.create({
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      name: row.name,
      planTier: row.plan_tier as PlanTier,
      createdAt: row.created_at,
      emailVerifiedAt: row.email_verified_at,
      authProvider: row.auth_provider as AuthProvider,
      googleId: row.google_id,
      githubId: row.github_id,
    });
  }
}
