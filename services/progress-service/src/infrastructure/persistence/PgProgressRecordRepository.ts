import type { Pool } from "pg";
import type { ProgressActivityType, ProgressEvent, ProgressRecord } from "@ai-learning-platform/shared";
import type { IProgressRecordRepository } from "../../application/interfaces/IProgressRecordRepository.js";

type ProgressRecordRow = {
  id: string;
  user_id: string;
  course_id: string | null;
  module_id: string | null;
  lesson_id: string | null;
  activity_type: ProgressActivityType;
  occurred_at: Date;
};

function rowToProgressRecord(row: ProgressRecordRow): ProgressRecord {
  return {
    id: row.id,
    userId: row.user_id,
    courseId: row.course_id,
    moduleId: row.module_id,
    lessonId: row.lesson_id,
    activityType: row.activity_type,
    occurredAt: row.occurred_at.toISOString(),
  };
}

export class PgProgressRecordRepository implements IProgressRecordRepository {
  constructor(private readonly pool: Pool) {}

  async record(event: ProgressEvent): Promise<void> {
    await this.pool.query(
      `INSERT INTO progress_records (user_id, course_id, module_id, lesson_id, activity_type, occurred_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id, lesson_id) WHERE activity_type = 'lesson_viewed' AND lesson_id IS NOT NULL
       DO NOTHING`,
      [event.userId, event.courseId, event.moduleId, event.lessonId, event.activityType, event.occurredAt]
    );
  }

  async countDistinctLessonsViewed(userId: string, courseId: string): Promise<number> {
    const result = await this.pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM progress_records
       WHERE user_id = $1 AND course_id = $2 AND activity_type = 'lesson_viewed'`,
      [userId, courseId]
    );
    return Number(result.rows[0]?.count ?? 0);
  }

  async findViewedLessonIds(userId: string, courseId: string): Promise<string[]> {
    const result = await this.pool.query<{ lesson_id: string }>(
      `SELECT lesson_id FROM progress_records
       WHERE user_id = $1 AND course_id = $2 AND activity_type = 'lesson_viewed' AND lesson_id IS NOT NULL`,
      [userId, courseId]
    );
    return result.rows.map((r) => r.lesson_id);
  }

  async hasActivityType(userId: string, activityType: ProgressActivityType): Promise<boolean> {
    const result = await this.pool.query(
      `SELECT 1 FROM progress_records WHERE user_id = $1 AND activity_type = $2 LIMIT 1`,
      [userId, activityType]
    );
    return (result.rowCount ?? 0) > 0;
  }

  async findMostRecentCourseId(userId: string): Promise<string | null> {
    const result = await this.pool.query<{ course_id: string | null }>(
      `SELECT course_id FROM progress_records
       WHERE user_id = $1 AND course_id IS NOT NULL
       ORDER BY occurred_at DESC LIMIT 1`,
      [userId]
    );
    return result.rows[0]?.course_id ?? null;
  }

  async findRecent(userId: string, limit: number): Promise<ProgressRecord[]> {
    const result = await this.pool.query<ProgressRecordRow>(
      `SELECT id, user_id, course_id, module_id, lesson_id, activity_type, occurred_at
       FROM progress_records WHERE user_id = $1 ORDER BY occurred_at DESC LIMIT $2`,
      [userId, limit]
    );
    return result.rows.map(rowToProgressRecord);
  }
}
