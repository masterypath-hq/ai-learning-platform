import type { CourseResponse, EnrolledCourse } from "@ai-learning-platform/shared";

export interface ICourseServiceClient {
  getEnrolledCourses(userId: string): Promise<EnrolledCourse[]>;
  getCourse(courseId: string): Promise<CourseResponse>;
}
