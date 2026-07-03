import type { EnrolledCourse, PhaseLevel } from "@ai-learning-platform/shared";

export interface IEnrollmentRepository {
  findByUserId(userId: string): Promise<EnrolledCourse[]>;
  create(courseId: string, userId: string, phase: PhaseLevel): Promise<EnrolledCourse>;
}
