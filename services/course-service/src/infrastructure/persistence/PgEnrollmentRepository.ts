import type { Pool } from "pg";
import type { IEnrollmentRepository } from "../../application/interfaces/IEnrollmentRepository.js";
import type { EnrolledCourse, EnrollmentStatus, PhaseLevel } from "@ai-learning-platform/shared";

type EnrollmentRow = {
  enrollment_id: string;
  status: string;
  current_phase: string;
  enrolled_at: Date;
  completed_at: Date | null;
  course_id: string;
  slug: string;
  title: string;
  description: string | null;
  primary_language: string | null;
  thumbnail_url: string | null;
  duration_weeks: number | null;
};

type EnrollmentInsertRow = {
  enrollment_id: string;
  status: string;
  current_phase: string;
  enrolled_at: Date;
  completed_at: Date | null;
  course_id: string;
  slug: string;
  title: string;
  description: string | null;
  primary_language: string | null;
  thumbnail_url: string | null;
  duration_weeks: number | null;
};

export class PgEnrollmentRepository implements IEnrollmentRepository {
  constructor(private readonly pool: Pool) {}

  async findByUserId(userId: string): Promise<EnrolledCourse[]> {
    const result = await this.pool.query<EnrollmentRow>(
      `SELECT
         e.id            AS enrollment_id,
         e.status,
         e.current_phase,
         e.enrolled_at,
         e.completed_at,
         c.id            AS course_id,
         c.slug,
         c.title,
         c.description,
         c.primary_language,
         c.thumbnail_url,
         c.duration_weeks
       FROM enrollments e
       JOIN courses c ON c.id = e.course_id
       WHERE e.user_id = $1
       ORDER BY e.enrolled_at DESC`,
      [userId]
    );

    return result.rows.map((r) => ({
      enrollmentId: r.enrollment_id,
      courseId: r.course_id,
      slug: r.slug,
      title: r.title,
      description: r.description,
      primaryLanguage: r.primary_language,
      thumbnailUrl: r.thumbnail_url,
      durationWeeks: r.duration_weeks,
      status: r.status as EnrollmentStatus,
      currentPhase: r.current_phase as PhaseLevel,
      enrolledAt: r.enrolled_at.toISOString(),
      completedAt: r.completed_at ? r.completed_at.toISOString() : null,
    }));
  }

  async create(courseId: string, userId: string): Promise<EnrolledCourse> {
    const result = await this.pool.query<EnrollmentInsertRow>(
      `WITH inserted AS (
         INSERT INTO enrollments (user_id, course_id, status, current_phase)
         VALUES ($1, $2, 'active', 'foundation')
         ON CONFLICT (user_id, course_id) DO NOTHING
         RETURNING id, status, current_phase, enrolled_at, completed_at, course_id
       )
       SELECT
         i.id            AS enrollment_id,
         i.status,
         i.current_phase,
         i.enrolled_at,
         i.completed_at,
         c.id            AS course_id,
         c.slug,
         c.title,
         c.description,
         c.primary_language,
         c.thumbnail_url,
         c.duration_weeks
       FROM inserted i
       JOIN courses c ON c.id = i.course_id`,
      [userId, courseId]
    );

    if (result.rowCount === 0) throw new Error("ALREADY_ENROLLED");

    const r = result.rows[0];
    return {
      enrollmentId: r.enrollment_id,
      courseId: r.course_id,
      slug: r.slug,
      title: r.title,
      description: r.description,
      primaryLanguage: r.primary_language,
      thumbnailUrl: r.thumbnail_url,
      durationWeeks: r.duration_weeks,
      status: r.status as EnrollmentStatus,
      currentPhase: r.current_phase as PhaseLevel,
      enrolledAt: r.enrolled_at.toISOString(),
      completedAt: r.completed_at ? r.completed_at.toISOString() : null,
    };
  }
}
