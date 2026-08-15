import type { CourseResponse, EnrolledCourse, ListEnrolledCoursesResponse } from "@ai-learning-platform/shared";
import type { ICourseServiceClient } from "../../application/interfaces/ICourseServiceClient.js";

export class CourseServiceClient implements ICourseServiceClient {
  constructor(
    private readonly baseUrl: string,
    private readonly internalServiceSecret: string
  ) {}

  async getEnrolledCourses(userId: string): Promise<EnrolledCourse[]> {
    const res = await fetch(`${this.baseUrl}/api/v1/internal/enrollments/${userId}`, {
      headers: { "x-internal-secret": this.internalServiceSecret },
    });
    if (!res.ok) throw new Error(`course-service getEnrolledCourses failed: ${res.status} ${await res.text()}`);
    const body = (await res.json()) as { data: ListEnrolledCoursesResponse };
    return body.data.courses;
  }

  async getCourse(courseId: string): Promise<CourseResponse> {
    const res = await fetch(`${this.baseUrl}/api/v1/courses/${courseId}`);
    if (res.status === 404) throw new Error("COURSE_NOT_FOUND");
    if (!res.ok) throw new Error(`course-service getCourse failed: ${res.status} ${await res.text()}`);
    return res.json() as Promise<CourseResponse>;
  }
}
