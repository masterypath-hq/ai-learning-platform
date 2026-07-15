import type { Pool } from "pg";
import type { IEnrollmentRepository } from "../../application/interfaces/IEnrollmentRepository.js";
import type { EnrolledCourse, EnrollmentStatus, PhaseLevel, SelfAssessmentLevel } from "@ai-learning-platform/shared";

type EnrollmentRow = {
  enrollment_id: string;
  status: string;
  current_phase: string;
  self_assessed_level: string | null;
  self_assessment_completed_at: Date | null;
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

type EnrollmentInsertRow = EnrollmentRow;

export class PgEnrollmentRepository implements IEnrollmentRepository {
  constructor(private readonly pool: Pool) {}

  async findByUserId(userId: string): Promise<EnrolledCourse[]> {
    const result = await this.pool.query<EnrollmentRow>(
      `SELECT
         e.id            AS enrollment_id,
         e.status,
         e.current_phase,
         e.self_assessed_level,
         e.self_assessment_completed_at,
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

    return result.rows.map(rowToEnrolledCourse);
  }

  async create(
    courseId: string,
    userId: string,
    phase: PhaseLevel,
    selfAssessedLevel?: SelfAssessmentLevel
  ): Promise<EnrolledCourse> {
    const result = await this.pool.query<EnrollmentInsertRow>(
      `WITH inserted AS (
         INSERT INTO enrollments (user_id, course_id, status, current_phase, self_assessed_level, self_assessment_completed_at)
         VALUES ($1, $2, 'active', $3, $4, CASE WHEN $4::self_assessment_level IS NULL THEN NULL ELSE NOW() END)
         ON CONFLICT (user_id, course_id) DO NOTHING
         RETURNING id, status, current_phase, self_assessed_level, self_assessment_completed_at, enrolled_at, completed_at, course_id
       )
       SELECT
         i.id            AS enrollment_id,
         i.status,
         i.current_phase,
         i.self_assessed_level,
         i.self_assessment_completed_at,
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
      [userId, courseId, phase, selfAssessedLevel ?? null]
    );

    if (result.rowCount === 0) throw new Error("ALREADY_ENROLLED");

    return rowToEnrolledCourse(result.rows[0]);
  }
}

function rowToEnrolledCourse(r: EnrollmentRow): EnrolledCourse {
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
    selfAssessedLevel: r.self_assessed_level as SelfAssessmentLevel | null,
    selfAssessmentCompletedAt: r.self_assessment_completed_at ? r.self_assessment_completed_at.toISOString() : null,
    enrolledAt: r.enrolled_at.toISOString(),
    completedAt: r.completed_at ? r.completed_at.toISOString() : null,
  };
}
