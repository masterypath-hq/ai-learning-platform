import type { Pool } from "pg";
import type { Streak } from "@ai-learning-platform/shared";
import type { IStreakRepository } from "../../application/interfaces/IStreakRepository.js";

type StreakRow = {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null; // cast to text in SQL — avoids pg's tz-shifting DATE parser
};

export class PgStreakRepository implements IStreakRepository {
  constructor(private readonly pool: Pool) {}

  async find(userId: string): Promise<Streak | null> {
    const result = await this.pool.query<StreakRow>(
      `SELECT user_id, current_streak, longest_streak, last_activity_date::text AS last_activity_date
       FROM streaks WHERE user_id = $1`,
      [userId]
    );
    if (result.rows.length === 0) return null;
    return this.rowToStreak(result.rows[0]);
  }

  async upsert(streak: Streak): Promise<void> {
    await this.pool.query(
      `INSERT INTO streaks (user_id, current_streak, longest_streak, last_activity_date, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         current_streak = EXCLUDED.current_streak,
         longest_streak = EXCLUDED.longest_streak,
         last_activity_date = EXCLUDED.last_activity_date,
         updated_at = NOW()`,
      [streak.userId, streak.currentStreak, streak.longestStreak, streak.lastActivityDate]
    );
  }

  private rowToStreak(row: StreakRow): Streak {
    return {
      userId: row.user_id,
      currentStreak: row.current_streak,
      longestStreak: row.longest_streak,
      lastActivityDate: row.last_activity_date,
    };
  }
}
