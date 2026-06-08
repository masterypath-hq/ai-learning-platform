import type { Pool } from "pg";
import { Course } from "../../domain/models/Course.js";
import type { ICourseRepository, CourseFilters, CoursePagination, FindByUserIdResult, CourseDetails } from "../../application/interfaces/ICourseRepository.js";
import { CourseStatus } from "@ai-learning-platform/shared";
import type { Subject, CourseTrack, CourseLevel, TrackCourse } from "@ai-learning-platform/shared";

const SELECT_COLS =
  "id, user_id, subject, track, level, title, description, learning_objectives, prerequisites, " +
  "estimated_duration_minutes, status, error_message, created_at, updated_at";

type CourseRow = {
  id: string;
  user_id: string;
  subject: string;
  track: string;
  level: string;
  title: string | null;
  description: string | null;
  learning_objectives: string[] | null;
  prerequisites: string[] | null;
  estimated_duration_minutes: number | null;
  status: string;
  error_message: string | null;
  created_at: Date;
  updated_at: Date;
};

export class PgCourseRepository implements ICourseRepository {
  constructor(private readonly pool: Pool) {}

  async save(course: Course): Promise<void> {
    const p = course.toJSON();
    await this.pool.query(
      `INSERT INTO courses
         (id, user_id, subject, track, level, title, description, learning_objectives,
          prerequisites, estimated_duration_minutes, status, error_message, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       ON CONFLICT (id) DO UPDATE SET
         title = EXCLUDED.title,
         description = EXCLUDED.description,
         learning_objectives = EXCLUDED.learning_objectives,
         prerequisites = EXCLUDED.prerequisites,
         estimated_duration_minutes = EXCLUDED.estimated_duration_minutes,
         status = EXCLUDED.status,
         error_message = EXCLUDED.error_message,
         updated_at = EXCLUDED.updated_at`,
      [
        p.id, p.userId, p.subject, p.track, p.level,
        p.title, p.description, p.learningObjectives, p.prerequisites,
        p.estimatedDurationMinutes, p.status, p.errorMessage,
        p.createdAt, p.updatedAt,
      ]
    );
  }

  async findById(id: string): Promise<Course | null> {
    const result = await this.pool.query<CourseRow>(
      `SELECT ${SELECT_COLS} FROM courses WHERE id = $1`,
      [id]
    );
    if (result.rows.length === 0) return null;
    return this.rowToCourse(result.rows[0]);
  }

  async findByUserId(
    userId: string,
    filters?: CourseFilters,
    pagination?: CoursePagination
  ): Promise<FindByUserIdResult> {
    const conditions: string[] = ["user_id = $1"];
    const values: unknown[] = [userId];
    let paramIndex = 2;

    if (filters?.subject) {
      conditions.push(`subject = $${paramIndex++}`);
      values.push(filters.subject);
    }
    if (filters?.status) {
      conditions.push(`status = $${paramIndex++}`);
      values.push(filters.status);
    }

    const where = `WHERE ${conditions.join(" AND ")}`;
    const countResult = await this.pool.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM courses ${where}`,
      values
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 20;
    const offset = (page - 1) * limit;

    const dataResult = await this.pool.query<CourseRow>(
      `SELECT ${SELECT_COLS} FROM courses ${where}
       ORDER BY created_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      [...values, limit, offset]
    );

    return {
      courses: dataResult.rows.map((r) => this.rowToCourse(r)),
      total,
    };
  }

  async updateStatus(id: string, status: CourseStatus, errorMessage?: string): Promise<void> {
    await this.pool.query(
      `UPDATE courses SET status = $1, error_message = $2, updated_at = NOW() WHERE id = $3`,
      [status, errorMessage ?? null, id]
    );
  }

  async updateDetails(id: string, details: CourseDetails): Promise<void> {
    await this.pool.query(
      `UPDATE courses
       SET title = $1, description = $2, learning_objectives = $3,
           prerequisites = $4, estimated_duration_minutes = $5, updated_at = NOW()
       WHERE id = $6`,
      [
        details.title,
        details.description,
        details.learningObjectives,
        details.prerequisites,
        details.estimatedDurationMinutes,
        id,
      ]
    );
  }

  async findAllPublished(): Promise<TrackCourse[]> {
    type TrackRow = {
      id: string;
      slug: string;
      title: string;
      description: string | null;
      primary_language: string | null;
      thumbnail_url: string | null;
      duration_weeks: number | null;
      created_at: Date;
      updated_at: Date;
    };

    const result = await this.pool.query<TrackRow>(
      `SELECT id, slug, title, description, primary_language, thumbnail_url, duration_weeks, created_at, updated_at
       FROM courses WHERE is_published = true ORDER BY title ASC`
    );

    return result.rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      description: r.description,
      primaryLanguage: r.primary_language,
      thumbnailUrl: r.thumbnail_url,
      durationWeeks: r.duration_weeks,
      createdAt: r.created_at.toISOString(),
      updatedAt: r.updated_at.toISOString(),
    }));
  }

  private rowToCourse(row: CourseRow): Course {
    return Course.create({
      id: row.id,
      userId: row.user_id,
      subject: row.subject as Subject,
      track: row.track as CourseTrack,
      level: row.level as CourseLevel,
      title: row.title,
      description: row.description,
      learningObjectives: row.learning_objectives ?? [],
      prerequisites: row.prerequisites ?? [],
      estimatedDurationMinutes: row.estimated_duration_minutes,
      status: row.status as CourseStatus,
      errorMessage: row.error_message,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}
