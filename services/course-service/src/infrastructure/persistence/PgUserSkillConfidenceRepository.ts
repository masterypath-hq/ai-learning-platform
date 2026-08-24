import type { Pool } from "pg";
import type { ConfidenceLevel, UserSkillConfidenceResponse } from "@ai-learning-platform/shared";
import type {
  IUserSkillConfidenceRepository,
  SkillConfidenceRating,
} from "../../application/interfaces/IUserSkillConfidenceRepository.js";

type ConfidenceRow = {
  skill_id: string;
  level: string;
  rated_at: Date;
};

function rowToConfidence(r: ConfidenceRow): UserSkillConfidenceResponse {
  return {
    skillId: r.skill_id,
    level: r.level as ConfidenceLevel,
    ratedAt: r.rated_at.toISOString(),
  };
}

export class PgUserSkillConfidenceRepository implements IUserSkillConfidenceRepository {
  constructor(private readonly pool: Pool) {}

  async findByUserId(userId: string): Promise<UserSkillConfidenceResponse[]> {
    const result = await this.pool.query<ConfidenceRow>(
      `SELECT skill_id, level, rated_at FROM user_skill_confidence WHERE user_id = $1`,
      [userId]
    );
    return result.rows.map(rowToConfidence);
  }

  async upsertMany(userId: string, ratings: SkillConfidenceRating[]): Promise<UserSkillConfidenceResponse[]> {
    if (ratings.length === 0) return [];

    const values: string[] = [];
    const params: unknown[] = [userId];
    ratings.forEach((rating, i) => {
      params.push(rating.skillId, rating.level);
      const skillIdIdx = params.length - 1;
      const levelIdx = params.length;
      values.push(`($1, $${skillIdIdx}, $${levelIdx})`);
    });

    const result = await this.pool.query<ConfidenceRow>(
      `INSERT INTO user_skill_confidence (user_id, skill_id, level)
       VALUES ${values.join(", ")}
       ON CONFLICT (user_id, skill_id) DO UPDATE SET level = EXCLUDED.level, rated_at = NOW()
       RETURNING skill_id, level, rated_at`,
      params
    );

    return result.rows.map(rowToConfidence);
  }
}
