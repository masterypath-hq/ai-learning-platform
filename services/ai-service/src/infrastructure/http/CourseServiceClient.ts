import type {
  CourseResponse,
  EnrolledCourse,
  LessonWithContextResponse,
  ListEnrolledCoursesResponse,
  ModuleWithContextResponse,
} from "@ai-learning-platform/shared";
import type { ICourseServiceClient } from "../../application/interfaces/ICourseServiceClient.js";

export class CourseServiceClient implements ICourseServiceClient {
  constructor(
    private readonly baseUrl: string,
    private readonly internalServiceSecret: string
  ) {}

  async getLesson(lessonId: string): Promise<LessonWithContextResponse> {
    const res = await fetch(`${this.baseUrl}/api/v1/lessons/${lessonId}`, {
      headers: { "x-internal-secret": this.internalServiceSecret },
    });
    if (res.status === 404) throw new Error("LESSON_NOT_FOUND");
    if (!res.ok) throw new Error(`course-service getLesson failed: ${res.status} ${await res.text()}`);
    const body = (await res.json()) as { data: LessonWithContextResponse };
    return body.data;
  }

  async getModule(moduleId: string): Promise<ModuleWithContextResponse> {
    const res = await fetch(`${this.baseUrl}/api/v1/modules/${moduleId}`, {
      headers: { "x-internal-secret": this.internalServiceSecret },
    });
    if (res.status === 404) throw new Error("MODULE_NOT_FOUND");
    if (!res.ok) throw new Error(`course-service getModule failed: ${res.status} ${await res.text()}`);
    const body = (await res.json()) as { data: ModuleWithContextResponse };
    return body.data;
  }

  async getCourse(courseId: string): Promise<CourseResponse> {
    const res = await fetch(`${this.baseUrl}/api/v1/courses/${courseId}`);
    if (res.status === 404) throw new Error("COURSE_NOT_FOUND");
    if (!res.ok) throw new Error(`course-service getCourse failed: ${res.status} ${await res.text()}`);
    return res.json() as Promise<CourseResponse>;
  }

  async getEnrolledCourses(userId: string): Promise<EnrolledCourse[]> {
    const res = await fetch(`${this.baseUrl}/api/v1/internal/enrollments/${userId}`, {
      headers: { "x-internal-secret": this.internalServiceSecret },
    });
    if (!res.ok) throw new Error(`course-service getEnrolledCourses failed: ${res.status} ${await res.text()}`);
    const body = (await res.json()) as { data: ListEnrolledCoursesResponse };
    return body.data.courses;
  }
}
