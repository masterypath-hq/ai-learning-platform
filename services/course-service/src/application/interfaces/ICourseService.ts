import type {
  GenerateCourseRequest,
  GenerateCourseResponse,
  CourseStatusResponse,
  CourseResponse,
  ListCoursesResponse,
  ListTrackCoursesResponse,
  Subject,
  CourseStatus,
} from "@ai-learning-platform/shared";

/** Port for all course operations. Controller depends on this abstraction (DIP). */
export interface ICourseService {
  generateCourse(userId: string, request: GenerateCourseRequest): Promise<GenerateCourseResponse>;
  getCourseStatus(courseId: string, userId: string): Promise<CourseStatusResponse>;
  getCourse(courseId: string, userId: string): Promise<CourseResponse>;
  listUserCourses(
    userId: string,
    subject?: Subject,
    status?: CourseStatus,
    page?: number,
    limit?: number
  ): Promise<ListCoursesResponse>;
  listAllCourses(): Promise<ListTrackCoursesResponse>;
}
