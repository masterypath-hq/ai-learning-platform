import type { EnrolledCourse, PhaseLevel, SelfAssessmentLevel } from "@ai-learning-platform/shared";

export interface IEnrollmentRepository {
  findByUserId(userId: string): Promise<EnrolledCourse[]>;
  create(
    courseId: string,
    userId: string,
    phase: PhaseLevel,
    selfAssessedLevel?: SelfAssessmentLevel,
    goal?: string | null
  ): Promise<EnrolledCourse>;
}
